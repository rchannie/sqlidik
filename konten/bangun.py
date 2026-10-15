"""Merakit seluruh konten menjadi konten.json dan memeriksa setiap query kunci di SQLite.

Jalankan:  python konten/bangun.py
Hasil disalin ke app/src/konten/konten.json dan backend/app/konten.json.
"""
import json
import os
import re
import shutil
import sqlite3
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from alat import meta_tabel, skrip_sql  # noqa: E402
from arsip import (CATATAN, KASUS_HARIAN, LATIHAN, LENCANA, PANGKAT, PENEMPATAN,  # noqa: E402
                   TABEL_ARSIP)
from kasus_utama import BERKAS, KARTU, KASUS_UTAMA  # noqa: E402

AKAR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AVATAR = {"raka", "nadia", "bima", "sinta", "pak_hendra", "pak_darto", "bu_sri", "bu_ratna"}

ATURAN = {
    "koin_awal": 30,
    "biaya_petunjuk": 5,
    "faktor_xp_bintang": [0.6, 0.8, 1.0],
    "bonus_koin_tiga_bintang": 5,
    "batas_percobaan_salah": 6,
    "zona_waktu_jam": 7,
    "detik_kilat": 120,
    "bukti_kolektor": 20,
}

masalah = []
laporan = []


def normal(sql):
    tanpa_teks = re.sub(r"'(?:[^']|'')*'", "''", sql)
    return re.sub(r"\s+", " ", tanpa_teks.upper())


def jalankan(con, sql):
    cur = con.execute(sql)
    kolom = [d[0] for d in cur.description]
    return kolom, cur.fetchall()


def periksa_langkah(con, nama, i, s):
    try:
        kolom, baris = jalankan(con, s["query_kunci"])
    except sqlite3.Error as e:
        masalah.append(f"{nama} langkah {i}: query kunci gagal: {e}")
        return None
    if not baris:
        masalah.append(f"{nama} langkah {i}: query kunci tidak menghasilkan baris")
    n = normal(s["query_kunci"])
    for w in s["wajib"]:
        if w.upper() not in n:
            masalah.append(f"{nama} langkah {i}: kata wajib {w} tidak ada di query kunci")
    if len(s["petunjuk"]) != 3:
        masalah.append(f"{nama} langkah {i}: petunjuk harus tiga")
    laporan.append(f"  [{i}] {s['query_kunci']}")
    laporan.append(f"      kolom: {kolom}")
    for b in baris[:12]:
        laporan.append(f"      {b}")
    if len(baris) > 12:
        laporan.append(f"      ... {len(baris)} baris")
    return kolom, baris


def db_dari(tabel_list):
    con = sqlite3.connect(":memory:")
    con.executescript(skrip_sql(tabel_list))
    return con


def bangun():
    kasus_keluar = []
    for k in KASUS_UTAMA:
        laporan.append(f"\n== {k['id']} {k['judul']}")
        con = db_dari(k["tabel_sumber"])
        for i, s in enumerate(k["langkah"], 1):
            periksa_langkah(con, k["id"], i, s)
        pelaku = [t for t in k["tersangka"] if t["pelaku"]]
        if len(pelaku) != 1:
            masalah.append(f"{k['id']}: harus tepat satu pelaku")
        for t in k["tersangka"]:
            if t["avatar"] not in AVATAR:
                masalah.append(f"{k['id']}: avatar {t['avatar']} tidak dikenal")
            if not t["pelaku"] and not t["alasan"]:
                masalah.append(f"{k['id']}: tersangka {t['nama']} belum punya alasan")
        laporan.append(f"  pelaku: {pelaku[0]['nama'] if pelaku else '-'}")
        keluar = {x: v for x, v in k.items() if x != "tabel_sumber"}
        keluar["sql"] = skrip_sql(k["tabel_sumber"])
        keluar["tabel"] = meta_tabel(k["tabel_sumber"])
        keluar["kartu"] = KARTU[k["konsep"]]
        kasus_keluar.append(keluar)

    con_arsip = db_dari(TABEL_ARSIP)
    harian_keluar = []
    for h in KASUS_HARIAN:
        laporan.append(f"\n== {h['id']} {h['judul']}")
        hasil = periksa_langkah(con_arsip, h["id"], 1, h["langkah"][0])
        if h["jawaban"] not in h["opsi"] or len(h["opsi"]) != 3:
            masalah.append(f"{h['id']}: jawaban harus salah satu dari tiga opsi")
        if hasil and not any(h["jawaban"] in [str(v) for v in b] for b in hasil[1]):
            masalah.append(f"{h['id']}: jawaban {h['jawaban']} tidak terlihat di hasil query kunci")
        laporan.append(f"  jawaban: {h['jawaban']}")
        h = dict(h)
        h["kartu"] = KARTU[h["konsep"]]
        harian_keluar.append(h)

    for l in LATIHAN:
        laporan.append(f"\n== latihan {l['id']} {l['judul']}")
        periksa_langkah(con_arsip, l["id"], 1, l)

    for p in PENEMPATAN:
        if not 0 <= p["jawaban"] < len(p["opsi"]):
            masalah.append(f"penempatan {p['konsep']}: indeks jawaban salah")

    konten = {
        "versi": 1,
        "aturan": ATURAN,
        "berkas": BERKAS,
        "kasus": kasus_keluar,
        "harian": harian_keluar,
        "arsip": {"sql": skrip_sql(TABEL_ARSIP), "tabel": meta_tabel(TABEL_ARSIP)},
        "latihan": LATIHAN,
        "penempatan": PENEMPATAN,
        "catatan": CATATAN,
        "kartu": KARTU,
        "lencana": LENCANA,
        "pangkat": PANGKAT,
    }
    teks = json.dumps(konten, ensure_ascii=False, indent=1)
    for tanda in ("—", "–"):
        if tanda in teks:
            masalah.append("Konten memuat tanda pisah panjang (em dash atau en dash)")
    return konten, teks


if __name__ == "__main__":
    konten, teks = bangun()
    dist = os.path.join(AKAR, "konten", "dist")
    os.makedirs(dist, exist_ok=True)
    open(os.path.join(dist, "laporan.txt"), "w").write("\n".join(laporan))
    if masalah:
        print("MASALAH:")
        for m in masalah:
            print(" -", m)
        sys.exit(1)
    open(os.path.join(dist, "konten.json"), "w").write(teks)
    tujuan = [os.path.join(AKAR, "app", "src", "konten", "konten.json"),
              os.path.join(AKAR, "backend", "app", "konten.json")]
    for t in tujuan:
        if os.path.isdir(os.path.dirname(t)):
            shutil.copy(os.path.join(dist, "konten.json"), t)
            print("disalin ke", os.path.relpath(t, AKAR))
    print(f"ok: {len(konten['kasus'])} kasus utama, {len(konten['harian'])} kasus harian, "
          f"{len(konten['latihan'])} latihan, {len(teks) // 1024} KB")
