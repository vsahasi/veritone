import uuid
from typing import Any, Optional

from sqlalchemy import Float, ForeignKey, String, Text
from sqlalchemy.dialects.sqlite import JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.models.video import Base


class Utterance(Base):
    __tablename__ = "utterances"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    video_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("videos.id", ondelete="CASCADE"), nullable=False
    )
    speaker_id: Mapped[str] = mapped_column(String(64), default="default", nullable=False)
    start_ts: Mapped[float] = mapped_column(Float, nullable=False)
    end_ts: Mapped[float] = mapped_column(Float, nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    # Modality scores (Phase 2b+)
    vocal_label: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    vocal_confidence: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    semantic_label: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    divergence_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    divergence_flags: Mapped[Optional[list[str]]] = mapped_column(JSON, nullable=True)
