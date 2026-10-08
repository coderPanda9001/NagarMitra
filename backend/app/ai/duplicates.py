import math
import os
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple
from app.models.issue import Issue
from app.ai.embeddings import embedder_service

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371000.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

def text_similarity(text1: str, text2: str) -> float:
    vec1 = embedder_service.get_embedding(text1 or "")
    vec2 = embedder_service.get_embedding(text2 or "")

    if vec1 and vec2 and len(vec1) == len(vec2):
        dot = sum(a * b for a, b in zip(vec1, vec2))
        norm1 = math.sqrt(sum(a * a for a in vec1))
        norm2 = math.sqrt(sum(b * b for b in vec2))
        if norm1 > 0 and norm2 > 0:
            return max(0.0, min(1.0, dot / (norm1 * norm2)))

    words1 = set((text1 or "").lower().split())
    words2 = set((text2 or "").lower().split())
    if not words1 or not words2:
        return 0.0
    intersection = words1.intersection(words2)
    union = words1.union(words2)
    return len(intersection) / float(len(union)) if union else 0.0

def _hamming(a: int, b: int) -> int:
    return bin(a ^ b).count("1")

def _average_hash(image_path: str, hash_size: int = 8) -> Optional[int]:
    try:
        from PIL import Image
    except ImportError:
        return None

    try:
        abs_path = image_path
        if not os.path.isabs(abs_path):
            project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
            abs_path = os.path.join(project_root, image_path.lstrip("/\\"))
        if not os.path.exists(abs_path):
            return None

        with Image.open(abs_path) as im:
            im = im.convert("L").resize((hash_size, hash_size), Image.Resampling.LANCZOS if hasattr(Image, "Resampling") else Image.LANCZOS)
            pixels = list(im.getdata())
        avg = sum(pixels) / len(pixels)
        bits = 0
        for i, p in enumerate(pixels):
            if p >= avg:
                bits |= 1 << i
        return bits
    except Exception:
        return None

def image_similarity(img1_path: Optional[str], img2_path: Optional[str], uploads_root: Optional[str] = None) -> Optional[float]:
    if not img1_path or not img2_path:
        return None

    def _resolve(p: str) -> str:
        if os.path.isabs(p):
            return p
        if uploads_root:
            candidate = os.path.join(uploads_root, os.path.basename(p))
            if os.path.exists(candidate):
                return candidate
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
        abs_p = os.path.join(project_root, p.lstrip("/\\"))
        if os.path.exists(abs_p):
            return abs_p
        return p

    try:
        h1 = _average_hash(_resolve(img1_path))
        h2 = _average_hash(_resolve(img2_path))
    except Exception:
        return None

    if h1 is None or h2 is None:
        return None

    dist = _hamming(h1, h2)
    max_dist = 64
    return max(0.0, 1.0 - (dist / max_dist))

class DuplicateDetector:
    def find_duplicates(
        self,
        new_lat: float,
        new_lng: float,
        new_title: str,
        new_description: str,
        new_category: str,
        new_created_at: datetime,
        new_image_url: Optional[str],
        existing_issues: List[Issue],
        max_distance_meters: float = 100.0,
        uploads_root: Optional[str] = None,
        weights: Optional[Dict[str, float]] = None,
        thresholds: Optional[Dict[str, float]] = None,
    ) -> List[Dict[str, Any]]:
        w = weights or {"location": 0.35, "text": 0.35, "category": 0.15, "time": 0.15}
        th = thresholds or {"duplicate": 0.72, "related": 0.45}

        new_combined_text = f"{new_title} {new_description}".strip()

        candidates: List[Dict[str, Any]] = []
        for issue in existing_issues:
            if not issue.latitude or not issue.longitude:
                continue

            dist = haversine_distance(new_lat, new_lng, issue.latitude, issue.longitude)
            if dist > max_distance_meters:
                continue

            loc_score = max(0.0, 1.0 - (dist / max_distance_meters))

            existing_text = f"{issue.title} {issue.description}".strip()
            t_score = text_similarity(new_combined_text, existing_text)

            cat_match = (issue.category_id or "").lower() == (new_category or "").lower()
            cat_score = 1.0 if cat_match else 0.2

            try:
                days_diff = abs((new_created_at - issue.created_at).total_seconds()) / 86400.0
            except Exception:
                days_diff = 0.0
            time_score = max(0.0, math.exp(-days_diff / 7.0))

            total_score = (
                w.get("location", 0.35) * loc_score
                + w.get("text", 0.35) * t_score
                + w.get("category", 0.15) * cat_score
                + w.get("time", 0.15) * time_score
            )

            existing_first_image = None
            if issue.images and len(issue.images) > 0:
                existing_first_image = issue.images[0].url

            img_score = None
            if new_image_url or existing_first_image:
                img_score = image_similarity(new_image_url, existing_first_image, uploads_root=uploads_root)

            if total_score < th.get("related", 0.45) and (img_score is None or img_score < 0.6):
                continue

            classification = "Duplicate" if total_score >= th.get("duplicate", 0.72) else "Related"

            reason_parts = [
                f"Distance: {round(dist, 1)}m",
                f"Text similarity: {round(t_score * 100)}%",
                f"Category match: {'Yes' if cat_match else 'No'}",
                f"Age delta: {round(days_diff, 1)}d"
            ]
            if img_score is not None:
                reason_parts.append(f"Image sim: {round(img_score * 100)}%")

            candidate = {
                "candidate_issue_id": issue.id,
                "candidate_title": issue.title,
                "candidate_tracking_number": issue.tracking_number,
                "similarity_score": round(total_score * 100, 1),
                "distance_meters": round(dist, 1),
                "classification": classification,
                "reason": " | ".join(reason_parts),
                "status": issue.status,
                "loc_score": round(loc_score, 3),
                "text_score": round(t_score, 3),
                "cat_score": round(cat_score, 3),
                "time_score": round(time_score, 3),
            }
            if img_score is not None:
                candidate["image_score"] = round(img_score, 3)
            candidates.append(candidate)

        candidates.sort(key=lambda x: x["similarity_score"], reverse=True)
        return candidates

duplicate_detector = DuplicateDetector()
