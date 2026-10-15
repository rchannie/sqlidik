from datetime import datetime, timedelta, timezone

from app.konten import harian_untuk, hari_ini

from conftest import daftar, daftar_guru


def test_info_dan_akun(klien):
    assert klien.get("/api/info").json()["daftar_guru_terbuka"] is True
    h = daftar(klien)
    r = klien.post("/api/auth/daftar", json={"nama": "Raka", "email": "RAKA@uji.id", "kata_sandi": "rahasia1"})
    assert r.status_code == 409
    assert klien.post("/api/auth/masuk", json={"email": "raka@uji.id", "kata_sandi": "salah123"}).status_code == 401
    r = klien.post("/api/auth/masuk", json={"email": " Raka@Uji.id ", "kata_sandi": "rahasia1"})
    assert r.status_code == 200
    saya = klien.get("/api/auth/saya", headers=h).json()
    assert saya["pengguna"]["peran"] == "siswa"
    assert saya["statistik"]["koin"] == 30
    assert klien.get("/api/auth/saya").status_code == 401
    assert klien.post("/api/auth/daftar", json={"nama": "A", "email": "bukan-email", "kata_sandi": "rahasia1"}).status_code == 422
    assert klien.post("/api/auth/daftar", json={"nama": "A", "email": "a@b.id", "kata_sandi": "123"}).status_code == 422
    r = klien.patch("/api/auth/saya", headers=h, json={"avatar": "pemain_02", "nama": "Raka P"})
    assert r.json()["pengguna"]["avatar"] == "pemain_02"
    assert klien.patch("/api/auth/saya", headers=h, json={"avatar": "aneh"}).status_code == 422


def test_daftar_guru_butuh_kode(klien):
    r = klien.post("/api/auth/daftar-guru", json={"nama": "X", "email": "x@uji.id", "kata_sandi": "rahasia1", "kode_guru": "salah"})
    assert r.status_code == 403
    g = daftar_guru(klien)
    assert klien.get("/api/auth/saya", headers=g).json()["pengguna"]["peran"] == "guru"
    s = daftar(klien)
    assert klien.get("/api/guru/kelas", headers=s).status_code == 403


def test_sinkron_progres_dan_statistik(klien):
    h = daftar(klien)
    kirim = {
        "progres": [{"id_kasus": "b1k1", "status": "selesai", "bintang": 3, "jumlah_percobaan": 3, "petunjuk_dipakai": 0,
                     "durasi_detik": 95, "selesai_pada": datetime.now(timezone.utc).isoformat()}],
        "riwayat": [{"id": "r-000001", "id_kasus": "b1k1", "id_langkah": "b1k1-1", "konsep": "SELECT",
                     "teks_query": "SELECT * FROM peminjaman_kunci", "hasil_benar": True}],
        "hari_aktif": [{"tanggal": hari_ini().isoformat()}],
    }
    r = klien.post("/api/sinkron", headers=h, json=kirim).json()
    st = r["statistik"]
    assert st["xp"] == 40 and st["koin"] == 30 + 15 + 5
    assert {"kasus_pertama", "tanpa_petunjuk", "detektif_kilat"} <= set(st["lencana"])
    assert st["streak_saat_ini"] == 1
    # dikirim ulang tidak membuat dobel
    r2 = klien.post("/api/sinkron", headers=h, json=kirim).json()
    assert r2["statistik"]["xp"] == 40 and len(r2["progres"]) == 1
    # petunjuk mengurangi koin, kasus tidak dikenal diabaikan
    kirim2 = {"progres": [{"id_kasus": "b1k2", "status": "selesai", "bintang": 2, "jumlah_percobaan": 7, "petunjuk_dipakai": 2},
                          {"id_kasus": "tidak-ada", "status": "selesai", "bintang": 3}]}
    st = klien.post("/api/sinkron", headers=h, json=kirim2).json()["statistik"]
    assert st["xp"] == 40 + 32
    assert st["koin"] == 50 + 15 - 10
    # perangkat lain memuat keadaan yang sama
    semua = klien.get("/api/sinkron", headers=h).json()
    assert {p["id_kasus"] for p in semua["progres"]} == {"b1k1", "b1k2"}


def test_streak_dan_harian(klien):
    h = daftar(klien)
    kini = hari_ini()
    hari = [{"tanggal": (kini - timedelta(days=i)).isoformat()} for i in range(7)]
    st = klien.post("/api/sinkron", headers=h, json={"hari_aktif": hari}).json()["statistik"]
    assert st["streak_saat_ini"] == 7 and "streak_7_hari" in st["lencana"]
    kasus = harian_untuk(kini)
    salah = {"harian": [{"tanggal": kini.isoformat(), "id_kasus": "bukan-ini", "durasi_detik": 30}]}
    assert klien.post("/api/sinkron", headers=h, json=salah).json()["harian"] == []
    benar = {"harian": [{"tanggal": kini.isoformat(), "id_kasus": kasus["id"], "durasi_detik": 80, "bintang": 3}]}
    r = klien.post("/api/sinkron", headers=h, json=benar).json()
    assert len(r["harian"]) == 1 and r["statistik"]["xp"] == 30


def test_mode_kelas_lengkap(klien):
    g = daftar_guru(klien)
    k = klien.post("/api/guru/kelas", headers=g, json={"nama_kelas": "XI RPL 1"}).json()
    kode = k["kode_kelas"]
    assert len(kode) == 6
    s1 = daftar(klien, "Raka", "raka@uji.id", kode_kelas=kode.lower())
    s2 = daftar(klien, "Nadia", "nadia@uji.id")
    assert klien.post("/api/kelas/gabung", headers=s2, json={"kode": "ZZZZZZ"}).status_code == 404
    assert klien.post("/api/kelas/gabung", headers=s2, json={"kode": kode}).json()["sudah"] is False
    r = klien.post("/api/auth/daftar", json={"nama": "X", "email": "x@uji.id", "kata_sandi": "rahasia1", "kode_kelas": "SALAH1"})
    assert r.status_code == 404

    # kasus buatan guru: skrip berbahaya ditolak
    dasar = {
        "judul": "Kunci Lab Hilang", "konsep": "WHERE", "briefing": ["Kunci lab hilang."], "penjelasan": "Dewi lupa.",
        "sumber_data": "sendiri",
        "sql": "CREATE TABLE pinjam (id INTEGER PRIMARY KEY, nama TEXT, jam TEXT);\n"
               "INSERT INTO pinjam VALUES (1, 'Dewi', '15:10'), (2, 'Fajar', '09:00');",
        "langkah": [{"instruksi": "Siapa meminjam setelah 15.00?", "query_kunci": "SELECT nama FROM pinjam WHERE jam > '15:00';"}],
        "tersangka": [{"nama": "Dewi", "avatar": "nadia", "pelaku": True}, {"nama": "Fajar", "avatar": "raka"}],
    }
    for buruk in ["ATTACH DATABASE 'x.db' AS x;", "CREATE TABLE a (x); DROP TABLE a;", "PRAGMA writable_schema = 1;"]:
        r = klien.post("/api/guru/kasus/periksa", headers=g, json=dasar | {"sql": buruk})
        assert r.status_code == 422, buruk
    r = klien.post("/api/guru/kasus/periksa", headers=g, json=dasar | {"langkah": [{"instruksi": "x", "query_kunci": "DELETE FROM pinjam"}]})
    assert r.status_code == 422 and r.json()["detail"]["bagian"] == "langkah1"
    r = klien.post("/api/guru/kasus/periksa", headers=g, json=dasar | {"langkah": [{"instruksi": "x", "query_kunci": "SELECT * FROM pinjam WHERE jam > '23:00'"}]})
    assert r.status_code == 422
    r = klien.post("/api/guru/kasus/periksa", headers=g, json=dasar)
    assert r.status_code == 200, r.text
    assert r.json()["pratinjau"][0]["baris"] == [["Dewi"]]
    langkah = r.json()["data"]["langkah"][0]
    assert langkah["wajib"] == ["WHERE"] and all(langkah["petunjuk"])
    buat = klien.post("/api/guru/kasus", headers=g, json=dasar).json()
    id_kasus = buat["data"]["id"]
    arsip = klien.post("/api/guru/kasus", headers=g, json=dasar | {
        "sumber_data": "arsip", "judul": "Pakai arsip",
        "langkah": [{"instruksi": "Cari Futsal", "query_kunci": "SELECT nama FROM siswa WHERE ekskul = 'Futsal'"}]})
    assert arsip.status_code == 200, arsip.text

    # tugas dan tampilan siswa
    tenggat = (datetime.now(timezone.utc) + timedelta(days=3)).isoformat()
    assert klien.post(f"/api/guru/kelas/{k['id_kelas']}/tugas", headers=g, json={"id_kasus": "b2k1", "tenggat": tenggat}).status_code == 200
    assert klien.post(f"/api/guru/kelas/{k['id_kelas']}/tugas", headers=g, json={"id_kasus": id_kasus, "tenggat": tenggat}).status_code == 200
    lewat = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
    assert klien.post(f"/api/guru/kelas/{k['id_kelas']}/tugas", headers=g, json={"id_kasus": "b2k1", "tenggat": lewat}).status_code == 422
    saya = klien.get("/api/kelas/saya", headers=s1).json()
    assert saya["kelas"][0]["nama_kelas"] == "XI RPL 1" and len(saya["kelas"][0]["tugas"]) == 2
    assert {x["id"] for x in saya["kasus_guru"]} >= {id_kasus}
    assert klien.get(f"/api/kasus/{id_kasus}", headers=s1).status_code == 200
    luar = daftar(klien, "Luar", "luar@uji.id")
    assert klien.get(f"/api/kasus/{id_kasus}", headers=luar).status_code == 404

    # siswa menyelesaikan tugas kasus guru, guru melihat rekap
    klien.post("/api/sinkron", headers=s1, json={
        "progres": [{"id_kasus": id_kasus, "status": "selesai", "bintang": 2, "jumlah_percobaan": 4,
                     "selesai_pada": datetime.now(timezone.utc).isoformat()}],
        "riwayat": [{"id": f"r-{i:06d}", "id_kasus": id_kasus, "konsep": "WHERE", "teks_query": "SELECT", "hasil_benar": i == 0,
                     "jenis_error": None if i == 0 else "kolom"} for i in range(4)],
    })
    saya = klien.get("/api/kelas/saya", headers=s1).json()
    st = {t["id_kasus"]: t["selesai"] for t in saya["kelas"][0]["tugas"]}
    assert st == {"b2k1": False, id_kasus: True}
    d = klien.get(f"/api/guru/kelas/{k['id_kelas']}", headers=g).json()
    assert {a["nama"] for a in d["anggota"]} == {"Raka", "Nadia"}
    where = next(x for x in d["rekap_konsep"] if x["konsep"] == "WHERE")
    assert where["total"] == 4 and where["salah"] == 3 and where["kesalahan_umum"][0]["jenis"] == "kolom"
    nadia = next(a for a in d["anggota"] if a["nama"] == "Nadia")
    assert "Belum pernah bermain" in nadia["perlu_perhatian"]
    raka = next(a for a in d["anggota"] if a["nama"] == "Raka")
    detail = klien.get(f"/api/guru/kelas/{k['id_kelas']}/siswa/{raka['id']}", headers=g).json()
    assert detail["progres"][0]["status"] == "selesai" and len(detail["riwayat"]) == 4
    csv = klien.get(f"/api/guru/kelas/{k['id_kelas']}/rekap.csv", headers=g)
    assert csv.status_code == 200 and "Raka" in csv.text

    # guru lain tidak bisa melihat kelas ini, siswa tidak bisa memakai rute guru
    g2 = daftar_guru(klien, "lain@uji.id")
    assert klien.get(f"/api/guru/kelas/{k['id_kelas']}", headers=g2).status_code == 404
    assert klien.get(f"/api/guru/kelas/{k['id_kelas']}", headers=s1).status_code == 403

    # peringkat harian
    kini = hari_ini()
    klien.post("/api/sinkron", headers=s1, json={"harian": [{"tanggal": kini.isoformat(), "id_kasus": harian_untuk(kini)["id"],
                                                            "durasi_detik": 60, "bintang": 3}]})
    klien.post("/api/sinkron", headers=s2, json={"harian": [{"tanggal": kini.isoformat(), "id_kasus": harian_untuk(kini)["id"],
                                                            "durasi_detik": 45, "bintang": 3}]})
    p = klien.get(f"/api/harian/peringkat?id_kelas={k['id_kelas']}", headers=s1).json()
    assert [x["nama"] for x in p["daftar"]] == ["Nadia", "Raka"]
    assert klien.get(f"/api/harian/peringkat?id_kelas={k['id_kelas']}", headers=luar).status_code == 403

    # hapus kasus menyembunyikannya dan menghapus tugasnya
    assert klien.delete(f"/api/guru/kasus/{id_kasus}", headers=g).status_code == 200
    saya = klien.get("/api/kelas/saya", headers=s1).json()
    assert id_kasus not in {x["id"] for x in saya["kasus_guru"]}
    assert len(saya["kelas"][0]["tugas"]) == 1
    kode_baru = klien.post(f"/api/guru/kelas/{k['id_kelas']}/kode-baru", headers=g).json()["kode_kelas"]
    assert kode_baru != kode
