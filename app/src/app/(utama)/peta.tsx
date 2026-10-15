/* Peta Kasus: papan gabus berisi lima berkas yang saling terhubung tali merah. */
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { LayoutChangeEvent, Pressable, View } from 'react-native';

import { A } from '../../aset';
import { HudPemain, Layar } from '../../komponen/layar';
import { Bintang, Judul, Kotak, Label, Lembar, Teks, Tombol } from '../../komponen/ui';
import { BERKAS, Berkas, kasusDiBerkas } from '../../konten';
import { berkasSelesai, berkasTerbuka, kasusBerikutnya, kasusTerbuka } from '../../permainan/aturan';
import { useToko } from '../../data/toko';
import { NAMA_KONSEP, W } from '../../tema';

const TINGGI_BARIS = 190;
const POSISI_X = [0.3, 0.7, 0.32, 0.68, 0.5];

export default function PetaKasus() {
  const s = useToko((k) => k.s)!;
  const [lebar, setLebar] = useState(360);
  const [buka, setBuka] = useState<Berkas | null>(null);
  const guru = s.pengguna.peran === 'guru';
  const penempatan = guru ? 5 : s.penempatan;
  const berikut = kasusBerikutnya(s.progres, penempatan);
  const tugasAktif = (s.kelas ?? []).flatMap((c) => c.tugas.filter((t) => !t.selesai && !t.lewat_tenggat));

  const titik = BERKAS.map((b, i) => ({ x: POSISI_X[i] * lebar, y: i * TINGGI_BARIS + 70 }));

  return (
    <Layar latar={A.latar.papan} atas={guru ? undefined : <HudPemain />}>
      {guru ? (
        <Kotak isi={{ gap: 6 }}>
          <Label>MODE COBA MAIN</Label>
          <Teks ukuran={16}>Semua kasus terbuka supaya Bapak/Ibu bisa mencoba alur yang dimainkan siswa. Progres guru tidak dihitung di rekap kelas.</Teks>
        </Kotak>
      ) : berikut ? (
        <Kotak warna={W.tinta} tepi={W.emas} isi={{ gap: 10 }}>
          <Label warna={W.emas}>{`KASUS BERIKUTNYA · BERKAS ${berikut.berkas}`}</Label>
          <Judul ukuran={12} warna={W.kertas}>{berikut.judul.toUpperCase()}</Judul>
          <Tombol label="BUKA BERKAS" onPress={() => router.push(`/kasus/${berikut.id}`)} testID="kasus-berikutnya" />
        </Kotak>
      ) : (
        <Kotak isi={{ gap: 6 }}>
          <Label>SEMUA BERKAS SELESAI</Label>
          <Teks ukuran={16}>Kamu bisa mengulang kasus untuk mengejar tiga bintang, atau lanjut ke Kasus Harian dan Ruang Arsip.</Teks>
        </Kotak>
      )}
      {tugasAktif.length ? (
        <Pressable onPress={() => router.navigate('/kelas')} accessibilityRole="button">
          <Kotak warna={W.emasMuda} isi={{ gap: 4 }}>
            <Label warna={W.merahTua}>TUGAS DARI GURU</Label>
            <Teks ukuran={16}>{`${tugasAktif.length} tugas belum selesai. Ketuk untuk melihat.`}</Teks>
          </Kotak>
        </Pressable>
      ) : null}

      <View onLayout={(e: LayoutChangeEvent) => setLebar(e.nativeEvent.layout.width)} style={{ height: BERKAS.length * TINGGI_BARIS + 20 }}>
        {titik.slice(1).map((t, i) => {
          const a = titik[i];
          const dx = t.x - a.x;
          const dy = t.y - a.y;
          const panjang = Math.sqrt(dx * dx + dy * dy);
          const sudut = (Math.atan2(dy, dx) * 180) / Math.PI;
          return (
            <View
              key={'tali' + i}
              style={{ position: 'absolute', left: (a.x + t.x) / 2 - panjang / 2, top: (a.y + t.y) / 2 - 2, width: panjang, height: 4, backgroundColor: W.merah, opacity: 0.9, transform: [{ rotate: `${sudut}deg` }] }}
            />
          );
        })}
        <Image source={A.dekor.polaroid} style={{ position: 'absolute', left: 4, top: TINGGI_BARIS * 1.2, width: 72, height: 84 }} />
        <Image source={A.dekor.catatan} style={{ position: 'absolute', right: 6, top: TINGGI_BARIS * 2.25, width: 54, height: 48 }} />
        <Image source={A.dekor.koran} style={{ position: 'absolute', left: 0, top: TINGGI_BARIS * 3.55, width: 108, height: 72 }} />
        {BERKAS.map((b, i) => {
          const terbuka = guru || berkasTerbuka(b.nomor, s.progres, penempatan);
          const selesai = berkasSelesai(b.nomor, s.progres);
          const kasus = kasusDiBerkas(b.nomor);
          const bintang = kasus.reduce((n, k) => n + (s.progres[k.id]?.bintang ?? 0), 0);
          const aktif = berikut?.berkas === b.nomor;
          const kartu = selesai ? A.kartu.selesai : terbuka ? A.kartu.terbuka : A.kartu.terkunci;
          return (
            <Pressable
              key={b.nomor}
              testID={'berkas-' + b.nomor}
              accessibilityRole="button"
              accessibilityLabel={`Berkas ${b.nomor} ${b.judul}${terbuka ? '' : ', terkunci'}`}
              onPress={() => setBuka(b)}
              style={{ position: 'absolute', left: titik[i].x - 80, top: titik[i].y - 58, width: 160, alignItems: 'center' }}
            >
              <Image source={A.dekor.paku} style={{ width: 30, height: 30, marginBottom: -14, zIndex: 2 }} />
              <Image source={kartu} style={{ width: 112, height: 84 }} />
              <View style={{ marginTop: 4, width: 160, backgroundColor: aktif ? W.kertasPutih : terbuka ? W.kertas : W.abu2, borderWidth: 3, borderColor: aktif ? W.merah : W.tinta, padding: 6, alignItems: 'center', gap: 3 }}>
                <Judul ukuran={8} warna={aktif ? W.merah : terbuka ? W.hijauTua : W.abu3}>
                  {b.nomor === 5 ? 'KASUS BESAR' : `BERKAS ${b.nomor}`}
                </Judul>
                <Teks ukuran={15} tebal garis={1}>
                  {NAMA_KONSEP[b.konsep]}
                </Teks>
                {terbuka ? <Bintang jumlah={Math.round(bintang / Math.max(1, kasus.length))} ukuran={16} /> : <Teks ukuran={14} warna={W.abu3}>Terkunci</Teks>}
              </View>
            </Pressable>
          );
        })}
      </View>

      <Lembar terbuka={!!buka} tutup={() => setBuka(null)} judul={buka ? `BERKAS ${buka.nomor} · ${buka.judul.toUpperCase()}` : ''}>
        {buka ? (
          <>
            <Teks>{buka.ringkas}</Teks>
            {kasusDiBerkas(buka.nomor).map((k, i) => {
              const p = s.progres[k.id];
              const bisa = guru || kasusTerbuka(k, s.progres, penempatan);
              return (
                <Kotak key={k.id} warna={bisa ? W.kertasPutih : W.abu1} isi={{ gap: 8 }}>
                  <Label warna={bisa ? W.biru : W.abu3}>{`KASUS ${i + 1} · ${k.durasi ?? '3-5 menit'}`}</Label>
                  <Judul ukuran={11}>{k.judul.toUpperCase()}</Judul>
                  <Teks ukuran={15} warna={W.teksRedup}>{k.tkp}</Teks>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    {p?.status === 'selesai' ? <Bintang jumlah={p.bintang} /> : <Teks ukuran={15} warna={W.abu3}>{bisa ? 'Belum diselesaikan' : 'Selesaikan kasus sebelumnya dulu'}</Teks>}
                    <Tombol
                      kecil
                      label={!bisa ? 'TERKUNCI' : p?.status === 'selesai' ? 'ULANGI' : 'MAINKAN'}
                      ikon={!bisa ? A.ikon.gembok : undefined}
                      mati={!bisa}
                      varian={p?.status === 'selesai' ? 'navy' : 'emas'}
                      onPress={() => {
                        setBuka(null);
                        router.push(`/kasus/${k.id}`);
                      }}
                      testID={'main-' + k.id}
                    />
                  </View>
                </Kotak>
              );
            })}
            <Tombol label="BUKA BUKU CATATAN" varian="kertas" kecil onPress={() => { setBuka(null); router.push(`/catatan/${buka.konsep}`); }} />
          </>
        ) : null}
      </Lembar>
    </Layar>
  );
}
