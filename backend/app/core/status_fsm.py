from typing import Dict, Set, Tuple, Optional

VALID_STATUSES = {
    "Reported",
    "Under Review",
    "Confirmed",
    "Assigned",
    "Work Scheduled",
    "In Progress",
    "Resolution Submitted",
    "Awaiting Verification",
    "Resolved",
    "Verified",
    "Reopened",
    "Duplicate",
    "Rejected",
}

TRANSITIONS: Dict[str, Set[str]] = {
    "Reported": {"Under Review", "Duplicate", "Rejected"},
    "Under Review": {"Confirmed", "Rejected", "Duplicate"},
    "Confirmed": {"Assigned", "Duplicate", "Reopened"},
    "Assigned": {"Work Scheduled", "In Progress"},
    "Work Scheduled": {"In Progress"},
    "In Progress": {"Resolution Submitted", "Reopened"},
    "Resolution Submitted": {"Awaiting Verification"},
    "Awaiting Verification": {"Resolved", "Reopened"},
    "Resolved": {"Verified", "Reopened"},
    "Verified": set(),
    "Reopened": {"Confirmed", "In Progress", "Under Review"},
    "Duplicate": set(),
    "Rejected": {"Under Review", "Confirmed"},
}

NO_TRANSITION_REQUIRED = {
    "Reported",
    "Under Review",
    "Confirmed",
    "Assigned",
    "Work Scheduled",
    "In Progress",
    "Resolution Submitted",
    "Awaiting Verification",
    "Resolved",
    "Verified",
    "Reopened",
    "Duplicate",
    "Rejected",
}


def validate_transition(current: str, target: str) -> Tuple[bool, str]:
    if current == target:
        return True, ""
    if current not in TRANSITIONS:
        return False, f"Unknown source status: {current}"
    if target not in VALID_STATUSES:
        return False, f"Unknown target status: {target}"
    allowed = TRANSITIONS.get(current, set())
    if target in allowed:
        return True, ""
    return False, f"Invalid transition: {current} cannot go to {target}"


def allowed_targets(current: str) -> Set[str]:
    return TRANSITIONS.get(current, set())
