/* Mesin SQL di browser: SQLite versi WebAssembly (sql.js) yang dimuat dari folder public/sqljs. */
import { BATAS_BARIS, DbKasus, Hasil, Nilai, nilaiAman } from './jenis';

type SqlJs = { Database: new () => any };
let modul: Promise<SqlJs> | null = null;

function muatSqlJs(): Promise<SqlJs> {
  if (modul) return modul;
  modul = new Promise<SqlJs>((selesai, gagal) => {
    const w = window as any;
    const lokasi = (f: string) => `${window.location.origin}/sqljs/${f}`;
    const mulai = () => w.initSqlJs({ locateFile: lokasi }).then(selesai, gagal);
    if (w.initSqlJs) return mulai();
    const s = document.createElement('script');
    s.src = lokasi('sql-wasm.js');
    s.async = true;
    s.onload = mulai;
    s.onerror = () => gagal(new Error('Mesin SQL gagal dimuat. Muat ulang halaman.'));
    document.head.appendChild(s);
  });
  modul.catch(() => {
    modul = null;
  });
  return modul;
}

/** Dimuat sejak aplikasi dibuka, supaya kasus tetap bisa dimainkan kalau internet putus di tengah jalan. */
export function siapkanMesin(): void {
  muatSqlJs().catch(() => {});
}

export async function bukaDb(skrip: string): Promise<DbKasus> {
  const SQL = await muatSqlJs();
  const db = new SQL.Database();
  db.exec(skrip);
  let tertutup = false;
  return {
    async jalankan(sql: string): Promise<Hasil> {
      const st = db.prepare(sql);
      try {
        const kolom: string[] = st.getColumnNames();
        const baris: Nilai[][] = [];
        let terpotong = false;
        while (st.step()) {
          if (baris.length >= BATAS_BARIS) {
            terpotong = true;
            break;
          }
          baris.push((st.get() as unknown[]).map(nilaiAman));
        }
        return { kolom, baris, terpotong };
      } finally {
        st.free();
      }
    },
    async tutup() {
      if (tertutup) return;
      tertutup = true;
      db.close();
    },
  };
}
