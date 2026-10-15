from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import sesi_db
from ..keamanan import PembatasPercobaan, hanya_siswa, ip_dari, pengguna_aktif
from ..konten import harian_untuk, hari_ini, peta_kasus_bawaan
from ..models import (AnggotaKelas, HasilHarian, Kasus, Kelas, Pengguna, ProgresKasus, TugasKelas)
from .auth import cari_kelas_dari_kode
from .sinkron import kasus_boleh

rute = APIRouter(prefix="/api", tags=["kelas"])
# Satu kelas biasanya memakai IP sekolah yang sama, jadi batasnya dibuat longgar.
batas_kode = PembatasPercobaan(batas=40, jendela_detik=600)


class Gabung(BaseModel):
    kode: str = Field(max_length=12)


def ringkas_kasus(k: Kasus) -> dict:
    return {"id_kasus": k.id_kasus, "judul": k.judul, "konsep": k.konsep, "jenis": k.jenis,
            "jumlah_langkah": len(k.data.get("langkah", []))}


def anggota_dari(db: Session, id_kelas: int) -> list[Pengguna]:
    q = select(Pengguna).join(AnggotaKelas, AnggotaKelas.id_siswa == Pengguna.id_pengguna).where(
        AnggotaKelas.id_kelas == id_kelas).order_by(Pengguna.nama)
    return list(db.scalars(q))


def peringkat_harian(db: Session, id_kelas: int, tanggal: date) -> dict:
    anggota = anggota_dari(db, id_kelas)
    ids = [a.id_pengguna for a in anggota]
    hasil = db.scalars(select(HasilHarian).where(HasilHarian.tanggal == tanggal, HasilHarian.id_pengguna.in_(ids))).all() if ids else []
    nama = {a.id_pengguna: a for a in anggota}
    urut = sorted(hasil, key=lambda h: (-h.bintang, h.durasi_detik, h.jumlah_percobaan))
    kasus = harian_untuk(tanggal)
    return {
        "tanggal": tanggal.isoformat(), "id_kasus": kasus["id"], "judul": kasus["judul"],
        "jumlah_anggota": len(anggota),
        "daftar": [{"peringkat": i + 1, "id": h.id_pengguna, "nama": nama[h.id_pengguna].nama,
                    "avatar": nama[h.id_pengguna].avatar, "durasi_detik": h.durasi_detik,
                    "jumlah_percobaan": h.jumlah_percobaan, "bintang": h.bintang} for i, h in enumerate(urut)],
    }


def _waktu_utc(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def status_tugas(t: TugasKelas, prog: ProgresKasus | None) -> dict:
    selesai = bool(prog and prog.status == "selesai")
    waktu = _waktu_utc(prog.selesai_pada) if prog else None
    tenggat = _waktu_utc(t.tenggat)
    return {"selesai": selesai, "terlambat": bool(selesai and waktu and waktu > tenggat),
            "lewat_tenggat": bool(not selesai and datetime.now(timezone.utc) > tenggat),
            "bintang": prog.bintang if prog else 0}


def judul_kasus(db: Session, id_kasus: str) -> tuple[str, str]:
    b = peta_kasus_bawaan().get(id_kasus)
    if b:
        return b["judul"], b["konsep"]
    k = db.get(Kasus, id_kasus)
    return (k.judul, k.konsep) if k else ("Kasus terhapus", "-")


@rute.post("/kelas/gabung")
def gabung(isi: Gabung, request: Request, p: Pengguna = Depends(hanya_siswa), db: Session = Depends(sesi_db)):
    kunci = ip_dari(request)
    batas_kode.cek(kunci)
    kelas = cari_kelas_dari_kode(db, isi.kode)
    if not kelas:
        batas_kode.gagal(kunci)
        raise HTTPException(404, "Kode kelas tidak ditemukan. Cek lagi ke gurumu.")
    if db.get(AnggotaKelas, (kelas.id_kelas, p.id_pengguna)):
        return {"id_kelas": kelas.id_kelas, "nama_kelas": kelas.nama_kelas, "sudah": True}
    db.add(AnggotaKelas(id_kelas=kelas.id_kelas, id_siswa=p.id_pengguna))
    db.commit()
    return {"id_kelas": kelas.id_kelas, "nama_kelas": kelas.nama_kelas, "sudah": False}


@rute.post("/kelas/{id_kelas}/keluar")
def keluar(id_kelas: int, p: Pengguna = Depends(hanya_siswa), db: Session = Depends(sesi_db)):
    a = db.get(AnggotaKelas, (id_kelas, p.id_pengguna))
    if a:
        db.delete(a)
        db.commit()
    return {"ok": True}


@rute.get("/kelas/saya")
def kelas_saya(p: Pengguna = Depends(hanya_siswa), db: Session = Depends(sesi_db)):
    daftar = db.scalars(select(Kelas).join(AnggotaKelas, AnggotaKelas.id_kelas == Kelas.id_kelas).where(
        AnggotaKelas.id_siswa == p.id_pengguna).order_by(Kelas.nama_kelas)).all()
    progres = {x.id_kasus: x for x in db.scalars(select(ProgresKasus).where(ProgresKasus.id_siswa == p.id_pengguna))}
    hasil, kasus_guru = [], {}
    for k in daftar:
        guru = db.get(Pengguna, k.id_guru)
        tugas = []
        for t in db.scalars(select(TugasKelas).where(TugasKelas.id_kelas == k.id_kelas).order_by(TugasKelas.tenggat)):
            judul, konsep = judul_kasus(db, t.id_kasus)
            tugas.append({"id_tugas": t.id_tugas, "id_kasus": t.id_kasus, "judul": judul, "konsep": konsep,
                          "tenggat": _waktu_utc(t.tenggat).isoformat(), **status_tugas(t, progres.get(t.id_kasus))})
        milik_guru = db.scalars(select(Kasus).where(Kasus.jenis == "guru", Kasus.id_pembuat == k.id_guru,
                                                    Kasus.aktif.is_(True))).all()
        for kg in milik_guru:
            kasus_guru[kg.id_kasus] = kg.data
        hasil.append({"id_kelas": k.id_kelas, "nama_kelas": k.nama_kelas, "guru": guru.nama if guru else "-",
                      "tugas": tugas, "kasus_guru": [ringkas_kasus(kg) for kg in milik_guru]})
    return {"kelas": hasil, "kasus_guru": list(kasus_guru.values())}


@rute.get("/harian/peringkat")
def peringkat(id_kelas: int, tanggal: date | None = None, p: Pengguna = Depends(pengguna_aktif),
              db: Session = Depends(sesi_db)):
    kelas = db.get(Kelas, id_kelas)
    if not kelas:
        raise HTTPException(404, "Kelas tidak ditemukan.")
    if p.peran == "guru" and kelas.id_guru != p.id_pengguna:
        raise HTTPException(403, "Kelas ini bukan milikmu.")
    if p.peran == "siswa" and not db.get(AnggotaKelas, (id_kelas, p.id_pengguna)):
        raise HTTPException(403, "Kamu bukan anggota kelas ini.")
    return peringkat_harian(db, id_kelas, tanggal or hari_ini())


@rute.get("/kasus/{id_kasus}")
def detail_kasus(id_kasus: str, p: Pengguna = Depends(pengguna_aktif), db: Session = Depends(sesi_db)):
    if id_kasus not in kasus_boleh(db, p):
        raise HTTPException(404, "Kasus tidak ditemukan atau tidak bisa kamu buka.")
    k = db.get(Kasus, id_kasus)
    return k.data
