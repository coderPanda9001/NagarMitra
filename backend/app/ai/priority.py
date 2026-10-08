import math
from datetime import datetime
from typing import Dict, Any, List, Optional

class PriorityEngine:
    @staticmethod
    def _severity_points(severity: str) -> int:
        sev_upper = (severity or "Medium").upper()
        if sev_upper == "CRITICAL":
            return 40
        if sev_upper == "HIGH":
            return 30
        if sev_upper == "MEDIUM":
            return 20
        return 10

    @staticmethod
    def _report_count_points(count: int) -> int:
        c = max(1, count or 1)
        return min(25, (c - 1) * 5)

    @staticmethod
    def _age_points(created_at: datetime) -> int:
        try:
            age_days = (datetime.utcnow() - created_at).total_seconds() / 86400.0
        except Exception:
            age_days = 0
        return min(20, int(max(0.0, age_days) * 2))

    @staticmethod
    def _haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        R = 6371000.0
        phi1, phi2 = math.radians(lat1), math.radians(lat2)
        dp = math.radians(lat2 - lat1)
        dl = math.radians(lon2 - lon1)
        a = math.sin(dp / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dl / 2.0) ** 2
        return 2.0 * R * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

    def _is_recurrent(
        self,
        issue_id: str,
        lat: Optional[float],
        lng: Optional[float],
        category: Optional[str],
        nearby_issues: Optional[List[Any]] = None,
        radius_m: float = 100.0,
        threshold: int = 3,
    ) -> bool:
        if not nearby_issues or lat is None or lng is None:
            return False
        count = 0
        for other in nearby_issues:
            if getattr(other, "id", None) == issue_id:
                continue
            other_lat = getattr(other, "latitude", None)
            other_lng = getattr(other, "longitude", None)
            other_cat = getattr(other, "category_id", None)
            if other_lat is None or other_lng is None:
                continue
            if category and other_cat and (other_cat or "").lower() != (category or "").lower():
                continue
            dist = self._haversine_m(lat, lng, other_lat, other_lng)
            if dist <= radius_m:
                count += 1
            if count >= threshold:
                return True
        return False

    def calculate_priority(
        self,
        severity: str,
        report_count: int,
        created_at: datetime,
        is_recurrent: bool = False,
        issue_id: Optional[str] = None,
        lat: Optional[float] = None,
        lng: Optional[float] = None,
        category: Optional[str] = None,
        nearby_issues: Optional[List[Any]] = None,
    ) -> Dict[str, Any]:
        score = 0
        factors = []

        sev_pts = self._severity_points(severity)
        factors.append({
            "factor": "AI Severity",
            "value": (severity or "Medium").capitalize(),
            "points": sev_pts,
        })
        score += sev_pts

        cnt_pts = self._report_count_points(report_count)
        count = max(1, report_count or 1)
        if cnt_pts > 0:
            factors.append({
                "factor": "Citizen Support",
                "value": f"{count} citizen reports",
                "points": cnt_pts,
            })
            score += cnt_pts

        age_pts = self._age_points(created_at)
        if age_pts > 0:
            try:
                age_days = (datetime.utcnow() - created_at).total_seconds() / 86400.0
            except Exception:
                age_days = 0
            factors.append({
                "factor": "Age / SLA Elapsed",
                "value": f"{round(max(0.0, age_days), 1)} days open",
                "points": age_pts,
            })
            score += age_pts

        if not is_recurrent and nearby_issues is not None and lat is not None:
            is_recurrent = self._is_recurrent(issue_id or "", lat, lng, category, nearby_issues)

        if is_recurrent:
            factors.append({
                "factor": "Recurrent Hotspot",
                "value": "High frequency zone",
                "points": 15,
            })
            score += 15

        if score >= 65:
            priority = "Critical"
        elif score >= 45:
            priority = "High"
        elif score >= 30:
            priority = "Medium"
        else:
            priority = "Low"

        sev_val = (severity or "Medium").capitalize()
        return {
            "priority": priority,
            "total_score": score,
            "factors": factors,
            "explanation": f"Calculated score {score}/100 based on severity ({sev_val}), support ({count}), and SLA age.",
        }


priority_engine = PriorityEngine()
