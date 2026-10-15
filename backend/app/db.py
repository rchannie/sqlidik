from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from sqlalchemy.pool import NullPool

from .config import DATABASE_URL

if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

    @event.listens_for(engine, "connect")
    def _fk_sqlite(dbapi_con, _):
        dbapi_con.execute("PRAGMA foreign_keys=ON")
else:
    # Koneksi dibuka per permintaan supaya server di Railway bisa tidur saat sepi,
    # dan jumlah koneksi ke pooler Supabase tetap kecil.
    engine = create_engine(DATABASE_URL, poolclass=NullPool, connect_args={"prepare_threshold": None})

SesiLokal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def sesi_db():
    db = SesiLokal()
    try:
        yield db
    finally:
        db.close()
