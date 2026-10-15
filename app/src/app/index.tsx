/* Layar Judul */
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { A } from '../aset';
import { Pengaturan } from '../komponen/pengaturan';
import { Layar } from '../komponen/layar';
import { Judul, Teks, Tombol } from '../komponen/ui';
import { useToko } from '../data/toko';
import { W } from '../tema';

export default function LayarJudul() {
  const s = useToko((k) => k.s);
  const [atur, setAtur] = useState(false);
  const lanjut = () => {
    if (!s) return router.push('/masuk');
    if (s.pengguna.peran === 'guru') return router.replace('/kelas');
    if (s.penempatan === null) return router.replace('/penempatan');
    router.replace('/peta');
  };
  return (
    <Layar latar={A.latar.judul} gulir={false}>
      <View style={{ flex: 1, padding: 24, justifyContent: 'space-between' }}>
        <View style={{ alignItems: 'center', marginTop: '22%', gap: 18 }}>
          <Image source={A.logo} style={{ width: 300, height: 66 }} contentFit="contain" accessibilityLabel="SQLidik" />
          <Judul ukuran={11} warna={W.emas} style={{ textAlign: 'center' }}>
            DETEKTIF DATA SEKOLAH
          </Judul>
        </View>
        <View style={{ gap: 14, marginBottom: 28 }}>
          {s ? (
            <>
              <Teks warna={W.kertas} style={{ textAlign: 'center' }}>
                Halo, {s.pengguna.nama}.
              </Teks>
              <Tombol label={s.pengguna.peran === 'guru' ? 'BUKA MODE KELAS' : 'LANJUTKAN'} onPress={lanjut} testID="tombol-lanjut" />
            </>
          ) : (
            <>
              <Tombol label="MULAI PENYELIDIKAN" onPress={() => router.push({ pathname: '/masuk', params: { tab: 'daftar' } })} testID="tombol-mulai" />
              <Tombol label="SUDAH PUNYA AKUN" varian="navy" onPress={() => router.push('/masuk')} />
            </>
          )}
          <Tombol label="PENGATURAN" varian="navy" onPress={() => setAtur(true)} />
          <Judul ukuran={8} warna={W.abu2} style={{ textAlign: 'center', marginTop: 8 }}>
            VERSI 1.0
          </Judul>
        </View>
      </View>
      <Pengaturan terbuka={atur} tutup={() => setAtur(false)} />
    </Layar>
  );
}
