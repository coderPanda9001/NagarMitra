import os
import json
import logging
from typing import Dict, Any, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

CATEGORIES = [
    "Roads & Potholes",
    "Street Lighting",
    "Garbage & Sanitation",
    "Water Supply & Leakage",
    "Drainage & Sewage",
    "Traffic & Signs",
    "Parks & Trees",
    "Public Property Damage",
    "Noise & Nuisance",
    "Other"
]

CATEGORY_TO_DEPT = {
    "Roads & Potholes": "Public Works Department",
    "Street Lighting": "Electrical Services",
    "Garbage & Sanitation": "Sanitation & Waste Management",
    "Water Supply & Leakage": "Water Supply & Sewage Board",
    "Drainage & Sewage": "Water Supply & Sewage Board",
    "Traffic & Signs": "Traffic & Transit Authority",
    "Parks & Trees": "Parks & Horticulture",
    "Public Property Damage": "Public Works Department",
    "Noise & Nuisance": "Health & Environment",
    "Other": "General Administration"
}

class IssueClassifier:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY", getattr(settings, "GEMINI_API_KEY", ""))

    def classify(self, text: str, image_bytes: Optional[bytes] = None, mime_type: Optional[str] = None) -> Dict[str, Any]:
        api_key = os.getenv("GEMINI_API_KEY") or self.api_key
        if api_key:
            try:
                from google import genai
                from google.genai import types
                
                client = genai.Client(api_key=api_key)
                prompt = f"""You are an AI civic issue classification system.
Analyze the following civic issue description and optional image.
Categorize it strictly into ONE of these 10 categories:
{json.dumps(CATEGORIES)}

Provide response STRICTLY in valid JSON with these exact keys:
- "category": string (must be exact match from the 10 categories)
- "severity": string (one of "Low", "Medium", "High", "Critical")
- "confidence": float (between 0.50 and 0.99)
- "reasoning": string (1-2 sentences explaining why this category and severity were chosen)
- "tags": list of 2-4 string keywords

Issue Description: "{text}"
"""
                contents = [prompt]
                if image_bytes and mime_type:
                    contents.append(
                        types.Part.from_bytes(
                            data=image_bytes,
                            mime_type=mime_type
                        )
                    )

                response = client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=contents,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json"
                    )
                )

                if response.text:
                    parsed = json.loads(response.text)
                    cat = parsed.get("category", "Other")
                    if cat not in CATEGORIES:
                        cat = "Other"
                    dept = CATEGORY_TO_DEPT.get(cat, "General Administration")
                    return {
                        "category": cat,
                        "severity": parsed.get("severity", "Medium"),
                        "confidence": float(parsed.get("confidence", 0.88)),
                        "reasoning": parsed.get("reasoning", "Classified using Gemini vision & language model."),
                        "suggested_department": dept,
                        "tags": parsed.get("tags", [cat.lower()]),
                        "source": "gemini-2.5-flash"
                    }
            except Exception as e:
                logger.warning(f"Gemini API classification error, falling back to rule-based: {e}")

        # Transparent Rule-Based Classifier Fallback
        return self._rule_based_classify(text)

    def _rule_based_classify(self, text: str) -> Dict[str, Any]:
        lower = text.lower()
        
        if any(w in lower for w in ["pothole", "road", "asphalt", "tar", "crack", "street hole"]):
            category = "Roads & Potholes"
            severity = "High" if any(w in lower for w in ["deep", "big", "accident", "danger", "broken"]) else "Medium"
            confidence = 0.88
            reasoning = "Keywords related to road surface defects detected (rule-based classification)."
            tags = ["road", "pothole", "infrastructure"]
        elif any(w in lower for w in ["light", "lamp", "pole", "dark", "street light", "bulb"]):
            category = "Street Lighting"
            severity = "High" if "dark" in lower or "night" in lower else "Medium"
            confidence = 0.85
            reasoning = "Keywords related to lighting or illumination detected (rule-based classification)."
            tags = ["lighting", "street-lamp", "electricity"]
        elif any(w in lower for w in ["garbage", "trash", "waste", "bin", "dump", "litter", "smell", "stink"]):
            category = "Garbage & Sanitation"
            severity = "High" if any(w in lower for w in ["overflow", "stink", "smell", "unhygienic"]) else "Medium"
            confidence = 0.89
            reasoning = "Keywords related to waste management and sanitation detected (rule-based classification)."
            tags = ["sanitation", "garbage", "cleanliness"]
        elif any(w in lower for w in ["water", "leak", "pipe", "burst", "drinking", "supply"]):
            category = "Water Supply & Leakage"
            severity = "Critical" if any(w in lower for w in ["burst", "flooding", "heavy leak", "drinking"]) else "High"
            confidence = 0.90
            reasoning = "Keywords related to water supply pipelines detected (rule-based classification)."
            tags = ["water", "leakage", "pipeline"]
        elif any(w in lower for w in ["drain", "sewage", "gutter", "overflow", "manhole", "clog"]):
            category = "Drainage & Sewage"
            severity = "High" if any(w in lower for w in ["overflow", "block", "smell"]) else "Medium"
            confidence = 0.87
            reasoning = "Keywords related to drainage and sewage overflow detected (rule-based classification)."
            tags = ["drainage", "sewage", "overflow"]
        elif any(w in lower for w in ["traffic", "signal", "sign", "zebra", "crosswalk", "congestion"]):
            category = "Traffic & Signs"
            severity = "High" if "signal" in lower else "Medium"
            confidence = 0.84
            reasoning = "Keywords related to traffic signals and road signage detected (rule-based classification)."
            tags = ["traffic", "signals", "road-safety"]
        elif any(w in lower for w in ["tree", "park", "branch", "bench", "grass", "garden"]):
            category = "Parks & Trees"
            severity = "High" if any(w in lower for w in ["fallen", "blocking", "danger"]) else "Low"
            confidence = 0.86
            reasoning = "Keywords related to public parks and flora detected (rule-based classification)."
            tags = ["parks", "trees", "greenery"]
        elif any(w in lower for w in ["wall", "bench", "damage", "graffiti", "bus stop", "vandalism"]):
            category = "Public Property Damage"
            severity = "Medium"
            confidence = 0.83
            reasoning = "Keywords related to public infrastructure damage detected (rule-based classification)."
            tags = ["public-property", "damage", "vandalism"]
        elif any(w in lower for w in ["noise", "loud", "speaker", "nuisance", "music", "barking"]):
            category = "Noise & Nuisance"
            severity = "Low"
            confidence = 0.82
            reasoning = "Keywords related to environmental noise detected (rule-based classification)."
            tags = ["noise", "nuisance", "environment"]
        else:
            category = "Other"
            severity = "Medium"
            confidence = 0.70
            reasoning = "General issue description classified under default category (rule-based classification)."
            tags = ["general", "civic"]

        dept = CATEGORY_TO_DEPT.get(category, "General Administration")
        return {
            "category": category,
            "severity": severity,
            "confidence": confidence,
            "reasoning": reasoning,
            "suggested_department": dept,
            "tags": tags,
            "source": "rule-based"
        }

classifier_service = IssueClassifier()
