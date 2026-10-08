import logging
from typing import List, Optional

logger = logging.getLogger(__name__)

class TextEmbedder:
    def __init__(self):
        self._model = None
        self._checked = False
        self._is_available = False

    def _load_model(self):
        if self._checked:
            return self._is_available
        self._checked = True
        try:
            from sentence_transformers import SentenceTransformer
            self._model = SentenceTransformer("all-MiniLM-L6-v2")
            self._is_available = True
            logger.info("SentenceTransformer (all-MiniLM-L6-v2) loaded successfully.")
        except ImportError:
            logger.info("sentence-transformers library is not installed.")
            self._is_available = False
        except Exception as e:
            logger.warning(f"Failed to load sentence-transformers model: {e}")
            self._is_available = False
        return self._is_available

    def get_embedding(self, text: str) -> Optional[List[float]]:
        if not self._load_model():
            return None
        try:
            vector = self._model.encode(text)
            return vector.tolist()
        except Exception as e:
            logger.error(f"Error computing text embedding: {e}")
            return None

embedder_service = TextEmbedder()
