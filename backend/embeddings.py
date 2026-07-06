import logging
import numpy as np
from typing import List
from backend.config import GEMINI_API_KEY

logger = logging.getLogger("agentflow.embeddings")

class EmbeddingManager:
    """
    Modular manager for text embeddings.
    Defaults to loading 'sentence-transformers/all-MiniLM-L6-v2' locally.
    Falls back gracefully to Google Gemini Embeddings API, and finally to a
    lightweight mathematical vector representation if no library or API key is accessible.
    """
    def __init__(self):
        self.model = None
        self.mode = "sentence-transformers"
        
        # 1. Try local sentence-transformers
        try:
            from sentence_transformers import SentenceTransformer
            logger.info("Initializing local SentenceTransformer ('all-MiniLM-L6-v2')...")
            self.model = SentenceTransformer("all-MiniLM-L6-v2")
            self.dimension = 384
            self.mode = "sentence-transformers"
            logger.info("SentenceTransformer loaded successfully.")
        except Exception as e:
            logger.warning(f"Failed to load sentence-transformers: {e}. Trying Gemini API...")
            
            # 2. Try Gemini API fallback
            if GEMINI_API_KEY:
                try:
                    import google.generativeai as genai
                    genai.configure(api_key=GEMINI_API_KEY)
                    self.dimension = 768  # Gemini embedding dimension
                    self.mode = "gemini"
                    logger.info("Gemini Embeddings API initialized successfully.")
                except Exception as ex:
                    logger.error(f"Failed to initialize Gemini embeddings: {ex}. Using basic fallback model.")
                    self._setup_basic_fallback()
            else:
                logger.warning("No Gemini API key available. Using basic fallback model.")
                self._setup_basic_fallback()

    def _setup_basic_fallback(self):
        self.dimension = 384
        self.mode = "fallback"
        logger.warning("Using deterministic TF-IDF/hash-based mathematical vector fallback for embeddings.")

    def embed_query(self, text: str) -> List[float]:
        """
        Embeds a single query string.
        """
        return self.embed_documents([text])[0]

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        """
        Embeds a list of document strings.
        """
        if not texts:
            return []

        if self.mode == "sentence-transformers" and self.model:
            try:
                embeddings = self.model.encode(texts)
                return embeddings.tolist()
            except Exception as e:
                logger.error(f"Local embedding generation failed: {e}. Switching to basic fallback.")
                self.mode = "fallback"

        if self.mode == "gemini":
            try:
                import google.generativeai as genai
                embeddings = []
                for text in texts:
                    # Limit input length if necessary
                    truncated = text[:4000]
                    result = genai.embed_content(
                        model="models/embedding-001",
                        content=truncated,
                        task_type="retrieval_document"
                    )
                    embeddings.append(result["embedding"])
                return embeddings
            except Exception as e:
                logger.error(f"Gemini embedding API failed: {e}. Switching to basic fallback.")
                self.mode = "fallback"

        # Fallback Mode: Deterministic hash-based mock embedding to keep vector store functional
        # Converts words in text to a distribution of values in a self.dimension array.
        fallback_embeddings = []
        for text in texts:
            # Deterministic vector based on character hashes
            vector = np.zeros(self.dimension)
            words = text.lower().split()
            if not words:
                words = ["empty"]
            for i, word in enumerate(words):
                # Hash word to a position
                idx = hash(word) % self.dimension
                # Weight by position (simple TF-IDF-like proxy)
                vector[idx] += 1.0 / (i + 1)
            # Normalize vector
            norm = np.linalg.norm(vector)
            if norm > 0:
                vector = vector / norm
            fallback_embeddings.append(vector.tolist())
        return fallback_embeddings
