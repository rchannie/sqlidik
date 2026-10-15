/* Lihat Proses: memecah query SELECT menjadi tahapan FROM, WHERE, GROUP BY, HAVING, lalu SELECT. */
import { DbKasus, Hasil } from './jenis';
import { siapkanQuery } from './periksa';
import { terjemahError } from './pesan';

export type Tahap = { judul: string; klausa: string; penjelasan: string; hasil?: Hasil; jumlah?: number; galat?: string };

const KLAUSA = ['SELECT', 'FROM', 'WHERE', 'GROUP BY', 'HAVING', 'ORDER BY', 'LIMIT'] as const;
type Klausa = (typeof KLAUSA)[number];

/** Mengganti isi teks berkutip dengan karakter netral supaya posisi huruf tetap sama. */
function samarkan(sql: string): string {
  return sql.replace(/'(?:[^']|'')*'/g, (m) => "'" + 'x'.repeat(m.length - 2) + "'");
}

export function pecahKlausa(sql: string): Partial<Record<Klausa, string>> | null {
  const s = samarkan(sql);
  const atas = s.toUpperCase();
  const posisi: { k: Klausa; i: number; panjang: number }[] = [];
  let kedalaman = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '(') kedalaman++;
    else if (c === ')') kedalaman--;
    if (kedalaman !== 0) continue;
    if (i > 0 && /[A-Za-z0-9_]/.test(s[i - 1])) continue;
    for (const k of KLAUSA) {
      const pola = new RegExp('^' + k.replace(' ', '\\s+') + '(?![A-Za-z0-9_])');
      const m = atas.slice(i).match(pola);
      if (m) {
        if (!posisi.some((p) => p.k === k)) posisi.push({ k, i, panjang: m[0].length });
        i += m[0].length - 1;
        break;
      }
    }
  }
  if (!posisi.length || posisi[0].k !== 'SELECT' || !posisi.some((p) => p.k === 'FROM')) return null;
  const hasil: Partial<Record<Klausa, string>> = {};
  posisi.forEach((p, n) => {
    const akhir = n + 1 < posisi.length ? posisi[n + 1].i : sql.length;
    hasil[p.k] = sql.slice(p.i + p.panjang, akhir).trim();
  });
  return hasil;
}

export async function lihatProses(db: DbKasus, masukan: string): Promise<{ tahap: Tahap[]; galat?: string }> {
  const siap = siapkanQuery(masukan);
  if (!siap.ok) return { tahap: [], galat: siap.pesan };
  const k = pecahKlausa(siap.sql);
  if (!k) return { tahap: [], galat: 'Lihat Proses hanya bisa dipakai untuk query SELECT ... FROM ... yang sederhana.' };

  const tahap: Tahap[] = [];
  const jalan = async (t: Tahap, sql: string) => {
    try {
      const h = await db.jalankan(sql);
      t.hasil = h;
      t.jumlah = h.baris.length;
    } catch (e) {
      t.galat = terjemahError(e).pesan;
    }
    tahap.push(t);
  };

  const from = k.FROM!;
  const adaJoin = /\bJOIN\b/i.test(samarkan(from));
  const awal: Tahap = {
    judul: adaJoin ? '1. Gabungkan tabel' : '1. Ambil tabel',
    klausa: 'FROM ' + from,
    penjelasan: adaJoin
      ? 'JOIN memasangkan baris dari beberapa tabel yang nilainya cocok menurut syarat ON.'
      : 'Semua baris dari tabel diambil lebih dulu.',
  };
  await jalan(awal, `SELECT * FROM ${from}`);
  const totalAwal = awal.jumlah ?? 0;
  if (adaJoin) awal.penjelasan += ` Hasilnya ${totalAwal} baris gabungan.`;
  else awal.penjelasan += ` Ada ${totalAwal} baris.`;

  const where = k.WHERE ? ` WHERE ${k.WHERE}` : '';
  let n = 2;
  if (k.WHERE) {
    const t: Tahap = { judul: `${n++}. Saring baris`, klausa: 'WHERE ' + k.WHERE, penjelasan: '' };
    await jalan(t, `SELECT * FROM ${from}${where}`);
    t.penjelasan = `Hanya baris yang memenuhi syarat yang lolos: tersisa ${t.jumlah ?? 0} dari ${totalAwal} baris.`;
  }
  if (k['GROUP BY']) {
    const g = k['GROUP BY'];
    const t: Tahap = { judul: `${n++}. Kelompokkan`, klausa: 'GROUP BY ' + g, penjelasan: '' };
    await jalan(t, `SELECT ${g}, COUNT(*) AS banyak_baris FROM ${from}${where} GROUP BY ${g}`);
    t.penjelasan = `Baris dengan nilai ${g} yang sama digabung menjadi satu kelompok. Ada ${t.jumlah ?? 0} kelompok.`;
    if (k.HAVING) {
      const h: Tahap = { judul: `${n++}. Saring kelompok`, klausa: 'HAVING ' + k.HAVING, penjelasan: '' };
      await jalan(h, `SELECT ${g}, COUNT(*) AS banyak_baris FROM ${from}${where} GROUP BY ${g} HAVING ${k.HAVING}`);
      h.penjelasan = `HAVING menyaring hasil kelompok: tersisa ${h.jumlah ?? 0} kelompok.`;
    }
  }
  const akhir: Tahap = { judul: `${n++}. Pilih kolom`, klausa: 'SELECT ' + k.SELECT, penjelasan: '' };
  await jalan(akhir, siap.sql);
  const catatan: string[] = [];
  if (/^DISTINCT\b/i.test(k.SELECT ?? '')) catatan.push('DISTINCT membuang baris yang sama persis.');
  if (/\b(COUNT|SUM|AVG|MIN|MAX)\s*\(/i.test(k.SELECT ?? '') && !k['GROUP BY']) {
    catatan.push('Fungsi agregasi tanpa GROUP BY meringkas semua baris menjadi satu.');
  }
  if (k['ORDER BY']) catatan.push(`Hasil diurutkan dengan ORDER BY ${k['ORDER BY']}.`);
  if (k.LIMIT) catatan.push(`LIMIT ${k.LIMIT} membatasi jumlah baris.`);
  akhir.penjelasan = `Kolom yang ditulis setelah SELECT ditampilkan sebagai hasil akhir (${akhir.jumlah ?? 0} baris). ${catatan.join(' ')}`.trim();
  return { tahap };
}
