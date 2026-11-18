import { useEffect, useState } from 'react';
import { View } from 'react-native';

import type { Tahap } from '../mesin/proses';
import { efek } from '../suara/mesin';
import { Gerak } from './gerak';
import { W } from '../tema';
import { TabelHasil } from './tabel';
import { Judul, Kode, Lembar, Teks, Tombol } from './ui';

/** Lihat Proses: tahapan query (FROM, WHERE, GROUP BY, HAVING, SELECT) dibuka satu per satu. */
export function LembarProses({ terbuka, tutup, tahap, galat }: { terbuka: boolean; tutup: () => void; tahap: Tahap[]; galat?: string }) {
  const [tampil, setTampil] = useState(1);
  useEffect(() => {
    if (terbuka) setTampil(1);
  }, [terbuka, tahap]);
  const sisa = tahap.length - tampil;

  return (
    <Lembar terbuka={terbuka} tutup={tutup} judul="LIHAT PROSES QUERY" suaraBuka="proses_tahap">
      {galat ? <Teks warna={W.merah}>{galat}</Teks> : null}
      {tahap.slice(0, tampil).map((t, i) => (
        <Gerak key={i} jenis="naik" jarak={12} durasi={220} style={{ gap: 6 }}>
          <Judul ukuran={10}>{t.judul.toUpperCase()}</Judul>
          <View style={{ backgroundColor: W.layar, padding: 8, borderWidth: 2, borderColor: W.tinta }}>
            <Kode ukuran={20}>{t.klausa}</Kode>
          </View>
          <Teks ukuran={16}>{t.penjelasan}</Teks>
          {t.galat ? <Teks ukuran={15} warna={W.merah}>{t.galat}</Teks> : null}
          {t.hasil ? <TabelHasil hasil={t.hasil} maks={8} terang ukuran={18} /> : null}
          {i < tampil - 1 ? <Judul ukuran={12} warna={W.merah} style={{ textAlign: 'center' }}>V</Judul> : null}
        </Gerak>
      ))}
      {sisa > 0 ? (
        <View style={{ gap: 8 }}>
          <Tombol
            label={`TAHAP BERIKUTNYA: ${tahap[tampil].judul.toUpperCase()}`}
            suara={null}
            onPress={() => {
              efek('proses_tahap');
              setTampil(tampil + 1);
            }}
            testID="tahap-berikutnya"
          />
          <Tombol label="TAMPILKAN SEMUA TAHAP" varian="kertas" kecil onPress={() => setTampil(tahap.length)} />
        </View>
      ) : null}
    </Lembar>
  );
}
