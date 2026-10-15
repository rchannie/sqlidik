/* Ruang Arsip: Latihan Ulang, Buku Catatan, dan latihan bebas tanpa skor. */
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { A } from '../../aset';
import { ikonKonsep } from '../../komponen/kartu';
import { HudPemain, JudulBagian, Layar } from '../../komponen/layar';
import { Ikon, Judul, Kotak, Label, Teks, Tombol } from '../../komponen/ui';
import { BERKAS, LATIHAN, URUTAN_KONSEP } from '../../konten';
import { berkasTerbuka } from '../../permainan/aturan';
import { konsepLemah, useToko } from '../../data/toko';
import { NAMA_KONSEP, W } from '../../tema';

export default function Arsip() {
  const s = useToko((k) => k.s)!;
  const guru = s.pengguna.peran === 'guru';
  const lemah = konsepLemah(s);
  const target = lemah[0];
  const latihanUlang = target ? LATIHAN.filter((l) => l.konsep === target.konsep) : [];
  const mulaiUlang = () => {
    const urut = target.beruntun % latihanUlang.length;
    router.push({ pathname: '/latihan/[id]', params: { id: latihanUlang[urut].id, ulang: '1' } });
  };

  return (
    <Layar latar={A.latar.papan} atas={guru ? undefined : <HudPemain />}>
      <Kotak warna={W.tinta} tepi={W.emas} isi={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Ikon src={A.ikon.arsip} ukuran={40} />
          <View style={{ flex: 1 }}>
            <Label warna={W.emas}>LATIHAN ULANG</Label>
          </View>
        </View>
        {target ? (
          <>
            <Teks warna={W.kertas}>
              {`Konsep ${NAMA_KONSEP[target.konsep]} paling sering salah (${target.salah} kali). Selesaikan tiga latihan ${NAMA_KONSEP[target.konsep]} berturut-turut untuk menandainya sudah paham.`}
            </Teks>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {[0, 1, 2].map((i) => (
                <View key={i} style={{ flex: 1, height: 14, borderWidth: 2, borderColor: W.kertas, backgroundColor: i < target.beruntun ? W.hijau : W.malam3 }} />
              ))}
            </View>
            <Tombol label="MULAI LATIHAN ULANG" onPress={mulaiUlang} testID="latihan-ulang" />
          </>
        ) : (
          <Teks warna={W.kertas}>Belum ada konsep yang perlu diulang. Konsep yang sering salah akan muncul di sini secara otomatis.</Teks>
        )}
      </Kotak>

      <JudulBagian>BUKU CATATAN DETEKTIF</JudulBagian>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {BERKAS.map((b) => {
          const buka = guru || berkasTerbuka(b.nomor, s.progres, s.penempatan);
          return (
            <Pressable
              key={b.nomor}
              disabled={!buka}
              onPress={() => router.push(`/catatan/${b.konsep}`)}
              accessibilityRole="button"
              accessibilityLabel={`Catatan ${b.judul}${buka ? '' : ', terkunci'}`}
              style={{ width: '47%' }}
            >
              <View style={{ backgroundColor: buka ? W.kertas : W.abu2, borderWidth: 3, borderColor: W.tinta, padding: 10, gap: 6, minHeight: 100 }}>
                <Ikon src={buka ? ikonKonsep(b.konsep) : A.ikon.gembok} ukuran={34} />
                <Judul ukuran={9}>{NAMA_KONSEP[b.konsep]}</Judul>
                <Teks ukuran={14} warna={W.teksRedup}>{buka ? b.ringkas : 'Terbuka setelah berkasnya terbuka.'}</Teks>
              </View>
            </Pressable>
          );
        })}
      </View>

      <JudulBagian>LATIHAN BEBAS</JudulBagian>
      <Teks warna={W.kertas} ukuran={15}>Tanpa skor dan tanpa biaya petunjuk. Memakai basis data Arsip Sekolah.</Teks>
      {URUTAN_KONSEP.map((k) => (
        <Kotak key={k} isi={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ikon src={ikonKonsep(k)} ukuran={26} />
            <Judul ukuran={10}>{NAMA_KONSEP[k]}</Judul>
          </View>
          {LATIHAN.filter((l) => l.konsep === k).map((l) => (
            <Pressable key={l.id} onPress={() => router.push(`/latihan/${l.id}`)} accessibilityRole="button" accessibilityLabel={l.judul} testID={'latihan-' + l.id}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6, borderTopWidth: 2, borderColor: W.abu1 }}>
                <View style={{ width: 22, height: 22, borderWidth: 2, borderColor: W.tinta, backgroundColor: s.latihan[l.id]?.selesai ? W.hijau : W.kertasPutih, alignItems: 'center', justifyContent: 'center' }}>
                  {s.latihan[l.id]?.selesai ? <Judul ukuran={8} warna={W.kertas}>V</Judul> : null}
                </View>
                <Teks style={{ flex: 1 }}>{l.judul}</Teks>
                <Judul ukuran={10} warna={W.biru}>{'>'}</Judul>
              </View>
            </Pressable>
          ))}
        </Kotak>
      ))}
    </Layar>
  );
}
