/* Pemeriksa jawaban: menjalankan query siswa dan query kunci, lalu membandingkan hasilnya. */
import type { Langkah } from '../konten';
import { DbKasus, Hasil, Nilai } from './jenis';
import { JenisError, terjemahError } from './pesan';

export type HasilPeriksa = {
  benar: boolean;
  hasil?: Hasil;
  pesan: string;
  jenis_error?: JenisError;
};

export function tanpaTeks(sql: string): string {
  return sql.replace(/'(?:[^']|'')*'/g, "''");
}

export function tanpaKomentar(sql: string): string {
  return sql.replace(/--[^\n]*/g, ' ').replace(/\/\*[\s\S]*?\*\//g, ' ');
}

export function normalSql(sql: string): string {
  return tanpaTeks(tanpaKomentar(sql)).toUpperCase().replace(/\s+/g, ' ').trim();
}

export function pakaiKata(sql: string, kata: string): boolean {
  const pola = new RegExp('\\b' + kata.toUpperCase().replace(/\s+/g, '\\s+') + '\\b');
  return pola.test(normalSql(sql));
}

export type Siap = { ok: true; sql: string } | { ok: false; pesan: string; jenis: JenisError };

export function siapkanQuery(masukan: string): Siap {
  const sql = tanpaKomentar(masukan).trim().replace(/;+\s*$/, '').trim();
  if (!sql) return { ok: false, pesan: 'Tulis query dulu, Detektif.', jenis: 'lain' };
  if (tanpaTeks(sql).includes(';')) {
    return { ok: false, pesan: 'Jalankan satu query saja dalam sekali jalan.', jenis: 'sintaks' };
  }
  if ((tanpaTeks(sql).match(/'/g) || []).length % 2 === 1) {
    return { ok: false, pesan: 'Ada tanda kutip yang belum ditutup.', jenis: 'sintaks' };
  }
  if (!/^(SELECT|WITH)\b/i.test(sql)) {
    if (/^(INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|REPLACE|ATTACH|PRAGMA)\b/i.test(sql)) {
      return { ok: false, pesan: 'Detektif hanya membaca bukti, tidak mengubahnya. Gunakan perintah SELECT.', jenis: 'lain' };
    }
    return { ok: false, pesan: 'Query untuk membaca data selalu diawali SELECT.', jenis: 'sintaks' };
  }
  return { ok: true, sql };
}

function normalNilai(v: Nilai): string {
  if (v === null) return 'N';
  if (typeof v === 'number') {
    const r = Math.round(v * 10000) / 10000;
    return 'A' + String(r);
  }
  const n = Number(v);
  if (v.trim() !== '' && !Number.isNaN(n) && /^-?\d+(\.\d+)?$/.test(v.trim())) return 'A' + String(Math.round(n * 10000) / 10000);
  return 'T' + v;
}

function kunciBaris(b: Nilai[], idx: number[]): string {
  return JSON.stringify(idx.map((i) => normalNilai(b[i])));
}

function multiset(daftar: string[]): string {
  return [...daftar].sort().join('\u0001');
}

function ambilUrutan(sql: string): string | null {
  const n = normalSql(sql);
  const m = n.match(/\bORDER BY (.+?)(?: LIMIT .*)?$/);
  return m ? m[1].trim() : null;
}

export type Banding =
  | { cocok: true }
  | { cocok: false; alasan: 'kosong' | 'lebih' | 'kurang' | 'kolom_kurang' | 'kolom_lebih' | 'isi' | 'urutan' };

export function bandingkan(kunci: Hasil, siswa: Hasil, cocok: 'tepat' | 'minimal', sqlKunci: string, sqlSiswa: string): Banding {
  if (siswa.baris.length === 0 && kunci.baris.length > 0) return { cocok: false, alasan: 'kosong' };
  if (siswa.baris.length > kunci.baris.length) return { cocok: false, alasan: 'lebih' };
  if (siswa.baris.length < kunci.baris.length) return { cocok: false, alasan: 'kurang' };
  const K = kunci.kolom.length;
  const S = siswa.kolom.length;
  if (S < K) return { cocok: false, alasan: 'kolom_kurang' };

  const kolomKunci = Array.from({ length: K }, (_, i) => multiset(kunci.baris.map((b) => normalNilai(b[i]))));
  const kolomSiswa = Array.from({ length: S }, (_, j) => multiset(siswa.baris.map((b) => normalNilai(b[j]))));
  const calon = kolomKunci.map((mk) => kolomSiswa.map((ms, j) => (ms === mk ? j : -1)).filter((j) => j >= 0));
  if (calon.some((c) => c.length === 0)) return { cocok: false, alasan: S > K ? 'isi' : 'isi' };

  const barisKunci = kunci.baris.map((b) => kunciBaris(b, kunci.kolom.map((_, i) => i)));
  const msKunci = multiset(barisKunci);
  const berurut = /\bORDER BY\b/.test(normalSql(sqlKunci));
  let adaPasangan = false;
  let urutanBenar = false;

  const pakai = new Set<number>();
  const peta: number[] = [];
  const coba = (i: number): boolean => {
    if (i === K) {
      const barisSiswa = siswa.baris.map((b) => kunciBaris(b, peta));
      if (multiset(barisSiswa) !== msKunci) return false;
      adaPasangan = true;
      if (!berurut || barisSiswa.join('\u0002') === barisKunci.join('\u0002')) {
        urutanBenar = true;
        return true;
      }
      return false;
    }
    for (const j of calon[i]) {
      if (pakai.has(j)) continue;
      pakai.add(j);
      peta.push(j);
      if (coba(i + 1)) return true;
      peta.pop();
      pakai.delete(j);
    }
    return false;
  };
  coba(0);

  if (!adaPasangan) return { cocok: false, alasan: 'isi' };
  if (berurut && !urutanBenar) {
    const uk = ambilUrutan(sqlKunci);
    if (!uk || uk !== ambilUrutan(sqlSiswa)) return { cocok: false, alasan: 'urutan' };
  }
  if (cocok === 'tepat' && S > K) return { cocok: false, alasan: 'kolom_lebih' };
  return { cocok: true };
}

const cacheKunci = new WeakMap<DbKasus, Map<string, Hasil>>();

export async function hasilKunci(db: DbKasus, sql: string): Promise<Hasil> {
  let m = cacheKunci.get(db);
  if (!m) {
    m = new Map();
    cacheKunci.set(db, m);
  }
  const ada = m.get(sql);
  if (ada) return ada;
  const h = await db.jalankan(sql);
  m.set(sql, h);
  return h;
}

export async function jalankanSiswa(db: DbKasus, masukan: string): Promise<{ hasil?: Hasil; sql?: string; error?: { pesan: string; jenis: JenisError } }> {
  const siap = siapkanQuery(masukan);
  if (!siap.ok) return { error: { pesan: siap.pesan, jenis: siap.jenis } };
  try {
    const hasil = await db.jalankan(siap.sql);
    return { hasil, sql: siap.sql };
  } catch (e) {
    return { error: terjemahError(e) };
  }
}

export async function periksaLangkah(db: DbKasus, langkah: Langkah, masukan: string): Promise<HasilPeriksa> {
  const r = await jalankanSiswa(db, masukan);
  if (r.error) return { benar: false, pesan: r.error.pesan, jenis_error: r.error.jenis };
  const hasil = r.hasil!;
  const kunci = await hasilKunci(db, langkah.query_kunci);
  const b = bandingkan(kunci, hasil, langkah.cocok, langkah.query_kunci, r.sql!);
  const n = hasil.baris.length;
  if (!b.cocok) {
    const pesan = {
      kosong: 'Query berjalan, tapi tidak ada baris yang cocok. Cek lagi nilai di syaratmu, termasuk huruf besar kecil dan tanda kutip.',
      lebih: `Hasilmu ${n} baris, padahal bukti yang dicari lebih sedikit. Syaratnya mungkin kurang ketat.`,
      kurang: `Hasilmu ${n} baris, padahal masih ada bukti yang terlewat. Syaratnya mungkin terlalu ketat.`,
      kolom_kurang: `Jumlah barisnya sudah pas, tapi kolomnya belum lengkap. Kolom yang dibutuhkan: ${kunci.kolom.join(', ')}.`,
      kolom_lebih: `Isinya sudah benar, tapi tampilkan kolom ${kunci.kolom.join(', ')} saja.`,
      isi: `Jumlah barisnya sudah ${n}, tapi isinya belum sesuai. Cek lagi kolom, syarat, atau tabel yang dipakai.`,
      urutan: 'Isinya sudah benar, tapi urutannya belum sesuai. Perhatikan ORDER BY.',
    }[b.alasan];
    return { benar: false, hasil, pesan, jenis_error: 'hasil' };
  }
  const kurang = langkah.wajib.filter((w) => !pakaiKata(r.sql!, w));
  if (kurang.length) {
    return {
      benar: false,
      hasil,
      jenis_error: 'kata_wajib',
      pesan: `Hasilnya sudah benar, tapi langkah ini melatih ${kurang.join(' dan ')}. Coba tulis ulang query-mu dengan ${kurang.join(' dan ')}.`,
    };
  }
  return { benar: true, hasil, pesan: langkah.komentar_benar || 'Bukti tersimpan.' };
}
