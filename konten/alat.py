"""Alat bantu untuk menulis konten kasus.

Setiap tabel ditulis sebagai daftar kolom dan daftar baris, lalu diubah menjadi
skrip SQL (CREATE TABLE dan INSERT) yang dijalankan di SQLite pada aplikasi.
"""


def _nilai_sql(v):
    if v is None:
        return "NULL"
    if isinstance(v, bool):
        return "1" if v else "0"
    if isinstance(v, (int, float)):
        return str(v)
    return "'" + str(v).replace("'", "''") + "'"


def tabel(nama, keterangan, kolom, baris, relasi=None):
    """kolom: daftar (nama, tipe, keterangan). Kolom pertama dianggap kunci utama.

    relasi: daftar (kolom, tabel_tujuan, kolom_tujuan) untuk kunci tamu.
    """
    return {
        "nama": nama,
        "keterangan": keterangan,
        "kolom": [{"nama": k[0], "tipe": k[1], "keterangan": k[2]} for k in kolom],
        "baris": [list(b) for b in baris],
        "relasi": [{"kolom": r[0], "tabel": r[1], "ke": r[2]} for r in (relasi or [])],
    }


def skrip_sql(daftar_tabel):
    bagian = []
    for t in daftar_tabel:
        defs = []
        for i, k in enumerate(t["kolom"]):
            d = f'{k["nama"]} {k["tipe"]}'
            if i == 0:
                d += " PRIMARY KEY"
            defs.append(d)
        for r in t["relasi"]:
            defs.append(f'FOREIGN KEY ({r["kolom"]}) REFERENCES {r["tabel"]}({r["ke"]})')
        bagian.append(f'CREATE TABLE {t["nama"]} (' + ", ".join(defs) + ");")
        nama_kolom = ", ".join(k["nama"] for k in t["kolom"])
        for b in t["baris"]:
            if len(b) != len(t["kolom"]):
                raise ValueError(f'Baris {b} di tabel {t["nama"]} tidak sesuai jumlah kolom')
            bagian.append(f'INSERT INTO {t["nama"]} ({nama_kolom}) VALUES (' + ", ".join(_nilai_sql(v) for v in b) + ");")
    return "\n".join(bagian)


def meta_tabel(daftar_tabel):
    """Ringkasan tabel untuk Peta Tabel (tanpa isi baris)."""
    return [
        {
            "nama": t["nama"],
            "keterangan": t["keterangan"],
            "kolom": t["kolom"],
            "relasi": t["relasi"],
            "jumlah_baris": len(t["baris"]),
        }
        for t in daftar_tabel
    ]


def langkah(instruksi, query_kunci, petunjuk, komentar, wajib=None, cocok="minimal", blok_tambahan=None):
    """cocok: 'tepat' berarti kolom hasil harus sama persis dengan query kunci,
    'minimal' berarti hasil siswa cukup memuat kolom query kunci dengan baris yang sama."""
    assert len(petunjuk) == 3, "Setiap langkah butuh tiga tingkat petunjuk"
    return {
        "instruksi": instruksi,
        "query_kunci": query_kunci.strip().rstrip(";"),
        "petunjuk": petunjuk,
        "komentar_benar": komentar,
        "wajib": wajib or [],
        "cocok": cocok,
        "blok_tambahan": blok_tambahan or [],
    }


def tersangka(nama, peran, avatar, pelaku=False, alasan=""):
    return {"nama": nama, "peran": peran, "avatar": avatar, "pelaku": pelaku, "alasan": alasan}
