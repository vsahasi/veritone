"""Text embeddings for RAG (sentence-transformers, local)."""
from typing import Any

from app.config import settings

_encoder = None


def _get_encoder():
    global _encoder
    if _encoder is None:
        from sentence_transformers import SentenceTransformer

        _encoder = SentenceTransformer(settings.embedding_model)
    return _encoder


def embed_text(text: str) -> list[float]:
    """Embed a single string. Returns list of floats (normalized for cosine similarity)."""
    if not (text or text.strip()):
        return _get_encoder().encode(" ", normalize_embeddings=True).tolist()
    return _get_encoder().encode(text.strip(), normalize_embeddings=True).tolist()


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Embed multiple strings. Returns list of vectors."""
    if not texts:
        return []
    cleaned = [t.strip() if t else " " for t in texts]
    return _get_encoder().encode(cleaned, normalize_embeddings=True).tolist()
