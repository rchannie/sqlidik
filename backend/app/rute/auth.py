import re

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..config import KODE_DAFTAR_GURU
from ..db import sesi_db
from ..keamanan import (PembatasPercobaan, buat_token, cek_sandi, hash_sandi, ip_dari, pengguna_aktif)
from ..konten import konten
from ..models import AnggotaKelas, Kelas, Pengguna
from ..permainan import statistik_tersimpan

rute = APIRouter(prefix="/api", tags=["akun"])
batas_masuk = PembatasPercobaan(batas=8, jendela_detik=600)
batas_daftar_guru = PembatasPercobaan(batas=5, jendela_detik=1800)
AVATAR_PEMAIN = {"pemain_01", "pemain_02", "pemain_03", "pemain_04"}
POLA_EMAIL = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class DaftarSiswa(BaseModel):
    nama: str = Field(min_length=1, max_length=80)
    email: str = Field(max_length=160)
    kata_sandi: str = Field(max_length=128)
    sekolah: str | None = Field(default=None, max_length=120)
    kode_kelas: str | None = Field(default=None, max_length=12)
    avatar: str | None = None


class DaftarGuru(BaseModel):
    nama: str = Field(min_length=1, max_length=80)
    email: str = Field(max_length=160)
    kata_sandi: str = Field(max_length=128)
    sekolah: str | None = Field(default=None, max_length=120)
    kode_guru: str = Field(max_length=120)


class Masuk(BaseModel):
    email: str = Field(max_length=160)
    kata_sandi: str = Field(max_length=128)


class UbahProfil(BaseModel):
    nama: str | None = Field(default=None, max_length=80)
    avatar: str | None = None
    sekolah: str | None = Field(default=None, max_length=120)


class GantiSandi(BaseModel):
    lama: str = Field(max_length=128)
    baru: str = Field(max_length=128)


def data_pengguna(p: Pengguna) -> dict:
    return {"id": p.id_pengguna, "nama": p.nama, "email": p.email, "peran": p.peran, "sekolah": p.sekolah,
            "avatar": p.avatar, "penempatan": p.penempatan}


def _cek_isian(nama: str, email: str, sandi: str) -> tuple[str, str]:
    nama = " ".join(nama.split())
    email = email.strip().lower()
    if not nama:
        raise HTTPException(422, "Nama belum diisi.")
    if not POLA_EMAIL.match(email):
        raise HTTPException(422, "Format email belum benar.")
    if len(sandi) < 6:
        raise HTTPException(422, "Kata sandi minimal 6 karakter.")
    return nama, email


def _email_terpakai(db: Session, email: str) -> bool:
    return db.scalar(select(func.count()).select_from(Pengguna).where(Pengguna.email == email)) > 0


def cari_kelas_dari_kode(db: Session, kode: str) -> Kelas | None:
    kode = re.sub(r"[^A-Za-z0-9]", "", kode or "").upper()
    if not kode:
        return None
    return db.scalar(select(Kelas).where(Kelas.kode_kelas == kode))


@rute.get("/info")
def info():
    return {"nama": "SQLidik", "daftar_guru_terbuka": bool(KODE_DAFTAR_GURU), "versi_konten": konten()["versi"]}


@rute.post("/auth/daftar")
def daftar_siswa(isian: DaftarSiswa, request: Request, db: Session = Depends(sesi_db)):
    nama, email = _cek_isian(isian.nama, isian.email, isian.kata_sandi)
    kelas = None
    if isian.kode_kelas and isian.kode_kelas.strip():
        kunci = "kode:" + ip_dari(request)
        batas_masuk.cek(kunci)
        kelas = cari_kelas_dari_kode(db, isian.kode_kelas)
        if not kelas:
            batas_masuk.gagal(kunci)
            raise HTTPException(404, "Kode kelas tidak ditemukan. Cek lagi ke gurumu, atau kosongkan dulu.")
    if _email_terpakai(db, email):
        raise HTTPException(409, "Email ini sudah terdaftar. Silakan masuk.")
    p = Pengguna(nama=nama, email=email, kata_sandi_hash=hash_sandi(isian.kata_sandi), peran="siswa",
                 sekolah=(isian.sekolah or "").strip() or None,
                 avatar=isian.avatar if isian.avatar in AVATAR_PEMAIN else "pemain_01")
    db.add(p)
    db.flush()
    if kelas:
        db.add(AnggotaKelas(id_kelas=kelas.id_kelas, id_siswa=p.id_pengguna))
    db.commit()
    return {"token": buat_token(p), "pengguna": data_pengguna(p)}


@rute.post("/auth/daftar-guru")
def daftar_guru(isian: DaftarGuru, request: Request, db: Session = Depends(sesi_db)):
    if not KODE_DAFTAR_GURU:
        raise HTTPException(403, "Pendaftaran guru sedang ditutup. Hubungi pengelola SQLidik.")
    kunci = "guru:" + ip_dari(request)
    batas_daftar_guru.cek(kunci)
    if isian.kode_guru.strip() != KODE_DAFTAR_GURU:
        batas_daftar_guru.gagal(kunci)
        raise HTTPException(403, "Kode pendaftaran guru salah.")
    nama, email = _cek_isian(isian.nama, isian.email, isian.kata_sandi)
    if _email_terpakai(db, email):
        raise HTTPException(409, "Email ini sudah terdaftar. Silakan masuk.")
    p = Pengguna(nama=nama, email=email, kata_sandi_hash=hash_sandi(isian.kata_sandi), peran="guru",
                 sekolah=(isian.sekolah or "").strip() or None, avatar="pak_hendra")
    db.add(p)
    db.commit()
    return {"token": buat_token(p), "pengguna": data_pengguna(p)}


@rute.post("/auth/masuk")
def masuk(isian: Masuk, request: Request, db: Session = Depends(sesi_db)):
    email = isian.email.strip().lower()
    kunci = ip_dari(request) + ":" + email
    batas_masuk.cek(kunci)
    p = db.scalar(select(Pengguna).where(Pengguna.email == email))
    if not p or not cek_sandi(isian.kata_sandi, p.kata_sandi_hash):
        batas_masuk.gagal(kunci)
        raise HTTPException(401, "Email atau kata sandi salah.")
    batas_masuk.reset(kunci)
    return {"token": buat_token(p), "pengguna": data_pengguna(p)}


@rute.get("/auth/saya")
def saya(p: Pengguna = Depends(pengguna_aktif), db: Session = Depends(sesi_db)):
    hasil = {"pengguna": data_pengguna(p)}
    if p.peran == "siswa":
        hasil["statistik"] = statistik_tersimpan(db, p.id_pengguna)
        db.commit()
    return hasil


@rute.patch("/auth/saya")
def ubah_profil(isian: UbahProfil, p: Pengguna = Depends(pengguna_aktif), db: Session = Depends(sesi_db)):
    if isian.nama is not None:
        nama = " ".join(isian.nama.split())
        if not nama:
            raise HTTPException(422, "Nama belum diisi.")
        p.nama = nama
    if isian.avatar is not None:
        if isian.avatar not in AVATAR_PEMAIN:
            raise HTTPException(422, "Avatar tidak dikenal.")
        p.avatar = isian.avatar
    if isian.sekolah is not None:
        p.sekolah = isian.sekolah.strip() or None
    db.merge(p)
    db.commit()
    return {"pengguna": data_pengguna(p)}


@rute.post("/auth/ganti-sandi")
def ganti_sandi(isian: GantiSandi, p: Pengguna = Depends(pengguna_aktif), db: Session = Depends(sesi_db)):
    if not cek_sandi(isian.lama, p.kata_sandi_hash):
        raise HTTPException(403, "Kata sandi lama salah.")
    if len(isian.baru) < 6:
        raise HTTPException(422, "Kata sandi baru minimal 6 karakter.")
    p.kata_sandi_hash = hash_sandi(isian.baru)
    db.merge(p)
    db.commit()
    return {"ok": True}
