"""Aturan gamifikasi: XP, koin, pangkat, streak, dan lencana.

Semua nilai dihitung ulang dari catatan progres, sehingga hasil sinkron dari beberapa perangkat
selalu sama. Aturan yang sama ditulis juga di aplikasi (src/permainan/aturan.ts) untuk mode offline.
"""
from datetime import date, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from .konten import aturan, hari_ini, konten
from .models import (HariAktif, HasilHarian, Kasus, LencanaPemain, ProgresKasus, StatistikPemain,
                     sekarang)


def pangkat_dari_xp(xp: int) -> dict:
    hasil = konten()["pangkat"][0]
    for p in konten()["pangkat"]:
        if xp >= p["xp"]:
            hasil = p
    return hasil


def hitung_streak(tanggal: set[date], kini: date) -> tuple[int, int]:
    if not tanggal:
        return 0, 0
    urut = sorted(tanggal)
    terpanjang, jalan = 1, 1
    for a, b in zip(urut, urut[1:]):
        jalan = jalan + 1 if (b - a).days == 1 else 1
        terpanjang = max(terpanjang, jalan)
    saat_ini = 0
    mulai = kini if kini in tanggal else kini - timedelta(days=1)
    while mulai in tanggal:
        saat_ini += 1
        mulai -= timedelta(days=1)
    return saat_ini, terpanjang


def hitung_statistik(db: Session, id_siswa: int) -> dict:
    a = aturan()
    progres = db.scalars(select(ProgresKasus).where(ProgresKasus.id_siswa == id_siswa)).all()
    harian = db.scalars(select(HasilHarian).where(HasilHarian.id_pengguna == id_siswa)).all()
    hari = {h.tanggal for h in db.scalars(select(HariAktif).where(HariAktif.id_pengguna == id_siswa))}
    ids = {p.id_kasus for p in progres}
    kasus = {k.id_kasus: k for k in db.scalars(select(Kasus).where(Kasus.id_kasus.in_(ids)))} if ids else {}

    xp, koin_masuk, petunjuk, bukti = 0, 0, 0, 0
    lencana = set()
    for p in progres:
        petunjuk += p.petunjuk_dipakai
        k = kasus.get(p.id_kasus)
        # Hadiah Kasus Harian dihitung dari tabel hasil_harian, bukan dari progres.
        if not k or p.status != "selesai" or p.bintang < 1 or k.jenis == "harian":
            continue
        b = min(p.bintang, 3)
        xp += round(k.xp_hadiah * a["faktor_xp_bintang"][b - 1])
        koin_masuk += k.koin_hadiah + (a["bonus_koin_tiga_bintang"] if b == 3 else 0)
        bukti += len(k.data.get("langkah", []))
        lencana.add("kasus_pertama")
        if k.jenis == "utama":
            if b == 3 and p.petunjuk_dipakai == 0:
                lencana.add("tanpa_petunjuk")
            if p.durasi_detik is not None and p.durasi_detik < a["detik_kilat"]:
                lencana.add("detektif_kilat")
    for h in harian:
        petunjuk += h.petunjuk_dipakai
        xp += 30
        koin_masuk += 10
        bukti += 1
        lencana.add("kasus_pertama")

    selesai = {p.id_kasus for p in progres if p.status == "selesai"}
    kasus_join = [x["id"] for x in konten()["kasus"] if x["berkas"] == 5]
    if kasus_join and all(x in selesai for x in kasus_join):
        lencana.add("raja_join")
    if bukti >= a["bukti_kolektor"]:
        lencana.add("kolektor_bukti")
    saat_ini, terpanjang = hitung_streak(hari, hari_ini())
    if terpanjang >= 7:
        lencana.add("streak_7_hari")
    koin = max(0, a["koin_awal"] + koin_masuk - a["biaya_petunjuk"] * petunjuk)
    return {
        "xp": xp, "koin": koin, "pangkat": pangkat_dari_xp(xp)["kode"], "streak_saat_ini": saat_ini,
        "streak_terpanjang": terpanjang, "terakhir_aktif": max(hari).isoformat() if hari else None,
        "bukti": bukti, "lencana": sorted(lencana),
    }


def perbarui_statistik(db: Session, id_siswa: int) -> dict:
    s = hitung_statistik(db, id_siswa)
    row = db.get(StatistikPemain, id_siswa) or StatistikPemain(id_pengguna=id_siswa)
    row.xp, row.koin, row.pangkat = s["xp"], s["koin"], s["pangkat"]
    row.streak_saat_ini, row.streak_terpanjang = s["streak_saat_ini"], s["streak_terpanjang"]
    row.terakhir_aktif = date.fromisoformat(s["terakhir_aktif"]) if s["terakhir_aktif"] else None
    db.merge(row)
    sudah = {x.id_lencana for x in db.scalars(select(LencanaPemain).where(LencanaPemain.id_pengguna == id_siswa))}
    for kode in s["lencana"]:
        if kode not in sudah:
            db.add(LencanaPemain(id_pengguna=id_siswa, id_lencana=kode, didapat_pada=sekarang()))
    db.flush()
    didapat = {x.id_lencana: x.didapat_pada for x in db.scalars(select(LencanaPemain).where(LencanaPemain.id_pengguna == id_siswa))}
    s["lencana_didapat"] = {k: utc(v).isoformat() for k, v in didapat.items()}
    return s


def statistik_tersimpan(db: Session, id_siswa: int) -> dict:
    row = db.get(StatistikPemain, id_siswa)
    if not row:
        return perbarui_statistik(db, id_siswa)
    didapat = {x.id_lencana: utc(x.didapat_pada).isoformat()
               for x in db.scalars(select(LencanaPemain).where(LencanaPemain.id_pengguna == id_siswa))}
    saat_ini = row.streak_saat_ini
    if row.terakhir_aktif and (hari_ini() - row.terakhir_aktif).days > 1:
        saat_ini = 0
    return {"xp": row.xp, "koin": row.koin, "pangkat": row.pangkat, "streak_saat_ini": saat_ini,
            "streak_terpanjang": row.streak_terpanjang,
            "terakhir_aktif": row.terakhir_aktif.isoformat() if row.terakhir_aktif else None,
            "lencana": sorted(didapat), "lencana_didapat": didapat}


def utc(dt: datetime | None) -> datetime | None:
    """SQLite mengembalikan waktu tanpa zona. Semua waktu di server disimpan dalam UTC."""
    if dt is None:
        return None
    from datetime import timezone
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def ke_utc(teks: str | None) -> datetime | None:
    if not teks:
        return None
    try:
        dt = datetime.fromisoformat(teks.replace("Z", "+00:00"))
    except ValueError:
        return None
    if dt.tzinfo is None:
        from datetime import timezone
        dt = dt.replace(tzinfo=timezone.utc)
    return dt
