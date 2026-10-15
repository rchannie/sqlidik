import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import inspect, text

from . import models  # noqa: F401  (mendaftarkan tabel)
from .config import ASAL_DIIZINKAN, JWT_SEMENTARA, KODE_DAFTAR_GURU
from .db import Base, SesiLokal, engine
from .konten import isi_konten_bawaan
from .rute import auth, guru, kelas, sinkron

log = logging.getLogger("sqlidik")


def siapkan_basis_data():
    Base.metadata.create_all(engine)
    if engine.dialect.name == "postgresql":
        # Supabase membuka tabel di schema public lewat API-nya. RLS tanpa policy menutup akses itu,
        # sedangkan server ini tetap bisa membaca karena terhubung sebagai pemilik tabel.
        with engine.begin() as con:
            for nama in inspect(con).get_table_names():
                con.execute(text(f'ALTER TABLE "{nama}" ENABLE ROW LEVEL SECURITY'))
    with SesiLokal() as db:
        isi_konten_bawaan(db)


@asynccontextmanager
async def siklus(app: FastAPI):
    siapkan_basis_data()
    if JWT_SEMENTARA:
        log.warning("JWT_SECRET belum diisi. Semua pengguna harus masuk ulang setiap server dinyalakan ulang.")
    if not KODE_DAFTAR_GURU:
        log.warning("KODE_DAFTAR_GURU belum diisi. Pendaftaran guru ditutup.")
    yield


app = FastAPI(title="SQLidik API", version="1.0.0", lifespan=siklus)
app.add_middleware(CORSMiddleware, allow_origins=ASAL_DIIZINKAN, allow_methods=["*"], allow_headers=["*"])


@app.middleware("http")
async def tanpa_cache(request: Request, call_next):
    respon = await call_next(request)
    if request.url.path.startswith("/api"):
        respon.headers["Cache-Control"] = "no-store"
    return respon


@app.exception_handler(RequestValidationError)
async def isian_salah(request: Request, exc: RequestValidationError):
    return JSONResponse(status_code=422, content={"detail": "Isian belum lengkap atau formatnya salah."})


@app.get("/")
def akar():
    return {"nama": "SQLidik API", "status": "jalan"}


@app.get("/api/sehat")
def sehat():
    return {"ok": True}


for r in (auth.rute, sinkron.rute, kelas.rute, guru.rute):
    app.include_router(r)
