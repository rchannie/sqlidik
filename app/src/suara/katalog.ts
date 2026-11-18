/*
 * Katalog suara SQLidik, mengikuti Daftar Suara SQLidik (kolom Nama File, Dipakai Saat, dan Pengganti).
 * File audionya ada di assets/suara dan didaftarkan otomatis di berkas.ts oleh alat/olah_suara.py.
 */

export type NamaMusik = 'musik_judul' | 'musik_peta' | 'musik_investigasi' | 'musik_tuduh' | 'musik_harian' | 'musik_arsip';

export type NamaJingle = 'jingle_menang' | 'jingle_pangkat';

export type NamaEfek =
  | 'ui_tap'
  | 'ui_kembali'
  | 'ui_galat'
  | 'dialog_lanjut'
  | 'ui_tab'
  | 'ui_lembar'
  | 'berkas_buka'
  | 'berkas_terkunci'
  | 'berkas_terbuka'
  | 'query_jalan'
  | 'query_benar'
  | 'query_salah'
  | 'query_error'
  | 'blok_pasang'
  | 'blok_lepas'
  | 'proses_tahap'
  | 'petunjuk_buka'
  | 'koin_kurang'
  | 'stempel_terbukti'
  | 'stempel_ditolak'
  | 'tersangka_pilih'
  | 'bintang'
  | 'bintang_2'
  | 'bintang_3'
  | 'koin_dapat'
  | 'lencana_dapat'
  | 'xp_naik'
  | 'streak_naik';

export type NamaBerkas = NamaMusik | NamaJingle | 'suasana_hujan' | NamaEfek;

/**
 * Suara pengganti kalau file opsional tidak ada (kolom Pengganti di Daftar Suara).
 * Pengganti bisa berantai, misalnya streak_naik ke xp_naik lalu ke bintang. null berarti tanpa suara.
 * bintang_2 dan bintang_3 adalah turunan bintang.mp3 dengan nada lebih tinggi, dibuat oleh alat/olah_suara.py.
 */
export const PENGGANTI: Partial<Record<NamaBerkas, NamaBerkas | null>> = {
  jingle_pangkat: 'jingle_menang',
  musik_harian: 'musik_investigasi',
  musik_arsip: 'musik_investigasi',
  suasana_hujan: null,
  ui_tab: 'ui_tap',
  ui_lembar: 'ui_tap',
  berkas_terkunci: 'ui_galat',
  berkas_terbuka: 'lencana_dapat',
  query_error: 'query_salah',
  blok_lepas: 'ui_kembali',
  proses_tahap: 'ui_tab',
  koin_kurang: 'ui_galat',
  tersangka_pilih: 'ui_tap',
  xp_naik: 'bintang',
  streak_naik: 'xp_naik',
  bintang_2: 'bintang',
  bintang_3: 'bintang_2',
};

/**
 * Volume dasar (0 sampai 1) sebelum dikali pengaturan pemain. Semua file sudah diratakan ke -16 LUFS,
 * jadi angka ini hanya mengatur campuran: musik di bawah efek, tombol yang sering diketuk dibuat lebih pelan.
 * Kalau suara pengganti yang dipakai, volume nama yang diminta tetap berlaku.
 */
export const VOLUME_DASAR: Partial<Record<NamaBerkas, number>> = {
  musik_judul: 0.6,
  musik_peta: 0.5,
  musik_investigasi: 0.45,
  musik_tuduh: 0.55,
  musik_harian: 0.5,
  musik_arsip: 0.5,
  suasana_hujan: 0.3,
  jingle_menang: 0.85,
  jingle_pangkat: 0.85,

  ui_tap: 0.55,
  ui_kembali: 0.55,
  ui_galat: 0.65,
  dialog_lanjut: 0.45,
  ui_tab: 0.5,
  ui_lembar: 0.6,
  berkas_buka: 0.8,
  berkas_terkunci: 0.7,
  berkas_terbuka: 0.9,
  query_jalan: 0.6,
  query_benar: 0.85,
  query_salah: 0.7,
  query_error: 0.7,
  blok_pasang: 0.6,
  blok_lepas: 0.55,
  proses_tahap: 0.6,
  petunjuk_buka: 0.85,
  koin_kurang: 0.7,
  stempel_terbukti: 1,
  stempel_ditolak: 0.95,
  tersangka_pilih: 0.7,
  bintang: 0.8,
  bintang_2: 0.8,
  bintang_3: 0.8,
  koin_dapat: 0.8,
  lencana_dapat: 0.9,
  xp_naik: 0.8,
  streak_naik: 0.85,
};

/** Efek yang disiapkan sejak aplikasi dibuka supaya ketukan pertama tidak terlambat. */
export const EFEK_SIAGA: NamaEfek[] = ['ui_tap', 'ui_kembali', 'ui_tab', 'ui_lembar', 'dialog_lanjut'];

/** Bunyi bintang ke-1, ke-2, dan ke-3 di layar hasil, nadanya makin tinggi. */
export const EFEK_BINTANG: NamaEfek[] = ['bintang', 'bintang_2', 'bintang_3'];
