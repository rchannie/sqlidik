import time
from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session

from .config import JWT_SECRET, MASA_TOKEN_HARI
from .db import sesi_db
from .models import Pengguna


def hash_sandi(sandi: str) -> str:
    return bcrypt.hashpw(sandi.encode()[:72], bcrypt.gensalt()).decode()


def cek_sandi(sandi: str, hash_: str) -> bool:
    try:
        return bcrypt.checkpw(sandi.encode()[:72], hash_.encode())
    except ValueError:
        return False


def buat_token(p: Pengguna) -> str:
    kini = datetime.now(timezone.utc)
    data = {"sub": str(p.id_pengguna), "peran": p.peran, "iat": kini, "exp": kini + timedelta(days=MASA_TOKEN_HARI)}
    return jwt.encode(data, JWT_SECRET, algorithm="HS256")


def pengguna_aktif(request: Request, db: Session = Depends(sesi_db)) -> Pengguna:
    auth = request.headers.get("authorization", "")
    if not auth.lower().startswith("bearer "):
        raise HTTPException(401, "Silakan masuk dulu.")
    try:
        data = jwt.decode(auth[7:].strip(), JWT_SECRET, algorithms=["HS256"])
    except jwt.PyJWTError:
        raise HTTPException(401, "Sesi sudah berakhir. Silakan masuk lagi.")
    p = db.get(Pengguna, int(data.get("sub", 0)))
    if not p:
        raise HTTPException(401, "Akun tidak ditemukan. Silakan masuk lagi.")
    return p


def hanya_guru(p: Pengguna = Depends(pengguna_aktif)) -> Pengguna:
    if p.peran != "guru":
        raise HTTPException(403, "Fitur ini hanya untuk guru.")
    return p


def hanya_siswa(p: Pengguna = Depends(pengguna_aktif)) -> Pengguna:
    if p.peran != "siswa":
        raise HTTPException(403, "Fitur ini hanya untuk siswa.")
    return p


class PembatasPercobaan:
    """Membatasi percobaan yang gagal per kunci (misalnya IP + email) dalam satu jendela waktu."""

    def __init__(self, batas: int, jendela_detik: int):
        self.batas = batas
        self.jendela = jendela_detik
        self.catatan: dict[str, deque] = defaultdict(deque)

    def _bersihkan(self, kunci: str):
        q = self.catatan[kunci]
        batas_waktu = time.monotonic() - self.jendela
        while q and q[0] < batas_waktu:
            q.popleft()

    def cek(self, kunci: str):
        self._bersihkan(kunci)
        if len(self.catatan[kunci]) >= self.batas:
            raise HTTPException(429, "Terlalu banyak percobaan. Tunggu beberapa menit lalu coba lagi.")

    def gagal(self, kunci: str):
        self.catatan[kunci].append(time.monotonic())

    def reset(self, kunci: str):
        self.catatan.pop(kunci, None)


def ip_dari(request: Request) -> str:
    terusan = request.headers.get("x-forwarded-for", "")
    if terusan:
        return terusan.split(",")[0].strip()
    return request.client.host if request.client else "?"
