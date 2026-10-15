"""Memeriksa kasus buatan guru dengan SQLite sebelum disimpan.

Skrip basis data kasus nanti dijalankan di perangkat siswa, jadi hanya perintah CREATE TABLE,
CREATE INDEX, dan INSERT yang diizinkan. Query kunci hanya boleh berupa SELECT.
"""
import re
import sqlite3

from .konten import konten

KONSEP = {"SELECT", "WHERE", "LIKE", "AGREGASI", "JOIN"}
AVATAR = {"raka", "nadia", "bima", "sinta", "pak_hendra", "pak_darto", "bu_sri", "bu_ratna"}
BATAS_SKRIP = 60_000
BATAS_TABEL = 10
BATAS_BARIS = 2000


class KasusTidakValid(Exception):
    def __init__(self, pesan: str, bagian: str = "umum"):
        super().__init__(pesan)
        self.pesan = pesan
        self.bagian = bagian


def _otorisasi_skrip(aksi, a1, a2, nama_db, pemicu):
    boleh = {sqlite3.SQLITE_CREATE_TABLE, sqlite3.SQLITE_CREATE_INDEX, sqlite3.SQLITE_INSERT, sqlite3.SQLITE_READ,
             sqlite3.SQLITE_SELECT, sqlite3.SQLITE_FUNCTION, sqlite3.SQLITE_TRANSACTION, sqlite3.SQLITE_UPDATE}
    if aksi in boleh:
        if aksi == sqlite3.SQLITE_FUNCTION and a2 and a2.lower() in {"load_extension", "readfile", "writefile"}:
            return sqlite3.SQLITE_DENY
        return sqlite3.SQLITE_OK
    return sqlite3.SQLITE_DENY


def _otorisasi_baca(aksi, a1, a2, nama_db, pemicu):
    if aksi in {sqlite3.SQLITE_READ, sqlite3.SQLITE_SELECT, sqlite3.SQLITE_FUNCTION, sqlite3.SQLITE_RECURSIVE}:
        return sqlite3.SQLITE_OK
    return sqlite3.SQLITE_DENY


def _batasi_waktu(con):
    hitung = {"n": 0}

    def cek():
        hitung["n"] += 1
        return 1 if hitung["n"] > 2000 else 0

    con.set_progress_handler(cek, 1000)


def _terjemah(e: Exception) -> str:
    m = str(e)
    if "not authorized" in m:
        return "Perintah ini tidak diizinkan. Skrip hanya boleh berisi CREATE TABLE dan INSERT."
    if "interrupted" in m:
        return "Perintah terlalu lama dijalankan. Kurangi jumlah data atau sederhanakan query."
    if "no such table" in m:
        return "Tabel " + m.split(":")[-1].strip() + " tidak ditemukan."
    if "no such column" in m:
        return "Kolom " + m.split(":")[-1].strip() + " tidak ditemukan."
    if "syntax error" in m:
        return "Ada kesalahan penulisan SQL: " + m
    if "UNIQUE constraint" in m:
        return "Ada nilai kunci utama yang dobel: " + m
    return m


def buat_db(skrip: str) -> sqlite3.Connection:
    if len(skrip) > BATAS_SKRIP:
        raise KasusTidakValid("Skrip basis data terlalu panjang (maksimal 60.000 karakter).", "sql")
    if not skrip.strip():
        raise KasusTidakValid("Skrip basis data masih kosong.", "sql")
    con = sqlite3.connect(":memory:")
    con.set_authorizer(_otorisasi_skrip)
    _batasi_waktu(con)
    try:
        con.executescript(skrip)
    except sqlite3.Error as e:
        raise KasusTidakValid("Skrip basis data gagal dijalankan. " + _terjemah(e), "sql")
    con.set_authorizer(None)
    con.set_progress_handler(None, 0)
    tabel = [r[0] for r in con.execute("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'")]
    if not tabel:
        raise KasusTidakValid("Skrip belum membuat tabel apa pun.", "sql")
    if len(tabel) > BATAS_TABEL:
        raise KasusTidakValid(f"Maksimal {BATAS_TABEL} tabel per kasus.", "sql")
    total = sum(con.execute(f'SELECT COUNT(*) FROM "{t}"').fetchone()[0] for t in tabel)
    if total > BATAS_BARIS:
        raise KasusTidakValid(f"Maksimal {BATAS_BARIS} baris data per kasus.", "sql")
    return con


def meta_tabel(con: sqlite3.Connection) -> list[dict]:
    hasil = []
    for (nama,) in con.execute("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY rowid"):
        kolom = [{"nama": r[1], "tipe": r[2] or "", "keterangan": ""} for r in con.execute(f'PRAGMA table_info("{nama}")')]
        relasi = [{"kolom": r[3], "tabel": r[2], "ke": r[4]} for r in con.execute(f'PRAGMA foreign_key_list("{nama}")')]
        n = con.execute(f'SELECT COUNT(*) FROM "{nama}"').fetchone()[0]
        hasil.append({"nama": nama, "keterangan": "", "kolom": kolom, "relasi": relasi, "jumlah_baris": n})
    return hasil


def _tanpa_teks(sql: str) -> str:
    return re.sub(r"'(?:[^']|'')*'", "''", sql)


def jalankan_kunci(con: sqlite3.Connection, sql: str, nomor: int):
    sql = sql.strip().rstrip(";").strip()
    if not sql:
        raise KasusTidakValid(f"Query kunci langkah {nomor} masih kosong.", f"langkah{nomor}")
    bersih = _tanpa_teks(sql)
    if ";" in bersih:
        raise KasusTidakValid(f"Query kunci langkah {nomor} hanya boleh satu perintah.", f"langkah{nomor}")
    if not re.match(r"^\s*(SELECT|WITH)\b", bersih, re.I):
        raise KasusTidakValid(f"Query kunci langkah {nomor} harus diawali SELECT.", f"langkah{nomor}")
    con.set_authorizer(_otorisasi_baca)
    _batasi_waktu(con)
    try:
        cur = con.execute(sql)
        baris = cur.fetchmany(501)
        kolom = [d[0] for d in cur.description]
    except sqlite3.Error as e:
        raise KasusTidakValid(f"Query kunci langkah {nomor} gagal: " + _terjemah(e), f"langkah{nomor}")
    finally:
        con.set_authorizer(None)
        con.set_progress_handler(None, 0)
    if not baris:
        raise KasusTidakValid(f"Query kunci langkah {nomor} tidak menghasilkan baris. Siswa tidak akan menemukan bukti.", f"langkah{nomor}")
    if len(baris) > 500:
        raise KasusTidakValid(f"Hasil query kunci langkah {nomor} terlalu banyak (lebih dari 500 baris).", f"langkah{nomor}")
    return sql, kolom, baris


def _tabel_disebut(sql: str) -> list[str]:
    hasil = []
    for m in re.finditer(r"\b(?:FROM|JOIN)\s+([A-Za-z_][A-Za-z0-9_]*)", _tanpa_teks(sql), re.I):
        if m.group(1) not in hasil:
            hasil.append(m.group(1))
    return hasil


KATA_KONSEP = ["WHERE", "AND", "OR", "LIKE", "COUNT", "SUM", "AVG", "MIN", "MAX", "GROUP BY", "HAVING", "ORDER BY", "JOIN", "DISTINCT"]


def _kata_dipakai(sql: str) -> list[str]:
    n = re.sub(r"\s+", " ", _tanpa_teks(sql).upper())
    return [k for k in KATA_KONSEP if re.search(r"\b" + k.replace(" ", r"\s+") + r"\b", n)]


def wajib_untuk(konsep: str, sql: str) -> list[str]:
    dipakai = _kata_dipakai(sql)
    pilihan = {
        "SELECT": ["SELECT", "FROM"], "WHERE": ["WHERE"], "LIKE": ["LIKE"],
        "AGREGASI": [k for k in ["COUNT", "SUM", "AVG", "MIN", "MAX", "GROUP BY", "HAVING"] if k in dipakai],
        "JOIN": ["JOIN", "ON"],
    }[konsep]
    return [k for k in pilihan if k in ("SELECT", "FROM", "ON") or k in dipakai]


def petunjuk_otomatis(sql: str) -> list[str]:
    tabel = _tabel_disebut(sql)
    kata = _kata_dipakai(sql)
    p1 = "Data yang dibutuhkan ada di tabel " + ", ".join(tabel) + "." if tabel else "Lihat Peta Tabel untuk memilih tabel."
    p2 = ("Query ini memakai " + ", ".join(kata) + ".") if kata else "Pilih kolom yang dibutuhkan setelah SELECT."
    kerangka = re.sub(r"'(?:[^']|'')*'", "'____'", sql)
    kerangka = re.sub(r"(?<![A-Za-z_])\d+(?![A-Za-z_])", "____", kerangka)
    return [p1, p2, kerangka]


def _teks(v, nama: str, maks: int, wajib: bool = True, bagian: str = "umum") -> str:
    s = (v or "").strip() if isinstance(v, str) else ""
    if wajib and not s:
        raise KasusTidakValid(f"{nama} belum diisi.", bagian)
    if len(s) > maks:
        raise KasusTidakValid(f"{nama} terlalu panjang (maksimal {maks} karakter).", bagian)
    return s


def periksa_kasus(masukan: dict, id_kasus: str) -> tuple[dict, list[dict]]:
    judul = _teks(masukan.get("judul"), "Judul kasus", 80)
    konsep = masukan.get("konsep")
    if konsep not in KONSEP:
        raise KasusTidakValid("Pilih konsep SQL untuk kasus ini.")
    briefing = [b.strip() for b in (masukan.get("briefing") or []) if isinstance(b, str) and b.strip()]
    if not briefing:
        raise KasusTidakValid("Cerita briefing belum diisi.", "briefing")
    if len(briefing) > 4 or any(len(b) > 300 for b in briefing):
        raise KasusTidakValid("Briefing maksimal 4 paragraf, masing-masing 300 karakter.", "briefing")
    tkp = _teks(masukan.get("tkp"), "Tempat kejadian", 80, wajib=False)
    penjelasan = _teks(masukan.get("penjelasan"), "Penjelasan pelaku", 500, bagian="tersangka")

    if masukan.get("sumber_data") == "arsip":
        skrip = konten()["arsip"]["sql"]
    else:
        skrip = masukan.get("sql") or ""
    con = buat_db(skrip)

    langkah_masuk = masukan.get("langkah") or []
    if not 1 <= len(langkah_masuk) <= 5:
        raise KasusTidakValid("Kasus butuh 1 sampai 5 langkah investigasi.", "langkah")
    langkah, pratinjau = [], []
    for i, s in enumerate(langkah_masuk, 1):
        instruksi = _teks(s.get("instruksi"), f"Instruksi langkah {i}", 300, bagian=f"langkah{i}")
        sql, kolom, baris = jalankan_kunci(con, s.get("query_kunci") or "", i)
        petunjuk = [str(p).strip() for p in (s.get("petunjuk") or [])][:3]
        otomatis = petunjuk_otomatis(sql)
        petunjuk = [petunjuk[j] if j < len(petunjuk) and petunjuk[j] else otomatis[j] for j in range(3)]
        komentar = _teks(s.get("komentar_benar"), f"Komentar langkah {i}", 300, wajib=False) or "Bukti tersimpan. Lanjutkan penyelidikan."
        langkah.append({"instruksi": instruksi, "query_kunci": sql, "petunjuk": petunjuk, "komentar_benar": komentar,
                        "wajib": wajib_untuk(konsep, sql), "cocok": "minimal", "blok_tambahan": []})
        pratinjau.append({"kolom": kolom, "baris": [list(b) for b in baris[:10]], "jumlah": len(baris)})

    tersangka_masuk = masukan.get("tersangka") or []
    if not 2 <= len(tersangka_masuk) <= 4:
        raise KasusTidakValid("Kasus butuh 2 sampai 4 tersangka.", "tersangka")
    tersangka = []
    for t in tersangka_masuk:
        nama = _teks(t.get("nama"), "Nama tersangka", 40, bagian="tersangka")
        avatar = t.get("avatar") if t.get("avatar") in AVATAR else "raka"
        pelaku = bool(t.get("pelaku"))
        alasan = _teks(t.get("alasan"), "Alasan", 300, wajib=False, bagian="tersangka")
        if not pelaku and not alasan:
            alasan = f"Bukti yang ada tidak mengarah ke {nama}."
        tersangka.append({"nama": nama, "peran": _teks(t.get("peran"), "Peran", 60, wajib=False, bagian="tersangka"),
                          "avatar": avatar, "pelaku": pelaku, "alasan": alasan})
    if sum(t["pelaku"] for t in tersangka) != 1:
        raise KasusTidakValid("Tandai tepat satu tersangka sebagai pelaku.", "tersangka")

    kartu = konten()["kartu"][konsep]
    data = {
        "id": id_kasus, "jenis": "guru", "berkas": None, "urutan": 0, "judul": judul, "tkp": tkp or "Sekolah",
        "konsep": konsep, "briefing": briefing, "sql": skrip, "tabel": meta_tabel(con), "kartu": kartu,
        "langkah": langkah, "tersangka": tersangka, "penjelasan": penjelasan,
        "penutup": "Kasus dari gurumu selesai. Kerja bagus, Detektif.", "xp": 40, "koin": 15, "durasi": "3-5 menit",
        "sumber_data": "arsip" if masukan.get("sumber_data") == "arsip" else "sendiri",
    }
    if data["sumber_data"] == "arsip":
        data["tabel"] = konten()["arsip"]["tabel"]
    con.close()
    return data, pratinjau
