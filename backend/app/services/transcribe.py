"""Orchestrate transcription: resolve video -> extract audio -> Whisper -> persist utterances."""
from pathlib import Path
from typing import Any

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.utterance import Utterance
from app.models.video import Video
from app.services.extract import extract_audio_to_wav
from app.services.storage import get_video_local_path_for_processing
from app.services.whisper_transcribe import transcribe_audio


def _get_extension(video: Video) -> str:
    ext = (video.metadata_ or {}).get("extension")
    return ext if ext in (".mp4", ".webm") else ".mp4"


async def run_transcribe_pipeline(db: AsyncSession, video_id: str) -> dict[str, Any]:
    """
    Load video, set status=processing, extract audio, run Whisper, persist utterances, set status=ready.
    Returns summary dict with status, utterance_count, duration_seconds.
    Raises FileNotFoundError if video file missing; other exceptions on Whisper/FFmpeg failure.
    """
    result = await db.get(Video, video_id)
    if not result:
        raise ValueError(f"Video not found: {video_id}")
    video = result

    if video.status not in ("ingested", "transcript_failed", "ready"):
        return {
            "video_id": video_id,
            "status": video.status,
            "utterance_count": 0,
            "message": f"Video in status {video.status}; only ingested/ready/transcript_failed can be (re)transcribed.",
        }

    video.status = "processing"
    await db.flush()

    work = settings.get_work_path()
    work.mkdir(parents=True, exist_ok=True)
    ext = _get_extension(video)
    video_path: Path | None = None
    wav_path: Path | None = None

    try:
        video_path = get_video_local_path_for_processing(video_id, ext)
        wav_path = extract_audio_to_wav(video_path, work / f"{video_id}.wav")
        segments = transcribe_audio(wav_path)
    except Exception:
        video.status = "transcript_failed"
        await db.flush()
        raise
    finally:
        if wav_path and wav_path.exists():
            wav_path.unlink(missing_ok=True)
        if settings.storage_type == "minio" and video_path and video_path.exists():
            video_path.unlink(missing_ok=True)

    await db.execute(delete(Utterance).where(Utterance.video_id == video_id))
    duration_seconds: float | None = None
    for seg in segments:
        u = Utterance(
            video_id=video_id,
            speaker_id="default",
            start_ts=seg["start"],
            end_ts=seg["end"],
            text=seg["text"],
        )
        db.add(u)
        if duration_seconds is None or seg["end"] > duration_seconds:
            duration_seconds = seg["end"]

    video.status = "ready"
    if duration_seconds is not None:
        video.duration_seconds = duration_seconds
    await db.flush()

    return {
        "video_id": video_id,
        "status": "ready",
        "utterance_count": len(segments),
        "duration_seconds": duration_seconds,
    }
