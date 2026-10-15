/* Mode Blok: memecah query kunci menjadi blok kata, lalu menambahkan beberapa blok pengecoh. */
import type { Langkah, MetaTabel } from '../konten';

const POLA = /'(?:[^']|'')*'|\bGROUP\s+BY\b|\bORDER\s+BY\b|[A-Za-z_][A-Za-z0-9_]*\s*\([^()]*\)|[A-Za-z_][A-Za-z0-9_]*\.[A-Za-z_][A-Za-z0-9_]*|[A-Za-z_][A-Za-z0-9_]*|\d+(?:\.\d+)?|<>|>=|<=|!=|[=<>*,()]/gi;
const KATA_KUNCI = new Set([
  'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'LIKE', 'GROUP BY', 'ORDER BY', 'HAVING', 'JOIN', 'ON', 'AS',
  'DESC', 'ASC', 'DISTINCT', 'LIMIT', 'IN', 'IS', 'NULL', 'BETWEEN', 'INNER', 'LEFT',
]);

export type Blok = { id: string; teks: string; jenis: 'kunci' | 'nama' | 'nilai' | 'tanda' };

export function pecahToken(sql: string): string[] {
  return (sql.match(POLA) ?? []).map((t) => {
    const atas = t.toUpperCase().replace(/\s+/g, ' ');
    if (KATA_KUNCI.has(atas)) return atas;
    if (/^[A-Za-z_]+\s*\(/.test(t)) return t.replace(/^([A-Za-z_]+)\s*\(/, (_, f) => f.toUpperCase() + '(');
    return t;
  });
}

function jenisBlok(t: string): Blok['jenis'] {
  if (KATA_KUNCI.has(t) || /^[A-Z]+\(/.test(t)) return 'kunci';
  if (t.startsWith("'") || /^\d/.test(t)) return 'nilai';
  if (/^[=<>*,()!]+$/.test(t)) return 'tanda';
  return 'nama';
}

function acak<T>(xs: T[], benih: string): T[] {
  let h = 2166136261;
  for (const c of benih) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  const hasil = [...xs];
  for (let i = hasil.length - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    const j = Math.abs(h ^ (h >>> 16)) % (i + 1);
    [hasil[i], hasil[j]] = [hasil[j], hasil[i]];
  }
  return hasil;
}

export function buatBlok(langkah: Langkah, tabel: MetaTabel[], benih: string): Blok[] {
  const token = pecahToken(langkah.query_kunci);
  const ada = new Set(token.map((t) => t.toLowerCase()));
  const pengecoh: string[] = [];
  const kolomLain = tabel.flatMap((t) => t.kolom.map((k) => k.nama)).filter((k) => !ada.has(k.toLowerCase()));
  for (const k of acak([...new Set(kolomLain)], benih).slice(0, 2)) pengecoh.push(k);
  const kataLain = ['WHERE', 'ORDER BY', 'AND', 'OR', 'GROUP BY', 'LIKE'].filter((k) => !ada.has(k.toLowerCase()));
  if (kataLain.length) pengecoh.push(acak(kataLain, benih + 'k')[0]);
  for (const b of langkah.blok_tambahan ?? []) pengecoh.push(b);
  const semua = [...token, ...pengecoh].map((teks, i) => ({ id: `b${i}`, teks, jenis: jenisBlok(teks) }));
  return acak(semua, benih);
}

export function rangkaiBlok(daftar: string[]): string {
  return daftar
    .join(' ')
    .replace(/\s+,/g, ',')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
    .trim();
}
