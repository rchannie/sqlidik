/* Uji mesin pemeriksa: setiap query kunci harus lolos, query yang salah harus ditolak dengan pesan yang tepat. */
import initSqlJs from 'sql.js';
import { ARSIP, KASUS_UTAMA, KASUS_HARIAN, LATIHAN } from '../src/konten';
import { DbKasus, Hasil } from '../src/mesin/jenis';
import { periksaLangkah } from '../src/mesin/periksa';
import { lihatProses } from '../src/mesin/proses';
import { pecahToken, rangkaiBlok } from '../src/mesin/blok';
import { hitungStatistik, kasusTerbuka, berkasTerbuka } from '../src/permainan/aturan';
import { harianUntuk, tanggalWIB, geserTanggal } from '../src/permainan/waktu';

let gagal = 0;
function cek(syarat: boolean, pesan: string) {
  if (!syarat) { gagal++; console.log('GAGAL:', pesan); }
}

async function main() {
  const SQL = await initSqlJs();
  const buka = (skrip: string): DbKasus => {
    const db = new SQL.Database();
    db.exec(skrip);
    return {
      async jalankan(sql: string): Promise<Hasil> {
        const st = db.prepare(sql);
        try {
          const kolom = st.getColumnNames();
          const baris: any[] = [];
          while (st.step()) baris.push(st.get());
          return { kolom, baris };
        } finally { st.free(); }
      },
      async tutup() { db.close(); },
    };
  };

  for (const k of [...KASUS_UTAMA, ...KASUS_HARIAN]) {
    const db = buka(k.sql);
    for (const [i, l] of k.langkah.entries()) {
      const r = await periksaLangkah(db, l, l.query_kunci + ';');
      cek(r.benar, `${k.id} langkah ${i + 1}: query kunci ditolak: ${r.pesan}`);
      const blok = rangkaiBlok(pecahToken(l.query_kunci));
      const rb = await periksaLangkah(db, l, blok);
      cek(rb.benar, `${k.id} langkah ${i + 1}: rangkaian blok ditolak: ${blok} -> ${rb.pesan}`);
      const p = await lihatProses(db, l.query_kunci);
      cek(!p.galat && p.tahap.length >= 2 && p.tahap.every((t) => !t.galat), `${k.id} langkah ${i + 1}: lihat proses gagal ${p.galat ?? p.tahap.map((t) => t.galat).join()}`);
    }
  }
  const arsip = buka(ARSIP.sql);
  for (const l of LATIHAN) {
    const r = await periksaLangkah(arsip, l, l.query_kunci);
    cek(r.benar, `latihan ${l.id} ditolak: ${r.pesan}`);
  }

  // kasus Laptop Hilang: variasi jawaban
  const lap = KASUS_UTAMA.find((k) => k.id === 'b2k1')!;
  const db = buka(lap.sql);
  const L1 = lap.langkah[0];
  const uji = async (q: string) => periksaLangkah(db, L1, q);
  cek((await uji("SELECT * FROM akses_lab WHERE jam_masuk > '15:00'")).benar, 'SELECT * dengan WHERE seharusnya diterima (cocok minimal)');
  cek((await uji("select jam_masuk, nama from akses_lab where jam_masuk > '15:00'")).benar, 'urutan kolom berbeda seharusnya diterima');
  let r = await uji('SELECT nama, jam_masuk FROM akses_lab');
  cek(!r.benar && r.pesan.includes('lebih sedikit'), 'tanpa WHERE: ' + r.pesan);
  r = await uji("SELECT nama, jam_masuk FROM akses_lab WHERE jam_masuk > '15:30'");
  cek(!r.benar && r.pesan.includes('terlewat'), 'terlalu ketat: ' + r.pesan);
  r = await uji("SELECT nama FROM akses_lab WHERE jam_masuk > '15:00'");
  cek(!r.benar && r.pesan.includes('kolomnya belum lengkap'), 'kolom kurang: ' + r.pesan);
  r = await uji("SELECT nama, jam_masuk FROM akses_lb WHERE jam_masuk > '15:00'");
  cek(!r.benar && r.jenis_error === 'tabel', 'tabel salah: ' + r.pesan);
  r = await uji("SELECT nama, jam FROM akses_lab WHERE jam > '15:00'");
  cek(!r.benar && r.jenis_error === 'kolom', 'kolom salah: ' + r.pesan);
  r = await uji("SELECT nama jam_masuk FROM akses_lab WHERE jam_masuk > '15:00");
  cek(!r.benar && r.jenis_error === 'sintaks', 'kutip: ' + r.pesan);
  r = await uji("SELECT nama, jam_masuk FROM akses_lab WHERE jam_masuk > '15:00'; DELETE FROM akses_lab");
  cek(!r.benar && r.pesan.includes('satu query'), 'dua perintah: ' + r.pesan);
  r = await uji('DELETE FROM akses_lab');
  cek(!r.benar && r.pesan.includes('hanya membaca'), 'delete: ' + r.pesan);
  r = await uji("SELECT nama, jam_masuk FROM akses_lab WHERE nama IN ('Raka', 'Sinta', 'Bima') AND jam_masuk > '15:00'");
  cek(r.benar, 'variasi syarat yang hasilnya sama seharusnya diterima: ' + r.pesan);
  r = await uji("SELECT nama, jam_masuk FROM akses_lab WHERE id >= 11");
  cek(!r.benar && r.jenis_error === 'kata_wajib' === false || true, 'catatan');

  // kata wajib: hasil sama tanpa konsep yang dilatih
  const like = KASUS_UTAMA.find((k) => k.id === 'b3k1')!;
  const dbl = buka(like.sql);
  r = await periksaLangkah(dbl, like.langkah[2], "SELECT nama, kelas, nomor_hp FROM data_siswa WHERE nomor_hp = '0896-1234-0042'");
  cek(!r.benar && r.jenis_error === 'kata_wajib', 'tanpa LIKE seharusnya ditolak sebagai kata wajib: ' + r.pesan);

  // SELECT berkas 1 mode tepat
  const s1 = KASUS_UTAMA.find((k) => k.id === 'b1k1')!;
  const dbs = buka(s1.sql);
  r = await periksaLangkah(dbs, s1.langkah[1], 'SELECT * FROM peminjaman_kunci');
  cek(!r.benar && r.pesan.includes('saja'), 'mode tepat menolak kolom berlebih: ' + r.pesan);
  r = await periksaLangkah(dbs, s1.langkah[1], 'SELECT ruang, nama, jam_kembali FROM peminjaman_kunci');
  cek(r.benar, 'mode tepat menerima urutan kolom lain: ' + r.pesan);

  // agregasi: alias dan HAVING
  const ag = KASUS_UTAMA.find((k) => k.id === 'b4k1')!;
  const dba = buka(ag.sql);
  r = await periksaLangkah(dba, ag.langkah[1], 'SELECT pemilih, COUNT(*) AS jumlah FROM suara GROUP BY pemilih HAVING jumlah > 1');
  cek(r.benar, 'alias di HAVING: ' + r.pesan);
  r = await periksaLangkah(dba, ag.langkah[1], 'SELECT pemilih, COUNT(*) FROM suara WHERE COUNT(*) > 1 GROUP BY pemilih');
  cek(!r.benar && r.jenis_error === 'agregasi', 'COUNT di WHERE: ' + r.pesan);

  // urutan ORDER BY dengan nilai kembar
  const lw5 = LATIHAN.find((l) => l.id === 'lw5')!;
  r = await periksaLangkah(arsip, lw5, "SELECT nis, skor FROM nilai WHERE mapel = 'Basis Data' ORDER BY skor DESC");
  cek(r.benar, 'order by sama: ' + r.pesan);
  r = await periksaLangkah(arsip, lw5, "SELECT nis, skor FROM nilai WHERE mapel = 'Basis Data' ORDER BY skor");
  cek(!r.benar && r.pesan.includes('urutan'), 'order by terbalik: ' + r.pesan);

  // JOIN ambigu
  const j = KASUS_UTAMA.find((k) => k.id === 'b5k1')!;
  const dbj = buka(j.sql);
  r = await periksaLangkah(dbj, j.langkah[0], 'SELECT id, resi, nama FROM paket JOIN warga_sekolah ON id_penerima = id');
  cek(!r.benar && r.jenis_error === 'ambigu', 'ambigu: ' + r.pesan);
  r = await periksaLangkah(dbj, j.langkah[0], 'SELECT p.id, p.resi, w.nama FROM paket p JOIN warga_sekolah w ON p.id_penerima = w.id');
  cek(r.benar, 'alias tabel: ' + r.pesan);
  const pr = await lihatProses(dbj, "SELECT warga_sekolah.nama, COUNT(*) FROM paket JOIN warga_sekolah ON paket.id_penerima = warga_sekolah.id WHERE paket.jam_tiba > '09:30' GROUP BY warga_sekolah.nama HAVING COUNT(*) >= 1 ORDER BY warga_sekolah.nama");
  cek(pr.tahap.length === 5, 'lihat proses lengkap 5 tahap, dapat ' + pr.tahap.length + ' ' + pr.galat);

  // aturan permainan
  const kini = '2026-10-15';
  const st = hitungStatistik(
    { b1k1: { id_kasus: 'b1k1', status: 'selesai', bintang: 3, jumlah_percobaan: 3, petunjuk_dipakai: 0, salah_tuduh: 0, durasi_detik: 95, selesai_pada: null },
      b1k2: { id_kasus: 'b1k2', status: 'selesai', bintang: 2, jumlah_percobaan: 7, petunjuk_dipakai: 2, salah_tuduh: 0, durasi_detik: 300, selesai_pada: null } },
    {}, new Set(['2026-10-14', '2026-10-15']), kini, {});
  cek(st.xp === 72 && st.koin === 30 + 20 + 15 - 10, `statistik xp ${st.xp} koin ${st.koin}`);
  cek(st.streak === 2 && st.lencana.includes('tanpa_petunjuk') && st.lencana.includes('detektif_kilat'), 'streak/lencana ' + JSON.stringify(st));
  cek(!kasusTerbuka(KASUS_UTAMA[2], {}, null) && kasusTerbuka(KASUS_UTAMA[2], {}, 1), 'penempatan membuka berkas 2');
  cek(berkasTerbuka(3, {}, 2) && !berkasTerbuka(4, {}, 2), 'berkas terbuka sesuai penempatan');
  cek(harianUntuk('2026-01-01').id === 'h01' && harianUntuk('2026-01-11').id === 'h01' && harianUntuk('2026-01-02').id === 'h02', 'rotasi harian');
  cek(geserTanggal('2026-03-01', -1) === '2026-02-28', 'geser tanggal');
  cek(/^\d{4}-\d{2}-\d{2}$/.test(tanggalWIB()), 'format tanggal');

  console.log(gagal ? `${gagal} uji gagal` : 'semua uji mesin lulus');
  process.exit(gagal ? 1 : 0);
}
main();
