"""FAISS index for utterance retrieval. Build from DB, persist to disk, search by query."""
import json
from pathlib import Path
from typing import Any

import numpy as np

from app.config import settings
from app.services.embeddings import embed_text, embed_texts


def _index_path() -> Path:
    return settings.get_work_path() / "faiss_index.bin"


def _manifest_path() -> Path:
    return settings.get_work_path() / "faiss_manifest.json"


def build_index(utterances: list[dict[str, Any]]) -> None:
    """
    Build FAISS index and manifest from list of utterances.
    Each utterance: {id, video_id, start_ts, end_ts, text}.
    """
    if not utterances:
        work = settings.get_work_path()
        work.mkdir(parents=True, exist_ok=True)
        _manifest_path().write_text("[]")
        return

    try:
        import faiss
    except ImportError:
        raise RuntimeError("faiss-cpu not installed. pip install faiss-cpu") from None

    texts = [u["text"] or " " for u in utterances]
    vectors = embed_texts(texts)
    npy = np.array(vectors, dtype=np.float32)
    d = npy.shape[1]
    index = faiss.IndexFlatIP(d)  # inner product = cosine when normalized
    index.add(npy)

    work = settings.get_work_path()
    work.mkdir(parents=True, exist_ok=True)
    faiss.write_index(index, str(_index_path()))
    manifest = [
        {
            "utterance_id": u["id"],
            "video_id": u["video_id"],
            "start_ts": u["start_ts"],
            "end_ts": u["end_ts"],
            "text": u["text"],
        }
        for u in utterances
    ]
    _manifest_path().write_text(json.dumps(manifest, indent=0))


def load_index_and_manifest() -> tuple[Any, list[dict]]:
    """Load FAISS index and manifest from disk. Raises FileNotFoundError if not built."""
    import faiss

    path = _index_path()
    manifest_path = _manifest_path()
    if not path.exists() or not manifest_path.exists():
        raise FileNotFoundError("RAG index not built. Build it first or run a query with rebuild.")
    index = faiss.read_index(str(path))
    manifest = json.loads(manifest_path.read_text())
    return index, manifest


def search(
    query: str,
    k: int = 10,
    video_id: str | None = None,
    index=None,
    manifest: list[dict] | None = None,
) -> list[dict[str, Any]]:
    """
    Embed query, search index, return top-k results with scores and citations.
    If index/manifest not passed, loads from disk. Optionally filter by video_id.
    """
    if index is None or manifest is None:
        index, manifest = load_index_and_manifest()
    if not manifest:
        return []

    q_vec = embed_text(query)
    q_npy = np.array([q_vec], dtype=np.float32)
    search_k = min(k * 5, len(manifest)) if video_id else min(k, len(manifest))  # fetch extra if filtering
    search_k = max(1, search_k)
    scores, indices = index.search(q_npy, search_k)

    results = []
    for i, idx in enumerate(indices[0]):
        if idx < 0:
            continue
        entry = dict(manifest[idx])
        entry["score"] = float(scores[0][i])
        if video_id is None or entry["video_id"] == video_id:
            results.append(entry)
        if len(results) >= k:
            break
    return results[:k]
