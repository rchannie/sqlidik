# Panduan Deploy SQLidik

Susunannya sama dengan Jejak Kode dan FitLearn:

| Bagian | Layanan | Isi |
|---|---|---|
| Basis data | **Supabase** (akun anggota lain) | PostgreSQL untuk akun, kelas, progres, dan kasus guru |
| Server | **Railway** | FastAPI dari folder `backend` |
| Versi web | **Vercel** | Expo web dari folder `app` |
| Aplikasi Android | **EAS Build** | File APK dari folder `app` |

```
Versi web  ──> https://sqlidik.vercel.app ──(/api/...)──┐
Aplikasi Android ──────────────────────────────────────>├──> Railway (FastAPI) ──> Supabase (PostgreSQL)
```

Versi web memanggil `/api` di alamatnya sendiri, lalu Vercel meneruskannya ke Railway. Aplikasi Android memanggil alamat Railway secara langsung.

Urutannya: Supabase, Railway, Vercel, lalu APK.

---

## 1. Unggah proyek ke GitHub

```bash
cd C:\laragon\www\sqlidik
git init
git add .
git commit -m "SQLidik versi 1.0"
```

Buat repository di github.com (boleh private), lalu jalankan perintah `git remote add origin ...` dan `git push -u origin main` yang ditampilkan GitHub. File `.gitignore` sudah mengatur supaya `node_modules`, hasil build, dan file `.env` tidak ikut terunggah.

Tambahkan anggota kelompok sebagai collaborator supaya semua bisa ikut mengerjakan.

## 2. Basis data di Supabase

Supabase gratis hanya boleh 2 project aktif, jadi pakai akun anggota yang slotnya masih kosong (misalnya Hanif sebagai penanggung jawab backend).

1. Di [supabase.com](https://supabase.com), buat project baru dengan region **Southeast Asia (Singapore)**.
2. Buat *Database Password* dan catat. Pakai huruf dan angka saja supaya tidak perlu diubah formatnya.
3. Setelah project siap, klik **Connect**, lalu pilih **Session pooler**. Salin alamatnya, bentuknya seperti:
   ```
   postgresql://postgres.abcdefgh:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
   ```
   Ganti `[PASSWORD]` dengan password tadi. **Jangan pakai Direct connection**, karena Railway tidak bisa menjangkau alamat direct Supabase.

Tabel dibuat otomatis oleh server saat pertama kali jalan. Server juga menyalakan Row Level Security di semua tabel, supaya data tidak bisa dibaca lewat API publik Supabase.

Project Supabase gratis dijeda kalau seminggu tidak dipakai. Cek dashboard sebelum presentasi atau uji coba di kelas.

## 3. Server di Railway

1. Di [railway.com](https://railway.com), pilih **New Project**, lalu **Deploy from GitHub repo** dan pilih repository SQLidik.
2. Buka **Settings** pada service tersebut:
   - **Root Directory**: `/backend`
   - **Region**: Singapore
3. Buka **Variables**, lalu isi:

   | Variabel | Isi |
   |---|---|
   | `DATABASE_URL` | Alamat Session pooler dari Supabase |
   | `JWT_SECRET` | Teks acak yang panjang, misalnya hasil `python -c "import secrets; print(secrets.token_urlsafe(48))"` |
   | `KODE_DAFTAR_GURU` | Kode untuk guru yang mendaftar, misalnya `sqlidik-guru-2026`. Kosongkan untuk menutup pendaftaran guru |

4. Buka **Settings > Networking**, lalu klik **Generate Domain**. Catat alamatnya, misalnya `https://sqlidik-api.up.railway.app`.
5. Cek dengan membuka `https://ALAMAT-RAILWAY/api/info`. Jika muncul `{"nama":"SQLidik",...}`, server sudah jalan.

Railway mengenali FastAPI dari `requirements.txt` dan menjalankan `uvicorn main:app` sendiri, jadi tidak perlu menulis start command.

Supaya kredit tidak cepat habis, nyalakan fitur **Serverless** agar server tidur saat sepi. Permintaan pertama setelah server tidur butuh beberapa detik. Aplikasi menunggu sampai 40 detik sebelum menyatakan gagal, dan progres tetap aman di HP selama menunggu.

## 4. Versi web di Vercel

1. Buka `app/vercel.json`, ganti `GANTI-DENGAN-ALAMAT-RAILWAY` dengan alamat Railway tanpa `https://`. Contoh:
   ```json
   { "source": "/api/:path*", "destination": "https://sqlidik-api.up.railway.app/api/:path*" }
   ```
   Commit dan push perubahan ini.
2. Di [vercel.com](https://vercel.com), pilih **Add New > Project** dan import repository SQLidik.
3. Isi **Root Directory** dengan `app`. Perintah build dan folder hasil sudah diatur di `vercel.json`.
4. Klik **Deploy**.

## 5. APK Android dengan EAS Build

1. Buka `app/eas.json`, ganti kedua `https://GANTI-DENGAN-ALAMAT-RAILWAY` dengan alamat Railway lengkap (dengan `https://`).
2. Buat akun gratis di [expo.dev](https://expo.dev), lalu di folder `app` jalankan:
   ```bash
   npx eas-cli@latest login
   npx eas-cli@latest build -p android --profile preview
   ```
   Saat pertama kali, EAS akan menanyakan pembuatan project dan keystore. Jawab **Yes** untuk semuanya.
3. Setelah build selesai (biasanya 10 sampai 20 menit), EAS memberikan tautan untuk mengunduh APK. Bagikan tautan itu ke siswa, atau pindai kode QR-nya dari HP.

Kalau alamat server berubah, ubah `eas.json` lalu build ulang. Siswa juga bisa mengganti alamat server dari tombol **Pengaturan** di layar judul.

## Memeriksa setelah deploy

1. Buka versi web, daftar sebagai guru dengan kode `KODE_DAFTAR_GURU`, lalu buat kelas.
2. Di HP, pasang APK, daftar sebagai siswa dengan kode kelas tadi, lalu mainkan satu kasus.
3. Kembali ke dasbor kelas di web. Siswa tadi harus muncul lengkap dengan kasus yang selesai dan riwayat query-nya.
