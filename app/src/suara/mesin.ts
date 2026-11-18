/*
 * Mesin suara SQLidik dengan expo-audio. Jalan di Android, iOS, dan web.
 *
 * - Musik latar diputar loop per layar. Setiap layar memanggil useMusikLayar(); layar yang sedang
 *   fokus menentukan lagunya. Lagu yang sama tidak diulang dari awal saat pindah layar.
 * - Efek diputar dengan efek('ui_tap'). Jingle (menang, naik pangkat) menjeda musik sebentar.
 * - Berkas opsional yang tidak ada diganti sesuai PENGGANTI di katalog.ts.
 * - Di web, suara baru dibunyikan setelah ketukan atau tombol keyboard pertama (aturan autoplay browser).
 * - Pengaturan musik dan efek (nyala/mati dan volume) disimpan di perangkat.
 */
import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { useIsFocused } from 'expo-router';
import { useEffect, useSyncExternalStore } from 'react';
import { AppState, Platform } from 'react-native';

import { bacaJson, simpanJson } from '../data/simpan';
import { BERKAS, DURASI } from './berkas';
import { EFEK_SIAGA, NamaBerkas, NamaEfek, NamaJingle, NamaMusik, PENGGANTI, VOLUME_DASAR } from './katalog';

const WEB = Platform.OS === 'web';
const MAKS_MUSIK = 3; // lagu yang disimpan di memori supaya bisa disambung, bukan diulang
const MAKS_EFEK = WEB ? 32 : 14; // pemutar efek yang disimpan; yang paling lama tidak dipakai dilepas

/* ------------------------------------------------------------------ pengaturan */

export const TINGKAT_MAKS = 10;
export type PengaturanSuara = { musik: boolean; tingkatMusik: number; efek: boolean; tingkatEfek: number };
const BAWAAN: PengaturanSuara = { musik: true, tingkatMusik: 8, efek: true, tingkatEfek: 10 };
const KUNCI = 'sqlidik:suara';

let atur: PengaturanSuara = BAWAAN;
const pendengar = new Set<() => void>();

export function usePengaturanSuara(): PengaturanSuara {
  return useSyncExternalStore(
    (cb) => {
      pendengar.add(cb);
      return () => pendengar.delete(cb);
    },
    () => atur,
    () => atur,
  );
}

function rapikanTingkat(t: unknown, cadangan: number): number {
  const n = typeof t === 'number' && isFinite(t) ? Math.round(t) : cadangan;
  return Math.max(0, Math.min(TINGKAT_MAKS, n));
}

export function ubahPengaturanSuara(ubah: Partial<PengaturanSuara>) {
  const baru = { ...atur, ...ubah };
  atur = {
    musik: !!baru.musik,
    efek: !!baru.efek,
    tingkatMusik: rapikanTingkat(baru.tingkatMusik, BAWAAN.tingkatMusik),
    tingkatEfek: rapikanTingkat(baru.tingkatEfek, BAWAAN.tingkatEfek),
  };
  pendengar.forEach((p) => p());
  simpanJson(KUNCI, atur);
  terapkanMusik(150);
}

/** Tingkat 0 sampai 10 diubah ke penguatan. Dikuadratkan supaya terasa rata di telinga. */
function kurva(tingkat: number): number {
  const s = Math.max(0, Math.min(1, tingkat / TINGKAT_MAKS));
  return s * s;
}

function batas01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

/* ------------------------------------------------------------------ berkas */

/** Cari berkas yang tersedia, ikuti rantai pengganti kalau berkas opsional tidak ada. */
function cari(nama: NamaBerkas): NamaBerkas | null {
  let n: NamaBerkas | null | undefined = nama;
  for (let i = 0; i < 6 && n; i++) {
    if (BERKAS[n] != null) return n;
    n = PENGGANTI[n];
  }
  return null;
}

function volumeDasar(diminta: NamaBerkas, dipakai: NamaBerkas): number {
  return VOLUME_DASAR[diminta] ?? VOLUME_DASAR[dipakai] ?? 0.8;
}

function buatPemutar(nama: NamaBerkas): AudioPlayer | null {
  const sumber = BERKAS[nama];
  if (sumber == null) return null;
  try {
    return createAudioPlayer(sumber, { updateInterval: 1000 });
  } catch {
    return null;
  }
}

function lepasPemutar(p: AudioPlayer) {
  try {
    p.pause();
  } catch {
    // abaikan
  }
  try {
    p.remove();
    p.release();
  } catch {
    // abaikan
  }
}

/* ------------------------------------------------------------------ izin web dan latar belakang */

let izin = !WEB; // di web baru true setelah ketukan pertama
let diLatar = false; // aplikasi di latar belakang atau tab browser disembunyikan

type AktivasiPengguna = { hasBeenActive: boolean; isActive: boolean };
function aktivasi(): AktivasiPengguna | undefined {
  return typeof navigator !== 'undefined' ? ((navigator as any).userActivation as AktivasiPengguna | undefined) : undefined;
}

/** Di web, cek apakah browser sudah mengizinkan suara. */
function bolehBunyi(): boolean {
  if (izin) return true;
  if (aktivasi()?.hasBeenActive) {
    izin = true;
    terapkanMusik();
  }
  return izin;
}

const PEMICU_WEB = ['pointerdown', 'pointerup', 'mousedown', 'touchend', 'keydown', 'click'];

function pasangIzinWeb() {
  if (typeof document === 'undefined') return;
  if (aktivasi()?.hasBeenActive) {
    izin = true;
    return;
  }
  const buka = (e: Event) => {
    if (izin) return lepas();
    const ua = aktivasi();
    // Ketukan layar sentuh baru dihitung browser saat jari diangkat, jadi tunggu sampai browser menganggapnya aktif.
    if (ua ? !ua.isActive : e.type === 'pointerdown' || e.type === 'pointerup') return;
    izin = true;
    lepas();
    terapkanMusik(); // dipanggil langsung di dalam ketukan supaya browser mengizinkan play()
  };
  const lepas = () => PEMICU_WEB.forEach((t) => document.removeEventListener(t, buka, true));
  PEMICU_WEB.forEach((t) => document.addEventListener(t, buka, true));
}

function aturLatar(latar: boolean) {
  if (diLatar === latar) return;
  diLatar = latar;
  if (WEB) {
    // Browser tidak menjeda audio saat tab disembunyikan, jadi dijeda di sini.
    if (latar) {
      for (const s of musik.values()) hentikanSlot(s);
      if (hujan) hentikanSlot(hujan);
      musikAktif = null;
      hujanAktif = false;
    } else {
      terapkanMusik();
    }
    return;
  }
  // Android dan iOS: expo-audio sendiri menjeda semua pemutar saat aplikasi ke latar belakang dan
  // menyambungnya lagi saat kembali. Pemutar yang sudah tidak dipakai dijeda ulang di sini.
  if (!latar) {
    for (const s of [...musik.values(), ...(hujan ? [hujan] : [])]) {
      if (!s.main) {
        try {
          s.p.pause();
        } catch {
          // abaikan
        }
      }
    }
    terapkanMusik();
  }
}

/* ------------------------------------------------------------------ musik latar */

type Slot = { nama: NamaBerkas; p: AudioPlayer; vol: number; main: boolean; pudar: ReturnType<typeof setInterval> | null; dipakai: number };

const musik = new Map<NamaBerkas, Slot>();
let musikAktif: Slot | null = null;
let hujan: Slot | null = null;
let hujanAktif = false;
let tahanan = 0;

let ingin: { musik: NamaMusik | null; hujan: boolean; pemilik: number } = { musik: null, hujan: false, pemilik: 0 };
let nomorPemilik = 0;
let jamLepas: ReturnType<typeof setTimeout> | null = null;

function aturVolume(s: Slot) {
  try {
    s.p.volume = batas01(s.vol);
  } catch {
    // abaikan
  }
}

function hentikanSlot(s: Slot) {
  if (s.pudar) clearInterval(s.pudar);
  s.pudar = null;
  s.vol = 0;
  aturVolume(s);
  if (s.main) {
    try {
      s.p.pause();
    } catch {
      // abaikan
    }
  }
  s.main = false;
}

function pudarKe(s: Slot, target: number, ms: number, selesai?: () => void) {
  if (s.pudar) clearInterval(s.pudar);
  s.pudar = null;
  const langkah = Math.max(1, Math.round(ms / 40));
  const awal = s.vol;
  if (ms <= 0 || Math.abs(target - awal) < 0.005) {
    s.vol = target;
    aturVolume(s);
    selesai?.();
    return;
  }
  let i = 0;
  s.pudar = setInterval(() => {
    i++;
    s.vol = awal + (target - awal) * (i / langkah);
    aturVolume(s);
    if (i >= langkah) {
      if (s.pudar) clearInterval(s.pudar);
      s.pudar = null;
      selesai?.();
    }
  }, 40);
}

function mainkanSlot(s: Slot) {
  if (s.main) return;
  try {
    s.p.loop = true;
    s.p.play();
    s.main = true;
  } catch {
    // abaikan
  }
}

function ambilSlotMusik(nama: NamaBerkas): Slot | null {
  const ada = musik.get(nama);
  if (ada) return ada;
  const p = buatPemutar(nama);
  if (!p) return null;
  const s: Slot = { nama, p, vol: 0, main: false, pudar: null, dipakai: Date.now() };
  aturVolume(s);
  musik.set(nama, s);
  // Lepas lagu yang paling lama tidak dipakai.
  if (musik.size > MAKS_MUSIK) {
    const lama = [...musik.values()].filter((x) => x !== s && x !== musikAktif && !x.main).sort((a, b) => a.dipakai - b.dipakai)[0];
    if (lama) {
      musik.delete(lama.nama);
      lepasPemutar(lama.p);
    }
  }
  return s;
}

/** Cocokkan yang sedang berbunyi dengan yang diminta layar dan pengaturan. */
function terapkanMusik(pudarVolume = 250) {
  const boleh = atur.musik && atur.tingkatMusik > 0 && izin && !diLatar;
  const diminta = ingin.musik;
  const nama = boleh && tahanan === 0 && diminta ? cari(diminta) : null;

  if (musikAktif && musikAktif.nama !== nama) {
    const lama = musikAktif;
    musikAktif = null;
    pudarKe(lama, 0, tahanan ? 150 : 400, () => {
      if (musikAktif !== lama) hentikanSlot(lama);
    });
  }
  if (nama && diminta) {
    const s = musikAktif ?? ambilSlotMusik(nama);
    if (s) {
      const baru = musikAktif !== s;
      musikAktif = s;
      s.dipakai = Date.now();
      mainkanSlot(s);
      pudarKe(s, volumeDasar(diminta, nama) * kurva(atur.tingkatMusik), baru ? 700 : pudarVolume);
    }
  }

  // Suara hujan: lapisan pelan di bawah musik layar judul dan Peta Kasus.
  const namaHujan = boleh && ingin.hujan ? cari('suasana_hujan') : null;
  if (namaHujan) {
    if (!hujan) {
      const p = buatPemutar(namaHujan);
      if (p) hujan = { nama: namaHujan, p, vol: 0, main: false, pudar: null, dipakai: Date.now() };
    }
    if (hujan) {
      const baru = !hujanAktif;
      hujanAktif = true;
      mainkanSlot(hujan);
      pudarKe(hujan, volumeDasar('suasana_hujan', namaHujan) * kurva(atur.tingkatMusik), baru ? 1200 : pudarVolume);
    }
  } else if (hujan && hujanAktif) {
    hujanAktif = false;
    const h = hujan;
    pudarKe(h, 0, 600, () => {
      if (!hujanAktif) hentikanSlot(h);
    });
  }
}

function klaimMusik(m: NamaMusik | null, pakaiHujan: boolean): number {
  if (jamLepas) clearTimeout(jamLepas);
  jamLepas = null;
  nomorPemilik += 1;
  ingin = { musik: m, hujan: pakaiHujan, pemilik: nomorPemilik };
  terapkanMusik();
  return nomorPemilik;
}

function lepasMusik(pemilik: number) {
  // Ditunda sebentar: biasanya layar berikutnya langsung mengklaim musiknya sendiri.
  if (jamLepas) clearTimeout(jamLepas);
  jamLepas = setTimeout(() => {
    jamLepas = null;
    if (ingin.pemilik !== pemilik) return;
    ingin = { musik: null, hujan: false, pemilik: 0 };
    terapkanMusik();
  }, 300);
}

/**
 * Pasang musik latar untuk layar ini. Musik berganti saat layar fokus dan berhenti kalau
 * layar berikutnya tidak memasang musik. null berarti layar ini tanpa musik (misalnya layar guru).
 */
export function useMusikLayar(m: NamaMusik | null, opsi: { hujan?: boolean } = {}) {
  const fokus = useIsFocused();
  const pakaiHujan = !!opsi.hujan;
  useEffect(() => {
    if (!fokus) return;
    const pemilik = klaimMusik(m, pakaiHujan);
    return () => lepasMusik(pemilik);
  }, [fokus, m, pakaiHujan]);
}

/* ------------------------------------------------------------------ efek dan jingle */

type Efek = { p: AudioPlayer; pernah: boolean; dipakai: number };
const efekSiap = new Map<NamaBerkas, Efek>();

function ambilEfek(nama: NamaBerkas): Efek | null {
  const ada = efekSiap.get(nama);
  if (ada) {
    ada.dipakai = Date.now();
    return ada;
  }
  const p = buatPemutar(nama);
  if (!p) return null;
  const e: Efek = { p, pernah: false, dipakai: Date.now() };
  efekSiap.set(nama, e);
  if (efekSiap.size > MAKS_EFEK) {
    let lamaNama: NamaBerkas | null = null;
    let lamaWaktu = Infinity;
    for (const [n, x] of efekSiap) {
      if (x !== e && x.dipakai < lamaWaktu) {
        lamaWaktu = x.dipakai;
        lamaNama = n;
      }
    }
    if (lamaNama) {
      lepasPemutar(efekSiap.get(lamaNama)!.p);
      efekSiap.delete(lamaNama);
    }
  }
  return e;
}

function putarDariAwal(e: Efek) {
  const p = e.p;
  if (WEB) {
    // Di web semuanya harus terjadi langsung di dalam ketukan supaya tidak ditolak browser.
    p.seekTo(0).catch(() => {});
    p.play();
    return;
  }
  if (!e.pernah) {
    e.pernah = true;
    p.play();
    return;
  }
  p.seekTo(0)
    .catch(() => {})
    .then(() => p.play());
}

function bunyikan(diminta: NamaBerkas, dipakai: NamaBerkas, volume: number): boolean {
  const e = ambilEfek(dipakai);
  if (!e) return false;
  try {
    e.p.volume = batas01(volumeDasar(diminta, dipakai) * volume);
    putarDariAwal(e);
    return true;
  } catch {
    return false;
  }
}

/**
 * Putar efek suara sekali. tunda dalam milidetik, volume pengali tambahan (0 sampai 1).
 * Tidak berbunyi kalau efek dimatikan di Pengaturan.
 */
export function efek(nama: NamaEfek, opsi: { tunda?: number; volume?: number } = {}) {
  if (opsi.tunda && opsi.tunda > 0) {
    setTimeout(() => efek(nama, { volume: opsi.volume }), opsi.tunda);
    return;
  }
  if (!atur.efek || atur.tingkatEfek <= 0 || diLatar || !bolehBunyi()) return;
  const n = cari(nama);
  if (n) bunyikan(nama, n, kurva(atur.tingkatEfek) * (opsi.volume ?? 1));
}

/**
 * Jeda musik latar selama ms milidetik, misalnya selama urutan hadiah di layar hasil.
 * Mengembalikan fungsi untuk menyambung musik lebih cepat (aman dipanggil berkali-kali).
 */
export function tahanMusik(ms: number): () => void {
  tahanan += 1;
  terapkanMusik();
  let sudah = false;
  const lepas = () => {
    if (sudah) return;
    sudah = true;
    clearTimeout(jam);
    tahanan = Math.max(0, tahanan - 1);
    terapkanMusik();
  };
  const jam = setTimeout(lepas, ms);
  return lepas;
}

/**
 * Putar jingle sekali. Musik layar langsung dipelankan, lalu disambung lagi setelah jingle selesai.
 * Jingle ikut pengaturan musik.
 */
export function jingle(nama: NamaJingle, opsi: { tunda?: number } = {}) {
  if (!atur.musik || atur.tingkatMusik <= 0 || diLatar || !bolehBunyi()) return;
  const n = cari(nama);
  if (!n) return;
  const tunda = Math.max(0, opsi.tunda ?? 0);
  tahanMusik(tunda + ((DURASI[n] ?? 3) + 0.3) * 1000);
  const mulai = () => {
    if (!diLatar && atur.musik) bunyikan(nama, n, kurva(atur.tingkatMusik));
  };
  if (tunda > 0) setTimeout(mulai, tunda);
  else mulai();
}

/* ------------------------------------------------------------------ persiapan */

let sudahSiap = false;

/** Dipanggil sekali saat aplikasi dibuka. */
export async function siapkanSuara() {
  if (sudahSiap) return;
  sudahSiap = true;
  const simpanan = await bacaJson<Partial<PengaturanSuara> | null>(KUNCI, null);
  if (simpanan) {
    atur = {
      musik: simpanan.musik ?? BAWAAN.musik,
      efek: simpanan.efek ?? BAWAAN.efek,
      tingkatMusik: rapikanTingkat(simpanan.tingkatMusik, BAWAAN.tingkatMusik),
      tingkatEfek: rapikanTingkat(simpanan.tingkatEfek, BAWAAN.tingkatEfek),
    };
    pendengar.forEach((p) => p());
  }

  if (WEB) {
    pasangIzinWeb();
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => aturLatar(document.visibilityState === 'hidden'));
    }
  } else {
    try {
      // iOS: ikuti tombol senyap HP (kategori ambient). Android: ikuti volume media, bukan mode dering.
      // mixWithOthers: musik dari aplikasi lain tidak dihentikan oleh efek tombol.
      await setAudioModeAsync({
        playsInSilentMode: Platform.OS !== 'ios',
        interruptionMode: 'mixWithOthers',
        shouldPlayInBackground: false,
        allowsRecording: false,
        shouldRouteThroughEarpiece: false,
      });
    } catch {
      // mode audio bawaan tetap bisa dipakai
    }
    AppState.addEventListener('change', (k) => {
      if (k === 'background') aturLatar(true);
      else if (k === 'active') aturLatar(false);
    });
  }

  for (const n of EFEK_SIAGA) {
    const ada = cari(n);
    if (ada) ambilEfek(ada);
  }
  terapkanMusik();
}
