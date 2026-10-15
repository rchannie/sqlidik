import { View } from 'react-native';

import type { Tahap } from '../mesin/proses';
import { W } from '../tema';
import { TabelHasil } from './tabel';
import { Judul, Kode, Lembar, Teks } from './ui';

export function LembarProses({ terbuka, tutup, tahap, galat }: { terbuka: boolean; tutup: () => void; tahap: Tahap[]; galat?: string }) {
  return (
    <Lembar terbuka={terbuka} tutup={tutup} judul="LIHAT PROSES QUERY">
      {galat ? <Teks warna={W.merah}>{galat}</Teks> : null}
      {tahap.map((t, i) => (
        <View key={i} style={{ gap: 6 }}>
          <Judul ukuran={10}>{t.judul.toUpperCase()}</Judul>
          <View style={{ backgroundColor: W.layar, padding: 8, borderWidth: 2, borderColor: W.tinta }}>
            <Kode ukuran={20}>{t.klausa}</Kode>
          </View>
          <Teks ukuran={16}>{t.penjelasan}</Teks>
          {t.galat ? <Teks ukuran={15} warna={W.merah}>{t.galat}</Teks> : null}
          {t.hasil ? <TabelHasil hasil={t.hasil} maks={8} terang ukuran={18} /> : null}
          {i < tahap.length - 1 ? <Judul ukuran={12} warna={W.merah} style={{ textAlign: 'center' }}>V</Judul> : null}
        </View>
      ))}
    </Lembar>
  );
}
