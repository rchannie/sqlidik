/* Mesin SQL di HP: SQLite asli lewat expo-sqlite, dibuka di memori untuk setiap kasus. */
import * as SQLite from 'expo-sqlite';

import { BATAS_BARIS, DbKasus, Hasil, Nilai, nilaiAman } from './jenis';

/** Di HP mesin SQLite sudah tersedia, jadi tidak perlu disiapkan. */
export function siapkanMesin(): void {}

export async function bukaDb(skrip: string): Promise<DbKasus> {
  const db = await SQLite.openDatabaseAsync(':memory:', { useNewConnection: true });
  await db.execAsync(skrip);
  let tertutup = false;
  return {
    async jalankan(sql: string): Promise<Hasil> {
      const st = await db.prepareAsync(sql);
      try {
        const kolom = await st.getColumnNamesAsync();
        const res = await st.executeForRawResultAsync();
        const baris: Nilai[][] = [];
        let terpotong = false;
        for await (const r of res) {
          if (baris.length >= BATAS_BARIS) {
            terpotong = true;
            break;
          }
          baris.push((r as unknown[]).map(nilaiAman));
        }
        return { kolom, baris, terpotong };
      } finally {
        await st.finalizeAsync();
      }
    },
    async tutup() {
      if (tertutup) return;
      tertutup = true;
      await db.closeAsync();
    },
  };
}
