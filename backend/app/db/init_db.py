from sqlalchemy import text

from app.db.session import engine
from app.models.video import Base
from app.models.utterance import Utterance  # noqa: F401 - register with Base


def _migrate_utterances_phase2b(conn):
    """Add vocal/semantic/divergence columns if missing (SQLite)."""
    result = conn.execute(text("PRAGMA table_info(utterances)"))
    existing = {row[1] for row in result.fetchall()}
    for col, spec in [
        ("vocal_label", "VARCHAR(64)"),
        ("vocal_confidence", "FLOAT"),
        ("semantic_label", "VARCHAR(64)"),
        ("divergence_score", "FLOAT"),
        ("divergence_flags", "TEXT"),  # JSON array stored as text
    ]:
        if col not in existing:
            conn.execute(text(f"ALTER TABLE utterances ADD COLUMN {col} {spec}"))


async def init_db() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.run_sync(_migrate_utterances_phase2b)
