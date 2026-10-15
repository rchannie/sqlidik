"""Sinkron progres dari aplikasi.

Aplikasi menyimpan progres di perangkat supaya bisa dimainkan offline, lalu mengirimnya ke sini
saat online. Penggabungan memakai nilai terbesar, jadi pengiriman ulang tidak membuat data dobel.
"""
from datetime import date, timedelta

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import sesi_db
from ..keamanan import pengguna_aktif
from ..konten import harian_untuk, hari_ini
from ..models import (AnggotaKelas, HariAktif, HasilHarian, Kasus, Kelas, Pengguna, ProgresKasus,
                      RiwayatQuery)
from ..permainan import ke_utc, perbarui_statistik, statistik_tersimpan, utc

rute = APIRouter(prefix="/api", tags=["sinkron"])


class Progres(BaseModel):
    id_kasus: str = Field(max_length=40)
    status: str = "berjalan"
    bintang: int = Field(default=0, ge=0, le=3)
    jumlah_percobaan: int = Field(default=0, ge=0, le=100000)
    petunjuk_dipakai: int = Field(default=0, ge=0, le=1000)
    salah_tuduh: int = Field(default=0, ge=0, le=1000)
    durasi_detik: int | None = Field(default=None, ge=0, le=10 ** 7)
    selesai_pada: str | None = None


class Riwayat(BaseModel):
    id: str = Field(min_length=6, max_length=40)
    id_kasus: str | None = Field(default=None, max_length=40)
    id_langkah: str | None = Field(default=None, max_length=50)
    konsep: str | None = Field(default=None, max_length=20)
    teks_query: str = Field(max_length=4000)
    hasil_benar: bool = False
    jenis_error: str | None = Field(default=None, max_length=30)
    pesan_error: str | None = Field(default=None, max_length=500)
    dijalankan_pada: str | None = None


class Harian(BaseModel):
    tanggal: date
    id_kasus: str = Field(max_length=40)
    durasi_detik: int = Field(ge=0, le=10 ** 7)
    jumlah_percobaan: int = Field(default=0, ge=0, le=100000)
    petunjuk_dipakai: int = Field(default=0, ge=0, le=100)
    bintang: int = Field(default=1, ge=1, le=3)
    selesai_pada: str | None = None


class Hari(BaseModel):
    tanggal: date
    pemulihan: bool = False


class Kiriman(BaseModel):
    progres: list[Progres] = Field(default_factory=list, max_length=500)
    riwayat: list[Riwayat] = Field(default_factory=list, max_length=1000)
    harian: list[Harian] = Field(default_factory=list, max_length=100)
    hari_aktif: list[Hari] = Field(default_factory=list, max_length=100)
    penempatan: int | None = Field(default=None, ge=0, le=5)


def kasus_boleh(db: Session, p: Pengguna) -> set[str]:
    """Kasus yang boleh dimainkan: semua kasus bawaan dan kasus guru dari kelas yang diikuti."""
    bawaan = set(db.scalars(select(Kasus.id_kasus).where(Kasus.jenis.in_(["utama", "harian"]))))
    if p.peran == "guru":
        milik = set(db.scalars(select(Kasus.id_kasus).where(Kasus.id_pembuat == p.id_pengguna)))
        return bawaan | milik
    guru = select(Kelas.id_guru).join(AnggotaKelas, AnggotaKelas.id_kelas == Kelas.id_kelas).where(
        AnggotaKelas.id_siswa == p.id_pengguna)
    dari_guru = set(db.scalars(select(Kasus.id_kasus).where(Kasus.jenis == "guru", Kasus.id_pembuat.in_(guru))))
    return bawaan | dari_guru


def keadaan(db: Session, p: Pengguna, statistik: dict | None = None) -> dict:
    awal = hari_ini() - timedelta(days=60)
    progres = db.scalars(select(ProgresKasus).where(ProgresKasus.id_siswa == p.id_pengguna)).all()
    harian = db.scalars(select(HasilHarian).where(HasilHarian.id_pengguna == p.id_pengguna,
                                                  HasilHarian.tanggal >= awal)).all()
    hari = db.scalars(select(HariAktif).where(HariAktif.id_pengguna == p.id_pengguna, HariAktif.tanggal >= awal)).all()
    return {
        "statistik": statistik or statistik_tersimpan(db, p.id_pengguna),
        "penempatan": p.penempatan,
        "progres": [{
            "id_kasus": x.id_kasus, "status": x.status, "bintang": x.bintang, "jumlah_percobaan": x.jumlah_percobaan,
            "petunjuk_dipakai": x.petunjuk_dipakai, "salah_tuduh": x.salah_tuduh, "durasi_detik": x.durasi_detik,
            "selesai_pada": utc(x.selesai_pada).isoformat() if x.selesai_pada else None,
        } for x in progres],
        "harian": [{
            "tanggal": h.tanggal.isoformat(), "id_kasus": h.id_kasus, "durasi_detik": h.durasi_detik,
            "jumlah_percobaan": h.jumlah_percobaan, "petunjuk_dipakai": h.petunjuk_dipakai, "bintang": h.bintang,
            "selesai_pada": utc(h.selesai_pada).isoformat(),
        } for h in harian],
        "hari_aktif": [{"tanggal": h.tanggal.isoformat(), "pemulihan": h.pemulihan} for h in hari],
    }


@rute.get("/sinkron")
def ambil(p: Pengguna = Depends(pengguna_aktif), db: Session = Depends(sesi_db)):
    hasil = keadaan(db, p)
    db.commit()
    return hasil


@rute.post("/sinkron")
def kirim(isi: Kiriman, p: Pengguna = Depends(pengguna_aktif), db: Session = Depends(sesi_db)):
    boleh = kasus_boleh(db, p)
    kini = hari_ini()
    batas_lama = kini - timedelta(days=30)

    ada = {x.id_kasus: x for x in db.scalars(select(ProgresKasus).where(ProgresKasus.id_siswa == p.id_pengguna))}
    for x in isi.progres:
        if x.id_kasus not in boleh:
            continue
        row = ada.get(x.id_kasus)
        if not row:
            row = ProgresKasus(id_siswa=p.id_pengguna, id_kasus=x.id_kasus, status="berjalan", bintang=0,
                               jumlah_percobaan=0, petunjuk_dipakai=0, salah_tuduh=0)
            db.add(row)
            ada[x.id_kasus] = row
        if x.status == "selesai":
            row.status = "selesai"
        row.bintang = max(row.bintang or 0, x.bintang)
        row.jumlah_percobaan = max(row.jumlah_percobaan or 0, x.jumlah_percobaan)
        row.petunjuk_dipakai = max(row.petunjuk_dipakai or 0, x.petunjuk_dipakai)
        row.salah_tuduh = max(row.salah_tuduh or 0, x.salah_tuduh)
        if x.durasi_detik is not None and x.status == "selesai":
            row.durasi_detik = x.durasi_detik if row.durasi_detik is None else min(row.durasi_detik, x.durasi_detik)
        waktu = ke_utc(x.selesai_pada)
        if waktu and x.status == "selesai" and (row.selesai_pada is None or waktu < utc(row.selesai_pada)):
            row.selesai_pada = waktu
    db.flush()

    if isi.riwayat:
        ids = [r.id for r in isi.riwayat]
        sudah = set(db.scalars(select(RiwayatQuery.id_riwayat).where(RiwayatQuery.id_riwayat.in_(ids))))
        for r in isi.riwayat:
            if r.id in sudah:
                continue
            sudah.add(r.id)
            prog = ada.get(r.id_kasus) if r.id_kasus else None
            baru = RiwayatQuery(
                id_riwayat=r.id, id_progres=prog.id_progres if prog else None, id_langkah=r.id_langkah,
                id_siswa=p.id_pengguna, id_kasus=r.id_kasus, konsep=r.konsep, teks_query=r.teks_query[:2000],
                hasil_benar=r.hasil_benar, jenis_error=r.jenis_error, pesan_error=(r.pesan_error or None),
            )
            waktu = ke_utc(r.dijalankan_pada)
            if waktu:
                baru.dijalankan_pada = waktu
            db.add(baru)

    for h in isi.harian:
        if not (batas_lama <= h.tanggal <= kini) or harian_untuk(h.tanggal)["id"] != h.id_kasus:
            continue
        row = db.get(HasilHarian, (p.id_pengguna, h.tanggal))
        if not row:
            baru = HasilHarian(id_pengguna=p.id_pengguna, tanggal=h.tanggal, id_kasus=h.id_kasus,
                               durasi_detik=h.durasi_detik, jumlah_percobaan=h.jumlah_percobaan,
                               petunjuk_dipakai=h.petunjuk_dipakai, bintang=h.bintang)
            waktu = ke_utc(h.selesai_pada)
            if waktu:
                baru.selesai_pada = waktu
            db.add(baru)
        elif h.durasi_detik < row.durasi_detik:
            row.durasi_detik, row.jumlah_percobaan, row.bintang = h.durasi_detik, h.jumlah_percobaan, h.bintang
            row.petunjuk_dipakai = max(row.petunjuk_dipakai, h.petunjuk_dipakai)

    for h in isi.hari_aktif:
        if batas_lama <= h.tanggal <= kini and not db.get(HariAktif, (p.id_pengguna, h.tanggal)):
            db.add(HariAktif(id_pengguna=p.id_pengguna, tanggal=h.tanggal, pemulihan=h.pemulihan))

    if isi.penempatan is not None and p.peran == "siswa":
        p.penempatan = isi.penempatan
        db.merge(p)
    db.flush()
    statistik = perbarui_statistik(db, p.id_pengguna) if p.peran == "siswa" else None
    hasil = keadaan(db, p, statistik)
    db.commit()
    return hasil
