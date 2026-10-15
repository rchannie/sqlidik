/* Menerjemahkan pesan error SQLite menjadi bahasa Indonesia yang mudah dipahami siswa. */
export type JenisError = 'sintaks' | 'tabel' | 'kolom' | 'ambigu' | 'agregasi' | 'hasil' | 'kata_wajib' | 'lain';

export type PesanError = { pesan: string; jenis: JenisError };

function ambil(pola: RegExp, teks: string): string | null {
  const m = teks.match(pola);
  return m ? m[1].trim() : null;
}

export function terjemahError(e: unknown): PesanError {
  const asli = e instanceof Error ? e.message : String(e);
  const t = asli.replace(/\s+/g, ' ');
  let x: string | null;
  if ((x = ambil(/no such table: ([\w.]+)/i, t))) {
    return { jenis: 'tabel', pesan: `Tabel ${x} tidak ada. Cek nama tabel di Peta Tabel.` };
  }
  if ((x = ambil(/no such column: ([\w.]+)/i, t))) {
    return { jenis: 'kolom', pesan: `Kolom ${x} tidak ditemukan. Cek ejaannya, atau mungkin kolom itu ada di tabel lain.` };
  }
  if ((x = ambil(/ambiguous column name: ([\w.]+)/i, t))) {
    return { jenis: 'ambigu', pesan: `Kolom ${x} ada di lebih dari satu tabel. Tulis nama tabelnya juga, misalnya tabel.${x}.` };
  }
  if (/misuse of aggregate/i.test(t)) {
    return { jenis: 'agregasi', pesan: 'Fungsi seperti COUNT atau SUM tidak bisa dipakai di WHERE. Untuk menyaring hasil kelompok, pakai HAVING.' };
  }
  if (/must appear in the GROUP BY|aggregate functions are not allowed in the GROUP BY/i.test(t)) {
    return { jenis: 'agregasi', pesan: 'Ada yang salah dengan GROUP BY. Kelompokkan berdasarkan kolom biasa, bukan fungsi agregasi.' };
  }
  if ((x = ambil(/wrong number of arguments to function (\w+)/i, t))) {
    return { jenis: 'sintaks', pesan: `Isi kurung pada fungsi ${x} belum benar.` };
  }
  if ((x = ambil(/no such function: (\w+)/i, t))) {
    return { jenis: 'sintaks', pesan: `Fungsi ${x} tidak dikenal. Cek lagi penulisannya.` };
  }
  if (/incomplete input/i.test(t)) {
    return { jenis: 'sintaks', pesan: 'Query belum lengkap. Mungkin ada tanda kutip atau kurung yang belum ditutup.' };
  }
  if (/unrecognized token/i.test(t)) {
    return { jenis: 'sintaks', pesan: 'Ada tanda yang tidak dikenali. Biasanya karena tanda kutip belum ditutup.' };
  }
  if ((x = ambil(/near "([^"]*)": syntax error/i, t))) {
    return { jenis: 'sintaks', pesan: `Ada kesalahan penulisan di dekat "${x}". Cek koma, tanda kutip, dan urutan kata kunci (SELECT, FROM, WHERE).` };
  }
  if (/syntax error/i.test(t)) {
    return { jenis: 'sintaks', pesan: 'Ada kesalahan penulisan SQL. Cek koma, tanda kutip, dan urutan kata kunci.' };
  }
  if (/readonly|not authorized|attempt to write/i.test(t)) {
    return { jenis: 'lain', pesan: 'Detektif hanya membaca bukti, tidak mengubahnya. Gunakan perintah SELECT.' };
  }
  const bersih = t.replace(/^.*Caused by:\s*/i, '').replace(/^Error code \d+:\s*/i, '');
  return { jenis: 'lain', pesan: `SQLite menolak query ini: ${bersih}` };
}
