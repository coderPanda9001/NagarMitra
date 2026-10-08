from datetime import datetime
import pytest
from app.ai.priority import priority_engine

def test_priority_engine_score():
    res = priority_engine.calculate_priority(
        severity="High",
        report_count=5,
        created_at=datetime.utcnow()
    )
    assert "priority" in res
    assert "total_score" in res
    assert "factors" in res
    assert res["total_score"] > 0

def test_priority_critical_severity():
    res = priority_engine.calculate_priority(
        severity="Critical",
        report_count=10,
        created_at=datetime.utcnow(),
        is_recurrent=True
    )
    assert res["priority"] == "Critical"
