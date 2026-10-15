"""Memuat konten bawaan (konten.json) dan menyalinnya ke basis data."""
import json
import os
from datetime import date, datetime, timedelta, timezone
from functools import lru_cache

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from .models import Berkas, Kasus, LangkahKasus, Lencana, Tersangka

BERKAS_KONTEN = os.path.join(os.path.dirname(os.path.abspath(__file__)), "konten.json")
WIB = timezone(timedelta(hours=7))
AWAL_HARIAN = date(2026, 1, 1)


@lru_cache
def konten() -> dict:
    with open(BERKAS_KONTEN, encoding="utf-8") as f:
        return json.load(f)


def aturan() -> dict:
    return konten()["aturan"]


def hari_ini() -> date:
    return datetime.now(WIB).date()


def harian_untuk(tanggal: date) -> dict:
    daftar = konten()["harian"]
    return daftar[(tanggal - AWAL_HARIAN).days % len(daftar)]


@lru_cache
def peta_kasus_bawaan() -> dict:
    k = konten()
    hasil = {x["id"]: x for x in k["kasus"]}
    hasil.update({x["id"]: x for x in k["harian"]})
    return hasil


def simpan_kasus(db: Session, data: dict, jenis: str, id_pembuat: int | None = None) -> Kasus:
    """Membuat atau memperbarui satu kasus beserta langkah dan tersangkanya."""
    kasus = db.get(Kasus, data["id"])
    if not kasus:
        kasus = Kasus(id_kasus=data["id"])
        db.add(kasus)
    kasus.id_berkas = data.get("berkas") if jenis == "utama" else None
    kasus.id_pembuat = id_pembuat
    kasus.judul = data["judul"]
    kasus.konsep = data["konsep"]
    kasus.cerita_briefing = "\n".join(data["briefing"])
    kasus.file_database = data.get("sql") or ""
    kasus.jenis = jenis
    kasus.xp_hadiah = data.get("xp", 40)
    kasus.koin_hadiah = data.get("koin", 15)
    kasus.data = data
    kasus.aktif = True
    db.flush()
    db.execute(delete(LangkahKasus).where(LangkahKasus.id_kasus == data["id"]))
    db.execute(delete(Tersangka).where(Tersangka.id_kasus == data["id"]))
    for i, s in enumerate(data["langkah"], 1):
        p = s["petunjuk"]
        db.add(LangkahKasus(id_langkah=f'{data["id"]}-{i}', id_kasus=data["id"], urutan=i, instruksi=s["instruksi"],
                            query_kunci=s["query_kunci"], petunjuk_1=p[0], petunjuk_2=p[1], petunjuk_3=p[2]))
    if jenis == "harian":
        for o in data["opsi"]:
            db.add(Tersangka(id_kasus=data["id"], nama=o, peran="", avatar=None, adalah_pelaku=o == data["jawaban"]))
    else:
        for t in data["tersangka"]:
            db.add(Tersangka(id_kasus=data["id"], nama=t["nama"], peran=t["peran"], avatar=t["avatar"],
                             adalah_pelaku=bool(t["pelaku"])))
    return kasus


def isi_konten_bawaan(db: Session):
    k = konten()
    for b in k["berkas"]:
        row = db.get(Berkas, b["nomor"]) or Berkas(id_berkas=b["nomor"])
        row.urutan, row.judul, row.konsep_sql, row.ringkasan_materi = b["nomor"], b["judul"], b["konsep"], b["ringkas"]
        db.merge(row)
    db.flush()
    versi_db = {r.id_kasus: r.data for r in db.scalars(select(Kasus).where(Kasus.jenis.in_(["utama", "harian"])))}
    for x in k["kasus"]:
        if versi_db.get(x["id"]) != x:
            simpan_kasus(db, x, "utama")
    for x in k["harian"]:
        if versi_db.get(x["id"]) != x:
            simpan_kasus(db, x, "harian")
    for l in k["lencana"]:
        db.merge(Lencana(id_lencana=l["kode"], nama=l["nama"], deskripsi=l["syarat"], syarat=l["syarat"],
                         gambar=f'lencana_{l["kode"]}.png'))
    db.commit()
