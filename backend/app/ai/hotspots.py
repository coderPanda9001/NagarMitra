import math
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from collections import Counter
from sqlalchemy.orm import Session
from app.models.issue import Issue


def haversine_m(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    R = 6371000.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lng2 - lng1)
    a = (math.sin(delta_phi / 2.0) ** 2
         + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c


_SKLEARN_USED = False


def find_hotspots(
    issues_list: List[Any],
    radius_m: float = 150,
    min_samples: int = 3
) -> List[Dict[str, Any]]:
    global _SKLEARN_USED
    valid = []
    for iss in issues_list:
        lat = getattr(iss, "latitude", None)
        lng = getattr(iss, "longitude", None)
        if lat is None or lng is None:
            continue
        try:
            lat_f = float(lat)
            lng_f = float(lng)
        except (TypeError, ValueError):
            continue
        valid.append((iss, lat_f, lng_f))

    if len(valid) < min_samples:
        _SKLEARN_USED = False
        return []

    clusters: List[Dict[str, Any]] = []
    used_sklearn = False

    try:
        import numpy as np
        from sklearn.cluster import DBSCAN

        coords = np.radians([[lat, lng] for (_, lat, lng) in valid])
        eps = float(radius_m) / 6371000.0
        db = DBSCAN(
            eps=eps,
            min_samples=min_samples,
            metric="haversine"
        )
        labels = db.fit_predict(coords)
        used_sklearn = True

        label_groups: Dict[int, List[int]] = {}
        for idx, lbl in enumerate(labels):
            if int(lbl) == -1:
                continue
            label_groups.setdefault(int(lbl), []).append(idx)

        for cid, idxs in label_groups.items():
            if len(idxs) < min_samples:
                continue
            members = [valid[i][0] for i in idxs]
            lats = [valid[i][1] for i in idxs]
            lngs = [valid[i][2] for i in idxs]
            c_lat = sum(lats) / len(lats)
            c_lng = sum(lngs) / len(lngs)
            issue_ids = [getattr(m, "id", str(idx)) for m in members]
            cats = []
            for m in members:
                cid_val = getattr(m, "category_id", None)
                if cid_val:
                    cats.append(str(cid_val))
            top3 = [c for c, _ in Counter(cats).most_common(3)]
            clusters.append({
                "cluster_id": f"cluster-{cid}",
                "centroid_lat": c_lat,
                "centroid_lng": c_lng,
                "count": len(members),
                "issue_ids": issue_ids,
                "category_top3": top3,
            })
    except ImportError:
        used_sklearn = False
    except Exception:
        used_sklearn = False

    if not used_sklearn:
        n = len(valid)
        visited = [False] * n
        cluster_id_counter = 0
        for i in range(n):
            if visited[i]:
                continue
            seed_iss, seed_lat, seed_lng = valid[i]
            members_idx = [i]
            for j in range(i + 1, n):
                if visited[j]:
                    continue
                _, j_lat, j_lng = valid[j]
                if haversine_m(seed_lat, seed_lng, j_lat, j_lng) <= float(radius_m):
                    members_idx.append(j)
            if len(members_idx) >= min_samples:
                for mi in members_idx:
                    visited[mi] = True
                members = [valid[idx][0] for idx in members_idx]
                lats = [valid[idx][1] for idx in members_idx]
                lngs = [valid[idx][2] for idx in members_idx]
                c_lat = sum(lats) / len(lats)
                c_lng = sum(lngs) / len(lngs)
                issue_ids = [getattr(m, "id", str(idx)) for m in members]
                cats = []
                for m in members:
                    cid_val = getattr(m, "category_id", None)
                    if cid_val:
                        cats.append(str(cid_val))
                top3 = [c for c, _ in Counter(cats).most_common(3)]
                clusters.append({
                    "cluster_id": f"cluster-{cluster_id_counter}",
                    "centroid_lat": c_lat,
                    "centroid_lng": c_lng,
                    "count": len(members),
                    "issue_ids": issue_ids,
                    "category_top3": top3,
                })
                cluster_id_counter += 1

    _SKLEARN_USED = used_sklearn
    return clusters


def get_last_sklearn_used() -> bool:
    global _SKLEARN_USED
    return _SKLEARN_USED


def label_recurring(
    db: Session,
    issue: Issue,
    radius_m: float = 100,
    days: int = 30
) -> bool:
    try:
        if not issue or not issue.id:
            return False
        lat = getattr(issue, "latitude", None)
        lng = getattr(issue, "longitude", None)
        cat_id = getattr(issue, "category_id", None)
        created = getattr(issue, "created_at", None)
        if lat is None or lng is None or created is None:
            return False

        cutoff = created - timedelta(days=days)

        query = db.query(Issue).filter(Issue.id != issue.id)
        if cat_id is not None:
            query = query.filter(Issue.category_id == cat_id)
        query = query.filter(Issue.created_at >= cutoff)

        matches = 0
        for other in query.all():
            o_lat = getattr(other, "latitude", None)
            o_lng = getattr(other, "longitude", None)
            if o_lat is None or o_lng is None:
                continue
            try:
                dist = haversine_m(float(lat), float(lng), float(o_lat), float(o_lng))
            except (TypeError, ValueError):
                continue
            if dist <= float(radius_m):
                matches += 1
                if matches >= 2:
                    return True
        return False
    except Exception:
        return False
