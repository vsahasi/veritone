"""Vocal modality pipeline: extract WAV, run emotion model per utterance, persist labels."""
from pathlib import Path
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.utterance import Utterance
from app.models.video import Video
from app.services.extract import extract_audio_to_wav, extract_audio_segment
from app.services.storage import get_video_local_path_for_processing
from app.services.vocal_emotion import classify_emotion


def _get_extension(video: Video) -> str:
    ext = (video.metadata_ or {}).get("extension")
    return ext if ext in (".mp4", ".webm") else ".mp4"


async def run_vocal_pipeline(db: AsyncSession, video_id: str) -> dict[str, Any]:
    """
    Require transcript (status=ready). Re-extract WAV, run emotion model on each utterance
    segment, update vocal_label and vocal_confidence. Returns summary.
    """
    video = await db.get(Video, video_id)
    if not video:
        raise ValueError(f"Video not found: {video_id}")
    if video.status != "ready":
        raise ValueError(
            f"Video must be transcribed first (status=ready). Current: {video.status}"
        )

    result = await db.execute(
        select(Utterance).where(Utterance.video_id == video_id).order_by(Utterance.start_ts)
    )
    utterances = list(result.scalars().all())
    if not utterances:
        return {"video_id": video_id, "status": "ready", "vocal_processed": 0}

    work = settings.get_work_path()
    work.mkdir(parents=True, exist_ok=True)
    ext = _get_extension(video)
    video_path: Path | None = None
    wav_path: Path | None = None

    try:
        video_path = get_video_local_path_for_processing(video_id, ext)
        wav_path = extract_audio_to_wav(video_path, work / f"{video_id}_vocal.wav")
    except Exception as e:
        raise RuntimeError(f"Failed to extract audio for vocal analysis: {e}") from e

    segment_paths: list[Path] = []
    try:
        for u in utterances:
            seg_path = work / f"seg_{video_id}_{u.id}.wav"
            try:
                extract_audio_segment(Path(wav_path), u.start_ts, u.end_ts, seg_path)
                segment_paths.append(seg_path)
                label, conf = classify_emotion(seg_path)
                u.vocal_label = label
                u.vocal_confidence = conf
            except Exception:
                u.vocal_label = None
                u.vocal_confidence = None
            finally:
                if seg_path.exists():
                    seg_path.unlink(missing_ok=True)
        await db.flush()
    finally:
        if wav_path and wav_path.exists():
            wav_path.unlink(missing_ok=True)
        if settings.storage_type == "minio" and video_path and video_path.exists():
            video_path.unlink(missing_ok=True)

    return {
        "video_id": video_id,
        "status": "ready",
        "vocal_processed": len(utterances),
    }
