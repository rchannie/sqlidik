/* Peta Tabel: struktur tabel kasus, hubungan antartabel, dan contoh isi. */
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import type { MetaTabel } from '../konten';
import { DbKasus, Hasil } from '../mesin/jenis';
import { W } from '../tema';
import { TabelHasil } from './tabel';
import { Judul, Kode, Label, Teks, Tombol } from './ui';

export function PetaTabel({ tabel, db, sisip }: { tabel: MetaTabel[]; db: DbKasus | null; sisip?: (teks: string) => void }) {
  const [isi, setIsi] = useState<Record<string, Hasil | null>>({});
  const lihat = async (nama: string) => {
    if (isi[nama]) return setIsi({ ...isi, [nama]: null });
    if (!db) return;
    try {
      const h = await db.jalankan(`SELECT * FROM ${nama} LIMIT 20`);
      setIsi({ ...isi, [nama]: h });
    } catch {
      // abaikan
    }
  };
  return (
    <View style={{ gap: 12 }}>
      {sisip ? <Teks ukuran={15} warna={W.biruMuda}>Ketuk nama tabel atau kolom untuk menyalinnya ke query.</Teks> : null}
      {tabel.map((t) => (
        <View key={t.nama} style={{ borderWidth: 3, borderColor: W.tinta, backgroundColor: W.kertasPutih }}>
          <Pressable disabled={!sisip} onPress={() => sisip?.(t.nama)} accessibilityLabel={'Tabel ' + t.nama}>
            <View style={{ backgroundColor: W.navy, padding: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Kode ukuran={23} warna={W.emas} style={{ flex: 1 }}>{t.nama}</Kode>
              <Judul ukuran={8} warna={W.kertas}>{`${t.jumlah_baris} BARIS`}</Judul>
            </View>
          </Pressable>
          {t.keterangan ? <Teks ukuran={15} warna={W.teksRedup} style={{ paddingHorizontal: 10, paddingTop: 6 }}>{t.keterangan}</Teks> : null}
          <View style={{ padding: 8, gap: 2 }}>
            {t.kolom.map((k, i) => {
              const fk = t.relasi.find((r) => r.kolom === k.nama);
              return (
                <Pressable key={k.nama} disabled={!sisip} onPress={() => sisip?.(k.nama)} accessibilityLabel={'Kolom ' + k.nama}>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, paddingVertical: 3 }}>
                    <Kode ukuran={21} warna={i === 0 ? W.merah : W.tinta} style={{ minWidth: 120 }}>{k.nama}</Kode>
                    <Kode ukuran={17} warna={W.abu3}>{k.tipe}</Kode>
                    <Teks ukuran={14} warna={W.teksRedup} style={{ flex: 1 }}>
                      {fk ? `menunjuk ${fk.tabel}.${fk.ke}` : k.keterangan}
                    </Teks>
                  </View>
                </Pressable>
              );
            })}
          </View>
          {db ? (
            <View style={{ padding: 8, paddingTop: 0, gap: 8 }}>
              <Tombol kecil varian="kertas" label={isi[t.nama] ? 'TUTUP ISI' : 'LIHAT ISI'} onPress={() => lihat(t.nama)} />
              {isi[t.nama] ? <TabelHasil hasil={isi[t.nama]!} terang ukuran={18} /> : null}
            </View>
          ) : null}
        </View>
      ))}
      {tabel.some((t) => t.relasi.length) ? (
        <View style={{ gap: 4 }}>
          <Label warna={W.emas}>HUBUNGAN ANTARTABEL</Label>
          {tabel.flatMap((t) => t.relasi.map((r) => (
            <Kode key={t.nama + r.kolom} ukuran={20} warna={W.kertas}>{`${t.nama}.${r.kolom} -> ${r.tabel}.${r.ke}`}</Kode>
          )))}
        </View>
      ) : null}
    </View>
  );
}
