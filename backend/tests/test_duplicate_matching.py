from datetime import datetime
import pytest
from app.ai.duplicates import duplicate_detector, haversine_distance, text_similarity

def test_haversine_distance():
    # Same point
    d0 = haversine_distance(19.1136, 72.8697, 19.1136, 72.8697)
    assert d0 == 0.0

    # Nearby point (approx 10-20 meters)
    d1 = haversine_distance(19.1136, 72.8697, 19.1137, 72.8698)
    assert 0 < d1 < 50.0

def test_text_similarity():
    sim = text_similarity("Pothole on SV Road", "Deep Pothole on SV Road")
    assert sim > 0.5

def test_spatial_duplicate_detector():
    candidates = duplicate_detector.find_duplicates(
        new_lat=19.1136,
        new_lng=72.8697,
        new_title="Massive Pothole near Station",
        new_description="Large hole in middle of road causing traffic",
        new_category="Roads & Potholes",
        new_created_at=datetime.utcnow(),
        new_image_url=None,
        existing_issues=[]
    )
    assert isinstance(candidates, list)
