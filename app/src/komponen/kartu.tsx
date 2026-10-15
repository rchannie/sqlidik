import { View } from 'react-native';

import { A } from '../aset';
import type { KartuKonsep as Kartu } from '../konten';
import { W } from '../tema';
import { Ikon, Judul, Kode, Kotak, Teks } from './ui';

const IKON_KONSEP: Record<string, number> = {
  SELECT: A.berkas.select,
  WHERE: A.berkas.where,
  LIKE: A.berkas.like,
  AGREGASI: A.berkas.sum_count,
  JOIN: A.berkas.join,
};

export function ikonKonsep(konsep: string): number {
  return IKON_KONSEP[konsep] ?? A.berkas.select;
}

export function KartuKonsep({ kartu, konsep }: { kartu: Kartu; konsep: string }) {
  return (
    <Kotak isi={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Ikon src={ikonKonsep(konsep)} ukuran={34} />
        <Judul ukuran={10} style={{ flex: 1 }}>{`KARTU KONSEP: ${kartu.judul.toUpperCase()}`}</Judul>
      </View>
      <Teks ukuran={16}>{kartu.isi}</Teks>
      <View style={{ backgroundColor: W.layar, borderWidth: 3, borderColor: W.tinta, padding: 10 }}>
        <Kode pilih>{kartu.contoh}</Kode>
      </View>
    </Kotak>
  );
}
