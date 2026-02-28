from app.db.session import engine
from app.models.video import Base
from app.models.utterance import Utterance  # noqa: F401 - register with Base

async def init_db() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
