from typing import Dict, Any

class AICategorizer:
    def analyze_issue(self, title: str, description: str) -> Dict[str, Any]:
        text = f"{title} {description}".lower()
        if "pothole" in text or "road" in text or "crack" in text:
            return {"category": "Roads & Potholes", "severity": "High", "confidence": 0.94}
        elif "water" in text or "leak" in text or "pipeline" in text:
            return {"category": "Water Supply & Leakage", "severity": "Critical", "confidence": 0.91}
        elif "garbage" in text or "trash" in text or "waste" in text:
            return {"category": "Garbage & Sanitation", "severity": "Medium", "confidence": 0.88}
        elif "light" in text or "lamp" in text or "dark" in text:
            return {"category": "Street Lighting", "severity": "Medium", "confidence": 0.85}
        else:
            return {"category": "Other", "severity": "Low", "confidence": 0.75}

ai_categorizer = AICategorizer()
