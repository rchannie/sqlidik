/* Buku Catatan Detektif: ringkasan konsep beserta contoh query dan kesalahan umum. */
import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { A } from '../../aset';
import { ikonKonsep } from '../../komponen/kartu';
import { Gerak } from '../../komponen/gerak';
import { HudKasus, Layar } from '../../komponen/layar';
import { Ikon, Judul, Kode, Kotak, Label, Teks, Tombol } from '../../komponen/ui';
import { CATATAN, Konsep, LATIHAN, URUTAN_KONSEP } from '../../konten';
import { useMusikLayar } from '../../suara/mesin';
import { NAMA_KONSEP, W } from '../../tema';

export default function Catatan() {
  const { konsep } = useLocalSearchParams<{ konsep: string }>();
  const k = (URUTAN_KONSEP.includes(konsep as Konsep) ? konsep : 'SELECT') as Konsep;
  const c = CATATAN[k];
  const latihan = LATIHAN.find((l) => l.konsep === k);
  useMusikLayar('musik_arsip');
  return (
    <Layar latar={A.latar.papan} atas={<HudKasus label="BUKU CATATAN DETEKTIF" judul={c.judul} />}>
      <Kotak isi={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Gerak jenis="melayang">
            <Ikon src={ikonKonsep(k)} ukuran={40} />
          </Gerak>
          <Judul ukuran={12} style={{ flex: 1 }}>{c.judul.toUpperCase()}</Judul>
        </View>
        {c.paragraf.map((p, i) => (
          <Teks key={i}>{p}</Teks>
        ))}
      </Kotak>
      <Kotak warna={W.tinta} tepi={W.kertas} isi={{ gap: 10 }}>
        <Label warna={W.emas}>CONTOH</Label>
        {c.contoh.map((x, i) => (
          <View key={i} style={{ gap: 4 }}>
            <View style={{ backgroundColor: W.layar, borderWidth: 2, borderColor: W.layarGaris, padding: 8 }}>
              <Kode pilih>{x.query}</Kode>
            </View>
            <Teks warna={W.kertas} ukuran={15}>{x.arti}</Teks>
          </View>
        ))}
      </Kotak>
      <Kotak warna={W.emasMuda} isi={{ gap: 8 }}>
        <Label warna={W.merahTua}>KESALAHAN YANG SERING TERJADI</Label>
        {c.kesalahan.map((x, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: 8 }}>
            <Judul ukuran={9} warna={W.merahTua}>{i + 1}</Judul>
            <Teks ukuran={16} style={{ flex: 1 }}>{x}</Teks>
          </View>
        ))}
      </Kotak>
      {latihan ? <Tombol label={`LATIHAN ${NAMA_KONSEP[k]}`} onPress={() => router.push(`/latihan/${latihan.id}`)} /> : null}
    </Layar>
  );
}
