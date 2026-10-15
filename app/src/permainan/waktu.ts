import { ATURAN, KASUS_HARIAN, Kasus } from '../konten';

const AWAL_HARIAN = Date.UTC(2026, 0, 1);
const SEHARI = 86400000;

/** Tanggal hari ini menurut WIB, format YYYY-MM-DD. Kasus Harian dan streak memakai zona ini. */
export function tanggalWIB(waktu: Date = new Date()): string {
  const d = new Date(waktu.getTime() + ATURAN.zona_waktu_jam * 3600000);
  return d.toISOString().slice(0, 10);
}

export function geserTanggal(tanggal: string, hari: number): string {
  const t = Date.parse(tanggal + 'T00:00:00Z') + hari * SEHARI;
  return new Date(t).toISOString().slice(0, 10);
}

export function harianUntuk(tanggal: string): Kasus {
  const hari = Math.round((Date.parse(tanggal + 'T00:00:00Z') - AWAL_HARIAN) / SEHARI);
  const n = KASUS_HARIAN.length;
  return KASUS_HARIAN[((hari % n) + n) % n];
}

const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export function tanggalPanjang(tanggal: string): string {
  const d = new Date(tanggal + 'T00:00:00Z');
  return `${HARI[d.getUTCDay()]}, ${d.getUTCDate()} ${BULAN[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function tanggalSingkat(tanggal: string | null | undefined): string {
  if (!tanggal) return '-';
  const d = new Date(tanggal.slice(0, 10) + 'T00:00:00Z');
  if (Number.isNaN(d.getTime())) return '-';
  return `${d.getUTCDate()} ${BULAN[d.getUTCMonth()].slice(0, 3)} ${d.getUTCFullYear()}`;
}

export function waktuSingkat(iso: string): string {
  const d = new Date(new Date(iso).getTime() + ATURAN.zona_waktu_jam * 3600000);
  const jam = String(d.getUTCHours()).padStart(2, '0');
  const menit = String(d.getUTCMinutes()).padStart(2, '0');
  return `${d.getUTCDate()} ${BULAN[d.getUTCMonth()].slice(0, 3)} ${d.getUTCFullYear()}, ${jam}.${menit}`;
}

export function durasiTeks(detik: number | null | undefined): string {
  if (detik === null || detik === undefined) return '-';
  const m = Math.floor(detik / 60);
  const s = detik % 60;
  return m ? `${m} mnt ${s} dtk` : `${s} dtk`;
}

export function sisaWaktu(iso: string): string {
  const selisih = new Date(iso).getTime() - Date.now();
  if (selisih <= 0) return 'lewat tenggat';
  const jam = Math.floor(selisih / 3600000);
  if (jam < 1) return `${Math.max(1, Math.floor(selisih / 60000))} menit lagi`;
  if (jam < 48) return `${jam} jam lagi`;
  return `${Math.floor(jam / 24)} hari lagi`;
}
