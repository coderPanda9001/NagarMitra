import tempfile
import os
import re
import math
from typing import Optional, Any, Dict, List, Tuple, Union
from datetime import datetime, timezone
from fastapi import APIRouter, File, UploadFile, Form, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.ai.classifier import classifier_service
from app.ai.transcriber import transcriber_service
from app.models import Issue, Category, Department, IssueStatusEvent
from app.core.database import get_db
from app.core.config import settings
from app.core.deps import get_current_user
from app.models.user import User

router = APIRouter()

INTENT_LIST = [
    'count_issues', 'list_issues', 'status_of', 'sla_summary',
    'department_workload', 'duplicate_review', 'hotspot_list', 'explain_priority'
]

KNOWN_WARDS = [
    "Ward A", "Ward B", "Ward C", "Ward D", "Ward E",
    "Colaba", "Bandra", "Andheri", "Dadar", "Malabar Hill",
    "Worli", "Bandra West", "Bandra East", "Andheri West", "Andheri East",
    "Santacruz", "Vile Parle", "Juhu", "Khar", "Mahim"
]

KNOWN_CATEGORIES = [
    "Roads & Potholes", "Potholes", "Garbage", "Water", "Light",
    "Drainage", "Traffic", "Park", "Air Quality", "Roads",
    "Street Light", "Waste Management", "Sanitation", "Water Supply"
]

VALID_STATUSES = [
    "Reported", "Verifying", "In Progress", "On Hold",
    "Escalated", "Resolved", "Closed", "Rejected", "Verified"
]

class AnalyzeRequest(BaseModel):
    title: str = ""
    description: str = ""

class AssistantQueryRequest(BaseModel):
    user_id: str
    text: str
    role: Optional[str] = None

class AssistantMeta(BaseModel):
    intent: str
    confidence: float
    params_validated: bool
    row_count_used: int
    primary_sql_query: str
    clarification: Optional[bool] = None
    db_backed: bool = True

class AssistantQueryResponse(BaseModel):
    answer_text: str
    structured: Optional[Any] = None
    meta: AssistantMeta


def classify_intent_rule_based(text: str) -> Tuple[str, float]:
    t = text.lower()
    exact = 0.9
    partial = 0.8

    if "how many" in t and ("issue" in t or "report" in t or "complaint" in t):
        return "count_issues", exact
    if ("list" in t and ("issue" in t or "report" in t)) or \
       ("show me" in t and ("issue" in t or "report" in t)) or \
       ("what" in t and ("issue" in t or "open" in t)):
        return "list_issues", exact
    if "status" in t or "where is" in t or "tracking" in t:
        return "status_of", exact
    if "sla" in t or "escalat" in t or "deadline" in t or "breach" in t:
        return "sla_summary", exact
    if "department" in t or "workload" in t or "team" in t or "queue" in t:
        return "department_workload", exact
    if "duplicate" in t or "merge" in t or "similar" in t:
        return "duplicate_review", exact
    if "hotspot" in t or "cluster" in t or "recurring" in t or "map" in t or "nearby" in t:
        return "hotspot_list", exact
    if "priority" in t or ("why" in t and ("high" in t or "score" in t)) or \
       ("explain" in t and "priority" in t):
        return "explain_priority", exact

    if "count" in t and ("issue" in t or "total" in t):
        return "count_issues", partial
    if "show" in t and ("issue" in t or "list" in t):
        return "list_issues", partial
    if "track" in t:
        return "status_of", partial
    if "service level" in t or "escalation" in t or "overdue" in t:
        return "sla_summary", partial
    if "assign" in t or "department" in t:
        return "department_workload", partial
    if "copy" in t or "repeat" in t:
        return "duplicate_review", partial
    if "area" in t or "location" in t or "hot" in t:
        return "hotspot_list", partial
    if "score" in t or "severity" in t:
        return "explain_priority", partial

    return "count_issues", 0.5


def classify_intent_with_gemini(text: str) -> Optional[Tuple[str, float]]:
    if not settings.GEMINI_API_KEY:
        return None
    try:
        import google.generativeai as genai
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-1.5-flash-latest")
        prompt = (
            f"Classify the following user query into EXACTLY ONE of these intents: {INTENT_LIST}.\n"
            f"User query: {text}\n"
            f"Respond with ONLY this JSON format, no extra text: "
            f'{{"intent": "<one_of_{INTENT_LIST}>", "confidence": <0.0_to_1.0>}}'
        )
        resp = model.generate_content(prompt)
        if not resp or not resp.text:
            return None
        import json
        try:
            data = json.loads(resp.text.strip())
            intent = data.get("intent")
            confidence = float(data.get("confidence", 0.5))
            if intent in INTENT_LIST:
                return intent, max(0.0, min(1.0, confidence))
        except Exception:
            pass
    except Exception:
        pass
    return None


def classify_intent(text: str) -> Tuple[str, float]:
    result = classify_intent_with_gemini(text)
    if result:
        return result
    return classify_intent_rule_based(text)


def extract_params(text: str) -> Dict[str, Any]:
    params: Dict[str, Any] = {}

    for ward in KNOWN_WARDS:
        if ward.lower() in text.lower():
            params["ward"] = ward
            break
    if "ward" not in params:
        ward_match = re.search(r'(?:ward|Ward)\s*([A-Z0-9]+)', text)
        if ward_match:
            params["ward"] = f"Ward {ward_match.group(1)}"

    for cat in KNOWN_CATEGORIES:
        if cat.lower() in text.lower():
            params["category"] = cat
            break

    for status in VALID_STATUSES:
        if status.lower() in text.lower():
            params["status"] = status
            break

    days_match = re.search(r'(\d+)\s*days?\b', text, re.IGNORECASE)
    if days_match:
        params["days"] = int(days_match.group(1))

    tracking_match = re.search(r'CT-\d{4}-\d+', text)
    if tracking_match:
        params["tracking_number"] = tracking_match.group(0)
    else:
        tracking_match2 = re.search(r'\b[A-Z]{2,3}[-_]?\d{4}[-_]?\d{3,8}\b', text)
        if tracking_match2:
            params["tracking_number"] = tracking_match2.group(0)

    issue_id_match = re.search(r'iss-[A-Za-z0-9]+', text)
    if issue_id_match:
        params["issue_id"] = issue_id_match.group(0)

    return params


def validate_slots(params: Dict[str, Any], db: Session, intent: str, confidence: float) -> Tuple[Dict[str, Any], bool, float]:
    validated = dict(params)
    params_validated = True
    conf = confidence

    if "category" in validated:
        cat_name = validated["category"]
        exists = db.query(Category).filter(
            (Category.name == cat_name) | (Category.id == cat_name)
        ).first()
        if not exists:
            del validated["category"]
            conf -= 0.15
            params_validated = False

    if "ward" in validated:
        ward_val = validated["ward"]
        exists = db.query(Issue).filter(Issue.ward == ward_val).first()
        if not exists:
            ward_lower = ward_val.lower()
            any_match = db.query(Issue).filter(Issue.ward.ilike(f"%{ward_lower}%")).first()
            if any_match:
                validated["ward"] = any_match.ward
            else:
                del validated["ward"]
                conf -= 0.1
                params_validated = False

    if "status" in validated:
        status_val = validated["status"]
        if status_val not in VALID_STATUSES:
            normalized = None
            for vs in VALID_STATUSES:
                if vs.lower() == status_val.lower():
                    normalized = vs
                    break
            if normalized:
                validated["status"] = normalized
            else:
                del validated["status"]
                conf -= 0.1
                params_validated = False

    required_issue_id = intent in ["status_of", "explain_priority"]
    if required_issue_id and "tracking_number" not in validated and "issue_id" not in validated:
        params_validated = False
        conf -= 0.05

    conf = max(0.0, min(1.0, conf))
    return validated, params_validated, conf


def format_sql_for_meta(intent: str, validated: Dict[str, Any]) -> str:
    parts = []
    for k, v in validated.items():
        if isinstance(v, str):
            parts.append(f"{k}='{v}'")
        else:
            parts.append(f"{k}={v}")
    where_clause = " AND ".join(parts) if parts else "1=1"

    if intent == "count_issues":
        return f"SELECT count(*) FROM issues WHERE {where_clause}"
    elif intent == "list_issues":
        return f"SELECT id, tracking_number, status, category_id, title, ward FROM issues WHERE {where_clause} LIMIT 20"
    elif intent == "status_of":
        return f"SELECT tracking_number, status, updated_at FROM issues WHERE {where_clause} LIMIT 1"
    elif intent == "sla_summary":
        return f"SELECT id, created_at, status FROM issues WHERE {where_clause}"
    elif intent == "department_workload":
        return f"SELECT assigned_department_id, status, count(*) FROM issues WHERE {where_clause} GROUP BY assigned_department_id, status"
    elif intent == "duplicate_review":
        return f"SELECT id, tracking_number, title, is_duplicate, duplicate_candidates FROM issues WHERE is_duplicate=true OR duplicate_candidates IS NOT NULL LIMIT 20"
    elif intent == "hotspot_list":
        return f"SELECT id, latitude, longitude FROM issues WHERE latitude IS NOT NULL AND longitude IS NOT NULL"
    elif intent == "explain_priority":
        return f"SELECT id, priority, priority_score, severity, category_id, created_at, supporting_count FROM issues WHERE {where_clause} LIMIT 1"
    return f"SELECT * FROM issues WHERE {where_clause}"


def execute_query(intent: str, validated: Dict[str, Any], db: Session) -> Tuple[Any, int]:
    query = db.query(Issue)

    if "ward" in validated:
        query = query.filter(Issue.ward == validated["ward"])
    if "category" in validated:
        cat = db.query(Category).filter(Category.name == validated["category"]).first()
        if cat:
            query = query.filter(Issue.category_id == cat.id)
    if "status" in validated:
        query = query.filter(Issue.status == validated["status"])
    if "days" in validated:
        from datetime import timedelta
        cutoff = datetime.utcnow() - timedelta(days=validated["days"])
        query = query.filter(Issue.created_at >= cutoff)

    if intent == "count_issues":
        count = query.count()
        result: Dict[str, Any] = {"count": count}
        if "ward" in validated:
            result["ward"] = validated["ward"]
        if "category" in validated:
            result["category"] = validated["category"]
        return result, count

    elif intent == "list_issues":
        issues = query.limit(20).all()
        simplified = []
        for iss in issues:
            cat_name = None
            if iss.category_id:
                c = db.query(Category).filter(Category.id == iss.category_id).first()
                if c:
                    cat_name = c.name
            simplified.append({
                "id": iss.id,
                "trackingNumber": iss.tracking_number,
                "status": iss.status,
                "category": cat_name,
                "title": iss.title,
                "ward": iss.ward,
            })
        return simplified, len(simplified)

    elif intent == "status_of":
        iss = None
        if "tracking_number" in validated:
            iss = db.query(Issue).filter(Issue.tracking_number == validated["tracking_number"]).first()
        if not iss and "issue_id" in validated:
            iss = db.query(Issue).filter(Issue.id == validated["issue_id"]).first()
        if not iss:
            query_first = query.first()
            if query_first:
                iss = query_first
        if iss:
            return {
                "trackingNumber": iss.tracking_number,
                "status": iss.status,
                "updatedAt": iss.updated_at.isoformat() if iss.updated_at else None,
            }, 1
        return None, 0

    elif intent == "sla_summary":
        issues = query.all()
        tier_counts: Dict[str, int] = {"Normal": 0, "At Risk": 0, "Overdue": 0, "Breached": 0}
        at_risk_ids = []
        now = datetime.utcnow()
        for iss in issues:
            if iss.status in ("Verified", "Resolved", "Closed"):
                tier_counts["Normal"] += 1
                continue
            age_hours = 0
            if iss.created_at:
                age = now - iss.created_at
                age_hours = age.total_seconds() / 3600
            if age_hours < 24:
                tier_counts["Normal"] += 1
            elif age_hours < 48:
                tier_counts["At Risk"] += 1
                at_risk_ids.append({"id": iss.id, "trackingNumber": iss.tracking_number, "ageHours": round(age_hours, 1)})
            elif age_hours < 72:
                tier_counts["Overdue"] += 1
                at_risk_ids.append({"id": iss.id, "trackingNumber": iss.tracking_number, "ageHours": round(age_hours, 1)})
            else:
                tier_counts["Breached"] += 1
                at_risk_ids.append({"id": iss.id, "trackingNumber": iss.tracking_number, "ageHours": round(age_hours, 1)})
        return {
            "countsByTier": tier_counts,
            "issuesAtRisk": at_risk_ids[:20],
        }, len(issues)

    elif intent == "department_workload":
        dept_map: Dict[str, Dict[str, Any]] = {}
        issues = query.all()
        for iss in issues:
            d_id = iss.assigned_department_id or "Unassigned"
            if d_id not in dept_map:
                d_name = "Unassigned"
                if d_id != "Unassigned":
                    d = db.query(Department).filter(Department.id == d_id).first()
                    if d:
                        d_name = d.name
                dept_map[d_id] = {"departmentName": d_name, "open": 0, "resolved": 0, "inProgress": 0}
            status = iss.status
            if status in ("Resolved", "Verified", "Closed"):
                dept_map[d_id]["resolved"] += 1
            elif status in ("In Progress", "Escalated", "On Hold", "Verifying"):
                dept_map[d_id]["inProgress"] += 1
            else:
                dept_map[d_id]["open"] += 1
        result_list = list(dept_map.values())
        return result_list, len(issues)

    elif intent == "duplicate_review":
        dup_issues = db.query(Issue).filter(
            (Issue.is_duplicate == True) | (Issue.duplicate_candidates.isnot(None))
        ).limit(20).all()
        result_list = []
        for iss in dup_issues:
            dup_count = 0
            if iss.duplicate_candidates:
                try:
                    import json
                    dc = json.loads(iss.duplicate_candidates)
                    if isinstance(dc, list):
                        dup_count = len(dc)
                    elif isinstance(dc, str):
                        dup_count = len([x for x in dc.split(",") if x.strip()])
                except Exception:
                    dup_count = 1
            result_list.append({
                "issueId": iss.id,
                "trackingNumber": iss.tracking_number,
                "title": iss.title,
                "isDuplicate": bool(iss.is_duplicate),
                "dupCandidateCount": dup_count,
            })
        return result_list, len(result_list)

    elif intent == "hotspot_list":
        hotspot_issues = db.query(Issue).filter(
            Issue.latitude.isnot(None), Issue.longitude.isnot(None)
        ).all()
        points = [(i.id, float(i.latitude), float(i.longitude)) for i in hotspot_issues]

        def haversine(lat1, lon1, lat2, lon2):
            R = 6371000.0
            phi1 = math.radians(lat1)
            phi2 = math.radians(lat2)
            dphi = math.radians(lat2 - lat1)
            dl = math.radians(lon2 - lon1)
            a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dl/2)**2
            return 2 * R * math.asin(math.sqrt(a))

        used = set()
        clusters: List[Dict[str, Any]] = []
        cluster_id = 0
        for i, p1 in enumerate(points):
            if i in used:
                continue
            cluster_points = [p1]
            used.add(i)
            for j, p2 in enumerate(points):
                if j in used or j == i:
                    continue
                if haversine(p1[1], p1[2], p2[1], p2[2]) <= 150:
                    cluster_points.append(p2)
                    used.add(j)
            if len(cluster_points) >= 3:
                centroid_lat = sum(p[1] for p in cluster_points) / len(cluster_points)
                centroid_lng = sum(p[2] for p in cluster_points) / len(cluster_points)
                clusters.append({
                    "clusterId": f"cluster_{cluster_id}",
                    "count": len(cluster_points),
                    "centroidLat": round(centroid_lat, 6),
                    "centroidLng": round(centroid_lng, 6),
                })
                cluster_id += 1
        return clusters, len(hotspot_issues)

    elif intent == "explain_priority":
        iss = None
        if "issue_id" in validated:
            iss = db.query(Issue).filter(Issue.id == validated["issue_id"]).first()
        if not iss and "tracking_number" in validated:
            iss = db.query(Issue).filter(Issue.tracking_number == validated["tracking_number"]).first()
        if not iss:
            iss = query.first()
        if iss:
            cat_name = None
            if iss.category_id:
                c = db.query(Category).filter(Category.id == iss.category_id).first()
                if c:
                    cat_name = c.name
            factors_parts = []
            if iss.severity:
                factors_parts.append(f"severity={iss.severity}")
            if iss.supporting_count:
                factors_parts.append(f"report_count={iss.supporting_count}")
            if iss.priority_factors_json:
                try:
                    import json
                    factors = json.loads(iss.priority_factors_json)
                    if isinstance(factors, dict):
                        for k, v in factors.items():
                            factors_parts.append(f"{k}={v}")
                except Exception:
                    pass
            return {
                "issueId": iss.id,
                "priority": iss.priority,
                "priorityScore": iss.priority_score,
                "severity": iss.severity,
                "category": cat_name,
                "reportCount": iss.supporting_count,
                "createdAt": iss.created_at.isoformat() if iss.created_at else None,
                "factorsSummary": ", ".join(factors_parts) if factors_parts else "default scoring",
            }, 1
        return None, 0

    return None, 0


def summarize_rule_based(intent: str, structured: Any, validated: Dict[str, Any]) -> str:
    if intent == "count_issues":
        if isinstance(structured, dict) and "count" in structured:
            count = structured["count"]
            extras = []
            if structured.get("ward"):
                extras.append(f"in {structured['ward']}")
            if structured.get("category"):
                extras.append(f"for {structured['category']}")
            extra_str = (" " + " ".join(extras)) if extras else ""
            if count == 0:
                return f"No issues matching those criteria found{extra_str}."
            return f"There are exactly {count} issues matching your query{extra_str}."

    elif intent == "list_issues":
        if isinstance(structured, list):
            n = len(structured)
            if n == 0:
                return "No issues matching those criteria found."
            lines = [f"Found {n} matching issues (showing top {min(n, 20)}):"]
            for item in structured:
                tn = item.get("trackingNumber", "?")
                st = item.get("status", "?")
                ca = item.get("category", "?")
                ti = item.get("title", "?")
                lines.append(f"  - [{tn}] {ti} | Status: {st} | Category: {ca}")
            return "\n".join(lines)

    elif intent == "status_of":
        if isinstance(structured, dict):
            tn = structured.get("trackingNumber")
            st = structured.get("status")
            if tn and st:
                return f"Issue {tn} is currently {st}."
        return "No issue matching that tracking number or ID found."

    elif intent == "sla_summary":
        if isinstance(structured, dict) and "countsByTier" in structured:
            c = structured["countsByTier"]
            return (
                f"SLA Summary: Normal={c.get('Normal', 0)}, At Risk={c.get('At Risk', 0)}, "
                f"Overdue={c.get('Overdue', 0)}, Breached={c.get('Breached', 0)}."
            )

    elif intent == "department_workload":
        if isinstance(structured, list):
            if len(structured) == 0:
                return "No department workload data found."
            lines = ["Department workload summary:"]
            for dept in structured:
                name = dept.get("departmentName", "?")
                op = dept.get("open", 0)
                rs = dept.get("resolved", 0)
                ip = dept.get("inProgress", 0)
                lines.append(f"  - {name}: Open={op}, In Progress={ip}, Resolved={rs}")
            return "\n".join(lines)

    elif intent == "duplicate_review":
        if isinstance(structured, list):
            n = len(structured)
            if n == 0:
                return "No issues flagged for duplicate review."
            lines = [f"{n} issues flagged for duplicate review:"]
            for item in structured:
                tn = item.get("trackingNumber", "?")
                ti = item.get("title", "?")
                dup = item.get("dupCandidateCount", 0)
                lines.append(f"  - [{tn}] {ti} ({dup} candidate links)")
            return "\n".join(lines)

    elif intent == "hotspot_list":
        if isinstance(structured, list):
            n = len(structured)
            if n == 0:
                return "No hotspot clusters detected (need at least 3 issues within 150m)."
            return f"Detected {n} hotspot clusters geographically."

    elif intent == "explain_priority":
        if isinstance(structured, dict):
            iss_id = structured.get("issueId", "?")
            pr = structured.get("priority", "?")
            ps = structured.get("priorityScore", "?")
            factors = structured.get("factorsSummary", "")
            return f"Issue {iss_id} priority is {pr} (score {ps}) because: {factors}."
        return "No issue found to explain priority for."

    return "Query completed."


def summarize_with_gemini(intent: str, structured: Any, text: str) -> Optional[str]:
    if not settings.GEMINI_API_KEY:
        return None
    try:
        import google.generativeai as genai
        import json
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-1.5-flash-latest")
        prompt = (
            f"User asked: '{text}' (intent={intent}).\n"
            f"Here is the actual structured result from our database:\n"
            f"{json.dumps(structured, default=str, indent=2)}\n"
            f"Summarize this in 1-3 natural sentences. DO NOT invent any numbers or facts. "
            f"Only use what is in the data above. If data is empty or 0, say so clearly."
        )
        resp = model.generate_content(prompt)
        if resp and resp.text:
            return resp.text.strip()
    except Exception:
        pass
    return None


@router.post("/analyze-issue")
async def analyze_issue(
    title: Optional[str] = Form(""),
    description: Optional[str] = Form(""),
    image: Optional[UploadFile] = File(None)
):
    text_content = f"{title or ''} {description or ''}".strip()
    
    image_bytes = None
    mime_type = None
    if image:
        image_bytes = await image.read()
        mime_type = image.content_type

    result = classifier_service.classify(
        text=text_content,
        image_bytes=image_bytes,
        mime_type=mime_type
    )
    return result

@router.post("/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...)
):
    try:
        suffix = os.path.splitext(file.filename)[1] or ".tmp"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name

        try:
            result = transcriber_service.transcribe(tmp_path)
            return result
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process audio file: {str(e)}")


@router.post("/assistant/query", response_model=AssistantQueryResponse)
async def assistant_query(
    request: AssistantQueryRequest,
    db: Session = Depends(get_db),
    _current_user: Optional[User] = Depends(lambda: None)
):
    try:
        intent, confidence = classify_intent(request.text)
    except Exception:
        intent, confidence = "count_issues", 0.5

    params = extract_params(request.text)
    validated, params_validated, confidence = validate_slots(params, db, intent, confidence)

    if confidence < 0.75 or not params_validated:
        return AssistantQueryResponse(
            answer_text="Could you clarify? Please specify the ward, category, or status you'd like to query about.",
            structured=None,
            meta=AssistantMeta(
                intent=intent,
                confidence=confidence,
                params_validated=params_validated,
                row_count_used=0,
                primary_sql_query=format_sql_for_meta(intent, validated),
                clarification=True,
                db_backed=True,
            )
        )

    structured, row_count = execute_query(intent, validated, db)
    primary_sql = format_sql_for_meta(intent, validated)

    if row_count == 0 and structured is None or (
        isinstance(structured, list) and len(structured) == 0
    ) or (
        isinstance(structured, dict) and intent == "count_issues" and structured.get("count", 0) == 0
    ):
        rule_summary = summarize_rule_based(intent, structured, validated)
        return AssistantQueryResponse(
            answer_text=rule_summary,
            structured=structured,
            meta=AssistantMeta(
                intent=intent,
                confidence=confidence,
                params_validated=params_validated,
                row_count_used=0,
                primary_sql_query=primary_sql,
                db_backed=True,
            )
        )

    gemini_summary = summarize_with_gemini(intent, structured, request.text)
    if gemini_summary:
        answer_text = gemini_summary
    else:
        answer_text = summarize_rule_based(intent, structured, validated)

    return AssistantQueryResponse(
        answer_text=answer_text,
        structured=structured,
        meta=AssistantMeta(
            intent=intent,
            confidence=confidence,
            params_validated=params_validated,
            row_count_used=row_count,
            primary_sql_query=primary_sql,
            db_backed=True,
        )
    )
