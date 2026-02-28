from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.utterance import Utterance
from app.models.video import Video
from app.services.transcribe import run_transcribe_pipeline
from app.services.process_vocal import run_vocal_pipeline
from app.services.divergence import run_divergence_pipeline
from app.services.rag_index import build_index, search as rag_search, load_index_and_manifest

router = APIRouter(tags=["analysis"])


class TranscribeResponse(BaseModel):
    video_id: str
    status: str
    utterance_count: int
    duration_seconds: float | None = None
    message: str | None = None


class VocalResponse(BaseModel):
    video_id: str
    status: str
    vocal_processed: int


class DivergenceResponse(BaseModel):
    video_id: str
    utterance_count: int


class UtteranceOut(BaseModel):
    start_ts: float
    end_ts: float
    text: str
    speaker_id: str
    vocal_label: str | None = None
    vocal_confidence: float | None = None
    semantic_label: str | None = None
    divergence_score: float | None = None
    divergence_flags: list[str] | None = None


class TranscriptResponse(BaseModel):
    video_id: str
    status: str
    utterances: list[UtteranceOut]


class TimelineEntry(BaseModel):
    start_ts: float
    end_ts: float
    text: str
    divergence_score: float | None
    divergence_flags: list[str] | None
    vocal_label: str | None
    semantic_label: str | None


class TimelineResponse(BaseModel):
    video_id: str
    duration_seconds: float | None
    entries: list[TimelineEntry]


class QueryBody(BaseModel):
    query: str
    video_id: str | None = None
    limit: int = 10
    rebuild: bool = False


class QueryResultEntry(BaseModel):
    utterance_id: str
    video_id: str
    start_ts: float
    end_ts: float
    text: str
    score: float


class QueryResponse(BaseModel):
    results: list[QueryResultEntry]


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
                vocal_label=u.vocal_label,
                vocal_confidence=u.vocal_confidence,
                semantic_label=u.semantic_label,
                divergence_score=u.divergence_score,
                divergence_flags=u.divergence_flags,
            )
            for u in utterances
        ],
    )


@router.post(
    "/videos/{video_id}/process-vocal",
    response_model=VocalResponse,
    status_code=status.HTTP_200_OK,
)
async def post_process_vocal(
    video_id: str,
    db: AsyncSession = Depends(get_db),
) -> VocalResponse:
    """Run vocal emotion model on each utterance (requires transcript)."""
    try:
        out = await run_vocal_pipeline(db, video_id)
        return VocalResponse(
            video_id=out["video_id"],
            status=out["status"],
            vocal_processed=out.get("vocal_processed", 0),
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from e
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e


@router.post(
    "/videos/{video_id}/compute-divergence",
    response_model=DivergenceResponse,
    status_code=status.HTTP_200_OK,
)
async def post_compute_divergence(
    video_id: str,
    db: AsyncSession = Depends(get_db),
) -> DivergenceResponse:
    """Compute two-way divergence (semantic placeholder vs vocal) for all utterances."""
    video = await db.get(Video, video_id)
    if not video:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found")
    if video.status != "ready":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Video must be transcribed first (status=ready).",
        )
    out = await run_divergence_pipeline(db, video_id)
    return DivergenceResponse(
        video_id=out["video_id"],
        utterance_count=out["utterance_count"],
    )


@router.get("/timeline/{video_id}", response_model=TimelineResponse)
async def get_timeline(
    video_id: str,
    db: AsyncSession = Depends(get_db),
) -> TimelineResponse:
    """Return divergence timeline for the video (for UI overlay)."""
    video = await db.get(Video, video_id)
    if not video:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found")
    if video.status not in ("ready", "processing"):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transcript not ready.",
        )
    result = await db.execute(
        select(Utterance).where(Utterance.video_id == video_id).order_by(Utterance.start_ts)
    )
    utterances = result.scalars().all()
    return TimelineResponse(
        video_id=video_id,
        duration_seconds=video.duration_seconds,
        entries=[
            TimelineEntry(
                start_ts=u.start_ts,
                end_ts=u.end_ts,
                text=u.text,
                divergence_score=u.divergence_score,
                divergence_flags=u.divergence_flags,
                vocal_label=u.vocal_label,
                semantic_label=u.semantic_label,
            )
            for u in utterances
        ],
    )


@router.post("/query", response_model=QueryResponse)
async def post_query(
    body: QueryBody,
    db: AsyncSession = Depends(get_db),
) -> QueryResponse:
    """Natural-language search over transcripts. Builds FAISS index on first run or when rebuild=True."""
    need_build = body.rebuild
    if not need_build:
        try:
            load_index_and_manifest()
        except FileNotFoundError:
            need_build = True

    if need_build:
        result = await db.execute(select(Utterance).order_by(Utterance.video_id, Utterance.start_ts))
        all_utterances = result.scalars().all()
        build_index(
            [
                {
                    "id": u.id,
                    "video_id": u.video_id,
                    "start_ts": u.start_ts,
                    "end_ts": u.end_ts,
                    "text": u.text,
                }
                for u in all_utterances
            ]
        )
        if not all_utterances:
            return QueryResponse(results=[])

    results = rag_search(
        body.query,
        k=min(body.limit, 50),
        video_id=body.video_id,
    )
    return QueryResponse(
        results=[
            QueryResultEntry(
                utterance_id=r["utterance_id"],
                video_id=r["video_id"],
                start_ts=r["start_ts"],
                end_ts=r["end_ts"],
                text=r["text"],
                score=r["score"],
            )
            for r in results
        ],
    )
