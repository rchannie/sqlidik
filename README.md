# SQLidik

Game detektif untuk belajar SQL, ditujukan untuk siswa SMK jurusan RPL. Siswa memecahkan kasus singkat di sekolah dengan menulis query SQL, mengumpulkan bukti dari hasil query, lalu menuduh pelaku. Satu kasus membahas satu konsep: SELECT, WHERE, LIKE, agregasi (COUNT, SUM, GROUP BY), dan JOIN.

Tugas besar mata kuliah Mobile Programming (IK300), Kelompok 7, Pendidikan Ilmu Komputer 5A.

## Isi folder

```
sqlidik/
  app/        Aplikasi React Native (Expo SDK 58). Satu kode untuk Android dan web.
  backend/    Server FastAPI: akun, sinkron progres, Mode Kelas, kasus buatan guru.
  konten/     Sumber cerita dan basis data kasus. Diubah lalu dirakit menjadi konten.json.
  alat/       Skrip pengolah audio (olah_suara.py).
  suara_asli/ File audio asli sebelum diolah. Tidak ikut git.
  DEPLOY.md   Panduan memasang ke Supabase, Railway, Vercel, dan membuat APK.
```

Bagian penting di dalam `app/src`:

| Folder | Isi |
|---|---|
| `app/` | Layar (Expo Router). `(utama)` berisi menu bawah: Kasus, Harian, Arsip, Kelas, Profil. `kasus/[id].tsx` berisi alur Briefing, Investigasi, Tuduh Pelaku, dan Hasil. `guru/` berisi dasbor kelas, detail siswa, dan penyunting kasus. |
| `komponen/` | Komponen tampilan pixel: tombol, kotak, terminal query, mode blok, Peta Tabel, Lihat Proses. `gerak.tsx` berisi animasi pixel (melayang, denyut, goyang, stempel, konfeti) dan `latar.tsx` berisi latar bergerak (hujan, lampu kota, monitor). |
| `mesin/` | Mesin SQL. `sqlite.ts` memakai expo-sqlite di HP, `sqlite.web.ts` memakai sql.js di browser. `periksa.ts` membandingkan hasil query siswa dengan query kunci. `proses.ts` memecah query menjadi tahapan untuk fitur Lihat Proses. |
| `permainan/` | Aturan XP, koin, pangkat, streak, lencana, dan kunci berkas. Aturannya sama dengan `backend/app/permainan.py`. |
| `data/` | Penyimpanan di perangkat, antrian sinkron, dan pengingat harian. |
| `suara/` | Musik dan efek suara (expo-audio). `katalog.ts` berisi nama, pengganti, dan volume dasar setiap suara. `mesin.ts` memutar musik per layar dan efek. `berkas.ts` dibuat otomatis oleh `alat/olah_suara.py`. |
| `konten/konten.json` | Hasil rakitan dari folder `konten/` di akar proyek. |

## Fitur

- 5 berkas dengan 10 kasus utama, 10 Kasus Harian yang berganti setiap hari, dan 25 latihan Ruang Arsip.
- Terminal Query dengan pesan error berbahasa Indonesia, tombol cepat untuk tanda dan kata kunci yang repot diketik di HP (`* , ' = > <`, SELECT, FROM, WHERE), Mode Blok untuk menyusun query dengan mengetuk, Peta Tabel, dan Lihat Proses (FROM, WHERE, GROUP BY, HAVING, SELECT). Kutip melengkung dari papan ketik HP otomatis diganti kutip lurus, dan jam atau tanggal yang lupa diberi kutip langsung diberi saran.
- Dialog Komandan bisa maju dan mundur (LANJUT dan KEMBALI). Tombol MULAI INVESTIGASI dan MULAI TES baru aktif setelah dialog dibaca sampai selesai.
- Petunjuk tiga tingkat yang dibayar koin, bukti dari hasil query, dan layar tuduh pelaku. Setelah dua kali salah di langkah yang sama, Komandan mengingatkan bahwa petunjuk bisa dibuka.
- XP, empat pangkat detektif, koin, bintang 1 sampai 3, streak dengan kasus pemulihan, dan enam lencana.
- Tes penempatan, Buku Catatan Detektif, Latihan Ulang untuk konsep yang sering salah, dan pengingat harian (Android).
- Musik latar 8-bit per layar dan efek suara. Musik dan efek bisa dinyalakan, dimatikan, dan diatur volumenya di Pengaturan.
- Animasi pixel bergaya patah-patah memakai Reanimated: hujan dan lampu kota di layar judul, kertas berayun di papan kasus, tersangka bergerak di layar tuduh, stempel, bintang, dan konfeti di layar hasil. Animasi otomatis mati kalau perangkat memakai pengaturan kurangi gerakan.
- Tombol kembali ke menu awal di setiap tab (dan tombol kembali Android), jadi tidak perlu keluar akun untuk kembali ke layar judul.
- Bisa dimainkan offline. Progres disimpan di HP lalu dikirim ke server saat online.
- Akun siswa dan guru. Akun guru hanya bisa dibuat dengan kode pendaftaran guru.
- Mode Kelas: kode kelas, tugas bertenggat, kasus buatan guru, rekap konsep yang paling sering salah, siswa yang perlu perhatian, detail riwayat query per siswa, papan peringkat Kasus Harian, dan unduhan rekap CSV.
- Semua fitur siswa dan guru tersedia di aplikasi Android maupun versi web.

## Menjalankan di laptop

Butuh Python 3.12 atau lebih baru dan Node.js 20 atau lebih baru.

### 1. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # di Linux/Mac: source .venv/bin/activate
pip install -r requirements.txt
copy .env.example .env          # di Linux/Mac: cp .env.example .env
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Tanpa `DATABASE_URL`, server memakai SQLite (file `backend/sqlidik.db`), jadi tidak perlu memasang PostgreSQL untuk mencoba. Buka http://localhost:8000/docs untuk melihat semua endpoint.

Akun guru dibuat lewat tab **Guru** di layar masuk dengan kode `KODE_DAFTAR_GURU` dari file `.env`, atau lewat terminal:

```bash
python kelola.py buat-guru
```

### 2. Aplikasi

```bash
cd app
npm install
copy .env.example .env          # isi EXPO_PUBLIC_API_URL dengan IP laptop, misalnya http://192.168.1.5:8000
npx expo start
```

- **HP Android:** pasang Expo Go dari Play Store, lalu pindai kode QR yang muncul. HP dan laptop harus memakai Wi-Fi yang sama, dan Windows Firewall harus mengizinkan port 8000.
- **Web:** tekan `w` di terminal Expo. Versi web juga memakai alamat dari `EXPO_PUBLIC_API_URL`. Alamat server bisa diganti kapan saja lewat tombol **Pengaturan** di layar judul.

Expo Go di Play Store hanya mendukung SDK terbaru. Proyek ini memakai SDK 58. Jika Expo Go sudah naik ke SDK yang lebih baru, pakai APK dari EAS Build (lihat `DEPLOY.md`).

## Mengubah atau menambah kasus

Cerita dan data kasus ditulis di `konten/kasus_utama.py` (kasus utama) dan `konten/arsip.py` (basis data Arsip Sekolah, Kasus Harian, latihan, tes penempatan, dan Buku Catatan). Setelah mengubah, jalankan:

```bash
python konten/bangun.py
```

Perintah ini menjalankan setiap query kunci di SQLite, memastikan setiap kasus punya tepat satu pelaku dan tiga tingkat petunjuk, lalu menyalin hasilnya ke `app/src/konten/konten.json` dan `backend/app/konten.json`. Jika ada yang salah, tidak ada file yang disalin. Laporan hasil setiap query ada di `konten/dist/laporan.txt`.

Guru juga bisa membuat kasus sendiri langsung dari aplikasi tanpa mengubah kode.

## Musik dan efek suara

Semua audio ada di `app/assets/suara/` dalam satu folder. Nama file mengikuti kolom Nama File di Daftar Suara SQLidik. File sudah diubah ke mp3, dikecilkan (38,5 MB menjadi 13,7 MB), dan volumenya diratakan ke -16 LUFS. Keras pelannya musik dibanding efek diatur lewat `VOLUME_DASAR` di `app/src/suara/katalog.ts`.

| Layar | Musik |
|---|---|
| Judul, Masuk, Daftar | `musik_judul` dan suara hujan pelan |
| Peta Kasus | `musik_peta` dan suara hujan pelan |
| Kasus Harian, Ruang Arsip, Kelas, Profil (siswa) | `musik_peta` |
| Briefing dan Investigasi | `musik_investigasi` (Kasus Harian: `musik_harian`) |
| Tuduh Pelaku | `musik_tuduh` |
| Hasil Kasus | `jingle_menang`, lalu `musik_peta` setelah bunyi hadiah selesai |
| Latihan Ruang Arsip, Buku Catatan, Tes Penempatan | `musik_arsip` |
| Semua layar guru | tanpa musik |

Efek diputar sesuai kolom Dipakai Saat. Kalau file opsional tidak ada, aplikasi memakai suara di kolom Pengganti (lihat `PENGGANTI` di `katalog.ts`). Di versi web, musik baru mulai setelah layar diketuk pertama kali karena browser tidak mengizinkan suara sebelum ada interaksi.

Untuk mengganti atau menambah suara:

1. Taruh file asli (mp3, wav, atau ogg) di folder `suara_asli/` dengan nama sesuai Daftar Suara.
2. Pasang ffmpeg (Windows: `winget install ffmpeg`) dan paket Python `pip install numpy soundfile pyloudnorm`.
3. Dari folder proyek paling atas, jalankan `python alat/olah_suara.py`.

Skrip ini mengubah semua file ke mp3, memotong hening di awal, meratakan volume, lalu menulis ulang `app/assets/suara/` dan `app/src/suara/berkas.ts`. Jangan menaruh file langsung di `app/assets/suara/` tanpa skrip ini, karena file tersebut tidak akan terdaftar di aplikasi.

## Pengujian

```bash
cd backend && python -m pytest          # API, sinkron, Mode Kelas, validasi kasus guru
cd app && npm run periksa               # pemeriksaan tipe TypeScript
cd app && npm run uji                   # semua query kunci, pemeriksa jawaban, Lihat Proses, aturan game
```

Untuk menguji backend dengan PostgreSQL, isi `DATABASE_URL` sebelum menjalankan pytest.

## Pembagian bagian kode

Mengikuti pembagian tugas di proposal:

| Anggota | Bagian | Folder utama |
|---|---|---|
| Muhammad Raditya Santosa | Integrasi aplikasi dengan API, build APK | `app/src/data`, `app/src/api`, `DEPLOY.md` |
| Hanif Habiburrahman | FastAPI, PostgreSQL, autentikasi, Mode Kelas | `backend/` |
| Kaisya Azzahra Salsabila | Mesin kasus, Terminal Query, mode blok, pemeriksa jawaban | `app/src/mesin`, `app/src/permainan` |
| Kayla Emira Qonitah | Layar dan komponen tampilan | `app/src/app`, `app/src/komponen` |
| Rifa Nur Habibah | Cerita dan basis data kasus, aset pixel art | `konten/`, `app/assets/game` |
