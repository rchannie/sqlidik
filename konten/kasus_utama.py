"""Kasus utama SQLidik: lima berkas, dua kasus per berkas."""
from alat import langkah, tabel, tersangka

BERKAS = [
    {
        "nomor": 1, "konsep": "SELECT", "judul": "SELECT dan FROM", "ikon": "select",
        "ringkas": "Menampilkan isi tabel dan memilih kolom.",
    },
    {
        "nomor": 2, "konsep": "WHERE", "judul": "WHERE", "ikon": "where",
        "ringkas": "Menyaring baris dengan syarat.",
    },
    {
        "nomor": 3, "konsep": "LIKE", "judul": "LIKE", "ikon": "like",
        "ringkas": "Mencari teks dengan pola.",
    },
    {
        "nomor": 4, "konsep": "AGREGASI", "judul": "COUNT, SUM, GROUP BY", "ikon": "sum_count",
        "ringkas": "Menghitung dan mengelompokkan data.",
    },
    {
        "nomor": 5, "konsep": "JOIN", "judul": "Kasus Besar: JOIN", "ikon": "kasus_besar",
        "ringkas": "Menggabungkan beberapa tabel.",
    },
]

KARTU = {
    "SELECT": {
        "judul": "SELECT dan FROM",
        "isi": "SELECT memilih kolom yang ingin ditampilkan. FROM menyebut tabel asal datanya. Tanda * berarti semua kolom.",
        "contoh": "SELECT * FROM siswa;\nSELECT nama, kelas FROM siswa;",
    },
    "WHERE": {
        "judul": "WHERE",
        "isi": "WHERE menyaring baris. Hanya baris yang memenuhi syarat yang ditampilkan. Syarat bisa memakai =, >, <, >=, <=, <>, serta AND dan OR.",
        "contoh": "SELECT * FROM akses_lab\nWHERE jam_masuk > '15:00';",
    },
    "LIKE": {
        "judul": "LIKE",
        "isi": "LIKE mencari teks yang cocok dengan pola. Tanda % mewakili huruf apa saja dengan jumlah berapa pun, sedangkan _ mewakili tepat satu huruf.",
        "contoh": "SELECT * FROM siswa\nWHERE nama LIKE 'A%';",
    },
    "AGREGASI": {
        "judul": "COUNT, SUM, dan GROUP BY",
        "isi": "COUNT menghitung banyak baris dan SUM menjumlahkan nilai. GROUP BY mengelompokkan baris yang nilainya sama, lalu HAVING menyaring hasil kelompok.",
        "contoh": "SELECT kelas, COUNT(*)\nFROM siswa\nGROUP BY kelas;",
    },
    "JOIN": {
        "judul": "JOIN",
        "isi": "JOIN menggabungkan dua tabel berdasarkan kolom yang nilainya sama, ditulis setelah ON. Tulis nama_tabel.kolom supaya jelas kolom itu milik tabel mana.",
        "contoh": "SELECT siswa.nama, nilai.skor\nFROM nilai\nJOIN siswa ON nilai.nis = siswa.nis;",
    },
}


def _kasus(id, berkas, urutan, judul, tkp, briefing, tabel_list, langkah_list, tersangka_list,
           penjelasan, penutup, xp=50, koin=20, durasi="3-5 menit"):
    return {
        "id": id, "berkas": berkas, "urutan": urutan, "jenis": "utama", "judul": judul, "tkp": tkp,
        "konsep": BERKAS[berkas - 1]["konsep"], "briefing": briefing, "tabel_sumber": tabel_list,
        "langkah": langkah_list, "tersangka": tersangka_list, "penjelasan": penjelasan,
        "penutup": penutup, "xp": xp, "koin": koin, "durasi": durasi,
    }


# ---------------------------------------------------------------- BERKAS 1
b1k1 = _kasus(
    "b1k1", 1, 1, "Kunci Ruang OSIS", "Ruang OSIS, Senin pagi",
    [
        "Selamat datang, Detektif. Pagi ini Ruang OSIS ditemukan tidak terkunci, dan spanduk pensi hilang dari dalam.",
        "Setiap peminjaman kunci dicatat Pak Darto di tabel peminjaman_kunci. Kita mulai dari sana.",
    ],
    [
        tabel("peminjaman_kunci", "Catatan peminjaman kunci ruangan hari Jumat", [
            ("id", "INTEGER", "Nomor catatan"), ("nama", "TEXT", "Nama peminjam"),
            ("ruang", "TEXT", "Ruangan yang kuncinya dipinjam"), ("jam_pinjam", "TEXT", "Jam kunci diambil"),
            ("jam_kembali", "TEXT", "Jam kunci dikembalikan, kosong jika belum"),
        ], [
            (1, "Pak Hendra", "Lab RPL", "07:00", "15:00"),
            (2, "Bu Ratna", "Perpustakaan", "07:15", "15:30"),
            (3, "Bima", "Ruang OSIS", "10:00", "11:30"),
            (4, "Raka", "Lab RPL", "13:00", "14:10"),
            (5, "Nadia", "Ruang OSIS", "14:05", None),
            (6, "Sinta", "Ruang Musik", "13:30", "14:45"),
            (7, "Pak Darto", "Gudang", "15:10", "15:25"),
        ]),
    ],
    [
        langkah(
            "Tampilkan seluruh isi tabel peminjaman_kunci.",
            "SELECT * FROM peminjaman_kunci",
            ["Nama tabelnya peminjaman_kunci.", "Tanda * berarti semua kolom.", "SELECT * FROM ____"],
            "Bagus. Ada tujuh catatan peminjaman. Sekarang kita pilih kolom yang penting saja supaya lebih mudah dibaca.",
            wajib=["SELECT", "FROM"], cocok="tepat",
        ),
        langkah(
            "Tampilkan kolom nama, ruang, dan jam_kembali saja.",
            "SELECT nama, ruang, jam_kembali FROM peminjaman_kunci",
            ["Tulis nama kolom setelah SELECT, dipisah koma.", "Kolomnya nama, ruang, dan jam_kembali.",
             "SELECT nama, ____, ____ FROM peminjaman_kunci"],
            "Perhatikan baris yang jam_kembali-nya NULL. NULL berarti kosong, jadi kunci itu belum dikembalikan.",
            wajib=["SELECT", "FROM"], cocok="tepat",
        ),
    ],
    [
        tersangka("Nadia", "Siswi XI RPL, sekretaris OSIS", "nadia", True),
        tersangka("Bima", "Siswa XII TKJ", "bima", alasan="Bima memang meminjam kunci Ruang OSIS, tetapi sudah mengembalikannya pukul 11.30."),
        tersangka("Pak Darto", "Satpam sekolah", "pak_darto", alasan="Pak Darto hanya meminjam kunci gudang dan sudah mengembalikannya pukul 15.25."),
    ],
    "Nadia meminjam kunci Ruang OSIS pukul 14.05 dan tidak mengembalikannya. Spanduk ia bawa pulang untuk dijahit, tetapi ia lupa mengunci pintu dan melapor. Spanduk sudah kembali.",
    "Kerja bagus, Detektif. Kamu sudah bisa membaca isi tabel. Kasus berikutnya sudah terbuka.",
    xp=40, koin=15, durasi="2-3 menit",
)

b1k2 = _kasus(
    "b1k2", 1, 2, "Poster Lomba yang Tercoret", "Mading lantai 2, Kamis sore",
    [
        "Poster lomba desain di mading lantai 2 dicoret spidol merah sekitar pukul 16.00.",
        "Kita punya dua catatan: peminjaman spidol di ruang guru dan presensi ekskul sore itu. Bandingkan keduanya.",
    ],
    [
        tabel("pinjam_spidol", "Peminjaman spidol di ruang guru", [
            ("id", "INTEGER", "Nomor catatan"), ("nama", "TEXT", "Nama peminjam"),
            ("warna", "TEXT", "Warna spidol"), ("jam_pinjam", "TEXT", "Jam spidol dipinjam"),
        ], [
            (1, "Nadia", "Hitam", "13:10"),
            (2, "Sinta", "Merah", "14:00"),
            (3, "Raka", "Merah", "14:20"),
            (4, "Bima", "Biru", "14:35"),
            (5, "Pak Hendra", "Hijau", "15:00"),
            (6, "Nadia", "Biru", "15:20"),
        ]),
        tabel("presensi_ekskul", "Presensi ekskul hari Kamis", [
            ("id", "INTEGER", "Nomor catatan"), ("nama", "TEXT", "Nama siswa"), ("ekskul", "TEXT", "Nama ekskul"),
            ("jam_datang", "TEXT", "Jam datang"), ("jam_pulang", "TEXT", "Jam pulang"),
        ], [
            (1, "Raka", "Futsal", "14:30", "15:10"),
            (2, "Sinta", "Desain Grafis", "14:15", "16:40"),
            (3, "Bima", "Robotik", "14:40", "17:00"),
            (4, "Nadia", "Jurnalistik", "13:00", "15:30"),
            (5, "Dewi", "Paduan Suara", "14:00", "15:45"),
        ]),
    ],
    [
        langkah(
            "Tampilkan kolom nama dan warna dari tabel pinjam_spidol.",
            "SELECT nama, warna FROM pinjam_spidol",
            ["Tabelnya pinjam_spidol.", "Kolom yang dibutuhkan nama dan warna.", "SELECT ____, ____ FROM pinjam_spidol"],
            "Ada dua orang yang meminjam spidol merah: Sinta dan Raka. Sekarang cek siapa yang masih di sekolah sekitar pukul 16.00.",
            wajib=["SELECT", "FROM"], cocok="tepat",
        ),
        langkah(
            "Tampilkan kolom nama dan jam_pulang dari tabel presensi_ekskul.",
            "SELECT nama, jam_pulang FROM presensi_ekskul",
            ["Tabelnya presensi_ekskul.", "Kolom yang dibutuhkan nama dan jam_pulang.", "SELECT nama, ____ FROM ____"],
            "Poster dicoret sekitar pukul 16.00. Siapa pemegang spidol merah yang masih di sekolah saat itu?",
            wajib=["SELECT", "FROM"], cocok="tepat",
        ),
    ],
    [
        tersangka("Raka", "Siswa XI RPL", "raka", alasan="Raka memang meminjam spidol merah, tetapi sudah pulang pukul 15.10."),
        tersangka("Sinta", "Siswi X RPL", "sinta", True),
        tersangka("Bima", "Siswa XII TKJ", "bima", alasan="Bima masih di sekolah sampai pukul 17.00, tetapi spidol yang ia pinjam berwarna biru."),
    ],
    "Sinta mencoret poster karena kesal desainnya tidak lolos seleksi. Ia sudah meminta maaf dan membantu mencetak ulang poster lomba.",
    "Dua tabel, satu kesimpulan. Berkas SELECT selesai, Detektif. Berkas WHERE sudah menunggu.",
    xp=40, koin=15, durasi="3 menit",
)

# ---------------------------------------------------------------- BERKAS 2
akses_lab_rows = [
    (1, "Pak Hendra", "Guru", "07:05", "12:00"),
    (2, "Dewi", "XI RPL", "07:30", "09:10"),
    (3, "Fajar", "XI RPL", "07:30", "09:10"),
    (4, "Nadia", "XI RPL", "09:20", "11:00"),
    (5, "Rizky", "X TKJ", "09:25", "11:00"),
    (6, "Bima", "XII TKJ", "11:10", "12:30"),
    (7, "Putri", "X RPL", "12:40", "14:00"),
    (8, "Sinta", "X RPL", "12:40", "14:00"),
    (9, "Pak Hendra", "Guru", "13:00", "14:50"),
    (10, "Fajar", "XI RPL", "14:05", "14:55"),
    (11, "Raka", "XI RPL", "15:12", "15:58"),
    (12, "Sinta", "X RPL", "15:20", "15:35"),
    (13, "Bima", "XII TKJ", "15:41", "15:50"),
]
b2k1 = _kasus(
    "b2k1", 2, 1, "Laptop Hilang di Lab", "Lab Komputer 2, pukul 15.40",
    [
        "Laptop guru hilang dari Lab Komputer 2 setelah jam 15.00. Laptop itu dikunci ke meja dengan baut.",
        "Cari siapa saja yang masuk lab setelah jam itu, lalu periksa alat yang mereka pinjam.",
    ],
    [
        tabel("akses_lab", "Catatan kartu akses Lab Komputer 2", [
            ("id", "INTEGER", "Nomor catatan"), ("nama", "TEXT", "Nama pemilik kartu"), ("kelas", "TEXT", "Kelas atau jabatan"),
            ("jam_masuk", "TEXT", "Jam masuk lab"), ("jam_keluar", "TEXT", "Jam keluar lab"),
        ], akses_lab_rows),
        tabel("peminjaman_alat", "Peminjaman alat di ruang teknisi", [
            ("id", "INTEGER", "Nomor catatan"), ("nama", "TEXT", "Nama peminjam"), ("alat", "TEXT", "Alat yang dipinjam"),
            ("jam_pinjam", "TEXT", "Jam alat dipinjam"), ("jam_kembali", "TEXT", "Jam alat dikembalikan"),
        ], [
            (1, "Pak Hendra", "Obeng", "09:00", "10:00"),
            (2, "Rizky", "Tang", "09:30", "10:45"),
            (3, "Bima", "Multimeter", "11:15", "12:20"),
            (4, "Putri", "Kabel LAN", "12:45", "13:50"),
            (5, "Fajar", "Crimping tool", "14:10", "14:50"),
            (6, "Sinta", "Kabel LAN", "15:25", "15:34"),
            (7, "Raka", "Obeng", "15:30", "15:55"),
            (8, "Pak Darto", "Senter", "15:50", "17:00"),
        ]),
    ],
    [
        langkah(
            "Cari siapa saja yang masuk lab setelah pukul 15.00. Tampilkan nama dan jam_masuk.",
            "SELECT nama, jam_masuk FROM akses_lab WHERE jam_masuk > '15:00'",
            ["Datanya ada di tabel akses_lab.", "Saring kolom jam_masuk dengan tanda >.",
             "SELECT nama, jam_masuk FROM akses_lab WHERE jam_masuk > '____'"],
            "Bagus! Tinggal 3 orang. Sekarang cek alat yang dipinjam setelah pukul 15.00.",
            wajib=["WHERE"],
        ),
        langkah(
            "Tampilkan nama, alat, dan jam_pinjam dari peminjaman_alat yang dipinjam setelah pukul 15.00.",
            "SELECT nama, alat, jam_pinjam FROM peminjaman_alat WHERE jam_pinjam > '15:00'",
            ["Datanya ada di tabel peminjaman_alat.", "Saring kolom jam_pinjam, sama seperti langkah sebelumnya.",
             "SELECT nama, alat, jam_pinjam FROM peminjaman_alat WHERE ____ > '15:00'"],
            "Ingat, laptop itu dikunci ke meja dengan baut. Alat apa yang dibutuhkan untuk membukanya?",
            wajib=["WHERE"],
        ),
    ],
    [
        tersangka("Raka", "Siswa XI RPL", "raka", True),
        tersangka("Sinta", "Siswi X RPL", "sinta", alasan="Sinta masuk lab pukul 15.20, tetapi hanya meminjam kabel LAN. Baut pengunci laptop hanya bisa dibuka dengan obeng."),
        tersangka("Bima", "Siswa XII TKJ", "bima", alasan="Bima masuk lab pukul 15.41 dan tidak meminjam alat apa pun setelah pukul 15.00."),
    ],
    "Raka meminjam obeng pukul 15.30 untuk membuka baut pengunci laptop. Laptop itu ia bawa ke ruang OSIS untuk latihan presentasi, lalu lupa mengembalikannya. Laptop sudah kembali ke lab.",
    "Kerja bagus, Detektif. WHERE membuat puluhan baris menjadi tiga nama saja.",
    xp=50, koin=20,
)

b2k2 = _kasus(
    "b2k2", 2, 2, "Kas Ekskul Robotik", "Sekretariat Ekskul Robotik",
    [
        "Saldo kas Ekskul Robotik kurang Rp135.000 dari seharusnya. Ada pengeluaran yang terlihat terlalu besar.",
        "Periksa buku kas, nota belanja, lalu presensi pengurus. Pakai AND kalau syaratnya lebih dari satu.",
    ],
    [
        tabel("kas_robotik", "Buku kas Ekskul Robotik bulan September", [
            ("id", "INTEGER", "Nomor catatan"), ("tanggal", "TEXT", "Tanggal transaksi"), ("keterangan", "TEXT", "Keterangan"),
            ("masuk", "INTEGER", "Uang masuk (rupiah)"), ("keluar", "INTEGER", "Uang keluar (rupiah)"),
        ], [
            (1, "2026-09-01", "Iuran anggota", 300000, 0),
            (2, "2026-09-03", "Beli baterai", 0, 45000),
            (3, "2026-09-08", "Beli kabel jumper", 0, 30000),
            (4, "2026-09-10", "Iuran anggota", 250000, 0),
            (5, "2026-09-14", "Beli spidol dan kertas", 0, 150000),
            (6, "2026-09-17", "Cetak banner lomba", 0, 60000),
            (7, "2026-09-21", "Beli sensor ultrasonik", 0, 85000),
            (8, "2026-09-24", "Iuran anggota", 200000, 0),
            (9, "2026-09-28", "Beli lem tembak", 0, 25000),
        ]),
        tabel("nota_belanja", "Nota belanja yang disimpan pengurus", [
            ("id", "INTEGER", "Nomor nota"), ("tanggal", "TEXT", "Tanggal belanja"), ("toko", "TEXT", "Nama toko"),
            ("barang", "TEXT", "Barang yang dibeli"), ("total", "INTEGER", "Total di nota (rupiah)"),
        ], [
            (1, "2026-09-03", "Toko Elektro Jaya", "Baterai AA", 45000),
            (2, "2026-09-08", "Toko Elektro Jaya", "Kabel jumper", 30000),
            (3, "2026-09-14", "Toko Buku Pelangi", "Spidol dan kertas", 15000),
            (4, "2026-09-17", "Percetakan Kilat", "Banner lomba", 60000),
            (5, "2026-09-21", "Toko Elektro Jaya", "Sensor ultrasonik", 85000),
            (6, "2026-09-28", "Toko Bangunan Sejahtera", "Lem tembak", 25000),
        ]),
        tabel("presensi_pengurus", "Presensi pengurus ekskul", [
            ("id", "INTEGER", "Nomor catatan"), ("tanggal", "TEXT", "Tanggal"), ("nama", "TEXT", "Nama pengurus"),
            ("jabatan", "TEXT", "Jabatan"), ("status", "TEXT", "Hadir, Izin, atau Sakit"),
        ], [
            (1, "2026-09-10", "Raka", "Ketua", "Hadir"),
            (2, "2026-09-10", "Bima", "Bendahara", "Hadir"),
            (3, "2026-09-10", "Nadia", "Bendahara", "Hadir"),
            (4, "2026-09-10", "Sinta", "Sekretaris", "Hadir"),
            (5, "2026-09-14", "Raka", "Ketua", "Hadir"),
            (6, "2026-09-14", "Bima", "Bendahara", "Hadir"),
            (7, "2026-09-14", "Nadia", "Bendahara", "Izin"),
            (8, "2026-09-14", "Sinta", "Sekretaris", "Hadir"),
            (9, "2026-09-17", "Raka", "Ketua", "Sakit"),
            (10, "2026-09-17", "Bima", "Bendahara", "Izin"),
            (11, "2026-09-17", "Nadia", "Bendahara", "Hadir"),
            (12, "2026-09-17", "Sinta", "Sekretaris", "Hadir"),
        ]),
    ],
    [
        langkah(
            "Tampilkan tanggal, keterangan, dan keluar dari kas_robotik untuk pengeluaran yang lebih dari 50000.",
            "SELECT tanggal, keterangan, keluar FROM kas_robotik WHERE keluar > 50000",
            ["Tabelnya kas_robotik, kolom uang keluar bernama keluar.", "Angka tidak perlu diberi tanda kutip.",
             "SELECT tanggal, keterangan, keluar FROM kas_robotik WHERE keluar > ____"],
            "Ada tiga pengeluaran besar. Beli spidol dan kertas sampai Rp150.000? Cek notanya.",
            wajib=["WHERE"],
        ),
        langkah(
            "Tampilkan nota_belanja pada tanggal 2026-09-14.",
            "SELECT * FROM nota_belanja WHERE tanggal = '2026-09-14'",
            ["Tabelnya nota_belanja.", "Tanggal ditulis sebagai teks, jadi pakai tanda kutip.",
             "SELECT * FROM nota_belanja WHERE tanggal = '____'"],
            "Notanya hanya Rp15.000, tetapi di buku kas tertulis Rp150.000. Ada yang menambah satu angka nol. Siapa bendahara yang bertugas hari itu?",
            wajib=["WHERE"],
        ),
        langkah(
            "Tampilkan nama dan status dari presensi_pengurus untuk jabatan Bendahara pada tanggal 2026-09-14.",
            "SELECT nama, status FROM presensi_pengurus WHERE tanggal = '2026-09-14' AND jabatan = 'Bendahara'",
            ["Ada dua syarat: tanggal dan jabatan.", "Gabungkan dua syarat dengan AND.",
             "SELECT nama, status FROM presensi_pengurus WHERE tanggal = '2026-09-14' AND ____ = '____'"],
            "Dua bendahara, tetapi hanya satu yang hadir saat transaksi itu dicatat.",
            wajib=["WHERE", "AND"],
        ),
    ],
    [
        tersangka("Bima", "Siswa XII TKJ, bendahara", "bima", True),
        tersangka("Nadia", "Siswi XI RPL, bendahara", "nadia", alasan="Nadia juga bendahara, tetapi pada 14 September ia izin dan tidak mencatat kas."),
        tersangka("Raka", "Siswa XI RPL, ketua ekskul", "raka", alasan="Raka ketua ekskul dan tidak memegang buku kas."),
    ],
    "Bima mencatat Rp150.000 padahal notanya Rp15.000. Selisihnya ia pakai untuk membeli suku cadang robot tanpa nota. Bima sudah mengembalikan uangnya dan membetulkan catatan kas.",
    "Tiga tabel, dua syarat, satu pelaku. Berkas WHERE selesai, Detektif.",
    xp=60, koin=20, durasi="4-5 menit",
)

# ---------------------------------------------------------------- BERKAS 3
b3k1 = _kasus(
    "b3k1", 3, 1, "Akun Palsu di Grup Kelas", "Grup chat XI RPL",
    [
        "Ada akun yang mengaku Pak Hendra dan menyebarkan pengumuman libur palsu di grup kelas.",
        "Nama akunnya mirip, jadi kita perlu mencari dengan pola. Di sinilah LIKE berguna.",
    ],
    [
        tabel("anggota_grup", "Daftar anggota grup chat XI RPL", [
            ("id", "INTEGER", "Nomor anggota"), ("nama_tampilan", "TEXT", "Nama yang terlihat di grup"),
            ("nomor_hp", "TEXT", "Nomor ponsel"), ("bergabung", "TEXT", "Tanggal bergabung"),
        ], [
            (1, "Pak Hendra", "081234560001", "2025-07-14"),
            (2, "Raka R.", "081377889900", "2025-07-14"),
            (3, "Nadia", "085712345678", "2025-07-14"),
            (4, "Dewi Lestari", "081299001122", "2025-07-15"),
            (5, "Fajar", "089911223344", "2025-07-15"),
            (6, "Bu Wulan BK", "081255501234", "2025-07-20"),
            (7, "Putri", "082144556677", "2025-08-02"),
            (8, "Rizky", "083866771122", "2025-08-02"),
            (9, "Hendra Official", "089612340042", "2026-10-11"),
            (10, "Admin Kelas", "081377889900", "2025-07-14"),
        ]),
        tabel("data_siswa", "Data siswa dari tata usaha", [
            ("nis", "TEXT", "Nomor induk siswa"), ("nama", "TEXT", "Nama siswa"), ("kelas", "TEXT", "Kelas"),
            ("nomor_hp", "TEXT", "Nomor ponsel yang didaftarkan"),
        ], [
            ("24101", "Raka Pratama", "XI RPL", "0813-7788-9900"),
            ("24102", "Nadia Putri", "XI RPL", "0857-1234-5678"),
            ("24103", "Dewi Lestari", "XI RPL", "0812-9900-1122"),
            ("24104", "Fajar Nugroho", "XI RPL", "0899-1122-3344"),
            ("25105", "Sinta Maharani", "X RPL", "0896-1234-0042"),
            ("23106", "Bima Saputra", "XII TKJ", "0821-7788-0042"),
            ("25107", "Putri Ayu", "X RPL", "0821-4455-6677"),
            ("25108", "Rizky Ramadhan", "X TKJ", "0838-6677-1122"),
        ]),
    ],
    [
        langkah(
            "Cari akun di anggota_grup yang nama_tampilan-nya mengandung kata Hendra.",
            "SELECT nama_tampilan, nomor_hp FROM anggota_grup WHERE nama_tampilan LIKE '%Hendra%'",
            ["Tabelnya anggota_grup.", "Kata Hendra bisa ada di tengah nama, jadi pakai % di depan dan di belakang.",
             "SELECT nama_tampilan, nomor_hp FROM anggota_grup WHERE nama_tampilan LIKE '%____%'"],
            "Ada dua akun. Pak Hendra memastikan nomornya berawalan 0812, jadi Hendra Official itu palsu. Catat nomornya.",
            wajib=["LIKE"],
        ),
        langkah(
            "Data siswa menulis nomor dengan tanda strip. Cari siswa yang nomor_hp-nya berakhiran 0042.",
            "SELECT nama, kelas, nomor_hp FROM data_siswa WHERE nomor_hp LIKE '%0042'",
            ["Tabelnya data_siswa.", "Berakhiran berarti % hanya ditaruh di depan.",
             "SELECT nama, kelas, nomor_hp FROM data_siswa WHERE nomor_hp LIKE '%____'"],
            "Ada dua siswa. Nomor akun palsu diawali 0896. Persempit lagi polanya.",
            wajib=["LIKE"],
        ),
        langkah(
            "Cari siswa yang nomor_hp-nya diawali 0896 dan berakhiran 0042.",
            "SELECT nama, kelas, nomor_hp FROM data_siswa WHERE nomor_hp LIKE '0896%0042'",
            ["Satu pola LIKE bisa memuat awal dan akhir sekaligus.", "Taruh % di antara awalan dan akhiran.",
             "SELECT nama, kelas, nomor_hp FROM data_siswa WHERE nomor_hp LIKE '0896%____'"],
            "Pola itu hanya cocok dengan satu nomor. Sekarang kamu tahu siapa pemilik akun palsu itu.",
            wajib=["LIKE"],
        ),
    ],
    [
        tersangka("Sinta", "Siswi X RPL", "sinta", True),
        tersangka("Bima", "Siswa XII TKJ", "bima", alasan="Nomor Bima memang berakhiran 0042, tetapi diawali 0821, bukan 0896."),
        tersangka("Raka", "Siswa XI RPL", "raka", alasan="Nomor Raka tidak cocok dengan pola nomor akun palsu."),
    ],
    "Sinta membuat akun Hendra Official untuk bercanda. Ia tidak menyangka pengumuman palsunya membuat beberapa teman tidak masuk sekolah. Akun sudah dihapus dan Sinta meminta maaf di grup.",
    "Pola yang tepat bisa menemukan satu nomor di antara banyak data. Kerja bagus, Detektif.",
    xp=60, koin=20, durasi="4-5 menit",
)

b3k2 = _kasus(
    "b3k2", 3, 2, "Halaman Buku yang Disobek", "Perpustakaan, rak TI",
    [
        "Bu Ratna menemukan buku yang dikembalikan hari Kamis, 8 Oktober, dengan satu halaman disobek.",
        "Label kodenya rusak. Yang terbaca hanya TI-0, satu angka yang tidak jelas, lalu angka 4. Judulnya mengandung kata Basis Data.",
    ],
    [
        tabel("buku", "Koleksi buku perpustakaan", [
            ("kode", "TEXT", "Kode buku"), ("judul", "TEXT", "Judul buku"), ("penulis", "TEXT", "Penulis"), ("rak", "TEXT", "Lokasi rak"),
        ], [
            ("TI-004", "Sistem Operasi", "Andi Wijaya", "TI-A"),
            ("TI-011", "Dasar Pemrograman Python", "Rina Kartika", "TI-A"),
            ("TI-014", "Basis Data untuk Pemula", "Budi Santoso", "TI-B"),
            ("TI-022", "Desain Basis Data Relasional", "Sari Utami", "TI-B"),
            ("TI-024", "Algoritma dan Struktur Data", "Andi Wijaya", "TI-B"),
            ("TI-031", "Praktikum Basis Data SQL", "Budi Santoso", "TI-C"),
            ("TI-034", "Pemrograman Web Dasar", "Dian Prasetyo", "TI-C"),
            ("TI-044", "Basis Data Lanjut", "Sari Utami", "TI-C"),
            ("MT-014", "Matematika Diskrit", "Hadi Susilo", "MT-A"),
        ]),
        tabel("peminjaman_buku", "Riwayat peminjaman buku", [
            ("id", "INTEGER", "Nomor catatan"), ("kode_buku", "TEXT", "Kode buku"), ("peminjam", "TEXT", "Nama peminjam"),
            ("tanggal_pinjam", "TEXT", "Tanggal pinjam"), ("tanggal_kembali", "TEXT", "Tanggal kembali"),
        ], [
            (1, "TI-014", "Raka", "2026-09-01", "2026-09-08"),
            (2, "TI-044", "Bima", "2026-09-20", "2026-09-27"),
            (3, "TI-022", "Sinta", "2026-09-29", "2026-10-06"),
            (4, "TI-014", "Nadia", "2026-10-01", "2026-10-08"),
            (5, "TI-034", "Bima", "2026-10-02", "2026-10-08"),
            (6, "TI-031", "Raka", "2026-10-05", "2026-10-12"),
            (7, "MT-014", "Sinta", "2026-10-06", "2026-10-08"),
        ]),
    ],
    [
        langkah(
            "Tampilkan kode dan judul buku yang judulnya mengandung kata Basis Data.",
            "SELECT kode, judul FROM buku WHERE judul LIKE '%Basis Data%'",
            ["Tabelnya buku.", "Kata Basis Data bisa di awal, tengah, atau akhir judul.",
             "SELECT kode, judul FROM buku WHERE judul LIKE '%____%'"],
            "Ada empat buku Basis Data. Sekarang pakai petunjuk dari label kode.",
            wajib=["LIKE"],
        ),
        langkah(
            "Cari buku yang kodenya cocok dengan pola TI-0, satu angka, lalu 4, dan judulnya mengandung Basis Data.",
            "SELECT kode, judul FROM buku WHERE kode LIKE 'TI-0_4' AND judul LIKE '%Basis Data%'",
            ["Satu angka yang tidak terbaca diwakili tanda _.", "Gabungkan dua pola LIKE dengan AND.",
             "SELECT kode, judul FROM buku WHERE kode LIKE 'TI-0_4' AND judul LIKE '____'"],
            "Tinggal dua kemungkinan: TI-014 dan TI-044. Cek siapa yang mengembalikan buku pada 8 Oktober.",
            wajib=["LIKE"],
        ),
        langkah(
            "Tampilkan kode_buku dan peminjam untuk buku berpola TI-0_4 yang dikembalikan pada 2026-10-08.",
            "SELECT kode_buku, peminjam FROM peminjaman_buku WHERE kode_buku LIKE 'TI-0_4' AND tanggal_kembali = '2026-10-08'",
            ["Tabelnya peminjaman_buku.", "Pakai pola kode yang sama, lalu tambahkan syarat tanggal_kembali.",
             "SELECT kode_buku, peminjam FROM peminjaman_buku WHERE kode_buku LIKE 'TI-0_4' AND ____ = '2026-10-08'"],
            "Dua buku kembali hari itu. Mana yang judulnya mengandung Basis Data?",
            wajib=["LIKE"],
        ),
    ],
    [
        tersangka("Nadia", "Siswi XI RPL", "nadia", True),
        tersangka("Bima", "Siswa XII TKJ", "bima", alasan="Bima mengembalikan TI-034 pada hari itu, tetapi judulnya Pemrograman Web Dasar, bukan buku Basis Data."),
        tersangka("Raka", "Siswa XI RPL", "raka", alasan="Raka meminjam TI-014 pada bulan September dan bukunya kembali dalam keadaan utuh."),
    ],
    "Nadia tidak sengaja menyobek halaman saat memfotokopi bab normalisasi. Ia takut melapor, jadi bukunya langsung dikembalikan. Nadia sudah mengganti halaman itu dan meminta maaf kepada Bu Ratna.",
    "Tanda % dan _ sudah kamu kuasai. Berkas LIKE selesai, Detektif.",
    xp=60, koin=20, durasi="4-5 menit",
)

# ---------------------------------------------------------------- BERKAS 4
suara_rows = []
_pemilih = [
    ("Dewi", "XI RPL", "XI RPL", "06:30"), ("Fajar", "XI RPL", "XI RPL", "06:32"), ("Putri", "X RPL", "X TKJ", "06:33"),
    ("Rizky", "X TKJ", "X TKJ", "06:35"), ("Bima", "XII TKJ", "XII RPL", "06:36"), ("Raka", "XI RPL", "XI RPL", "06:41"),
    ("Raka", "XI RPL", "XI RPL", "06:41"), ("Raka", "XI RPL", "XI RPL", "06:42"), ("Raka", "XI RPL", "XI RPL", "06:42"),
    ("Sinta", "X RPL", "X TKJ", "06:44"), ("Nadia", "XI RPL", "XI RPL", "06:45"), ("Gilang", "XII RPL", "XII RPL", "06:46"),
    ("Ayu", "XII RPL", "XII RPL", "06:47"), ("Bayu", "X TKJ", "X TKJ", "06:48"), ("Citra", "XI TKJ", "X TKJ", "06:50"),
    ("Doni", "XI TKJ", "XI RPL", "06:51"), ("Eka", "X RPL", "X TKJ", "06:52"), ("Fitri", "XII TKJ", "XII RPL", "06:53"),
    ("Galih", "XI RPL", "XI RPL", "06:54"), ("Hana", "X TKJ", "X TKJ", "06:55"), ("Indra", "XII RPL", "XII RPL", "06:56"),
    ("Joko", "XI TKJ", "X TKJ", "06:57"), ("Kiki", "X RPL", "XI RPL", "06:58"), ("Lina", "XII TKJ", "XII RPL", "06:59"),
    ("Maya", "XI RPL", "XI RPL", "07:00"), ("Nanda", "X TKJ", "X TKJ", "07:01"), ("Oki", "XII RPL", "XII RPL", "07:02"),
    ("Pandu", "XI TKJ", "X TKJ", "07:03"), ("Rani", "X RPL", "XI RPL", "07:04"), ("Salsa", "XII TKJ", "XII RPL", "07:05"),
    ("Tegar", "XII RPL", "XII RPL", "07:06"), ("Umi", "XI TKJ", "XII RPL", "07:07"), ("Vina", "X TKJ", "X TKJ", "07:08"),
]
for i, (p, kp, kpil, w) in enumerate(_pemilih, 1):
    suara_rows.append((i, p, kp, kpil, w))

b4k1 = _kasus(
    "b4k1", 4, 1, "Lomba Kelas Terbersih", "Tablet voting di lobi",
    [
        "XI RPL menang Lomba Kelas Terbersih lewat voting di tablet lobi. Kelas lain curiga ada yang memilih berkali-kali.",
        "Setiap orang seharusnya hanya memilih satu kali. Hitung suaranya dengan COUNT dan kelompokkan dengan GROUP BY.",
    ],
    [
        tabel("suara", "Suara yang masuk lewat tablet lobi", [
            ("id", "INTEGER", "Nomor suara"), ("pemilih", "TEXT", "Nama pemilih"), ("kelas_pemilih", "TEXT", "Kelas pemilih"),
            ("kelas_pilihan", "TEXT", "Kelas yang dipilih"), ("waktu", "TEXT", "Jam memilih"),
        ], suara_rows),
    ],
    [
        langkah(
            "Hitung jumlah suara untuk setiap kelas_pilihan.",
            "SELECT kelas_pilihan, COUNT(*) FROM suara GROUP BY kelas_pilihan",
            ["Tabelnya suara. Kelompokkan berdasarkan kelas_pilihan.", "COUNT(*) menghitung banyak baris di setiap kelompok.",
             "SELECT kelas_pilihan, COUNT(*) FROM suara GROUP BY ____"],
            "XI RPL unggul tipis. Sekarang cek apakah ada pemilih yang memilih lebih dari satu kali.",
            wajib=["COUNT", "GROUP BY"],
        ),
        langkah(
            "Cari pemilih yang memberikan suara lebih dari satu kali, beserta jumlah suaranya.",
            "SELECT pemilih, COUNT(*) FROM suara GROUP BY pemilih HAVING COUNT(*) > 1",
            ["Kelompokkan berdasarkan pemilih.", "Syarat untuk hasil kelompok ditulis dengan HAVING, bukan WHERE.",
             "SELECT pemilih, COUNT(*) FROM suara GROUP BY pemilih HAVING COUNT(*) > ____"],
            "Satu nama muncul empat kali dalam dua menit. Kalau suara gandanya dihapus, siapa juaranya?",
            wajib=["GROUP BY", "HAVING"],
        ),
    ],
    [
        tersangka("Raka", "Siswa XI RPL", "raka", True),
        tersangka("Nadia", "Siswi XI RPL", "nadia", alasan="Nadia hanya memilih satu kali, pukul 06.45."),
        tersangka("Sinta", "Siswi X RPL", "sinta", alasan="Sinta memilih satu kali, dan pilihannya X TKJ."),
    ],
    "Raka memilih empat kali untuk kelasnya sendiri karena tablet tidak menolak nama yang sama. Setelah suara ganda dihapus, X TKJ yang menang. Panitia juga menambahkan pemeriksaan nama di tablet.",
    "COUNT dan GROUP BY membuka kecurangan yang tidak terlihat dari daftar biasa. Kerja bagus, Detektif.",
    xp=60, koin=20,
)

penjualan_rows = []
_pj = [
    ("Es Teh", "Sinta", [15000, 20000, 25000, 10000, 30000, 20000]),
    ("Es Teh", "Bima", [25000, 30000, 20000, 15000, 25000, 15000]),
    ("Cireng", "Raka", [30000, 25000, 40000, 35000, 20000, 30000]),
    ("Donat", "Nadia", [20000, 30000, 25000, 35000, 40000]),
]
_n = 1
for stand, penjaga, totals in _pj:
    for t in totals:
        penjualan_rows.append((_n, stand, penjaga, t))
        _n += 1

b4k2 = _kasus(
    "b4k2", 4, 2, "Setoran Bazar Kurang", "Bazar Hari Guru",
    [
        "Bazar Hari Guru mencatat setiap penjualan di tabel penjualan_bazar. Uang yang disetor ke panitia ternyata kurang.",
        "Jumlahkan penjualan dan setoran setiap stand dengan SUM, lalu cari penjaga yang setorannya tidak cocok.",
    ],
    [
        tabel("penjualan_bazar", "Catatan penjualan setiap stand", [
            ("id", "INTEGER", "Nomor transaksi"), ("stand", "TEXT", "Nama stand"), ("penjaga", "TEXT", "Penjaga yang mencatat"),
            ("total", "INTEGER", "Total transaksi (rupiah)"),
        ], penjualan_rows),
        tabel("setoran", "Uang yang disetor ke panitia", [
            ("id", "INTEGER", "Nomor setoran"), ("stand", "TEXT", "Nama stand"), ("penjaga", "TEXT", "Penjaga yang menyetor"),
            ("jumlah", "INTEGER", "Jumlah setoran (rupiah)"),
        ], [
            (1, "Es Teh", "Sinta", 120000),
            (2, "Es Teh", "Bima", 80000),
            (3, "Cireng", "Raka", 180000),
            (4, "Donat", "Nadia", 150000),
        ]),
    ],
    [
        langkah(
            "Hitung total penjualan setiap stand.",
            "SELECT stand, SUM(total) FROM penjualan_bazar GROUP BY stand",
            ["Tabelnya penjualan_bazar.", "SUM(total) menjumlahkan kolom total di setiap kelompok.",
             "SELECT stand, SUM(total) FROM penjualan_bazar GROUP BY ____"],
            "Sudah ada total penjualan tiap stand. Sekarang hitung setorannya.",
            wajib=["SUM", "GROUP BY"],
        ),
        langkah(
            "Hitung total setoran setiap stand dari tabel setoran.",
            "SELECT stand, SUM(jumlah) FROM setoran GROUP BY stand",
            ["Tabelnya setoran, kolom uangnya bernama jumlah.", "Caranya sama seperti langkah sebelumnya.",
             "SELECT stand, SUM(____) FROM setoran GROUP BY stand"],
            "Stand Es Teh menjual Rp250.000, tetapi setorannya hanya Rp200.000. Stand itu dijaga dua orang.",
            wajib=["SUM", "GROUP BY"],
        ),
        langkah(
            "Untuk stand Es Teh saja, hitung total penjualan setiap penjaga.",
            "SELECT penjaga, SUM(total) FROM penjualan_bazar WHERE stand = 'Es Teh' GROUP BY penjaga",
            ["Saring dulu stand Es Teh dengan WHERE, baru kelompokkan.", "WHERE ditulis sebelum GROUP BY.",
             "SELECT penjaga, SUM(total) FROM penjualan_bazar WHERE stand = 'Es Teh' GROUP BY ____"],
            "Bandingkan dengan tabel setoran: Sinta menyetor Rp120.000 dan Bima Rp80.000.",
            wajib=["SUM", "GROUP BY", "WHERE"],
        ),
    ],
    [
        tersangka("Bima", "Siswa XII TKJ", "bima", True),
        tersangka("Sinta", "Siswi X RPL", "sinta", alasan="Penjualan Sinta Rp120.000 dan setorannya juga Rp120.000."),
        tersangka("Raka", "Siswa XI RPL", "raka", alasan="Stand Cireng yang dijaga Raka setorannya sudah cocok dengan penjualan."),
    ],
    "Bima menyimpan Rp50.000 di tas untuk uang kembalian dan lupa menyetorkannya. Uang itu sudah diserahkan ke panitia.",
    "SUM dan GROUP BY membuat selisih kecil langsung terlihat. Berkas agregasi selesai, Detektif.",
    xp=70, koin=25, durasi="4-5 menit",
)

# ---------------------------------------------------------------- BERKAS 5
warga_rows = [
    (1, "Pak Hendra", "Guru produktif"), (2, "Pak Darto", "Satpam"), (3, "Bu Sri", "Ibu kantin"),
    (4, "Bu Ratna", "Pustakawan"), (5, "Raka", "Siswa XI RPL"), (6, "Nadia", "Siswi XI RPL"),
    (7, "Bima", "Siswa XII TKJ"), (8, "Sinta", "Siswi X RPL"), (9, "Bu Wulan", "Guru BK"), (10, "Pak Joko", "Staf TU"),
]
b5k1 = _kasus(
    "b5k1", 5, 1, "Paket yang Tertukar", "Pos Satpam",
    [
        "Paket berisi komponen robot milik Pak Hendra diambil orang lain dari Pos Satpam.",
        "Pak Darto mencatat penerima dan pengambil paket dengan nomor ID, bukan nama. Gabungkan tabelnya dengan JOIN.",
    ],
    [
        tabel("warga_sekolah", "Daftar warga sekolah", [
            ("id", "INTEGER", "Nomor ID"), ("nama", "TEXT", "Nama"), ("peran", "TEXT", "Peran di sekolah"),
        ], warga_rows),
        tabel("paket", "Paket yang tiba di Pos Satpam", [
            ("id", "INTEGER", "Nomor paket"), ("resi", "TEXT", "Nomor resi"), ("id_penerima", "INTEGER", "ID penerima"),
            ("isi_tertulis", "TEXT", "Isi menurut label"), ("jam_tiba", "TEXT", "Jam paket tiba"),
        ], [
            (101, "JNT-2231", 1, "Komponen elektronik", "09:10"),
            (102, "SPX-5512", 3, "Peralatan dapur", "09:15"),
            (103, "JNE-7781", 4, "Buku", "09:40"),
            (104, "SPX-1290", 8, "Aksesoris ponsel", "10:00"),
            (105, "JNT-4410", 10, "Alat tulis kantor", "10:20"),
            (106, "POS-3307", 9, "Dokumen", "11:05"),
        ], relasi=[("id_penerima", "warga_sekolah", "id")]),
        tabel("pengambilan", "Catatan pengambilan paket", [
            ("id", "INTEGER", "Nomor catatan"), ("id_paket", "INTEGER", "Nomor paket"), ("id_pengambil", "INTEGER", "ID pengambil"),
            ("jam_ambil", "TEXT", "Jam diambil"),
        ], [
            (1, 103, 4, "09:55"),
            (2, 101, 3, "10:05"),
            (3, 104, 8, "10:30"),
            (4, 105, 10, "10:45"),
            (5, 106, 9, "11:20"),
        ], relasi=[("id_paket", "paket", "id"), ("id_pengambil", "warga_sekolah", "id")]),
    ],
    [
        langkah(
            "Gabungkan paket dan warga_sekolah. Tampilkan id paket, resi, dan nama penerimanya.",
            "SELECT paket.id, paket.resi, warga_sekolah.nama FROM paket JOIN warga_sekolah ON paket.id_penerima = warga_sekolah.id",
            ["Kolom id_penerima di paket menunjuk ke id di warga_sekolah.", "Tulis syarat penggabungan setelah ON.",
             "SELECT paket.id, paket.resi, warga_sekolah.nama FROM paket JOIN warga_sekolah ON paket.____ = warga_sekolah.id"],
            "Paket 101 milik Pak Hendra. Sekarang cari siapa yang mengambil setiap paket.",
            wajib=["JOIN", "ON"],
        ),
        langkah(
            "Gabungkan pengambilan dan warga_sekolah. Tampilkan id_paket, nama pengambil, dan jam_ambil.",
            "SELECT pengambilan.id_paket, warga_sekolah.nama, pengambilan.jam_ambil FROM pengambilan JOIN warga_sekolah ON pengambilan.id_pengambil = warga_sekolah.id",
            ["Kali ini yang dihubungkan kolom id_pengambil.", "Polanya sama dengan langkah pertama.",
             "SELECT pengambilan.id_paket, warga_sekolah.nama, pengambilan.jam_ambil FROM pengambilan JOIN warga_sekolah ON pengambilan.____ = warga_sekolah.id"],
            "Cocokkan nomor paket 101 dengan nama pengambilnya. Apakah orangnya sama dengan penerima?",
            wajib=["JOIN", "ON"],
        ),
    ],
    [
        tersangka("Bu Sri", "Ibu kantin", "bu_sri", True),
        tersangka("Pak Darto", "Satpam sekolah", "pak_darto", alasan="Pak Darto hanya mencatat paket dan tidak tercatat mengambil paket 101."),
        tersangka("Sinta", "Siswi X RPL", "sinta", alasan="Sinta mengambil paket 104, yaitu paketnya sendiri."),
    ],
    "Bu Sri mengambil paket 101 karena kardusnya mirip dengan paket peralatan dapur yang ia tunggu. Paket belum dibuka dan sudah diserahkan ke Pak Hendra. Paket Bu Sri masih menunggu di Pos Satpam.",
    "JOIN mengubah nomor ID menjadi nama yang bisa dibaca. Satu kasus besar lagi, Detektif.",
    xp=70, koin=25,
)

log_rows = [
    (1, "K-07", "Lobi", "05:58"), (2, "K-07", "Lemari Piala", "06:10"), (3, "K-11", "Lobi", "06:15"),
    (4, "K-11", "Perpustakaan", "06:20"), (5, "K-15", "Lobi", "06:30"), (6, "K-15", "Lemari Piala", "06:35"),
    (7, "K-03", "Lobi", "06:38"), (8, "K-03", "Lab RPL", "06:40"), (9, "K-21", "Lobi", "06:48"),
    (10, "K-21", "Lemari Piala", "06:52"), (11, "K-18", "Lobi", "06:55"), (12, "K-09", "Lobi", "07:02"),
    (13, "K-07", "Lemari Piala", "07:15"),
]
b5k2 = _kasus(
    "b5k2", 5, 2, "Piala yang Menghilang", "Lemari piala, lobi utama",
    [
        "Piala juara LKS hilang dari lemari piala, dua jam sebelum upacara.",
        "Lemari itu hanya bisa dibuka dengan kartu akses. Catatan pintu hanya menyimpan nomor kartu, jadi kamu perlu menggabungkan tiga tabel.",
    ],
    [
        tabel("warga", "Daftar warga sekolah", [
            ("id", "INTEGER", "Nomor ID"), ("nama", "TEXT", "Nama"), ("peran", "TEXT", "Peran di sekolah"),
        ], warga_rows),
        tabel("kartu_akses", "Kartu akses pintu", [
            ("no_kartu", "TEXT", "Nomor kartu"), ("id_warga", "INTEGER", "ID pemilik kartu"), ("aktif", "INTEGER", "1 jika kartu aktif"),
        ], [
            ("K-03", 1, 1), ("K-07", 2, 1), ("K-09", 9, 1), ("K-11", 4, 1),
            ("K-15", 7, 1), ("K-18", 6, 1), ("K-21", 5, 1), ("K-24", 8, 0),
        ], relasi=[("id_warga", "warga", "id")]),
        tabel("log_pintu", "Catatan pintu yang dibuka dengan kartu", [
            ("id", "INTEGER", "Nomor catatan"), ("no_kartu", "TEXT", "Nomor kartu"), ("pintu", "TEXT", "Pintu yang dibuka"),
            ("waktu", "TEXT", "Jam dibuka"),
        ], log_rows, relasi=[("no_kartu", "kartu_akses", "no_kartu")]),
        tabel("cctv_lobi", "Catatan petugas dari rekaman CCTV lobi", [
            ("id", "INTEGER", "Nomor catatan"), ("waktu", "TEXT", "Jam di rekaman"), ("keterangan", "TEXT", "Yang terlihat"),
        ], [
            (1, "06:05", "Pak Darto berkeliling lobi"),
            (2, "06:40", "Petugas kebersihan memotret lemari, piala masih ada"),
            (3, "06:45", "Piala masih terlihat di lemari"),
            (4, "06:56", "Seseorang membawa kardus ke arah ruang OSIS"),
            (5, "07:16", "Pak Darto melapor piala hilang"),
        ]),
    ],
    [
        langkah(
            "Gabungkan log_pintu dan kartu_akses. Tampilkan no_kartu, id_warga, dan waktu untuk pintu Lemari Piala.",
            "SELECT log_pintu.no_kartu, kartu_akses.id_warga, log_pintu.waktu FROM log_pintu JOIN kartu_akses ON log_pintu.no_kartu = kartu_akses.no_kartu WHERE log_pintu.pintu = 'Lemari Piala'",
            ["Dua tabel itu sama-sama punya kolom no_kartu.", "Setelah JOIN, saring pintunya dengan WHERE.",
             "SELECT log_pintu.no_kartu, kartu_akses.id_warga, log_pintu.waktu FROM log_pintu JOIN kartu_akses ON log_pintu.no_kartu = kartu_akses.no_kartu WHERE log_pintu.pintu = '____'"],
            "Sudah ada ID pemilik kartunya, tetapi belum ada nama. Tambahkan satu JOIN lagi ke tabel warga.",
            wajib=["JOIN", "ON", "WHERE"],
        ),
        langkah(
            "Gabungkan tiga tabel: log_pintu, kartu_akses, dan warga. Tampilkan nama dan waktu untuk pintu Lemari Piala.",
            "SELECT warga.nama, log_pintu.waktu FROM log_pintu JOIN kartu_akses ON log_pintu.no_kartu = kartu_akses.no_kartu JOIN warga ON kartu_akses.id_warga = warga.id WHERE log_pintu.pintu = 'Lemari Piala'",
            ["JOIN bisa ditulis dua kali berturut-turut.", "JOIN kedua menghubungkan kartu_akses.id_warga dengan warga.id.",
             "... JOIN kartu_akses ON log_pintu.no_kartu = kartu_akses.no_kartu JOIN warga ON kartu_akses.____ = warga.id WHERE ..."],
            "Ada empat kali lemari dibuka. Kapan terakhir kali piala terlihat?",
            wajib=["JOIN", "ON"],
        ),
        langkah(
            "Tampilkan catatan cctv_lobi antara pukul 06:30 dan 07:00.",
            "SELECT waktu, keterangan FROM cctv_lobi WHERE waktu >= '06:30' AND waktu <= '07:00'",
            ["Tabelnya cctv_lobi.", "Pakai dua syarat waktu yang digabung dengan AND.",
             "SELECT waktu, keterangan FROM cctv_lobi WHERE waktu >= '06:30' AND waktu <= '____'"],
            "Piala masih ada pukul 06.45. Siapa yang membuka lemari setelah itu dan sebelum piala dilaporkan hilang?",
            wajib=["WHERE"],
        ),
    ],
    [
        tersangka("Raka", "Siswa XI RPL", "raka", True),
        tersangka("Bima", "Siswa XII TKJ", "bima", alasan="Bima membuka lemari pukul 06.35, sedangkan CCTV pukul 06.45 masih memperlihatkan piala di lemari."),
        tersangka("Pak Darto", "Satpam sekolah", "pak_darto", alasan="Pak Darto membuka lemari pukul 06.10 untuk pemeriksaan pagi dan pukul 07.15 saat piala sudah hilang."),
    ],
    "Raka mengambil piala pukul 06.52 dan membawanya ke ruang OSIS untuk dibersihkan sebagai kejutan sebelum upacara, tetapi tidak memberi tahu siapa pun. Piala sudah kembali sebelum upacara dimulai.",
    "Semua berkas selesai. Kamu sudah layak disebut detektif data, dan kasus harian tetap menunggu setiap hari.",
    xp=90, koin=30, durasi="5-6 menit",
)

KASUS_UTAMA = [b1k1, b1k2, b2k1, b2k2, b3k1, b3k2, b4k1, b4k2, b5k1, b5k2]
