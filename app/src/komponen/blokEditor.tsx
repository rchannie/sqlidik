/* Mode Blok: menyusun query dengan mengetuk blok kata, untuk siswa yang belum lancar mengetik. */
import { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { A } from '../aset';
import type { Langkah, MetaTabel } from '../konten';
import { Blok, buatBlok, rangkaiBlok } from '../mesin/blok';
import { W } from '../tema';
import { Ikon, Judul, Kode } from './ui';

const WARNA_BLOK: Record<Blok['jenis'], { bg: string; teks: string }> = {
  kunci: { bg: W.biruMuda, teks: W.tinta },
  nama: { bg: W.kertas, teks: W.tinta },
  nilai: { bg: W.emasMuda, teks: W.tinta },
  tanda: { bg: W.abu1, teks: W.tinta },
};

export function BlokEditor({ langkah, tabel, benih, ubah }: { langkah: Langkah; tabel: MetaTabel[]; benih: string; ubah: (sql: string) => void }) {
  const semua = useMemo(() => buatBlok(langkah, tabel, benih), [langkah, tabel, benih]);
  const [pakai, setPakai] = useState<string[]>([]);
  useEffect(() => setPakai([]), [benih]);
  useEffect(() => {
    ubah(rangkaiBlok(pakai.map((id) => semua.find((b) => b.id === id)!.teks)));
  }, [pakai, semua]);
  const sisa = semua.filter((b) => !pakai.includes(b.id));

  const kepingan = (b: Blok, aksi: () => void, terpakai: boolean) => (
    <Pressable key={b.id} onPress={aksi} accessibilityRole="button" accessibilityLabel={(terpakai ? 'Lepas ' : 'Pakai ') + b.teks} testID={'blok-' + b.teks}>
      <View style={{ backgroundColor: WARNA_BLOK[b.jenis].bg, borderWidth: 2, borderColor: W.tinta, paddingHorizontal: 9, paddingVertical: 4, opacity: terpakai ? 1 : 0.95 }}>
        <Kode ukuran={22} warna={WARNA_BLOK[b.jenis].teks}>{b.teks}</Kode>
      </View>
    </Pressable>
  );

  return (
    <View style={{ gap: 10 }}>
      <View style={{ minHeight: 64, borderWidth: 2, borderStyle: 'dashed', borderColor: W.layarGaris, backgroundColor: W.layar, padding: 8, flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
        {pakai.length === 0 ? <Kode ukuran={20} warna="#5F8F68">Ketuk blok di bawah untuk menyusun query</Kode> : null}
        {pakai.map((id) => {
          const b = semua.find((x) => x.id === id)!;
          return kepingan(b, () => setPakai(pakai.filter((x) => x !== id)), true);
        })}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>{sisa.map((b) => kepingan(b, () => setPakai([...pakai, b.id]), false))}</View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Pressable onPress={() => setPakai(pakai.slice(0, -1))} accessibilityLabel="Batalkan blok terakhir" style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 2, borderColor: W.kertas, padding: 6 }}>
          <Ikon src={A.ikon.undo} ukuran={18} />
          <Judul ukuran={8} warna={W.kertas}>BATAL</Judul>
        </Pressable>
        <Pressable onPress={() => setPakai([])} accessibilityLabel="Kosongkan susunan" style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 2, borderColor: W.kertas, padding: 6 }}>
          <Ikon src={A.ikon.hapus} ukuran={18} />
          <Judul ukuran={8} warna={W.kertas}>KOSONGKAN</Judul>
        </Pressable>
      </View>
    </View>
  );
}
