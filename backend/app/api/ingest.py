from fastapi import APIRouter, File, HTTPException, UploadFile, status
from pydantic import BaseModel, HttpUrl

from app.services.ingest import ingest_from_file, ingest_from_url
from app.db.session import async_session_factory

router = APIRouter(prefix="/ingest", tags=["ingest"])


class IngestUrlBody(BaseModel):
    url: HttpUrl


class IngestResponse(BaseModel):
    video_id: str
    status: str


ALLOWED_EXTENSIONS = {".mp4", ".webm"}


def _check_filename(filename: str) -> None:
    ext = filename.lower().split(".")[-1] if "." in filename else ""
    if f".{ext}" not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Allowed formats: {', '.join(ALLOWED_EXTENSIONS)}",
        )


@router.post("", response_model=IngestResponse, status_code=status.HTTP_202_ACCEPTED)
async def post_ingest_file(file: UploadFile = File(...)) -> IngestResponse:
    """Ingest a video file (multipart). Returns video_id and status."""
    _check_filename(file.filename or "")
    content = await file.read()
    async with async_session_factory() as session:
        video = await ingest_from_file(session, content, file.filename or "video.mp4")
        await session.commit()
        return IngestResponse(video_id=video.id, status=video.status)


@router.post(
    "/url",
    response_model=IngestResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def post_ingest_url(body: IngestUrlBody) -> IngestResponse:
    """Ingest a video from URL (e.g. YouTube). Returns video_id and status."""
    try:
        async with async_session_factory() as session:
            video = await ingest_from_url(session, str(body.url))
            await session.commit()
            return IngestResponse(video_id=video.id, status=video.status)
    except NotImplementedError as e:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail=str(e),
        ) from e
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e
