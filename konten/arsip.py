"""Basis data Arsip Sekolah, Kasus Harian, latihan Ruang Arsip, tes penempatan, dan Buku Catatan."""
import random

from alat import langkah, tabel

_siswa = [
    ("S01", "Aditya Pratama", "X RPL", "Bandung", "Futsal"),
    ("S02", "Bella Safitri", "X RPL", "Cimahi", "Paduan Suara"),
    ("S03", "Candra Wijaya", "X RPL", "Bandung", "Robotik"),
    ("S04", "Dinda Maharani", "X TKJ", "Sumedang", "Jurnalistik"),
    ("S05", "Eko Saputra", "X TKJ", "Cimahi", "Futsal"),
    ("S06", "Farah Nabila", "X TKJ", "Bandung", "Desain Grafis"),
    ("S07", "Gilang Ramadhan", "XI RPL", "Bandung", "Robotik"),
    ("S08", "Hani Lestari", "XI RPL", "Garut", "Paduan Suara"),
    ("S09", "Irfan Hakim", "XI RPL", "Cimahi", "Robotik"),
    ("S10", "Jihan Aulia", "XI RPL", "Bandung", "Desain Grafis"),
    ("S11", "Kevin Anggara", "XI TKJ", "Sumedang", "Futsal"),
    ("S12", "Laras Wulandari", "XI TKJ", "Bandung", "Jurnalistik"),
    ("S13", "Mega Putri", "XI TKJ", "Cimahi", "Desain Grafis"),
    ("S14", "Naufal Rizki", "XII RPL", "Garut", "Robotik"),
    ("S15", "Oktavia Sari", "XII RPL", "Bandung", "Jurnalistik"),
    ("S16", "Putra Mahendra", "XII RPL", "Cimahi", "Futsal"),
    ("S17", "Qori Amelia", "XII RPL", "Bandung", "Paduan Suara"),
    ("S18", "Reza Firmansyah", "XII TKJ", "Sumedang", "Robotik"),
    ("S19", "Salma Azzahra", "XII TKJ", "Bandung", "Desain Grafis"),
    ("S20", "Taufik Hidayat", "XII TKJ", "Garut", "Futsal"),
    ("S21", "Ulfa Rahmawati", "X RPL", "Bandung", "Pramuka"),
    ("S22", "Vino Kurniawan", "XI RPL", "Cimahi", "Pramuka"),
    ("S23", "Wulan Anggraini", "XII TKJ", "Cimahi", "Pramuka"),
    ("S24", "Yoga Prasetyo", "X TKJ", "Bandung", "Robotik"),
]

_ekskul = [
    ("Futsal", "Pak Rahmat", "Selasa", "Lapangan"),
    ("Robotik", "Pak Hendra", "Rabu", "Lab RPL"),
    ("Paduan Suara", "Bu Melati", "Kamis", "Aula"),
    ("Jurnalistik", "Bu Wulan", "Jumat", "Perpustakaan"),
    ("Desain Grafis", "Pak Yusuf", "Rabu", "Lab Multimedia"),
    ("Pramuka", "Pak Asep", "Sabtu", "Lapangan"),
]

_terlambat = [
    ("S16", "2026-10-05", 10), ("S05", "2026-10-05", 15), ("S08", "2026-10-05", 5), ("S16", "2026-10-06", 20),
    ("S11", "2026-10-06", 10), ("S01", "2026-10-07", 5), ("S16", "2026-10-07", 15), ("S05", "2026-10-08", 25),
    ("S20", "2026-10-08", 10), ("S16", "2026-10-09", 5), ("S11", "2026-10-09", 30), ("S03", "2026-10-12", 10),
    ("S16", "2026-10-12", 10), ("S05", "2026-10-13", 5), ("S20", "2026-10-13", 45), ("S14", "2026-10-14", 20),
    ("S11", "2026-10-15", 10), ("S22", "2026-10-16", 15), ("S09", "2026-10-16", 5),
]

_kantin = [
    ("2026-10-12", "Aditya Pratama", "Nasi Goreng", 12000), ("2026-10-12", "Bella Safitri", "Es Teh", 3000),
    ("2026-10-12", "Gilang Ramadhan", "Nasi Goreng", 12000), ("2026-10-12", "Hani Lestari", "Bakso", 10000),
    ("2026-10-12", "Kevin Anggara", "Paket Ayam Geprek", 18000), ("2026-10-13", "Aditya Pratama", "Es Teh", 3000),
    ("2026-10-13", "Irfan Hakim", "Nasi Goreng", 12000), ("2026-10-13", "Jihan Aulia", "Mie Ayam", 11000),
    ("2026-10-13", "Putra Mahendra", "Bakso", 10000), ("2026-10-13", "Salma Azzahra", "Nasi Goreng", 12000),
    ("2026-10-14", "Gilang Ramadhan", "Mie Ayam", 11000), ("2026-10-14", "Kevin Anggara", "Nasi Goreng", 12000),
    ("2026-10-14", "Laras Wulandari", "Es Teh", 3000), ("2026-10-14", "Naufal Rizki", "Paket Ayam Geprek", 18000),
    ("2026-10-15", "Aditya Pratama", "Bakso", 10000), ("2026-10-15", "Oktavia Sari", "Nasi Goreng", 12000),
    ("2026-10-15", "Reza Firmansyah", "Mie Ayam", 11000), ("2026-10-15", "Kevin Anggara", "Paket Ayam Geprek", 18000),
    ("2026-10-16", "Mega Putri", "Es Teh", 3000), ("2026-10-16", "Hani Lestari", "Nasi Goreng", 12000),
]

_pinjam = [
    ("S03", "Dasar Pemrograman Python", "2026-10-01", "2026-10-08"),
    ("S07", "Basis Data untuk Pemula", "2026-10-02", "2026-10-09"),
    ("S10", "Desain Grafis Praktis", "2026-10-02", None),
    ("S15", "Menulis Berita", "2026-10-05", "2026-10-12"),
    ("S09", "Robotika untuk Pemula", "2026-10-05", None),
    ("S12", "Menulis Berita", "2026-10-13", None),
    ("S14", "Basis Data Lanjut", "2026-10-06", "2026-10-13"),
    ("S07", "Algoritma dan Struktur Data", "2026-10-12", None),
    ("S19", "Desain Grafis Praktis", "2026-10-13", "2026-10-16"),
    ("S01", "Kumpulan Taktik Futsal", "2026-10-14", None),
    ("S18", "Robotika untuk Pemula", "2026-10-14", "2026-10-15"),
    ("S03", "Pemrograman Web Dasar", "2026-10-15", None),
]

_rng = random.Random(2026)
_nilai = []
for nis, *_ in _siswa:
    for mapel in ("Basis Data", "Pemrograman Web"):
        _nilai.append([nis, mapel, _rng.randint(62, 90)])
# beberapa nilai ditetapkan supaya soal harian punya satu jawaban yang jelas
_tetap = {("S14", "Basis Data"): 96, ("S07", "Basis Data"): 93, ("S19", "Basis Data"): 91,
          ("S10", "Pemrograman Web"): 95, ("S03", "Pemrograman Web"): 92}
for n in _nilai:
    if (n[0], n[1]) in _tetap:
        n[2] = _tetap[(n[0], n[1])]

TABEL_ARSIP = [
    tabel("siswa", "Data siswa", [
        ("nis", "TEXT", "Nomor induk siswa"), ("nama", "TEXT", "Nama lengkap"), ("kelas", "TEXT", "Kelas"),
        ("kota", "TEXT", "Kota asal"), ("ekskul", "TEXT", "Ekskul yang diikuti"),
    ], _siswa),
    tabel("ekskul", "Daftar ekstrakurikuler", [
        ("nama", "TEXT", "Nama ekskul"), ("pembina", "TEXT", "Guru pembina"), ("hari", "TEXT", "Hari latihan"),
        ("ruang", "TEXT", "Tempat latihan"),
    ], _ekskul),
    tabel("keterlambatan", "Catatan siswa terlambat bulan Oktober", [
        ("id", "INTEGER", "Nomor catatan"), ("nis", "TEXT", "NIS siswa"), ("tanggal", "TEXT", "Tanggal"),
        ("menit", "INTEGER", "Lama terlambat (menit)"),
    ], [(i, *r) for i, r in enumerate(_terlambat, 1)], relasi=[("nis", "siswa", "nis")]),
    tabel("kantin", "Pembelian di kantin Bu Sri", [
        ("id", "INTEGER", "Nomor transaksi"), ("tanggal", "TEXT", "Tanggal"), ("pembeli", "TEXT", "Nama pembeli"),
        ("menu", "TEXT", "Menu yang dibeli"), ("harga", "INTEGER", "Harga (rupiah)"),
    ], [(i, *r) for i, r in enumerate(_kantin, 1)]),
    tabel("pinjam_buku", "Peminjaman buku perpustakaan", [
        ("id", "INTEGER", "Nomor catatan"), ("nis", "TEXT", "NIS peminjam"), ("judul", "TEXT", "Judul buku"),
        ("tanggal_pinjam", "TEXT", "Tanggal pinjam"), ("tanggal_kembali", "TEXT", "Tanggal kembali, kosong jika belum"),
    ], [(i, *r) for i, r in enumerate(_pinjam, 1)], relasi=[("nis", "siswa", "nis")]),
    tabel("nilai", "Nilai ujian tengah semester", [
        ("id", "INTEGER", "Nomor catatan"), ("nis", "TEXT", "NIS siswa"), ("mapel", "TEXT", "Mata pelajaran"),
        ("skor", "INTEGER", "Skor ujian"),
    ], [(i, *r) for i, r in enumerate(_nilai, 1)], relasi=[("nis", "siswa", "nis")]),
]


def _harian(id, konsep, judul, cerita, step, opsi, jawaban, penjelasan):
    return {"id": id, "jenis": "harian", "konsep": konsep, "judul": judul, "briefing": cerita,
            "langkah": [step], "opsi": opsi, "jawaban": jawaban, "penjelasan": penjelasan, "xp": 30, "koin": 10}


KASUS_HARIAN = [
    _harian("h01", "SELECT", "Jadwal Ekskul Tertukar",
            ["Pengumuman jadwal ekskul di mading tertukar. Ada siswa baru yang hanya bisa latihan hari Sabtu.",
             "Lihat tabel ekskul, lalu tentukan ekskul yang latihan hari Sabtu."],
            langkah("Tampilkan kolom nama dan hari dari tabel ekskul.", "SELECT nama, hari FROM ekskul",
                    ["Tabelnya ekskul.", "Kolomnya nama dan hari.", "SELECT nama, ____ FROM ekskul"],
                    "Sekarang baca kolom hari dengan teliti.", wajib=["SELECT", "FROM"], cocok="tepat"),
            ["Pramuka", "Futsal", "Robotik"], "Pramuka", "Pramuka satu-satunya ekskul yang latihan hari Sabtu."),
    _harian("h02", "WHERE", "Anggota Robotik dari Cimahi",
            ["Pak Hendra butuh anggota Robotik yang tinggal di Cimahi untuk menjemput komponen dari toko.",
             "Ada dua syarat: kota dan ekskul."],
            langkah("Tampilkan nama siswa yang kotanya Cimahi dan ekskulnya Robotik.",
                    "SELECT nama FROM siswa WHERE kota = 'Cimahi' AND ekskul = 'Robotik'",
                    ["Tabelnya siswa.", "Gabungkan dua syarat dengan AND.", "SELECT nama FROM siswa WHERE kota = 'Cimahi' AND ____ = 'Robotik'"],
                    "Hanya satu nama yang memenuhi dua syarat sekaligus.", wajib=["WHERE", "AND"]),
            ["Irfan Hakim", "Vino Kurniawan", "Gilang Ramadhan"], "Irfan Hakim",
            "Irfan Hakim tinggal di Cimahi dan ikut Robotik. Vino dari Cimahi tetapi ikut Pramuka, Gilang ikut Robotik tetapi tinggal di Bandung."),
    _harian("h03", "LIKE", "Kartu Pelajar yang Luntur",
            ["Kartu pelajar ditemukan di kantin. Tulisannya luntur, yang terbaca hanya awalan nama Sa dan kelas XII.",
             "Cari pemiliknya dengan pola."],
            langkah("Tampilkan nama dan kelas siswa yang namanya diawali Sa dan kelasnya diawali XII.",
                    "SELECT nama, kelas FROM siswa WHERE nama LIKE 'Sa%' AND kelas LIKE 'XII%'",
                    ["Diawali berarti tanda % ditaruh di belakang.", "Ada dua pola, gabungkan dengan AND.",
                     "SELECT nama, kelas FROM siswa WHERE nama LIKE 'Sa%' AND kelas LIKE '____'"],
                    "Polanya hanya cocok dengan satu siswa.", wajib=["LIKE"]),
            ["Salma Azzahra", "Oktavia Sari", "Farah Nabila"], "Salma Azzahra",
            "Hanya Salma Azzahra yang namanya diawali Sa dan duduk di kelas XII. Nama Oktavia Sari memang mengandung Sa, tetapi tidak di awal."),
    _harian("h04", "AGREGASI", "Menu Paling Laris",
            ["Bu Sri ingin menambah stok menu yang paling sering dibeli minggu ini.",
             "Hitung berapa kali setiap menu dibeli."],
            langkah("Hitung jumlah pembelian untuk setiap menu di tabel kantin.",
                    "SELECT menu, COUNT(*) FROM kantin GROUP BY menu",
                    ["Tabelnya kantin.", "Kelompokkan berdasarkan menu, lalu hitung dengan COUNT(*).",
                     "SELECT menu, COUNT(*) FROM kantin GROUP BY ____"],
                    "Bandingkan angkanya. Menu mana yang paling banyak?", wajib=["COUNT", "GROUP BY"]),
            ["Nasi Goreng", "Es Teh", "Bakso"], "Nasi Goreng", "Nasi Goreng dibeli 7 kali, paling banyak dibanding menu lain."),
    _harian("h05", "JOIN", "Rekor Terlambat",
            ["Wali kelas ingin tahu siapa yang paling sering terlambat bulan ini.",
             "Tabel keterlambatan hanya menyimpan NIS, jadi gabungkan dengan tabel siswa."],
            langkah("Tampilkan nama siswa dan berapa kali ia terlambat.",
                    "SELECT siswa.nama, COUNT(*) FROM keterlambatan JOIN siswa ON keterlambatan.nis = siswa.nis GROUP BY siswa.nama",
                    ["Hubungkan keterlambatan.nis dengan siswa.nis.", "Setelah JOIN, kelompokkan berdasarkan nama.",
                     "SELECT siswa.nama, COUNT(*) FROM keterlambatan JOIN siswa ON keterlambatan.nis = siswa.nis GROUP BY ____"],
                    "Cari jumlah yang paling besar.", wajib=["JOIN", "GROUP BY"]),
            ["Putra Mahendra", "Eko Saputra", "Kevin Anggara"], "Putra Mahendra",
            "Putra Mahendra terlambat 5 kali. Eko dan Kevin masing-masing 3 kali."),
    _harian("h06", "WHERE", "Bakso Hari Selasa",
            ["Ada mangkuk bakso yang tertinggal di meja kantin pada 13 Oktober.",
             "Bu Sri ingin mengembalikannya kepada pembelinya."],
            langkah("Tampilkan pembeli dan menu di kantin pada tanggal 2026-10-13 dengan menu Bakso.",
                    "SELECT pembeli, menu FROM kantin WHERE tanggal = '2026-10-13' AND menu = 'Bakso'",
                    ["Tabelnya kantin.", "Ada dua syarat: tanggal dan menu.",
                     "SELECT pembeli, menu FROM kantin WHERE tanggal = '2026-10-13' AND menu = '____'"],
                    "Hanya satu orang yang membeli bakso hari itu.", wajib=["WHERE", "AND"]),
            ["Putra Mahendra", "Hani Lestari", "Aditya Pratama"], "Putra Mahendra",
            "Putra Mahendra membeli bakso pada 13 Oktober. Hani membelinya tanggal 12, Aditya tanggal 15."),
    _harian("h07", "LIKE", "Buku Basis Data",
            ["Ada catatan di buku Basis Data yang dikembalikan pada 13 Oktober. Bu Ratna ingin tahu NIS peminjamnya.",
             "Judul bukunya mengandung kata Basis Data."],
            langkah("Tampilkan nis, judul, dan tanggal_kembali dari pinjam_buku yang judulnya mengandung Basis Data.",
                    "SELECT nis, judul, tanggal_kembali FROM pinjam_buku WHERE judul LIKE '%Basis Data%'",
                    ["Tabelnya pinjam_buku.", "Pakai % di depan dan di belakang kata yang dicari.",
                     "SELECT nis, judul, tanggal_kembali FROM pinjam_buku WHERE judul LIKE '%____%'"],
                    "Lihat kolom tanggal_kembali.", wajib=["LIKE"]),
            ["S14", "S07", "S12"], "S14", "S14 mengembalikan Basis Data Lanjut pada 13 Oktober. S07 mengembalikan bukunya tanggal 9."),
    _harian("h08", "AGREGASI", "Pembeli Paling Rajin",
            ["Bu Sri memberi hadiah kecil untuk pembeli dengan belanja terbanyak minggu ini.",
             "Jumlahkan belanja setiap pembeli."],
            langkah("Hitung total harga yang dibayar setiap pembeli di tabel kantin.",
                    "SELECT pembeli, SUM(harga) FROM kantin GROUP BY pembeli",
                    ["Tabelnya kantin.", "SUM(harga) menjumlahkan harga di setiap kelompok pembeli.",
                     "SELECT pembeli, SUM(harga) FROM kantin GROUP BY ____"],
                    "Cari total yang paling besar.", wajib=["SUM", "GROUP BY"]),
            ["Kevin Anggara", "Aditya Pratama", "Gilang Ramadhan"], "Kevin Anggara",
            "Kevin Anggara berbelanja Rp48.000, paling banyak minggu ini."),
    _harian("h09", "JOIN", "Juara Basis Data",
            ["Sekolah akan mengirim satu siswa dengan nilai Basis Data tertinggi ke lomba.",
             "Tabel nilai hanya menyimpan NIS. Gabungkan dengan tabel siswa supaya namanya terlihat."],
            langkah("Tampilkan nama siswa dan skor untuk mapel Basis Data.",
                    "SELECT siswa.nama, nilai.skor FROM nilai JOIN siswa ON nilai.nis = siswa.nis WHERE nilai.mapel = 'Basis Data'",
                    ["Hubungkan nilai.nis dengan siswa.nis.", "Saring mapel Basis Data dengan WHERE.",
                     "SELECT siswa.nama, nilai.skor FROM nilai JOIN siswa ON nilai.nis = siswa.nis WHERE nilai.mapel = '____'"],
                    "Cari skor yang paling tinggi. ORDER BY skor DESC bisa membantu.", wajib=["JOIN", "ON"]),
            ["Naufal Rizki", "Gilang Ramadhan", "Salma Azzahra"], "Naufal Rizki",
            "Naufal Rizki mendapat skor 96, lebih tinggi dari Gilang (93) dan Salma (91)."),
    _harian("h10", "WHERE", "Pembina Ekskul di Perpustakaan",
            ["Siswa baru ingin bergabung dengan ekskul yang latihan di Perpustakaan.",
             "Ia perlu tahu siapa pembinanya."],
            langkah("Tampilkan nama ekskul dan pembina yang ruang latihannya Perpustakaan.",
                    "SELECT nama, pembina FROM ekskul WHERE ruang = 'Perpustakaan'",
                    ["Tabelnya ekskul.", "Saring kolom ruang.", "SELECT nama, pembina FROM ekskul WHERE ruang = '____'"],
                    "Sekarang kamu tahu pembinanya.", wajib=["WHERE"]),
            ["Bu Wulan", "Bu Melati", "Pak Yusuf"], "Bu Wulan", "Jurnalistik latihan di Perpustakaan dan dibina Bu Wulan."),
]


def _latihan(id, konsep, judul, instruksi, query, petunjuk, wajib=None, cocok="minimal"):
    s = langkah(instruksi, query, petunjuk, "", wajib=wajib, cocok=cocok)
    s.update({"id": id, "konsep": konsep, "judul": judul})
    return s


LATIHAN = [
    _latihan("ls1", "SELECT", "Semua data ekskul", "Tampilkan seluruh isi tabel ekskul.", "SELECT * FROM ekskul",
             ["Tabelnya ekskul.", "Pakai * untuk semua kolom.", "SELECT * FROM ____"], ["SELECT", "FROM"], "tepat"),
    _latihan("ls2", "SELECT", "Nama dan kelas", "Tampilkan kolom nama dan kelas dari tabel siswa.", "SELECT nama, kelas FROM siswa",
             ["Tabelnya siswa.", "Pisahkan nama kolom dengan koma.", "SELECT nama, ____ FROM siswa"], ["SELECT", "FROM"], "tepat"),
    _latihan("ls3", "SELECT", "Judul buku dipinjam", "Tampilkan judul dan tanggal_pinjam dari tabel pinjam_buku.",
             "SELECT judul, tanggal_pinjam FROM pinjam_buku",
             ["Tabelnya pinjam_buku.", "Kolomnya judul dan tanggal_pinjam.", "SELECT judul, ____ FROM pinjam_buku"], ["SELECT"], "tepat"),
    _latihan("ls4", "SELECT", "Menu kantin", "Tampilkan menu dan harga dari tabel kantin.", "SELECT menu, harga FROM kantin",
             ["Tabelnya kantin.", "Kolomnya menu dan harga.", "SELECT ____, harga FROM kantin"], ["SELECT"], "tepat"),
    _latihan("ls5", "SELECT", "Kota tanpa berulang", "Tampilkan daftar kota asal siswa tanpa ada kota yang muncul dua kali.",
             "SELECT DISTINCT kota FROM siswa",
             ["Kolomnya kota di tabel siswa.", "DISTINCT setelah SELECT membuang baris yang sama.", "SELECT DISTINCT ____ FROM siswa"],
             ["DISTINCT"], "tepat"),
    _latihan("lw1", "WHERE", "Siswa XI RPL", "Tampilkan nama siswa kelas XI RPL.", "SELECT nama FROM siswa WHERE kelas = 'XI RPL'",
             ["Tabelnya siswa.", "Teks ditulis di antara tanda kutip.", "SELECT nama FROM siswa WHERE kelas = '____'"], ["WHERE"]),
    _latihan("lw2", "WHERE", "Terlambat lama", "Tampilkan data keterlambatan yang lebih dari 15 menit.",
             "SELECT * FROM keterlambatan WHERE menit > 15",
             ["Tabelnya keterlambatan.", "Angka tidak perlu tanda kutip.", "SELECT * FROM keterlambatan WHERE menit > ____"], ["WHERE"]),
    _latihan("lw3", "WHERE", "Belanja minimal 11 ribu", "Tampilkan pembelian di kantin yang harganya minimal 11000.",
             "SELECT * FROM kantin WHERE harga >= 11000",
             ["Minimal berarti lebih dari atau sama dengan.", "Operatornya >=.", "SELECT * FROM kantin WHERE harga >= ____"], ["WHERE"]),
    _latihan("lw4", "WHERE", "Futsal atau Robotik", "Tampilkan nama dan ekskul siswa yang ikut Futsal atau Robotik.",
             "SELECT nama, ekskul FROM siswa WHERE ekskul = 'Futsal' OR ekskul = 'Robotik'",
             ["Salah satu syarat terpenuhi sudah cukup.", "Gabungkan dengan OR.",
              "SELECT nama, ekskul FROM siswa WHERE ekskul = 'Futsal' OR ekskul = '____'"], ["WHERE", "OR"]),
    _latihan("lw5", "WHERE", "Urutkan skor", "Tampilkan nis dan skor mapel Basis Data, urutkan dari skor tertinggi.",
             "SELECT nis, skor FROM nilai WHERE mapel = 'Basis Data' ORDER BY skor DESC",
             ["Saring mapel dengan WHERE.", "ORDER BY skor DESC mengurutkan dari yang terbesar.",
              "SELECT nis, skor FROM nilai WHERE mapel = 'Basis Data' ORDER BY ____ DESC"], ["WHERE", "ORDER BY"]),
    _latihan("ll1", "LIKE", "Diawali huruf A", "Tampilkan nama siswa yang namanya diawali huruf A.",
             "SELECT nama FROM siswa WHERE nama LIKE 'A%'",
             ["Pakai LIKE pada kolom nama.", "Diawali berarti % di belakang.", "SELECT nama FROM siswa WHERE nama LIKE '____'"], ["LIKE"]),
    _latihan("ll2", "LIKE", "Berakhiran a", "Tampilkan nama siswa yang namanya berakhiran huruf a.",
             "SELECT nama FROM siswa WHERE nama LIKE '%a'",
             ["Berakhiran berarti % di depan.", "Pola untuk huruf terakhir a adalah '%a'.", "SELECT nama FROM siswa WHERE nama LIKE '____'"],
             ["LIKE"]),
    _latihan("ll3", "LIKE", "Buku pemrograman", "Tampilkan judul buku di pinjam_buku yang mengandung kata Pemrograman.",
             "SELECT judul FROM pinjam_buku WHERE judul LIKE '%Pemrograman%'",
             ["Tabelnya pinjam_buku.", "Mengandung berarti % di depan dan di belakang.",
              "SELECT judul FROM pinjam_buku WHERE judul LIKE '%____%'"], ["LIKE"]),
    _latihan("ll4", "LIKE", "Kelas XII", "Tampilkan nama dan kelas siswa yang kelasnya diawali XII.",
             "SELECT nama, kelas FROM siswa WHERE kelas LIKE 'XII%'",
             ["Kelas XII RPL dan XII TKJ sama-sama diawali XII.", "Pola diawali: 'XII%'.",
              "SELECT nama, kelas FROM siswa WHERE kelas LIKE '____'"], ["LIKE"]),
    _latihan("ll5", "LIKE", "NIS S1 dan satu angka", "Tampilkan nis dan nama siswa yang NIS-nya S1 diikuti tepat satu angka.",
             "SELECT nis, nama FROM siswa WHERE nis LIKE 'S1_'",
             ["Tanda _ mewakili tepat satu karakter.", "Polanya S1 lalu satu tanda _.", "SELECT nis, nama FROM siswa WHERE nis LIKE '____'"],
             ["LIKE"]),
    _latihan("la1", "AGREGASI", "Jumlah siswa", "Hitung jumlah seluruh siswa.", "SELECT COUNT(*) FROM siswa",
             ["COUNT(*) menghitung baris.", "Tidak perlu GROUP BY karena yang dihitung semua siswa.", "SELECT COUNT(*) FROM ____"], ["COUNT"]),
    _latihan("la2", "AGREGASI", "Siswa per kelas", "Hitung jumlah siswa di setiap kelas.", "SELECT kelas, COUNT(*) FROM siswa GROUP BY kelas",
             ["Kelompokkan berdasarkan kelas.", "Tampilkan kelas dan COUNT(*).", "SELECT kelas, COUNT(*) FROM siswa GROUP BY ____"],
             ["COUNT", "GROUP BY"]),
    _latihan("la3", "AGREGASI", "Pendapatan kantin", "Hitung total pendapatan kantin dari kolom harga.", "SELECT SUM(harga) FROM kantin",
             ["SUM menjumlahkan nilai sebuah kolom.", "Kolomnya harga.", "SELECT SUM(____) FROM kantin"], ["SUM"]),
    _latihan("la4", "AGREGASI", "Rata-rata skor", "Hitung rata-rata skor setiap mapel.", "SELECT mapel, AVG(skor) FROM nilai GROUP BY mapel",
             ["AVG mencari rata-rata.", "Kelompokkan berdasarkan mapel.", "SELECT mapel, AVG(skor) FROM nilai GROUP BY ____"],
             ["AVG", "GROUP BY"]),
    _latihan("la5", "AGREGASI", "Ekskul ramai", "Tampilkan ekskul yang anggotanya lebih dari 4 orang beserta jumlahnya.",
             "SELECT ekskul, COUNT(*) FROM siswa GROUP BY ekskul HAVING COUNT(*) > 4",
             ["Kelompokkan siswa berdasarkan ekskul.", "Syarat untuk hasil COUNT ditulis dengan HAVING.",
              "SELECT ekskul, COUNT(*) FROM siswa GROUP BY ekskul HAVING COUNT(*) > ____"], ["GROUP BY", "HAVING"]),
    _latihan("lj1", "JOIN", "Nama yang terlambat", "Tampilkan nama siswa dan menit keterlambatannya.",
             "SELECT siswa.nama, keterlambatan.menit FROM keterlambatan JOIN siswa ON keterlambatan.nis = siswa.nis",
             ["Hubungkan kolom nis di kedua tabel.", "Tulis syaratnya setelah ON.",
              "SELECT siswa.nama, keterlambatan.menit FROM keterlambatan JOIN siswa ON keterlambatan.nis = ____"], ["JOIN", "ON"]),
    _latihan("lj2", "JOIN", "Siapa meminjam apa", "Tampilkan nama siswa dan judul buku yang ia pinjam.",
             "SELECT siswa.nama, pinjam_buku.judul FROM pinjam_buku JOIN siswa ON pinjam_buku.nis = siswa.nis",
             ["Tabelnya pinjam_buku dan siswa.", "Keduanya punya kolom nis.",
              "SELECT siswa.nama, pinjam_buku.judul FROM pinjam_buku JOIN siswa ON pinjam_buku.nis = ____"], ["JOIN", "ON"]),
    _latihan("lj3", "JOIN", "Pembina ekskul", "Tampilkan nama siswa dan nama pembina ekskulnya.",
             "SELECT siswa.nama, ekskul.pembina FROM siswa JOIN ekskul ON siswa.ekskul = ekskul.nama",
             ["Kolom ekskul di tabel siswa berisi nama ekskul.", "Hubungkan siswa.ekskul dengan ekskul.nama.",
              "SELECT siswa.nama, ekskul.pembina FROM siswa JOIN ekskul ON siswa.ekskul = ____"], ["JOIN", "ON"]),
    _latihan("lj4", "JOIN", "Jago pemrograman web", "Tampilkan nama siswa yang skor Pemrograman Web-nya di atas 85, beserta skornya.",
             "SELECT siswa.nama, nilai.skor FROM nilai JOIN siswa ON nilai.nis = siswa.nis WHERE nilai.mapel = 'Pemrograman Web' AND nilai.skor > 85",
             ["Gabungkan nilai dan siswa lewat nis.", "Tambahkan dua syarat di WHERE: mapel dan skor.",
              "... JOIN siswa ON nilai.nis = siswa.nis WHERE nilai.mapel = 'Pemrograman Web' AND nilai.skor > ____"], ["JOIN", "WHERE"]),
    _latihan("lj5", "JOIN", "Hitung keterlambatan", "Tampilkan nama siswa dan berapa kali ia terlambat.",
             "SELECT siswa.nama, COUNT(*) FROM keterlambatan JOIN siswa ON keterlambatan.nis = siswa.nis GROUP BY siswa.nama",
             ["JOIN dulu, baru GROUP BY.", "Kelompokkan berdasarkan siswa.nama.",
              "SELECT siswa.nama, COUNT(*) FROM keterlambatan JOIN siswa ON keterlambatan.nis = siswa.nis GROUP BY ____"],
             ["JOIN", "GROUP BY"]),
]

PENEMPATAN = [
    {"konsep": "SELECT", "pertanyaan": "Query mana yang menampilkan kolom nama dari tabel siswa?",
     "opsi": ["SELECT siswa FROM nama;", "SELECT nama FROM siswa;", "SHOW nama IN siswa;", "GET nama FROM siswa;"], "jawaban": 1,
     "penjelasan": "Kolom ditulis setelah SELECT, tabel ditulis setelah FROM."},
    {"konsep": "WHERE", "pertanyaan": "Apa hasil query ini?", "kode": "SELECT nama FROM siswa\nWHERE kelas = 'XI RPL';",
     "tabel": {"kolom": ["nama", "kelas"], "baris": [["Raka", "XI RPL"], ["Sinta", "X RPL"], ["Nadia", "XI RPL"]]},
     "opsi": ["Raka dan Nadia", "Sinta saja", "Raka, Sinta, dan Nadia", "Tidak ada baris"], "jawaban": 0,
     "penjelasan": "WHERE hanya meloloskan baris yang kelasnya XI RPL, yaitu Raka dan Nadia."},
    {"konsep": "LIKE", "pertanyaan": "Pola mana yang cocok untuk nama yang diawali huruf B?",
     "opsi": ["LIKE '%B'", "LIKE 'B'", "LIKE 'B%'", "LIKE '_B'"], "jawaban": 2,
     "penjelasan": "Tanda % di belakang berarti setelah huruf B boleh ada huruf apa saja."},
    {"konsep": "AGREGASI", "pertanyaan": "Tabel siswa berisi 5 baris dari 2 kelas berbeda. Berapa baris hasil query ini?",
     "kode": "SELECT kelas, COUNT(*)\nFROM siswa\nGROUP BY kelas;",
     "opsi": ["1 baris", "2 baris", "5 baris", "10 baris"], "jawaban": 1,
     "penjelasan": "GROUP BY membuat satu baris untuk setiap kelompok. Ada 2 kelas, jadi hasilnya 2 baris."},
    {"konsep": "JOIN", "pertanyaan": "Tabel nilai dan siswa sama-sama punya kolom nis. Bagian ON yang tepat adalah",
     "kode": "SELECT siswa.nama, nilai.skor\nFROM nilai JOIN siswa\nON ...",
     "opsi": ["ON nilai.skor = siswa.nama", "ON nilai = siswa", "ON nilai.nis = siswa.nis", "ON nis"], "jawaban": 2,
     "penjelasan": "JOIN menghubungkan baris yang nilai kolom kuncinya sama, yaitu nilai.nis dan siswa.nis."},
]

CATATAN = {
    "SELECT": {
        "judul": "SELECT dan FROM",
        "paragraf": [
            "SELECT dipakai untuk mengambil data dari tabel. Setelah SELECT, tulis kolom yang ingin ditampilkan. Setelah FROM, tulis nama tabelnya.",
            "Tanda * berarti semua kolom. Kalau hanya butuh beberapa kolom, tulis namanya dipisah koma supaya hasilnya lebih mudah dibaca.",
            "DISTINCT setelah SELECT membuang baris yang sama persis, misalnya untuk melihat daftar kota tanpa berulang.",
        ],
        "contoh": [
            {"query": "SELECT * FROM peminjaman_kunci;", "arti": "Menampilkan semua kolom dan semua baris."},
            {"query": "SELECT nama, ruang FROM peminjaman_kunci;", "arti": "Menampilkan kolom nama dan ruang saja."},
            {"query": "SELECT DISTINCT kota FROM siswa;", "arti": "Menampilkan setiap kota satu kali."},
        ],
        "kesalahan": [
            "Menulis nama tabel setelah SELECT dan nama kolom setelah FROM. Urutannya kolom dulu, baru tabel.",
            "Lupa koma di antara nama kolom.",
            "Salah ketik nama kolom. Cek Peta Tabel untuk melihat nama kolom yang benar.",
        ],
    },
    "WHERE": {
        "judul": "WHERE",
        "paragraf": [
            "WHERE menyaring baris. Hanya baris yang memenuhi syarat yang ditampilkan.",
            "Operator yang bisa dipakai: = sama dengan, <> tidak sama dengan, > lebih dari, < kurang dari, >= minimal, <= maksimal.",
            "Teks dan tanggal ditulis di antara tanda kutip tunggal, misalnya '15:00'. Angka ditulis tanpa tanda kutip.",
            "AND berarti semua syarat harus terpenuhi. OR berarti cukup salah satu syarat terpenuhi. ORDER BY mengurutkan hasil, tambahkan DESC untuk urutan dari yang terbesar.",
        ],
        "contoh": [
            {"query": "SELECT nama FROM akses_lab WHERE jam_masuk > '15:00';", "arti": "Orang yang masuk setelah pukul 15.00."},
            {"query": "SELECT * FROM presensi WHERE tanggal = '2026-09-14' AND status = 'Hadir';", "arti": "Dua syarat sekaligus."},
            {"query": "SELECT nis, skor FROM nilai ORDER BY skor DESC;", "arti": "Diurutkan dari skor tertinggi."},
        ],
        "kesalahan": [
            "Lupa tanda kutip pada teks, misalnya WHERE kelas = XI RPL.",
            "Memakai tanda kutip ganda. Di SQL, teks ditulis dengan kutip tunggal.",
            "Memakai AND padahal maksudnya salah satu, atau sebaliknya.",
        ],
    },
    "LIKE": {
        "judul": "LIKE",
        "paragraf": [
            "LIKE mencari teks yang cocok dengan pola, bukan yang sama persis.",
            "Tanda % mewakili huruf apa saja dengan jumlah berapa pun, termasuk tidak ada huruf sama sekali. Tanda _ mewakili tepat satu huruf.",
            "Di SQLite, LIKE tidak membedakan huruf besar dan kecil untuk huruf biasa.",
        ],
        "contoh": [
            {"query": "WHERE nama LIKE 'A%'", "arti": "Diawali A."},
            {"query": "WHERE nomor_hp LIKE '%0042'", "arti": "Berakhiran 0042."},
            {"query": "WHERE judul LIKE '%Basis Data%'", "arti": "Mengandung kata Basis Data."},
            {"query": "WHERE kode LIKE 'TI-0_4'", "arti": "TI-0, satu karakter apa saja, lalu 4."},
        ],
        "kesalahan": [
            "Memakai = dengan tanda %. Tanda % hanya berlaku bersama LIKE.",
            "Salah posisi %. Diawali berarti % di belakang, berakhiran berarti % di depan.",
        ],
    },
    "AGREGASI": {
        "judul": "COUNT, SUM, dan GROUP BY",
        "paragraf": [
            "Fungsi agregasi meringkas banyak baris menjadi satu nilai: COUNT(*) menghitung baris, SUM(kolom) menjumlahkan, AVG(kolom) mencari rata-rata, MAX dan MIN mencari nilai terbesar dan terkecil.",
            "GROUP BY membagi baris menjadi kelompok berdasarkan kolom yang nilainya sama. Fungsi agregasi lalu dihitung untuk setiap kelompok.",
            "WHERE menyaring baris sebelum dikelompokkan. HAVING menyaring hasil kelompok, misalnya HAVING COUNT(*) > 1.",
        ],
        "contoh": [
            {"query": "SELECT kelas, COUNT(*) FROM siswa GROUP BY kelas;", "arti": "Jumlah siswa per kelas."},
            {"query": "SELECT stand, SUM(total) FROM penjualan GROUP BY stand;", "arti": "Total penjualan per stand."},
            {"query": "SELECT pemilih, COUNT(*) FROM suara GROUP BY pemilih HAVING COUNT(*) > 1;", "arti": "Pemilih yang memilih lebih dari sekali."},
        ],
        "kesalahan": [
            "Menulis syarat COUNT di WHERE. Syarat untuk hasil agregasi ditulis di HAVING.",
            "Menampilkan kolom yang tidak ada di GROUP BY dan tidak diagregasi, sehingga nilainya tidak bermakna.",
        ],
    },
    "JOIN": {
        "judul": "JOIN",
        "paragraf": [
            "JOIN menggabungkan baris dari dua tabel yang punya hubungan. Hubungannya ditulis setelah ON, biasanya kunci tamu di satu tabel sama dengan kunci utama di tabel lain.",
            "Tulis nama_tabel.kolom kalau ada nama kolom yang sama di dua tabel, misalnya siswa.nis dan nilai.nis.",
            "JOIN bisa ditulis berkali-kali untuk menggabungkan tiga tabel atau lebih. Setelah itu, WHERE dan GROUP BY tetap bisa dipakai.",
        ],
        "contoh": [
            {"query": "SELECT siswa.nama, nilai.skor FROM nilai JOIN siswa ON nilai.nis = siswa.nis;", "arti": "Skor beserta nama siswa."},
            {"query": "... FROM log_pintu JOIN kartu_akses ON log_pintu.no_kartu = kartu_akses.no_kartu JOIN warga ON kartu_akses.id_warga = warga.id", "arti": "Tiga tabel sekaligus."},
        ],
        "kesalahan": [
            "Lupa bagian ON, sehingga setiap baris dipasangkan dengan semua baris tabel lain.",
            "Menghubungkan kolom yang salah, misalnya id paket dengan id warga.",
            "Menulis nama kolom tanpa nama tabel padahal kolom itu ada di dua tabel, sehingga muncul pesan ambiguous column.",
        ],
    },
}

LENCANA = [
    {"kode": "kasus_pertama", "nama": "Kasus Pertama", "syarat": "Menyelesaikan kasus pertama."},
    {"kode": "raja_join", "nama": "Raja JOIN", "syarat": "Menyelesaikan semua kasus di berkas JOIN."},
    {"kode": "tanpa_petunjuk", "nama": "Tanpa Petunjuk", "syarat": "Menyelesaikan kasus utama dengan tiga bintang tanpa membuka petunjuk."},
    {"kode": "streak_7_hari", "nama": "Streak 7 Hari", "syarat": "Bermain tujuh hari berturut-turut."},
    {"kode": "detektif_kilat", "nama": "Detektif Kilat", "syarat": "Menyelesaikan kasus utama dalam waktu kurang dari 2 menit."},
    {"kode": "kolektor_bukti", "nama": "Kolektor Bukti", "syarat": "Mengumpulkan 20 bukti dari kasus yang diselesaikan."},
]

PANGKAT = [
    {"kode": "magang", "nama": "Detektif Magang", "xp": 0},
    {"kode": "junior", "nama": "Detektif Junior", "xp": 300},
    {"kode": "senior", "nama": "Detektif Senior", "xp": 800},
    {"kode": "kepala", "nama": "Kepala Detektif", "xp": 1500},
]
