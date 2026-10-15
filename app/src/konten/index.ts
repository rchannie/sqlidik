import data from './konten.json';

export type Konsep = 'SELECT' | 'WHERE' | 'LIKE' | 'AGREGASI' | 'JOIN';

export type Langkah = {
  instruksi: string;
  query_kunci: string;
  petunjuk: string[];
  komentar_benar: string;
  wajib: string[];
  cocok: 'tepat' | 'minimal';
  blok_tambahan?: string[];
};

export type Tersangka = { nama: string; peran: string; avatar: string | null; pelaku: boolean; alasan: string };

export type MetaTabel = {
  nama: string;
  keterangan: string;
  kolom: { nama: string; tipe: string; keterangan: string }[];
  relasi: { kolom: string; tabel: string; ke: string }[];
  jumlah_baris: number;
};

export type KartuKonsep = { judul: string; isi: string; contoh: string };

export type Kasus = {
  id: string;
  jenis: 'utama' | 'harian' | 'guru';
  berkas?: number | null;
  urutan?: number;
  judul: string;
  tkp?: string;
  konsep: Konsep;
  briefing: string[];
  sql: string;
  tabel: MetaTabel[];
  kartu: KartuKonsep;
  langkah: Langkah[];
  tersangka: Tersangka[];
  penjelasan: string;
  penutup: string;
  xp: number;
  koin: number;
  durasi?: string;
};

export type Latihan = Langkah & { id: string; konsep: Konsep; judul: string };

export type Berkas = { nomor: number; konsep: Konsep; judul: string; ikon: string; ringkas: string };

export type SoalPenempatan = {
  konsep: Konsep;
  pertanyaan: string;
  kode?: string;
  tabel?: { kolom: string[]; baris: string[][] };
  opsi: string[];
  jawaban: number;
  penjelasan: string;
};

export type Catatan = {
  judul: string;
  paragraf: string[];
  contoh: { query: string; arti: string }[];
  kesalahan: string[];
};

export type Aturan = {
  koin_awal: number;
  biaya_petunjuk: number;
  faktor_xp_bintang: number[];
  bonus_koin_tiga_bintang: number;
  batas_percobaan_salah: number;
  zona_waktu_jam: number;
  detik_kilat: number;
  bukti_kolektor: number;
};

type KasusHarianMentah = Omit<Kasus, 'sql' | 'tabel' | 'tersangka' | 'penutup'> & { opsi: string[]; jawaban: string };

const K = data as unknown as {
  versi: number;
  aturan: Aturan;
  berkas: Berkas[];
  kasus: Kasus[];
  harian: KasusHarianMentah[];
  arsip: { sql: string; tabel: MetaTabel[] };
  latihan: Latihan[];
  penempatan: SoalPenempatan[];
  catatan: Record<Konsep, Catatan>;
  kartu: Record<Konsep, KartuKonsep>;
  lencana: { kode: string; nama: string; syarat: string }[];
  pangkat: { kode: string; nama: string; xp: number }[];
};

export const ATURAN = K.aturan;
export const BERKAS = K.berkas;
export const KASUS_UTAMA = K.kasus;
export const ARSIP = K.arsip;
export const LATIHAN = K.latihan;
export const PENEMPATAN = K.penempatan;
export const CATATAN = K.catatan;
export const KARTU = K.kartu;
export const LENCANA = K.lencana;
export const PANGKAT = K.pangkat;
export const URUTAN_KONSEP: Konsep[] = ['SELECT', 'WHERE', 'LIKE', 'AGREGASI', 'JOIN'];

function siapkanHarian(h: KasusHarianMentah): Kasus {
  return {
    ...h,
    jenis: 'harian',
    sql: ARSIP.sql,
    tabel: ARSIP.tabel,
    tkp: 'Arsip Sekolah',
    penutup: 'Kasus harian selesai. Sampai jumpa besok, Detektif.',
    tersangka: h.opsi.map((o) => ({
      nama: o,
      peran: '',
      avatar: null,
      pelaku: o === h.jawaban,
      alasan: 'Belum tepat. Baca lagi hasil query-mu dengan teliti.',
    })),
  };
}

export const KASUS_HARIAN: Kasus[] = K.harian.map(siapkanHarian);

const PETA_BAWAAN: Record<string, Kasus> = Object.fromEntries(
  [...KASUS_UTAMA, ...KASUS_HARIAN].map((k) => [k.id, k]),
);

export function cariKasus(id: string, kasusGuru: Record<string, Kasus> = {}): Kasus | undefined {
  return PETA_BAWAAN[id] ?? kasusGuru[id];
}

export function kasusDiBerkas(nomor: number): Kasus[] {
  return KASUS_UTAMA.filter((k) => k.berkas === nomor).sort((a, b) => (a.urutan ?? 0) - (b.urutan ?? 0));
}

export function cariLatihan(id: string): Latihan | undefined {
  return LATIHAN.find((l) => l.id === id);
}
