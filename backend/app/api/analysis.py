from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.utterance import Utterance
from app.models.video import Video
from app.services.transcribe import run_transcribe_pipeline

router = APIRouter(tags=["analysis"])


class TranscribeResponse(BaseModel):
    video_id: str
    status: str
    utterance_count: int
    duration_seconds: float | None = None
    message: str | None = None


class UtteranceOut(BaseModel):
    start_ts: float
    end_ts: float
    text: str
    speaker_id: str


class TranscriptResponse(BaseModel):
    video_id: str
    status: str
    utterances: list[UtteranceOut]


@router.post(
    "/videos/{video_id}/transcribe",
    response_model=TranscribeResponse,
    status_code=status.HTTP_200_OK,
)
async def post_transcribe(
    video_id: str,
    db: AsyncSession = Depends(get_db),
) -> TranscribeResponse:
    """Run transcription pipeline (FFmpeg + Whisper) and persist utterances."""
    try:
        out = await run_transcribe_pipeline(db, video_id)
        return TranscribeResponse(
            video_id=out["video_id"],
            status=out["status"],
            utterance_count=out.get("utterance_count", 0),
            duration_seconds=out.get("duration_seconds"),
            message=out.get("message"),
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from e
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video file not found; re-upload or check storage.",
        ) from e


@router.get("/analysis/{video_id}", response_model=TranscriptResponse)
async def get_analysis(
    video_id: str,
    db: AsyncSession = Depends(get_db),
) -> TranscriptResponse:
    """Return video metadata and transcript (utterances). 404 if not found or not transcribed."""
    video = await db.get(Video, video_id)
    if not video:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found")
    if video.status not in ("ready", "processing"):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transcript not ready (status: {video.status}). Call POST /videos/{{video_id}}/transcribe first.",
        )
    result = await db.execute(
        select(Utterance).where(Utterance.video_id == video_id).order_by(Utterance.start_ts)
    )
    utterances = result.scalars().all()
    return TranscriptResponse(
        video_id=video_id,
        status=video.status,
        utterances=[
            UtteranceOut(
                start_ts=u.start_ts,
                end_ts=u.end_ts,
                text=u.text,
                speaker_id=u.speaker_id,
            )
            for u in utterances
        ],
    )
