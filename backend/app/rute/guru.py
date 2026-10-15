"""Mode Kelas untuk guru: kelas, tugas, rekap, dan kasus buatan sendiri."""
import csv
import io
import secrets
from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import sesi_db
from ..keamanan import hanya_guru
from ..konten import hari_ini, konten, simpan_kasus
from ..models import (AnggotaKelas, Kasus, Kelas, Pengguna, ProgresKasus, RiwayatQuery, TugasKelas)
from ..permainan import ke_utc, statistik_tersimpan
from ..validasi import KasusTidakValid, periksa_kasus
from .kelas import anggota_dari, judul_kasus, peringkat_harian, ringkas_kasus, status_tugas

rute = APIRouter(prefix="/api/guru", tags=["guru"])
HURUF_KODE = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
NAMA_JENIS_ERROR = {
    "sintaks": "Salah penulisan SQL", "tabel": "Nama tabel salah", "kolom": "Nama kolom salah",
    "hasil": "Hasil belum sesuai", "kata_wajib": "Belum memakai konsep yang diminta", "lain": "Lainnya",
    "ambigu": "Kolom ambigu saat JOIN", "agregasi": "Salah memakai fungsi agregasi",
}


class IsiKelas(BaseModel):
    nama_kelas: str = Field(min_length=1, max_length=80)


class IsiTugas(BaseModel):
    id_kasus: str = Field(max_length=40)
    tenggat: str


def kode_baru(db: Session) -> str:
    while True:
        kode = "".join(secrets.choice(HURUF_KODE) for _ in range(6))
        if not db.scalar(select(Kelas).where(Kelas.kode_kelas == kode)):
            return kode


def kelas_milik(db: Session, id_kelas: int, guru: Pengguna) -> Kelas:
    k = db.get(Kelas, id_kelas)
    if not k or k.id_guru != guru.id_pengguna:
        raise HTTPException(404, "Kelas tidak ditemukan.")
    return k


def _utc(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


@rute.get("/kelas")
def daftar_kelas(g: Pengguna = Depends(hanya_guru), db: Session = Depends(sesi_db)):
    hasil = []
    for k in db.scalars(select(Kelas).where(Kelas.id_guru == g.id_pengguna).order_by(Kelas.dibuat_pada)):
        jumlah = len(anggota_dari(db, k.id_kelas))
        tugas = db.scalars(select(TugasKelas).where(TugasKelas.id_kelas == k.id_kelas)).all()
        hasil.append({"id_kelas": k.id_kelas, "nama_kelas": k.nama_kelas, "kode_kelas": k.kode_kelas,
                      "jumlah_siswa": jumlah, "jumlah_tugas": len(tugas)})
    return hasil


@rute.post("/kelas")
def buat_kelas(isi: IsiKelas, g: Pengguna = Depends(hanya_guru), db: Session = Depends(sesi_db)):
    nama = " ".join(isi.nama_kelas.split())
    if not nama:
        raise HTTPException(422, "Nama kelas belum diisi.")
    k = Kelas(id_guru=g.id_pengguna, nama_kelas=nama, kode_kelas=kode_baru(db))
    db.add(k)
    db.commit()
    return {"id_kelas": k.id_kelas, "nama_kelas": k.nama_kelas, "kode_kelas": k.kode_kelas, "jumlah_siswa": 0, "jumlah_tugas": 0}


@rute.patch("/kelas/{id_kelas}")
def ubah_kelas(id_kelas: int, isi: IsiKelas, g: Pengguna = Depends(hanya_guru), db: Session = Depends(sesi_db)):
    k = kelas_milik(db, id_kelas, g)
    k.nama_kelas = " ".join(isi.nama_kelas.split()) or k.nama_kelas
    db.commit()
    return {"ok": True, "nama_kelas": k.nama_kelas}


@rute.delete("/kelas/{id_kelas}")
def hapus_kelas(id_kelas: int, g: Pengguna = Depends(hanya_guru), db: Session = Depends(sesi_db)):
    k = kelas_milik(db, id_kelas, g)
    for a in db.scalars(select(AnggotaKelas).where(AnggotaKelas.id_kelas == id_kelas)):
        db.delete(a)
    for t in db.scalars(select(TugasKelas).where(TugasKelas.id_kelas == id_kelas)):
        db.delete(t)
    db.delete(k)
    db.commit()
    return {"ok": True}


@rute.post("/kelas/{id_kelas}/kode-baru")
def ganti_kode(id_kelas: int, g: Pengguna = Depends(hanya_guru), db: Session = Depends(sesi_db)):
    k = kelas_milik(db, id_kelas, g)
    k.kode_kelas = kode_baru(db)
    db.commit()
    return {"kode_kelas": k.kode_kelas}


@rute.delete("/kelas/{id_kelas}/anggota/{id_siswa}")
def keluarkan(id_kelas: int, id_siswa: int, g: Pengguna = Depends(hanya_guru), db: Session = Depends(sesi_db)):
    kelas_milik(db, id_kelas, g)
    a = db.get(AnggotaKelas, (id_kelas, id_siswa))
    if a:
        db.delete(a)
        db.commit()
    return {"ok": True}


def _rekap(db: Session, k: Kelas) -> dict:
    anggota = anggota_dari(db, k.id_kelas)
    ids = [a.id_pengguna for a in anggota]
    tugas = db.scalars(select(TugasKelas).where(TugasKelas.id_kelas == k.id_kelas).order_by(TugasKelas.tenggat)).all()
    progres = db.scalars(select(ProgresKasus).where(ProgresKasus.id_siswa.in_(ids))).all() if ids else []
    batas = datetime.now(timezone.utc) - timedelta(days=60)
    riwayat = db.scalars(select(RiwayatQuery).where(RiwayatQuery.id_siswa.in_(ids), RiwayatQuery.dijalankan_pada >= batas)
                         .order_by(RiwayatQuery.dijalankan_pada)).all() if ids else []

    prog_siswa = defaultdict(dict)
    for x in progres:
        prog_siswa[x.id_siswa][x.id_kasus] = x
    riw_siswa = defaultdict(list)
    for r in riwayat:
        riw_siswa[r.id_siswa].append(r)

    hari = hari_ini()
    daftar_anggota = []
    for a in anggota:
        stat = statistik_tersimpan(db, a.id_pengguna)
        ps = prog_siswa[a.id_pengguna]
        selesai = [x for x in ps.values() if x.status == "selesai"]
        rw = riw_siswa[a.id_pengguna]
        terakhir = rw[-20:]
        salah = sum(1 for r in terakhir if not r.hasil_benar)
        persen_salah = round(100 * salah / len(terakhir)) if terakhir else 0
        tugas_selesai = sum(1 for t in tugas if status_tugas(t, ps.get(t.id_kasus))["selesai"])
        lewat = sum(1 for t in tugas if status_tugas(t, ps.get(t.id_kasus))["lewat_tenggat"])
        perhatian = []
        if not ps and not rw:
            perhatian.append("Belum pernah bermain")
        elif stat["terakhir_aktif"] and (hari - datetime.fromisoformat(stat["terakhir_aktif"]).date()).days >= 7:
            perhatian.append("Tidak aktif 7 hari terakhir")
        if len(terakhir) >= 10 and persen_salah >= 60:
            perhatian.append(f"{persen_salah}% query terakhir salah")
        if lewat:
            perhatian.append(f"{lewat} tugas lewat tenggat")
        konsep_lemah = Counter(r.konsep for r in rw if not r.hasil_benar and r.konsep)
        daftar_anggota.append({
            "id": a.id_pengguna, "nama": a.nama, "email": a.email, "avatar": a.avatar, "xp": stat["xp"],
            "pangkat": stat["pangkat"], "streak": stat["streak_saat_ini"], "terakhir_aktif": stat["terakhir_aktif"],
            "kasus_selesai": len(selesai),
            "rata_bintang": round(sum(x.bintang for x in selesai) / len(selesai), 1) if selesai else 0,
            "jumlah_query": len(rw), "persen_salah": persen_salah, "tugas_selesai": tugas_selesai,
            "konsep_lemah": konsep_lemah.most_common(1)[0][0] if konsep_lemah else None,
            "perlu_perhatian": perhatian,
        })

    per_konsep = defaultdict(lambda: {"total": 0, "salah": 0, "jenis": Counter(), "siswa_salah": set()})
    for r in riwayat:
        if not r.konsep:
            continue
        d = per_konsep[r.konsep]
        d["total"] += 1
        if not r.hasil_benar:
            d["salah"] += 1
            d["jenis"][r.jenis_error or "lain"] += 1
            d["siswa_salah"].add(r.id_siswa)
    urutan = ["SELECT", "WHERE", "LIKE", "AGREGASI", "JOIN"]
    rekap_konsep = []
    for kode in urutan + sorted(set(per_konsep) - set(urutan)):
        if kode not in per_konsep:
            rekap_konsep.append({"konsep": kode, "total": 0, "salah": 0, "persen_salah": 0, "jumlah_siswa_salah": 0,
                                 "kesalahan_umum": []})
            continue
        d = per_konsep[kode]
        rekap_konsep.append({
            "konsep": kode, "total": d["total"], "salah": d["salah"],
            "persen_salah": round(100 * d["salah"] / d["total"]) if d["total"] else 0,
            "jumlah_siswa_salah": len(d["siswa_salah"]),
            "kesalahan_umum": [{"jenis": j, "nama": NAMA_JENIS_ERROR.get(j, j), "jumlah": n} for j, n in d["jenis"].most_common(3)],
        })

    daftar_tugas = []
    for t in tugas:
        judul, konsep = judul_kasus(db, t.id_kasus)
        st = [status_tugas(t, prog_siswa[i].get(t.id_kasus)) for i in ids]
        daftar_tugas.append({
            "id_tugas": t.id_tugas, "id_kasus": t.id_kasus, "judul": judul, "konsep": konsep,
            "tenggat": _utc(t.tenggat).isoformat(), "selesai": sum(s["selesai"] for s in st),
            "terlambat": sum(s["terlambat"] for s in st), "belum": sum(not s["selesai"] for s in st),
            "siswa_belum": [a.nama for a, s in zip(anggota, st) if not s["selesai"]],
        })

    per_kasus = defaultdict(list)
    for x in progres:
        per_kasus[x.id_kasus].append(x)
    kasus_sulit = []
    for id_kasus, xs in per_kasus.items():
        judul, konsep = judul_kasus(db, id_kasus)
        kasus_sulit.append({"id_kasus": id_kasus, "judul": judul, "konsep": konsep,
                            "rata_percobaan": round(sum(x.jumlah_percobaan for x in xs) / len(xs), 1),
                            "salah_tuduh": sum(x.salah_tuduh for x in xs),
                            "selesai": sum(1 for x in xs if x.status == "selesai"), "dimainkan": len(xs)})
    kasus_sulit.sort(key=lambda x: -x["rata_percobaan"])
    return {"anggota": daftar_anggota, "tugas": daftar_tugas, "rekap_konsep": rekap_konsep, "kasus_sulit": kasus_sulit[:5]}


@rute.get("/kelas/{id_kelas}")
def detail_kelas(id_kelas: int, g: Pengguna = Depends(hanya_guru), db: Session = Depends(sesi_db)):
    k = kelas_milik(db, id_kelas, g)
    hasil = {"kelas": {"id_kelas": k.id_kelas, "nama_kelas": k.nama_kelas, "kode_kelas": k.kode_kelas},
             **_rekap(db, k), "peringkat_harian": peringkat_harian(db, k.id_kelas, hari_ini())}
    db.commit()
    return hasil


@rute.get("/kelas/{id_kelas}/siswa/{id_siswa}")
def detail_siswa(id_kelas: int, id_siswa: int, g: Pengguna = Depends(hanya_guru), db: Session = Depends(sesi_db)):
    kelas_milik(db, id_kelas, g)
    if not db.get(AnggotaKelas, (id_kelas, id_siswa)):
        raise HTTPException(404, "Siswa ini bukan anggota kelas.")
    s = db.get(Pengguna, id_siswa)
    progres = db.scalars(select(ProgresKasus).where(ProgresKasus.id_siswa == id_siswa)).all()
    riwayat = db.scalars(select(RiwayatQuery).where(RiwayatQuery.id_siswa == id_siswa)
                         .order_by(RiwayatQuery.dijalankan_pada.desc()).limit(40)).all()
    semua = db.scalars(select(RiwayatQuery).where(RiwayatQuery.id_siswa == id_siswa)).all()
    per_konsep = defaultdict(lambda: [0, 0])
    for r in semua:
        if r.konsep:
            per_konsep[r.konsep][0] += 1
            per_konsep[r.konsep][1] += 0 if r.hasil_benar else 1
    daftar_prog = []
    for x in progres:
        judul, konsep = judul_kasus(db, x.id_kasus)
        daftar_prog.append({"id_kasus": x.id_kasus, "judul": judul, "konsep": konsep, "status": x.status,
                            "bintang": x.bintang, "jumlah_percobaan": x.jumlah_percobaan,
                            "petunjuk_dipakai": x.petunjuk_dipakai, "salah_tuduh": x.salah_tuduh,
                            "durasi_detik": x.durasi_detik,
                            "selesai_pada": _utc(x.selesai_pada).isoformat() if x.selesai_pada else None})
    daftar_prog.sort(key=lambda x: x["id_kasus"])
    hasil = {
        "siswa": {"id": s.id_pengguna, "nama": s.nama, "email": s.email, "avatar": s.avatar, "penempatan": s.penempatan},
        "statistik": statistik_tersimpan(db, id_siswa), "progres": daftar_prog,
        "konsep": [{"konsep": k, "total": v[0], "salah": v[1], "persen_salah": round(100 * v[1] / v[0]) if v[0] else 0}
                   for k, v in sorted(per_konsep.items())],
        "riwayat": [{"teks_query": r.teks_query, "hasil_benar": r.hasil_benar, "jenis_error": r.jenis_error,
                     "pesan_error": r.pesan_error, "konsep": r.konsep, "id_kasus": r.id_kasus,
                     "dijalankan_pada": _utc(r.dijalankan_pada).isoformat()} for r in riwayat],
    }
    db.commit()
    return hasil


@rute.get("/kelas/{id_kelas}/rekap.csv")
def rekap_csv(id_kelas: int, g: Pengguna = Depends(hanya_guru), db: Session = Depends(sesi_db)):
    k = kelas_milik(db, id_kelas, g)
    r = _rekap(db, k)
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["Nama", "Email", "XP", "Pangkat", "Streak", "Kasus selesai", "Rata-rata bintang", "Jumlah query",
                "Persen query salah", f"Tugas selesai (dari {len(r['tugas'])})", "Konsep paling sering salah",
                "Terakhir aktif", "Perlu perhatian"])
    for a in r["anggota"]:
        w.writerow([a["nama"], a["email"], a["xp"], a["pangkat"], a["streak"], a["kasus_selesai"], a["rata_bintang"],
                    a["jumlah_query"], a["persen_salah"], a["tugas_selesai"], a["konsep_lemah"] or "",
                    a["terakhir_aktif"] or "", "; ".join(a["perlu_perhatian"])])
    db.commit()
    nama = "".join(c if c.isalnum() else "_" for c in k.nama_kelas)
    return Response(buf.getvalue().encode("utf-8-sig"), media_type="text/csv",
                    headers={"Content-Disposition": f'attachment; filename="rekap_{nama}.csv"'})


@rute.post("/kelas/{id_kelas}/tugas")
def buat_tugas(id_kelas: int, isi: IsiTugas, g: Pengguna = Depends(hanya_guru), db: Session = Depends(sesi_db)):
    kelas_milik(db, id_kelas, g)
    kasus = db.get(Kasus, isi.id_kasus)
    if not kasus or kasus.jenis == "harian" or (kasus.jenis == "guru" and kasus.id_pembuat != g.id_pengguna):
        raise HTTPException(404, "Kasus tidak ditemukan.")
    tenggat = ke_utc(isi.tenggat)
    if not tenggat:
        raise HTTPException(422, "Format tenggat belum benar.")
    if tenggat < datetime.now(timezone.utc):
        raise HTTPException(422, "Tenggat harus di masa depan.")
    t = TugasKelas(id_kelas=id_kelas, id_kasus=isi.id_kasus, tenggat=tenggat)
    db.add(t)
    db.commit()
    return {"id_tugas": t.id_tugas}


@rute.delete("/tugas/{id_tugas}")
def hapus_tugas(id_tugas: int, g: Pengguna = Depends(hanya_guru), db: Session = Depends(sesi_db)):
    t = db.get(TugasKelas, id_tugas)
    if not t:
        raise HTTPException(404, "Tugas tidak ditemukan.")
    kelas_milik(db, t.id_kelas, g)
    db.delete(t)
    db.commit()
    return {"ok": True}


@rute.get("/daftar-kasus")
def daftar_kasus(g: Pengguna = Depends(hanya_guru), db: Session = Depends(sesi_db)):
    bawaan = [{"id_kasus": x["id"], "judul": x["judul"], "konsep": x["konsep"], "jenis": "utama",
               "berkas": x["berkas"], "jumlah_langkah": len(x["langkah"])} for x in konten()["kasus"]]
    milik = [ringkas_kasus(k) for k in db.scalars(select(Kasus).where(Kasus.jenis == "guru", Kasus.id_pembuat == g.id_pengguna,
                                                                       Kasus.aktif.is_(True)).order_by(Kasus.dibuat_pada))]
    return {"bawaan": bawaan, "buatan": milik}


@rute.get("/kasus")
def kasus_saya(g: Pengguna = Depends(hanya_guru), db: Session = Depends(sesi_db)):
    return [k.data | {"diperbarui_pada": _utc(k.diperbarui_pada).isoformat()} for k in db.scalars(
        select(Kasus).where(Kasus.jenis == "guru", Kasus.id_pembuat == g.id_pengguna, Kasus.aktif.is_(True))
        .order_by(Kasus.dibuat_pada.desc()))]


def _periksa(masukan: dict, id_kasus: str):
    try:
        return periksa_kasus(masukan, id_kasus)
    except KasusTidakValid as e:
        raise HTTPException(422, {"pesan": e.pesan, "bagian": e.bagian})


@rute.post("/kasus/periksa")
def periksa(masukan: dict, g: Pengguna = Depends(hanya_guru)):
    data, pratinjau = _periksa(masukan, "pratinjau")
    return {"data": data, "pratinjau": pratinjau}


@rute.post("/kasus")
def buat_kasus(masukan: dict, g: Pengguna = Depends(hanya_guru), db: Session = Depends(sesi_db)):
    jumlah = len(db.scalars(select(Kasus.id_kasus).where(Kasus.id_pembuat == g.id_pengguna, Kasus.aktif.is_(True))).all())
    if jumlah >= 50:
        raise HTTPException(422, {"pesan": "Maksimal 50 kasus buatan per guru.", "bagian": "umum"})
    id_kasus = "g" + secrets.token_hex(5)
    data, pratinjau = _periksa(masukan, id_kasus)
    simpan_kasus(db, data, "guru", g.id_pengguna)
    db.commit()
    return {"data": data, "pratinjau": pratinjau}


@rute.put("/kasus/{id_kasus}")
def ubah_kasus(id_kasus: str, masukan: dict, g: Pengguna = Depends(hanya_guru), db: Session = Depends(sesi_db)):
    k = db.get(Kasus, id_kasus)
    if not k or k.jenis != "guru" or k.id_pembuat != g.id_pengguna or not k.aktif:
        raise HTTPException(404, "Kasus tidak ditemukan.")
    data, pratinjau = _periksa(masukan, id_kasus)
    simpan_kasus(db, data, "guru", g.id_pengguna)
    db.commit()
    return {"data": data, "pratinjau": pratinjau}


@rute.delete("/kasus/{id_kasus}")
def hapus_kasus(id_kasus: str, g: Pengguna = Depends(hanya_guru), db: Session = Depends(sesi_db)):
    k = db.get(Kasus, id_kasus)
    if not k or k.jenis != "guru" or k.id_pembuat != g.id_pengguna:
        raise HTTPException(404, "Kasus tidak ditemukan.")
    # Kasus disembunyikan, bukan dihapus, supaya riwayat dan nilai siswa tetap utuh.
    k.aktif = False
    for t in db.scalars(select(TugasKelas).where(TugasKelas.id_kasus == id_kasus)):
        db.delete(t)
    db.commit()
    return {"ok": True}


@rute.get("/ping")
def ping(g: Pengguna = Depends(hanya_guru)):
    return JSONResponse({"ok": True})
