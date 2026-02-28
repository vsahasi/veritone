from pathlib import Path

from app.config import settings


def _ensure_upload_dir() -> Path:
    path = settings.get_upload_path()
    path.mkdir(parents=True, exist_ok=True)
    return path


def save_video_local(file_bytes: bytes, video_id: str, extension: str) -> str:
    """Save video to local disk. Returns path as string (relative or absolute)."""
    root = _ensure_upload_dir()
    path = root / f"{video_id}{extension}"
    path.write_bytes(file_bytes)
    return str(path)


def get_video_path_local(video_id: str, extension: str = ".mp4") -> str:
    """Get path for a stored video (local)."""
    root = settings.get_upload_path()
    return str(root / f"{video_id}{extension}")


def save_video_minio(file_bytes: bytes, video_id: str, extension: str) -> str:
    """Save video to MinIO. Returns object key/uri."""
    import boto3
    from botocore.config import Config

    client = boto3.client(
        "s3",
        endpoint_url=settings.minio_endpoint,
        aws_access_key_id=settings.minio_access_key,
        aws_secret_access_key=settings.minio_secret_key,
        config=Config(signature_version="s3v4"),
        region_name="us-east-1",
    )
    key = f"videos/{video_id}{extension}"
    client.put_object(
        Bucket=settings.minio_bucket,
        Key=key,
        Body=file_bytes,
        ContentType="video/mp4" if extension == ".mp4" else "video/webm",
    )
    return key


def get_video_path_minio(video_id: str, extension: str = ".mp4") -> str:
    """Get object key for a stored video (MinIO)."""
    return f"videos/{video_id}{extension}"


def save_video(file_bytes: bytes, video_id: str, extension: str) -> str:
    """Save video using configured storage. Returns path or object key."""
    if settings.storage_type == "minio":
        return save_video_minio(file_bytes, video_id, extension)
    return save_video_local(file_bytes, video_id, extension)


def get_video_path(video_id: str, extension: str = ".mp4") -> str:
    """Get path/uri for a stored video."""
    if settings.storage_type == "minio":
        return get_video_path_minio(video_id, extension)
    return get_video_path_local(video_id, extension)


def get_video_local_path_for_processing(video_id: str, extension: str) -> Path:
    """Return a local Path that FFmpeg can read. For MinIO, downloads to work_dir."""
    if settings.storage_type == "minio":
        import boto3
        from botocore.config import Config

        work = settings.get_work_path()
        work.mkdir(parents=True, exist_ok=True)
        dest = work / f"{video_id}{extension}"
        client = boto3.client(
            "s3",
            endpoint_url=settings.minio_endpoint,
            aws_access_key_id=settings.minio_access_key,
            aws_secret_access_key=settings.minio_secret_key,
            config=Config(signature_version="s3v4"),
            region_name="us-east-1",
        )
        key = f"videos/{video_id}{extension}"
        client.download_file(settings.minio_bucket, key, str(dest))
        return dest
    path = settings.get_upload_path() / f"{video_id}{extension}"
    if not path.exists():
        raise FileNotFoundError(f"Video file not found: {path}")
    return path
