"""Rule-based two-way divergence: semantic (placeholder) vs vocal."""
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.utterance import Utterance

# Simple keyword-based semantic placeholder (no LLM). Maps to positive / negative / neutral.
POSITIVE_WORDS = frozenset(
    {
        "confident", "strong", "great", "excellent", "growth", "success",
        "optimistic", "positive", "revenue", "profit", "beat", "outperform",
    }
)
NEGATIVE_WORDS = frozenset(
    {
        "risk", "concern", "uncertain", "challenge", "weak", "decline",
        "loss", "miss", "headwind", "caution", "volatility", "uncertainty",
    }
)

VOCAL_STRESSED = frozenset({"angry", "fearful", "sad", "disgust"})
VOCAL_ANIMATED = frozenset({"happy", "surprised"})
VOCAL_CALM = frozenset({"calm", "neutral"})


def _semantic_label_from_text(text: str) -> str:
    """Placeholder: keyword-based sentiment -> positive, negative, or neutral."""
    if not text or not text.strip():
        return "neutral"
    lower = text.lower()
    words = set(lower.split())
    if words & POSITIVE_WORDS and not (words & NEGATIVE_WORDS):
        return "positive"
    if words & NEGATIVE_WORDS:
        return "negative"
    return "neutral"


def compute_divergence(semantic_label: str, vocal_label: str | None) -> tuple[float, list[str]]:
    """
    Rule-based two-way divergence. Returns (score 0-1, list of flag strings).
    High divergence when verbal sentiment and vocal affect mismatch.
    """
    flags: list[str] = []
    if not vocal_label:
        return (0.0, flags)

    vocal_lower = vocal_label.lower()
    score = 0.0

    # Positive words + stressed/negative voice -> high divergence
    if semantic_label == "positive" and vocal_lower in VOCAL_STRESSED:
        score = max(score, 0.85)
        flags.append("Verbal positive with stressed or negative vocal affect")
    # Negative words + animated/positive voice -> high divergence
    if semantic_label == "negative" and vocal_lower in VOCAL_ANIMATED:
        score = max(score, 0.8)
        flags.append("Verbal negative with animated or positive vocal affect")
    # Positive + calm/neutral can be slight mismatch (understated)
    if semantic_label == "positive" and vocal_lower in VOCAL_CALM:
        score = max(score, 0.35)
    # Negative + calm can be notable (flat delivery of bad news)
    if semantic_label == "negative" and vocal_lower in VOCAL_CALM:
        score = max(score, 0.5)
        flags.append("Negative content with flat or calm delivery")

    if not flags and score == 0:
        # Congruent or no rule matched
        if semantic_label == "positive" and vocal_lower in VOCAL_ANIMATED:
            pass  # congruent
        elif semantic_label == "negative" and vocal_lower in VOCAL_STRESSED:
            pass  # congruent
        else:
            score = 0.2  # mild uncertainty
    return (min(score, 1.0), flags)


def run_divergence_on_utterance(utterance: Any) -> None:
    """
    Set semantic_label (from text), then compute divergence from vocal_label.
    Mutates utterance.semantic_label, utterance.divergence_score, utterance.divergence_flags.
    """
    utterance.semantic_label = _semantic_label_from_text(utterance.text)
    score, flags = compute_divergence(utterance.semantic_label, utterance.vocal_label)
    utterance.divergence_score = score
    utterance.divergence_flags = flags if flags else None


async def run_divergence_pipeline(db: AsyncSession, video_id: str) -> dict[str, Any]:
    """
    Load all utterances for video_id, run rule-based divergence (semantic placeholder + vocal).
    Mutates utterances in db; caller must flush/commit.
    """
    result = await db.execute(
        select(Utterance).where(Utterance.video_id == video_id).order_by(Utterance.start_ts)
    )
    utterances = list(result.scalars().all())
    for u in utterances:
        run_divergence_on_utterance(u)
    await db.flush()
    return {"video_id": video_id, "utterance_count": len(utterances)}
