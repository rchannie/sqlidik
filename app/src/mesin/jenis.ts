export type Nilai = string | number | null;
export type Hasil = { kolom: string[]; baris: Nilai[][]; terpotong?: boolean };

export interface DbKasus {
  jalankan(sql: string): Promise<Hasil>;
  tutup(): Promise<void>;
}

export const BATAS_BARIS = 1000;

export function nilaiAman(v: unknown): Nilai {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number' || typeof v === 'string') return v;
  if (typeof v === 'bigint') return Number(v);
  if (typeof v === 'boolean') return v ? 1 : 0;
  return '[data biner]';
}
