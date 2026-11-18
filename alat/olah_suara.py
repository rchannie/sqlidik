"""
Olah audio SQLidik: ubah semua file di folder suara asli menjadi mp3 yang kecil
dengan volume yang rata, lalu tulis daftar berkasnya untuk aplikasi.

Pakai (dari folder proyek paling atas):
    python alat/olah_suara.py
    python alat/olah_suara.py --asli folder_lain

Butuh ffmpeg di PATH dan paket Python berikut:
    pip install numpy soundfile pyloudnorm

Masukan : suara_asli/<nama>.(mp3|wav|ogg|m4a|flac|aac)
Keluaran: app/assets/suara/<nama>.mp3 dan app/src/suara/berkas.ts

Yang dilakukan pada setiap file:
1. Hening di awal dipotong supaya efek langsung terdengar saat tombol diketuk.
   Ekor efek yang sudah hampir tidak terdengar juga dipotong.
2. Volume diratakan ke -16 LUFS (ukuran kekerasan suara yang dipakai platform musik),
   dengan pembatas puncak di -1,5 dBFS supaya tidak pecah.
   Perbandingan keras pelan antarsuara (musik lebih pelan dari efek, dan sebagainya)
   diatur di app/src/suara/katalog.ts, bukan di file.
3. Disimpan sebagai mp3 44,1 kHz. Musik 96 kbps, efek 96 kbps (stereo) atau 64 kbps (mono).
   File stereo yang kiri dan kanannya hampir sama diubah ke mono.

File yang namanya tidak ada di daftar NAMA di bawah dilewati.
File opsional yang tidak ada tidak masalah: aplikasi memakai suara penggantinya.
"""
import argparse
import os
import shutil
import subprocess
import sys
import tempfile

import numpy as np
import pyloudnorm as pyln
import soundfile as sf

AKAR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KELUAR = os.path.join(AKAR, "app", "assets", "suara")
DAFTAR_TS = os.path.join(AKAR, "app", "src", "suara", "berkas.ts")

SR = 44100
TARGET_LUFS = -16.0
BATAS_PUNCAK = -1.5  # dBFS
MAKS_TEKAN = 6.0  # dB, penekanan limiter paling banyak. Kalau perlu lebih, file dibiarkan sedikit lebih pelan.
EKSTENSI = (".mp3", ".wav", ".ogg", ".m4a", ".flac", ".aac")

# Nama file dan jenisnya. Harus sama dengan app/src/suara/katalog.ts.
NAMA = {
    "musik_judul": "musik", "musik_peta": "musik", "musik_investigasi": "musik", "musik_tuduh": "musik",
    "musik_harian": "musik", "musik_arsip": "musik", "suasana_hujan": "suasana",
    "jingle_menang": "jingle", "jingle_pangkat": "jingle",
    "ui_tap": "efek", "ui_kembali": "efek", "ui_galat": "efek", "dialog_lanjut": "efek", "ui_tab": "efek",
    "ui_lembar": "efek", "berkas_buka": "efek", "berkas_terkunci": "efek", "berkas_terbuka": "efek",
    "query_jalan": "efek", "query_benar": "efek", "query_salah": "efek", "query_error": "efek",
    "blok_pasang": "efek", "blok_lepas": "efek", "proses_tahap": "efek", "petunjuk_buka": "efek",
    "koin_kurang": "efek", "stempel_terbukti": "efek", "stempel_ditolak": "efek", "tersangka_pilih": "efek",
    "bintang": "efek", "koin_dapat": "efek", "lencana_dapat": "efek", "xp_naik": "efek", "streak_naik": "efek",
}

# Turunan dari bintang.mp3 untuk bintang kedua dan ketiga (nadanya naik 4 dan 7 semiton).
TURUNAN = {"bintang_2": ("bintang", 4), "bintang_3": ("bintang", 7)}


def jalankan(perintah):
    r = subprocess.run(perintah, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(" ".join(perintah) + "\n" + r.stderr[-2000:])
    return r


def baca(path):
    """Baca file audio apa saja lewat ffmpeg, hasilnya float32 44,1 kHz maksimal 2 kanal."""
    with tempfile.TemporaryDirectory() as tmp:
        wav = os.path.join(tmp, "a.wav")
        jalankan(["ffmpeg", "-v", "error", "-y", "-i", path, "-vn", "-ar", str(SR), "-c:a", "pcm_f32le", wav])
        x, sr = sf.read(wav, dtype="float32", always_2d=True)
    if x.shape[1] > 2:
        x = x[:, :2]
    return x


def db_blok(mono, blok):
    n = max(1, len(mono) // blok)
    rms = np.sqrt(np.mean(mono[: n * blok].reshape(n, blok) ** 2, axis=1))
    return 20 * np.log10(rms + 1e-12)


def pudar(x, masuk_detik, keluar_detik):
    y = x.copy()
    a = min(len(y), int(SR * masuk_detik))
    b = min(len(y), int(SR * keluar_detik))
    if a > 0:
        y[:a] *= (np.sin(np.linspace(0, np.pi / 2, a)) ** 2)[:, None]
    if b > 0:
        y[-b:] *= (np.cos(np.linspace(0, np.pi / 2, b)) ** 2)[:, None]
    return y


def potong(x, jenis):
    """Buang hening di awal dan ekor yang sudah tidak terdengar."""
    blok = int(SR * 0.01)
    mono = x.mean(axis=1)
    db = db_blok(mono, blok)
    puncak = db.max()
    n = len(db)
    if jenis in ("musik", "suasana"):
        aktif = np.where(db > -60)[0]
        a, b = (aktif[0], aktif[-1] + 1) if len(aktif) else (0, n)
        mulai = a * blok if a >= 3 else 0  # hening depan 30 ms atau lebih
        akhir = min(len(x), (b + 5) * blok) if n - b >= 30 else len(x)  # hening belakang 300 ms atau lebih
        return pudar(x[mulai:akhir], 0.003, 0.003)
    depan = max(puncak - 50, -75)
    belakang = max(puncak - (45 if jenis == "jingle" else 35), -70)
    aktif_depan = np.where(db > depan)[0]
    aktif_belakang = np.where(db > belakang)[0]
    if not len(aktif_depan):
        return x
    mulai = max(0, aktif_depan[0] - 1) * blok
    akhir = min(len(x), (aktif_belakang[-1] + 3) * blok)
    y = x[mulai:akhir]
    durasi = len(y) / SR
    return pudar(y, 0.002, min(0.15 if jenis == "jingle" else 0.04, durasi * 0.25))


def kekerasan(x):
    meter = pyln.Meter(SR)
    if len(x) < SR * 3:  # file pendek diberi hening di kedua sisi supaya bisa diukur, hening tidak ikut dihitung
        pad = np.zeros((SR, x.shape[1]), dtype=x.dtype)
        x = np.vstack([pad, x, pad])
    return meter.integrated_loudness(x)


def stereo_berarti(x):
    if x.shape[1] < 2:
        return False
    mid = np.sqrt(np.mean(((x[:, 0] + x[:, 1]) / 2) ** 2)) + 1e-12
    side = np.sqrt(np.mean(((x[:, 0] - x[:, 1]) / 2) ** 2)) + 1e-12
    return 20 * np.log10(side / mid) > -30


def tulis_mp3(x, path, jenis, limiter):
    stereo = stereo_berarti(x)
    if not stereo:
        x = x.mean(axis=1, keepdims=True)
    if jenis == "suasana":
        bitrate = "64k"
    elif stereo:
        bitrate = "96k"
    else:
        bitrate = "64k"
    with tempfile.TemporaryDirectory() as tmp:
        wav = os.path.join(tmp, "b.wav")
        sf.write(wav, x, SR, subtype="FLOAT")
        filter_ = []
        if limiter:
            batas = 10 ** (BATAS_PUNCAK / 20)
            filter_ = ["-af", f"alimiter=limit={batas:.4f}:attack=1:release=60:level=false:latency=true"]
        jalankan(
            ["ffmpeg", "-v", "error", "-y", "-i", wav, *filter_, "-ar", str(SR), "-ac", str(x.shape[1]),
             "-c:a", "libmp3lame", "-b:a", bitrate, "-map_metadata", "-1", "-id3v2_version", "0",
             "-write_xing", "1", path]
        )
    return stereo, bitrate


def naikkan_nada(x, semiton):
    """Naikkan nada dengan mempercepat (seperti memutar piringan lebih cepat). Durasi ikut memendek."""
    r = 2 ** (semiton / 12)
    with tempfile.TemporaryDirectory() as tmp:
        a = os.path.join(tmp, "a.wav")
        b = os.path.join(tmp, "b.wav")
        sf.write(a, x, SR, subtype="FLOAT")
        jalankan(["ffmpeg", "-v", "error", "-y", "-i", a, "-af", f"asetrate={SR * r:.0f},aresample={SR}", "-c:a", "pcm_f32le", b])
        y, _ = sf.read(b, dtype="float32", always_2d=True)
    return y


def ratakan(x):
    """Atur volume ke TARGET_LUFS. Mengembalikan (x, perlu_limiter, gain_db, lufs_awal)."""
    lufs = kekerasan(x)
    if not np.isfinite(lufs):
        return x, False, 0.0, lufs
    gain = TARGET_LUFS - lufs
    puncak = 20 * np.log10(np.abs(x).max() + 1e-12)
    lebih = puncak + gain - BATAS_PUNCAK
    if lebih > MAKS_TEKAN:
        gain -= lebih - MAKS_TEKAN
    y = x * (10 ** (gain / 20))
    return y.astype(np.float32), puncak + gain > BATAS_PUNCAK, gain, lufs


def ukur(path):
    x = baca(path)
    return kekerasan(x), 20 * np.log10(np.abs(x).max() + 1e-12), len(x) / SR


def tulis_daftar(hasil):
    nama_urut = sorted(hasil)
    baris = [
        "/* File ini dibuat otomatis oleh alat/olah_suara.py. Jangan diubah manual, jalankan ulang skripnya. */",
        "import type { NamaBerkas } from './katalog';",
        "",
        "/** Berkas suara yang tersedia. Yang tidak ada di sini memakai suara pengganti dari katalog. */",
        "export const BERKAS: Partial<Record<NamaBerkas, number>> = {",
    ]
    for n in nama_urut:
        baris.append(f"  {n}: require('../../assets/suara/{n}.mp3'),")
    baris += ["};", "", "/** Durasi setiap berkas dalam detik. */", "export const DURASI: Partial<Record<NamaBerkas, number>> = {"]
    for n in nama_urut:
        baris.append(f"  {n}: {hasil[n]:.2f},")
    baris += ["};", ""]
    os.makedirs(os.path.dirname(DAFTAR_TS), exist_ok=True)
    with open(DAFTAR_TS, "w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(baris))


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--asli", default=os.path.join(AKAR, "suara_asli"), help="folder berisi file audio asli")
    a = p.parse_args()

    if not shutil.which("ffmpeg"):
        sys.exit("ffmpeg tidak ditemukan. Pasang dulu (Windows: winget install ffmpeg) lalu buka terminal baru.")
    if not os.path.isdir(a.asli):
        sys.exit(f"Folder {a.asli} tidak ada.")

    masukan = {}
    for f in sorted(os.listdir(a.asli)):
        nama, ext = os.path.splitext(f)
        if ext.lower() not in EKSTENSI:
            continue
        if nama not in NAMA:
            print(f"  lewati {f}: nama tidak ada di daftar")
            continue
        if nama in masukan:
            print(f"  lewati {f}: {nama} sudah ada dengan ekstensi lain")
            continue
        masukan[nama] = os.path.join(a.asli, f)

    os.makedirs(KELUAR, exist_ok=True)
    sementara = tempfile.mkdtemp()
    durasi = {}
    total_asli = total_baru = 0
    print(f"{'nama':20s} {'asli':>9s} {'baru':>8s} {'LUFS':>12s} {'durasi':>14s}  format")
    try:
        olahan = {}
        for nama, path in masukan.items():
            jenis = NAMA[nama]
            x = baca(path)
            d0 = len(x) / SR
            x = potong(x, jenis)
            x, lim, gain, lufs0 = ratakan(x)
            olahan[nama] = x
            keluar = os.path.join(sementara, nama + ".mp3")
            stereo, br = tulis_mp3(x, keluar, jenis, lim)
            lufs1, _, d1 = ukur(keluar)
            durasi[nama] = d1
            u0, u1 = os.path.getsize(path), os.path.getsize(keluar)
            total_asli += u0
            total_baru += u1
            print(f"{nama:20s} {u0/1024:8.0f}K {u1/1024:7.0f}K {lufs0:5.1f} > {lufs1:5.1f} {d0:6.2f} > {d1:6.2f}  {br} {'stereo' if stereo else 'mono'}")
        for nama, (induk, semiton) in TURUNAN.items():
            if induk not in olahan:
                continue
            y = naikkan_nada(olahan[induk], semiton)
            keluar = os.path.join(sementara, nama + ".mp3")
            tulis_mp3(y, keluar, NAMA[induk], np.abs(y).max() > 10 ** (BATAS_PUNCAK / 20))
            durasi[nama] = ukur(keluar)[2]
            total_baru += os.path.getsize(keluar)
            print(f"{nama:20s} {'':9s} {os.path.getsize(keluar)/1024:7.0f}K  turunan {induk}, +{semiton} semiton")

        # Ganti isi folder keluaran dengan hasil baru. File lama yang sudah tidak ada asalnya ikut dihapus.
        for f in os.listdir(KELUAR):
            if f.lower().endswith(EKSTENSI):
                os.remove(os.path.join(KELUAR, f))
        for f in os.listdir(sementara):
            shutil.move(os.path.join(sementara, f), os.path.join(KELUAR, f))
    finally:
        shutil.rmtree(sementara, ignore_errors=True)

    tulis_daftar(durasi)
    hilang = [n for n in NAMA if n not in masukan]
    print(f"\nTotal {total_asli/1048576:.1f} MB menjadi {total_baru/1048576:.1f} MB.")
    if hilang:
        print("Tidak ada (memakai pengganti): " + ", ".join(hilang))
    print(f"Daftar berkas ditulis ke {os.path.relpath(DAFTAR_TS, AKAR)}")


if __name__ == "__main__":
    main()
