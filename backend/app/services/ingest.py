import tempfile
import uuid
from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.video import Video
from app.services.storage import save_video

ALLOWED_EXTENSIONS = {".mp4", ".webm"}
ALLOWED_CONTENT_TYPES = {"video/mp4", "video/webm"}


def _extension_for_filename(filename: str) -> str:
    p = Path(filename)
    ext = p.suffix.lower()
    return ext if ext in ALLOWED_EXTENSIONS else ".mp4"


async def ingest_from_file(
    db: AsyncSession,
    file_bytes: bytes,
    filename: str,
) -> Video:
    """Validate upload, save to storage, persist Video row. Returns Video."""
    ext = _extension_for_filename(filename)
    video_id = str(uuid.uuid4())
    save_video(file_bytes, video_id, ext)
    video = Video(
        id=video_id,
        source=filename,
        duration_seconds=None,
        status="ingested",
        metadata_={"source_type": "upload", "filename": filename},
    )
    db.add(video)
    await db.flush()
    await db.refresh(video)
    return video


async def ingest_from_url(db: AsyncSession, url: str) -> Video:
    """Download video from URL (e.g. YouTube via yt-dlp), save, persist. Returns Video."""
    try:
        import yt_dlp
    except ImportError:
        raise NotImplementedError("URL ingestion not available: yt-dlp not installed")

    video_id = str(uuid.uuid4())
    with tempfile.TemporaryDirectory() as tmpdir:
        out_template = str(Path(tmpdir) / "video.%(ext)s")
        ydl_opts = {
            "format": "best[ext=mp4]/best",
            "outtmpl": out_template,
            "quiet": True,
        }
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])

        # Find the downloaded file
        files = list(Path(tmpdir).glob("video.*"))
        if not files:
            raise ValueError("yt-dlp did not produce a video file")
        path = files[0]
        ext = path.suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            ext = ".mp4"
        file_bytes = path.read_bytes()

    save_video(file_bytes, video_id, ext)
    video = Video(
        id=video_id,
        source=url,
        duration_seconds=None,
        status="ingested",
        metadata_={"source_type": "url", "url": url},
    )
    db.add(video)
    await db.flush()
    await db.refresh(video)
    return video
