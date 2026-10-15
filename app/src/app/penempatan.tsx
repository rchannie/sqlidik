/* Tes Penempatan: lima soal singkat untuk menentukan berkas awal. */
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { A } from '../aset';
import { Dialog, Layar } from '../komponen/layar';
import { TabelHasil } from '../komponen/tabel';
import { Judul, Kode, Kotak, Label, Teks, Tombol } from '../komponen/ui';
import { BERKAS, PENEMPATAN } from '../konten';
import { simpanPenempatan } from '../data/toko';
import { W } from '../tema';

export default function Penempatan() {
  const [tahap, setTahap] = useState<'awal' | 'soal' | 'hasil'>('awal');
  const [no, setNo] = useState(0);
  const [pilih, setPilih] = useState<number | null>(null);
  const [benar, setBenar] = useState<boolean[]>([]);

  const soal = PENEMPATAN[no];
  const level = (() => {
    let n = 0;
    for (const b of benar) {
      if (!b) break;
      n++;
    }
    return Math.min(n, BERKAS.length - 1);
  })();

  const selesai = (lv: number) => {
    simpanPenempatan(lv);
    router.replace('/peta');
  };

  if (tahap === 'awal') {
    return (
      <Layar latar={A.latar.papan}>
        <Dialog
          teks={[
            'Selamat bergabung di tim, Detektif. Sebelum mulai, jawab lima pertanyaan singkat.',
            'Hasilnya menentukan berkas pertamamu. Kalau sudah paham SELECT atau WHERE, kamu bisa langsung lompat.',
          ]}
        />
        <Tombol label="MULAI TES" onPress={() => setTahap('soal')} testID="mulai-tes" />
        <Tombol label="LEWATI, MULAI DARI AWAL" varian="navy" onPress={() => selesai(0)} />
      </Layar>
    );
  }

  if (tahap === 'hasil') {
    const berkas = BERKAS[level];
    return (
      <Layar latar={A.latar.papan}>
        <Kotak isi={{ gap: 12 }}>
          <Label>HASIL TES PENEMPATAN</Label>
          <Judul ukuran={14}>{`${benar.filter(Boolean).length} DARI ${PENEMPATAN.length} BENAR`}</Judul>
          <Teks>
            Kamu mulai dari Berkas {berkas.nomor}: {berkas.judul}.{level > 0 ? ' Berkas sebelumnya tetap terbuka kalau mau berlatih.' : ''}
          </Teks>
        </Kotak>
        <Dialog ekspresi="senang" teks="Berkasmu sudah disiapkan di papan kasus. Selamat bertugas." />
        <Tombol label="KE PAPAN KASUS" onPress={() => selesai(level)} testID="ke-papan" />
      </Layar>
    );
  }

  const sudah = pilih !== null;
  return (
    <Layar latar={A.latar.papan}>
      <Kotak isi={{ gap: 12 }}>
        <Label>{`SOAL ${no + 1} DARI ${PENEMPATAN.length} · ${soal.konsep}`}</Label>
        <Teks tebal>{soal.pertanyaan}</Teks>
        {soal.tabel ? <TabelHasil hasil={{ kolom: soal.tabel.kolom, baris: soal.tabel.baris }} terang /> : null}
        {soal.kode ? (
          <View style={{ backgroundColor: W.layar, borderWidth: 3, borderColor: W.tinta, padding: 10 }}>
            <Kode>{soal.kode}</Kode>
          </View>
        ) : null}
        <View style={{ gap: 8 }}>
          {soal.opsi.map((o, i) => {
            const dipilih = pilih === i;
            const kunci = sudah && i === soal.jawaban;
            const warna = kunci ? W.hijau : dipilih ? W.merah : W.kertasPutih;
            return (
              <Pressable key={i} disabled={sudah} onPress={() => setPilih(i)} accessibilityRole="button" accessibilityLabel={o}>
                <View style={{ borderWidth: 3, borderColor: W.tinta, backgroundColor: sudah ? warna : W.kertasPutih, padding: 12, flexDirection: 'row', gap: 10 }}>
                  <Judul ukuran={10} warna={sudah && (kunci || dipilih) ? W.kertas : W.biru}>{String.fromCharCode(65 + i)}</Judul>
                  <Kode ukuran={21} warna={sudah && (kunci || dipilih) ? W.kertas : W.tinta} style={{ flex: 1 }}>{o}</Kode>
                </View>
              </Pressable>
            );
          })}
        </View>
        {sudah ? <Teks ukuran={16} warna={W.teksRedup}>{pilih === soal.jawaban ? 'Benar. ' : 'Belum tepat. '}{soal.penjelasan}</Teks> : null}
      </Kotak>
      {sudah ? (
        <Tombol
          label={no + 1 < PENEMPATAN.length ? 'SOAL BERIKUTNYA' : 'LIHAT HASIL'}
          onPress={() => {
            const b = [...benar, pilih === soal.jawaban];
            setBenar(b);
            setPilih(null);
            if (no + 1 < PENEMPATAN.length) setNo(no + 1);
            else setTahap('hasil');
          }}
          testID="soal-lanjut"
        />
      ) : null}
    </Layar>
  );
}
