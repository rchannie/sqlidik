import { ScrollView, View } from 'react-native';

import { Hasil, Nilai } from '../mesin/jenis';
import { W } from '../tema';
import { Kode } from './ui';

function teksNilai(v: Nilai): string {
  if (v === null) return 'NULL';
  if (typeof v === 'number' && !Number.isInteger(v)) return String(Math.round(v * 100) / 100);
  return String(v);
}

/** Tabel hasil query bergaya terminal. Kolom melebar sesuai isi dan bisa digeser ke samping. */
export function TabelHasil({ hasil, maks = 50, terang, ukuran = 20 }: { hasil: Hasil; maks?: number; terang?: boolean; ukuran?: number }) {
  const teksWarna = terang ? W.tinta : W.layarTeks;
  const kepalaWarna = terang ? W.biru : W.layarKuning;
  const garis = terang ? W.abu2 : W.layarGaris;
  const tampil = hasil.baris.slice(0, maks);
  const lebar = hasil.kolom.map((k, i) => {
    const panjang = Math.max(k.length, ...tampil.map((b) => teksNilai(b[i]).length));
    return Math.min(260, Math.max(48, panjang * (ukuran * 0.47) + 18));
  });
  return (
    <View style={{ borderWidth: 2, borderColor: garis, backgroundColor: terang ? W.kertasPutih : W.layar2 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator>
        <View>
          <View style={{ flexDirection: 'row', borderBottomWidth: 2, borderColor: garis }}>
            {hasil.kolom.map((k, i) => (
              <View key={i} style={{ width: lebar[i], paddingHorizontal: 8, paddingVertical: 4 }}>
                <Kode ukuran={ukuran} warna={kepalaWarna}>{k}</Kode>
              </View>
            ))}
          </View>
          {tampil.map((b, r) => (
            <View key={r} style={{ flexDirection: 'row', backgroundColor: r % 2 ? (terang ? '#F1EEE4' : '#0A1810') : 'transparent' }}>
              {b.map((v, i) => (
                <View key={i} style={{ width: lebar[i], paddingHorizontal: 8, paddingVertical: 2 }}>
                  <Kode ukuran={ukuran} warna={v === null ? W.abu3 : teksWarna}>{teksNilai(v)}</Kode>
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
      {hasil.baris.length > maks ? (
        <View style={{ padding: 6, borderTopWidth: 2, borderColor: garis }}>
          <Kode ukuran={18} warna={kepalaWarna}>{`... ${hasil.baris.length - maks} baris lagi`}</Kode>
        </View>
      ) : null}
    </View>
  );
}
