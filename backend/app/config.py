from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Storage: local, minio, or s3
    storage_type: str = "local"

    # Local storage
    upload_dir: str = "./uploads"

    # SQLite
    sqlite_path: str = "./data/veritone.db"

    # MinIO
    minio_endpoint: str = "http://minio:9000"
    minio_access_key: str = "minioadmin"
    minio_secret_key: str = "minioadmin"
    minio_bucket: str = "veritone"

    # AWS S3 (when storage_type=s3)
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    aws_region: str = "us-east-1"
    s3_bucket: str = "veritone"

    def get_upload_path(self) -> Path:
        return Path(self.upload_dir)

    def get_sqlite_url(self) -> str:
        path = Path(self.sqlite_path)
        path.parent.mkdir(parents=True, exist_ok=True)
        return f"sqlite+aiosqlite:///{path.absolute()}"


settings = Settings()
