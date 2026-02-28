from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.config import settings
from app.db.init_db import init_db
from app.api.ingest import router as ingest_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    settings.get_upload_path().mkdir(parents=True, exist_ok=True)
    yield


app = FastAPI(
    title="VeriTone",
    description="Multimodal credibility analysis engine for public communications.",
    lifespan=lifespan,
)

app.include_router(ingest_router, prefix="/api/v1")


@app.get("/health")
async def health():
    return {"status": "ok"}
