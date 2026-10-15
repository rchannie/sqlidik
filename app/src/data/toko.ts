/*
 * Toko data aplikasi: akun, progres, antrian sinkron, dan cache kelas.
 * Progres disimpan di perangkat lebih dulu (supaya bisa main offline), lalu dikirim ke server
 * lewat antrian saat online. Server menggabungkan dengan nilai terbesar, jadi aman dikirim ulang.
 */
import { useSyncExternalStore } from 'react';
import { AppState } from 'react-native';

import { GalatApi, api, muatAlamatServer } from '../api/klien';
import { Kasus, Konsep, cariKasus } from '../konten';
import { HarianLokal, ProgresLokal, Statistik, hitungStatistik } from '../permainan/aturan';
import { geserTanggal, harianUntuk, tanggalWIB } from '../permainan/waktu';
import { aturPengingat } from './pengingat';
import { bacaJson, simpanJson } from './simpan';
import { bacaToken, simpanToken } from './token';

export type Pengguna = {
  id: number;
  nama: string;
  email: string;
  peran: 'siswa' | 'guru';
  sekolah: string | null;
  avatar: string;
  penempatan: number | null;
};

export type Riwayat = {
  id: string;
  id_kasus: string | null;
  id_langkah: string | null;
  konsep: string | null;
  teks_query: string;
  hasil_benar: boolean;
  jenis_error: string | null;
  pesan_error: string | null;
  dijalankan_pada: string;
};

export type Tugas = {
  id_tugas: number;
  id_kasus: string;
  judul: string;
  konsep: string;
  tenggat: string;
  selesai: boolean;
  terlambat: boolean;
  lewat_tenggat: boolean;
  bintang: number;
};

export type KelasSiswa = {
  id_kelas: number;
  nama_kelas: string;
  guru: string;
  tugas: Tugas[];
  kasus_guru: { id_kasus: string; judul: string; konsep: string; jumlah_langkah: number }[];
};

export type Simpanan = {
  versi: 1;
  pengguna: Pengguna;
  progres: Record<string, ProgresLokal>;
  harian: Record<string, HarianLokal>;
  hariAktif: Record<string, { pemulihan: boolean }>;
  penempatan: number | null;
  antrian: { progres: string[]; riwayat: Riwayat[]; harian: string[]; hariAktif: string[]; penempatan: boolean };
  latihan: Record<string, { selesai: boolean }>;
  konsepStat: Record<string, { benar: number; salah: number; beruntun: number }>;
  kasusGuru: Record<string, Kasus>;
  kelas: KelasSiswa[] | null;
  lencanaDidapat: Record<string, string>;
  pengingat: { aktif: boolean; jam: number; menit: number };
  kasusTerakhir: string | null;
};

export type Keadaan = {
  siap: boolean;
  token: string | null;
  s: Simpanan | null;
  sinkron: { jalan: boolean; galat: string | null; terakhir: string | null };
  infoServer: { daftar_guru_terbuka: boolean } | null;
};

let keadaan: Keadaan = { siap: false, token: null, s: null, sinkron: { jalan: false, galat: null, terakhir: null }, infoServer: null };
const pendengar = new Set<() => void>();
let jamSimpan: ReturnType<typeof setTimeout> | null = null;

function ubah(fn: (k: Keadaan) => Keadaan) {
  keadaan = fn(keadaan);
  pendengar.forEach((p) => p());
}

function ubahS(fn: (s: Simpanan) => Simpanan) {
  if (!keadaan.s) return;
  const baru = fn(keadaan.s);
  ubah((k) => ({ ...k, s: baru }));
  jadwalkanSimpan();
}

function jadwalkanSimpan() {
  if (jamSimpan) clearTimeout(jamSimpan);
  jamSimpan = setTimeout(() => {
    const s = keadaan.s;
    if (s) simpanJson('sqlidik:data:' + s.pengguna.id, s);
  }, 250);
}

export function useToko<T>(pilih: (k: Keadaan) => T): T {
  return useSyncExternalStore(
    (cb) => {
      pendengar.add(cb);
      return () => pendengar.delete(cb);
    },
    () => pilih(keadaan),
    () => pilih(keadaan),
  );
}

export function ambilKeadaan(): Keadaan {
  return keadaan;
}

function idAcak(): string {
  return 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

function simpananKosong(p: Pengguna): Simpanan {
  return {
    versi: 1, pengguna: p, progres: {}, harian: {}, hariAktif: {}, penempatan: p.penempatan,
    antrian: { progres: [], riwayat: [], harian: [], hariAktif: [], penempatan: false },
    latihan: {}, konsepStat: {}, kasusGuru: {}, kelas: null, lencanaDidapat: {},
    pengingat: { aktif: false, jam: 19, menit: 0 }, kasusTerakhir: null,
  };
}

/* ---------------------------------------------------------------- statistik */

const cacheStat = new WeakMap<Simpanan, Map<string, Statistik>>();

export function statistikDari(s: Simpanan): Statistik {
  const kini = tanggalWIB();
  let m = cacheStat.get(s);
  if (!m) {
    m = new Map();
    cacheStat.set(s, m);
  }
  const ada = m.get(kini);
  if (ada) return ada;
  const st = hitungStatistik(s.progres, s.harian, new Set(Object.keys(s.hariAktif)), kini, s.kasusGuru);
  m.set(kini, st);
  return st;
}

export function useStatistik(): Statistik | null {
  return useToko((k) => (k.s ? statistikDari(k.s) : null));
}

/* ---------------------------------------------------------------- akun */

async function muatSimpanan(p: Pengguna): Promise<Simpanan> {
  const lama = await bacaJson<Simpanan | null>('sqlidik:data:' + p.id, null);
  if (lama && lama.versi === 1) return { ...simpananKosong(p), ...lama, pengguna: p };
  return simpananKosong(p);
}

export async function mulai() {
  await muatAlamatServer();
  const token = await bacaToken();
  const p = await bacaJson<Pengguna | null>('sqlidik:pengguna', null);
  if (token && p) {
    const s = await muatSimpanan(p);
    ubah((k) => ({ ...k, siap: true, token, s }));
    segarkanAkun();
  } else {
    ubah((k) => ({ ...k, siap: true }));
  }
  muatInfoServer();
}

export async function muatInfoServer() {
  try {
    const info = await api<{ daftar_guru_terbuka: boolean }>('/api/info', { waktuHabis: 30000 });
    ubah((k) => ({ ...k, infoServer: info }));
  } catch {
    // server belum bisa dihubungi
  }
}

async function terimaAkun(token: string, p: Pengguna) {
  await simpanToken(token);
  await simpanJson('sqlidik:pengguna', p);
  const s = await muatSimpanan(p);
  ubah((k) => ({ ...k, token, s }));
  if (p.peran === 'siswa') {
    try {
      const data = await api('/api/sinkron', { token });
      ubahS((x) => gabungServer(x, data));
    } catch {
      // dicoba lagi saat sinkron berikutnya
    }
    sinkron();
    muatKelas();
  } else {
    muatKasusGuruSendiri();
  }
}

export async function masuk(email: string, kata_sandi: string) {
  const r = await api<{ token: string; pengguna: Pengguna }>('/api/auth/masuk', { isi: { email, kata_sandi } });
  await terimaAkun(r.token, r.pengguna);
  return r.pengguna;
}

export async function daftar(isi: { nama: string; email: string; kata_sandi: string; sekolah?: string; kode_kelas?: string; avatar?: string }) {
  const r = await api<{ token: string; pengguna: Pengguna }>('/api/auth/daftar', { isi });
  await terimaAkun(r.token, r.pengguna);
  return r.pengguna;
}

export async function daftarGuru(isi: { nama: string; email: string; kata_sandi: string; sekolah?: string; kode_guru: string }) {
  const r = await api<{ token: string; pengguna: Pengguna }>('/api/auth/daftar-guru', { isi });
  await terimaAkun(r.token, r.pengguna);
  return r.pengguna;
}

export async function keluar() {
  const s = keadaan.s;
  if (s) await simpanJson('sqlidik:data:' + s.pengguna.id, s);
  await simpanToken(null);
  await simpanJson('sqlidik:pengguna', null);
  ubah((k) => ({ ...k, token: null, s: null, sinkron: { jalan: false, galat: null, terakhir: null } }));
}

export function adaAntrian(s: Simpanan | null): boolean {
  if (!s) return false;
  const a = s.antrian;
  return a.progres.length + a.riwayat.length + a.harian.length + a.hariAktif.length > 0 || a.penempatan;
}

async function segarkanAkun() {
  const token = keadaan.token;
  if (!token) return;
  try {
    const r = await api<{ pengguna: Pengguna }>('/api/auth/saya', { token });
    await simpanJson('sqlidik:pengguna', r.pengguna);
    ubahS((s) => ({ ...s, pengguna: r.pengguna }));
    if (r.pengguna.peran === 'siswa') {
      await sinkron();
      muatKelas();
    } else {
      muatKasusGuruSendiri();
    }
  } catch (e) {
    if (e instanceof GalatApi && e.status === 401) await keluar();
  }
}

export async function ubahProfil(isi: { nama?: string; avatar?: string; sekolah?: string }) {
  const r = await api<{ pengguna: Pengguna }>('/api/auth/saya', { metode: 'PATCH', isi, token: keadaan.token });
  await simpanJson('sqlidik:pengguna', r.pengguna);
  ubahS((s) => ({ ...s, pengguna: r.pengguna }));
}

/* ---------------------------------------------------------------- sinkron */

function gabungProgres(a: ProgresLokal | undefined, b: ProgresLokal): ProgresLokal {
  if (!a) return { ...b };
  const minNull = (x: number | null, y: number | null) => (x === null ? y : y === null ? x : Math.min(x, y));
  const minTanggal = (x: string | null, y: string | null) => (!x ? y : !y ? x : x < y ? x : y);
  return {
    id_kasus: a.id_kasus,
    status: a.status === 'selesai' || b.status === 'selesai' ? 'selesai' : 'berjalan',
    bintang: Math.max(a.bintang, b.bintang),
    jumlah_percobaan: Math.max(a.jumlah_percobaan, b.jumlah_percobaan),
    petunjuk_dipakai: Math.max(a.petunjuk_dipakai, b.petunjuk_dipakai),
    salah_tuduh: Math.max(a.salah_tuduh, b.salah_tuduh),
    durasi_detik: minNull(a.durasi_detik, b.durasi_detik),
    selesai_pada: minTanggal(a.selesai_pada, b.selesai_pada),
  };
}

function gabungServer(s: Simpanan, data: any): Simpanan {
  const progres = { ...s.progres };
  for (const p of data.progres ?? []) progres[p.id_kasus] = gabungProgres(progres[p.id_kasus], p);
  const harian = { ...s.harian };
  for (const h of data.harian ?? []) {
    const lokal = harian[h.tanggal];
    if (!lokal || h.durasi_detik < lokal.durasi_detik) harian[h.tanggal] = h;
  }
  const hariAktif = { ...s.hariAktif };
  for (const h of data.hari_aktif ?? []) if (!hariAktif[h.tanggal]) hariAktif[h.tanggal] = { pemulihan: h.pemulihan };
  const lencanaDidapat = { ...(data.statistik?.lencana_didapat ?? {}), ...s.lencanaDidapat };
  const penempatan = s.antrian.penempatan ? s.penempatan : (data.penempatan ?? s.penempatan);
  return { ...s, progres, harian, hariAktif, lencanaDidapat, penempatan };
}

let janjiSinkron: Promise<void> | null = null;

export function sinkron(): Promise<void> {
  if (janjiSinkron) return janjiSinkron;
  janjiSinkron = jalankanSinkron().finally(() => {
    janjiSinkron = null;
  });
  return janjiSinkron;
}

async function jalankanSinkron() {
  const { token, s } = keadaan;
  if (!token || !s || s.pengguna.peran !== 'siswa') return;
  const a = s.antrian;
  const progresTerkirim = a.progres.map((id) => s.progres[id]).filter(Boolean);
  const harianTerkirim = a.harian.map((t) => s.harian[t]).filter(Boolean);
  const riwayatTerkirim = a.riwayat.slice(0, 500);
  const kirim = {
    progres: progresTerkirim,
    riwayat: riwayatTerkirim,
    harian: harianTerkirim,
    hari_aktif: a.hariAktif.map((t) => ({ tanggal: t, pemulihan: s.hariAktif[t]?.pemulihan ?? false })),
    penempatan: a.penempatan ? s.penempatan : null,
  };
  const jejak = new Map(progresTerkirim.map((p) => [p.id_kasus, JSON.stringify(p)]));
  const jejakHarian = new Map(harianTerkirim.map((h) => [h.tanggal, JSON.stringify(h)]));
  const idRiwayat = new Set(riwayatTerkirim.map((r) => r.id));
  const hariTerkirim = new Set(a.hariAktif);
  const penempatanTerkirim = s.penempatan;
  ubah((k) => ({ ...k, sinkron: { ...k.sinkron, jalan: true } }));
  try {
    const data = await api('/api/sinkron', { isi: kirim, token, waktuHabis: 40000 });
    ubahS((x) => {
      const g = gabungServer(x, data);
      g.antrian = {
        progres: x.antrian.progres.filter((id) => jejak.get(id) !== JSON.stringify(x.progres[id])),
        riwayat: x.antrian.riwayat.filter((r) => !idRiwayat.has(r.id)),
        harian: x.antrian.harian.filter((t) => jejakHarian.get(t) !== JSON.stringify(x.harian[t])),
        hariAktif: x.antrian.hariAktif.filter((t) => !hariTerkirim.has(t)),
        penempatan: x.antrian.penempatan && x.penempatan !== penempatanTerkirim,
      };
      return g;
    });
    ubah((k) => ({ ...k, sinkron: { jalan: false, galat: null, terakhir: new Date().toISOString() } }));
  } catch (e) {
    if (e instanceof GalatApi && e.status === 401) {
      await keluar();
      return;
    }
    const pesan = e instanceof Error ? e.message : 'Sinkron gagal.';
    ubah((k) => ({ ...k, sinkron: { ...k.sinkron, jalan: false, galat: pesan } }));
  }
}

AppState.addEventListener('change', (st) => {
  if (st === 'active' && keadaan.s && adaAntrian(keadaan.s)) sinkron();
});

/* ---------------------------------------------------------------- kelas */

export async function muatKelas(): Promise<KelasSiswa[] | null> {
  const { token, s } = keadaan;
  if (!token || !s || s.pengguna.peran !== 'siswa') return null;
  const r = await api<{ kelas: KelasSiswa[]; kasus_guru: Kasus[] }>('/api/kelas/saya', { token });
  const kasusGuru = Object.fromEntries(r.kasus_guru.map((k) => [k.id, k]));
  ubahS((x) => ({ ...x, kelas: r.kelas, kasusGuru }));
  return r.kelas;
}

export async function gabungKelas(kode: string) {
  const r = await api<{ nama_kelas: string; sudah: boolean }>('/api/kelas/gabung', { isi: { kode }, token: keadaan.token });
  await muatKelas();
  return r;
}

export async function keluarKelas(id: number) {
  await api(`/api/kelas/${id}/keluar`, { metode: 'POST', isi: {}, token: keadaan.token });
  await muatKelas();
}

export async function muatKasusGuruSendiri() {
  const { token, s } = keadaan;
  if (!token || !s || s.pengguna.peran !== 'guru') return [];
  const daftar = await api<Kasus[]>('/api/guru/kasus', { token });
  ubahS((x) => ({ ...x, kasusGuru: Object.fromEntries(daftar.map((k) => [k.id, k])) }));
  return daftar;
}

/* ---------------------------------------------------------------- permainan */

function progresAwal(id: string): ProgresLokal {
  return { id_kasus: id, status: 'berjalan', bintang: 0, jumlah_percobaan: 0, petunjuk_dipakai: 0, salah_tuduh: 0, durasi_detik: null, selesai_pada: null };
}

function tambahUnik(xs: string[], x: string): string[] {
  return xs.includes(x) ? xs : [...xs, x];
}

function tandaiAktif(s: Simpanan, tanggal: string, pemulihan = false): Simpanan {
  if (s.hariAktif[tanggal]) return s;
  return {
    ...s,
    hariAktif: { ...s.hariAktif, [tanggal]: { pemulihan } },
    antrian: { ...s.antrian, hariAktif: tambahUnik(s.antrian.hariAktif, tanggal) },
  };
}

export function catatPercobaan(idKasus: string, isi: { id_langkah: string | null; konsep: string | null; teks_query: string; hasil_benar: boolean; jenis_error?: string | null; pesan_error?: string | null }, hitungKeProgres = true) {
  ubahS((s) => {
    const r: Riwayat = {
      id: idAcak(), id_kasus: idKasus, id_langkah: isi.id_langkah, konsep: isi.konsep, teks_query: isi.teks_query.slice(0, 2000),
      hasil_benar: isi.hasil_benar, jenis_error: isi.jenis_error ?? null, pesan_error: isi.pesan_error ?? null,
      dijalankan_pada: new Date().toISOString(),
    };
    const riwayat = [...s.antrian.riwayat, r].slice(-800);
    let baru: Simpanan = { ...s, antrian: { ...s.antrian, riwayat } };
    if (isi.konsep) {
      const lama = s.konsepStat[isi.konsep] ?? { benar: 0, salah: 0, beruntun: 0 };
      baru.konsepStat = {
        ...s.konsepStat,
        [isi.konsep]: isi.hasil_benar ? { ...lama, benar: lama.benar + 1 } : { ...lama, salah: lama.salah + 1, beruntun: 0 },
      };
    }
    if (hitungKeProgres) {
      const p = s.progres[idKasus] ?? progresAwal(idKasus);
      baru.progres = { ...s.progres, [idKasus]: { ...p, jumlah_percobaan: p.jumlah_percobaan + 1 } };
      baru.antrian = { ...baru.antrian, progres: tambahUnik(baru.antrian.progres, idKasus) };
    }
    return baru;
  });
}

export function belanjaPetunjuk(idKasus: string): boolean {
  const s = keadaan.s;
  if (!s) return false;
  if (statistikDari(s).koin < 5) return false;
  ubahS((x) => {
    const p = x.progres[idKasus] ?? progresAwal(idKasus);
    return {
      ...x,
      progres: { ...x.progres, [idKasus]: { ...p, petunjuk_dipakai: p.petunjuk_dipakai + 1 } },
      antrian: { ...x.antrian, progres: tambahUnik(x.antrian.progres, idKasus) },
    };
  });
  return true;
}

export function catatSalahTuduh(idKasus: string) {
  ubahS((x) => {
    const p = x.progres[idKasus] ?? progresAwal(idKasus);
    return {
      ...x,
      progres: { ...x.progres, [idKasus]: { ...p, salah_tuduh: p.salah_tuduh + 1 } },
      antrian: { ...x.antrian, progres: tambahUnik(x.antrian.progres, idKasus) },
    };
  });
}

export type Hadiah = { xp: number; koin: number; streak: number; lencanaBaru: string[]; bintangSebelumnya: number };

function hitungHadiah(sebelum: Simpanan, sesudah: Simpanan, bintangLama: number): Hadiah {
  const a = statistikDari(sebelum);
  const b = statistikDari(sesudah);
  return {
    xp: b.xp - a.xp,
    koin: b.koin - a.koin,
    streak: b.streak,
    lencanaBaru: b.lencana.filter((l) => !a.lencana.includes(l)),
    bintangSebelumnya: bintangLama,
  };
}

export function selesaikanKasus(idKasus: string, bintang: number, durasiDetik: number): Hadiah {
  const sebelum = keadaan.s!;
  const lama = sebelum.progres[idKasus];
  ubahS((x) => {
    const p = x.progres[idKasus] ?? progresAwal(idKasus);
    const kini = new Date().toISOString();
    let baru: Simpanan = {
      ...x,
      progres: {
        ...x.progres,
        [idKasus]: {
          ...p,
          status: 'selesai',
          bintang: Math.max(p.bintang, bintang),
          durasi_detik: p.durasi_detik === null ? durasiDetik : Math.min(p.durasi_detik, durasiDetik),
          selesai_pada: p.selesai_pada ?? kini,
        },
      },
      antrian: { ...x.antrian, progres: tambahUnik(x.antrian.progres, idKasus) },
    };
    baru = tandaiAktif(baru, tanggalWIB());
    return baru;
  });
  const hadiah = hitungHadiah(sebelum, keadaan.s!, lama?.bintang ?? 0);
  catatLencana(hadiah.lencanaBaru);
  sinkron();
  return hadiah;
}

export function selesaikanHarian(kasus: Kasus, tanggal: string, isi: { durasi: number; percobaan: number; petunjuk: number; bintang: number }, pemulihan: boolean): Hadiah {
  const sebelum = keadaan.s!;
  const hariIni = tanggalWIB();
  ubahS((x) => {
    let baru = { ...x };
    const p = x.progres[kasus.id] ?? progresAwal(kasus.id);
    baru.progres = { ...x.progres, [kasus.id]: { ...p, status: 'selesai', bintang: Math.max(p.bintang, isi.bintang), selesai_pada: p.selesai_pada ?? new Date().toISOString() } };
    baru.antrian = { ...x.antrian, progres: tambahUnik(x.antrian.progres, kasus.id) };
    if (!pemulihan && tanggal === hariIni && harianUntuk(hariIni).id === kasus.id) {
      const lama = x.harian[tanggal];
      if (!lama || isi.durasi < lama.durasi_detik) {
        baru.harian = {
          ...x.harian,
          [tanggal]: {
            tanggal, id_kasus: kasus.id, durasi_detik: isi.durasi, jumlah_percobaan: isi.percobaan,
            petunjuk_dipakai: isi.petunjuk, bintang: isi.bintang, selesai_pada: new Date().toISOString(),
          },
        };
        baru.antrian = { ...baru.antrian, harian: tambahUnik(baru.antrian.harian, tanggal) };
      }
    }
    if (pemulihan) baru = tandaiAktif(baru, geserTanggal(hariIni, -1), true);
    baru = tandaiAktif(baru, hariIni);
    return baru;
  });
  const hadiah = hitungHadiah(sebelum, keadaan.s!, 0);
  catatLencana(hadiah.lencanaBaru);
  sinkron();
  return hadiah;
}

function catatLencana(baru: string[]) {
  if (!baru.length) return;
  const kini = new Date().toISOString();
  ubahS((x) => ({ ...x, lencanaDidapat: { ...Object.fromEntries(baru.map((l) => [l, kini])), ...x.lencanaDidapat } }));
}

/** Latihan Ruang Arsip tidak memberi XP, tetapi tetap dihitung sebagai hari bermain. */
export function catatLatihan(id: string, konsep: Konsep, modeUlang: boolean): { paham: boolean } {
  let paham = false;
  ubahS((x) => {
    let baru: Simpanan = { ...x, latihan: { ...x.latihan, [id]: { selesai: true } } };
    if (modeUlang) {
      const st = x.konsepStat[konsep] ?? { benar: 0, salah: 0, beruntun: 0 };
      const beruntun = st.beruntun + 1;
      if (beruntun >= 3) {
        paham = true;
        baru.konsepStat = { ...x.konsepStat, [konsep]: { benar: 0, salah: 0, beruntun: 0 } };
      } else {
        baru.konsepStat = { ...x.konsepStat, [konsep]: { ...st, beruntun } };
      }
    }
    baru = tandaiAktif(baru, tanggalWIB());
    return baru;
  });
  sinkron();
  return { paham };
}

export function konsepLemah(s: Simpanan): { konsep: Konsep; salah: number; benar: number; beruntun: number }[] {
  return (Object.entries(s.konsepStat) as [Konsep, { benar: number; salah: number; beruntun: number }][])
    .filter(([, v]) => v.salah >= 3 && v.salah >= v.benar * 0.5)
    .map(([konsep, v]) => ({ konsep, ...v }))
    .sort((a, b) => b.salah - a.salah);
}

export function simpanPenempatan(level: number) {
  ubahS((x) => ({ ...x, penempatan: level, pengguna: { ...x.pengguna, penempatan: level }, antrian: { ...x.antrian, penempatan: true } }));
  sinkron();
}

export function tandaiKasusTerakhir(id: string) {
  ubahS((x) => ({ ...x, kasusTerakhir: id }));
}

export async function aturPengingatHarian(aktif: boolean, jam: number, menit: number) {
  const r = await aturPengingat(aktif, jam, menit);
  if (r.ok || !aktif) ubahS((x) => ({ ...x, pengingat: { aktif: aktif && r.ok, jam, menit } }));
  return r;
}

export function kasusDariId(id: string): Kasus | undefined {
  return cariKasus(id, keadaan.s?.kasusGuru ?? {});
}

export async function ambilKasusDariServer(id: string): Promise<Kasus | undefined> {
  const { token } = keadaan;
  if (!token) return undefined;
  const k = await api<Kasus>(`/api/kasus/${id}`, { token });
  ubahS((x) => ({ ...x, kasusGuru: { ...x.kasusGuru, [k.id]: k } }));
  return k;
}
