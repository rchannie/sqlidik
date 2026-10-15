/* Aturan gamifikasi. Harus sama dengan backend/app/permainan.py supaya angka di HP dan server cocok. */
import { ATURAN, BERKAS, KASUS_UTAMA, Kasus, PANGKAT, cariKasus, kasusDiBerkas } from '../konten';
import { geserTanggal } from './waktu';

export type ProgresLokal = {
  id_kasus: string;
  status: 'berjalan' | 'selesai';
  bintang: number;
  jumlah_percobaan: number;
  petunjuk_dipakai: number;
  salah_tuduh: number;
  durasi_detik: number | null;
  selesai_pada: string | null;
};

export type HarianLokal = {
  tanggal: string;
  id_kasus: string;
  durasi_detik: number;
  jumlah_percobaan: number;
  petunjuk_dipakai: number;
  bintang: number;
  selesai_pada: string;
};

export type Statistik = {
  xp: number;
  koin: number;
  pangkat: string;
  namaPangkat: string;
  xpPangkatIni: number;
  xpPangkatBerikut: number | null;
  streak: number;
  streakTerpanjang: number;
  bukti: number;
  kasusSelesai: number;
  totalBintang: number;
  lencana: string[];
};

export function pangkatDariXp(xp: number) {
  let p = PANGKAT[0];
  for (const x of PANGKAT) if (xp >= x.xp) p = x;
  const i = PANGKAT.indexOf(p);
  return { ...p, berikut: PANGKAT[i + 1] ?? null };
}

export function hitungStreak(tanggal: Set<string>, kini: string): { saatIni: number; terpanjang: number } {
  if (!tanggal.size) return { saatIni: 0, terpanjang: 0 };
  const urut = [...tanggal].sort();
  let terpanjang = 1;
  let jalan = 1;
  for (let i = 1; i < urut.length; i++) {
    jalan = geserTanggal(urut[i - 1], 1) === urut[i] ? jalan + 1 : 1;
    terpanjang = Math.max(terpanjang, jalan);
  }
  let saatIni = 0;
  let t = tanggal.has(kini) ? kini : geserTanggal(kini, -1);
  while (tanggal.has(t)) {
    saatIni++;
    t = geserTanggal(t, -1);
  }
  return { saatIni, terpanjang };
}

export function bintangSesi(petunjuk: number, salahTuduh: number, salahQuery: number): number {
  let b = 3;
  if (salahTuduh > 0) b--;
  if (petunjuk >= 2) b--;
  if (salahQuery >= ATURAN.batas_percobaan_salah) b--;
  return Math.max(1, b);
}

export function hitungStatistik(
  progres: Record<string, ProgresLokal>,
  harian: Record<string, HarianLokal>,
  hariAktif: Set<string>,
  kini: string,
  kasusGuru: Record<string, Kasus>,
): Statistik {
  let xp = 0;
  let koinMasuk = 0;
  let petunjuk = 0;
  let bukti = 0;
  let kasusSelesai = 0;
  let totalBintang = 0;
  const lencana = new Set<string>();
  for (const p of Object.values(progres)) {
    petunjuk += p.petunjuk_dipakai;
    const k = cariKasus(p.id_kasus, kasusGuru);
    if (p.status !== 'selesai' || p.bintang < 1 || (k && k.jenis === 'harian')) continue;
    const b = Math.min(p.bintang, 3);
    const xpKasus = k?.xp ?? 40;
    xp += Math.round(xpKasus * ATURAN.faktor_xp_bintang[b - 1]);
    koinMasuk += (k?.koin ?? 15) + (b === 3 ? ATURAN.bonus_koin_tiga_bintang : 0);
    bukti += k?.langkah.length ?? 1;
    kasusSelesai++;
    totalBintang += b;
    lencana.add('kasus_pertama');
    if (k?.jenis === 'utama') {
      if (b === 3 && p.petunjuk_dipakai === 0) lencana.add('tanpa_petunjuk');
      if (p.durasi_detik !== null && p.durasi_detik < ATURAN.detik_kilat) lencana.add('detektif_kilat');
    }
  }
  for (const h of Object.values(harian)) {
    xp += 30;
    koinMasuk += 10;
    bukti += 1;
    lencana.add('kasus_pertama');
  }
  const join = kasusDiBerkas(5).map((k) => k.id);
  if (join.length && join.every((id) => progres[id]?.status === 'selesai')) lencana.add('raja_join');
  if (bukti >= ATURAN.bukti_kolektor) lencana.add('kolektor_bukti');
  const { saatIni, terpanjang } = hitungStreak(hariAktif, kini);
  if (terpanjang >= 7) lencana.add('streak_7_hari');
  const pangkat = pangkatDariXp(xp);
  return {
    xp,
    koin: Math.max(0, ATURAN.koin_awal + koinMasuk - ATURAN.biaya_petunjuk * petunjuk),
    pangkat: pangkat.kode,
    namaPangkat: pangkat.nama,
    xpPangkatIni: pangkat.xp,
    xpPangkatBerikut: pangkat.berikut?.xp ?? null,
    streak: saatIni,
    streakTerpanjang: terpanjang,
    bukti,
    kasusSelesai,
    totalBintang,
    lencana: [...lencana].sort(),
  };
}

/** Berkas terbuka jika berkas sebelumnya selesai, atau sudah dilewati lewat tes penempatan. */
export function berkasTerbuka(nomor: number, progres: Record<string, ProgresLokal>, penempatan: number | null): boolean {
  if (nomor <= 1 || nomor <= (penempatan ?? 0) + 1) return true;
  return kasusDiBerkas(nomor - 1).every((k) => progres[k.id]?.status === 'selesai');
}

export function kasusTerbuka(k: Kasus, progres: Record<string, ProgresLokal>, penempatan: number | null): boolean {
  if (k.jenis !== 'utama') return true;
  const nomor = k.berkas ?? 1;
  if (!berkasTerbuka(nomor, progres, penempatan)) return false;
  if (nomor <= (penempatan ?? 0)) return true;
  const daftar = kasusDiBerkas(nomor);
  const i = daftar.findIndex((x) => x.id === k.id);
  return i <= 0 || progres[daftar[i - 1].id]?.status === 'selesai';
}

export function berkasSelesai(nomor: number, progres: Record<string, ProgresLokal>): boolean {
  return kasusDiBerkas(nomor).every((k) => progres[k.id]?.status === 'selesai');
}

export function kasusBerikutnya(progres: Record<string, ProgresLokal>, penempatan: number | null): Kasus | null {
  for (const b of BERKAS) {
    for (const k of kasusDiBerkas(b.nomor)) {
      if (progres[k.id]?.status !== 'selesai' && kasusTerbuka(k, progres, penempatan)) return k;
    }
  }
  return null;
}

export const SEMUA_KASUS_UTAMA = KASUS_UTAMA;
