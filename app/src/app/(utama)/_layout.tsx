import { Image } from 'expo-image';
import { Redirect, Tabs } from 'expo-router';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { A, AVATAR } from '../../aset';
import { Judul } from '../../komponen/ui';
import { useToko } from '../../data/toko';
import { tanggalWIB } from '../../permainan/waktu';
import { LEBAR_GURU, LEBAR_HP, W } from '../../tema';

const MENU_SISWA = [
  { nama: 'peta', label: 'KASUS', ikon: A.ikon.kasus },
  { nama: 'harian', label: 'HARIAN', ikon: A.ikon.harian },
  { nama: 'arsip', label: 'ARSIP', ikon: A.ikon.arsip },
  { nama: 'kelas', label: 'KELAS', ikon: AVATAR.pak_hendra },
  { nama: 'profil', label: 'PROFIL', ikon: A.ikon.profil },
];
const MENU_GURU = [
  { nama: 'kelas', label: 'KELAS', ikon: AVATAR.pak_hendra },
  { nama: 'kasus-saya', label: 'KASUS SAYA', ikon: A.ikon.kasus },
  { nama: 'peta', label: 'COBA MAIN', ikon: A.ikon.arsip },
  { nama: 'profil', label: 'PROFIL', ikon: A.ikon.profil },
];

function BilahMenu({ state, navigation }: any) {
  const aman = useSafeAreaInsets();
  const peran = useToko((k) => k.s?.pengguna.peran);
  const tandaHarian = useToko((k) => (k.s ? !k.s.harian[tanggalWIB()] : false));
  const tandaTugas = useToko((k) => (k.s?.kelas ?? []).some((c) => c.tugas.some((t) => !t.selesai && !t.lewat_tenggat)));
  const menu = peran === 'guru' ? MENU_GURU : MENU_SISWA;
  const aktif = state.routes[state.index]?.name;
  return (
    <View style={{ backgroundColor: W.malam3, paddingBottom: aman.bottom }}>
      <View style={{ width: '100%', maxWidth: peran === 'guru' ? LEBAR_GURU : LEBAR_HP, alignSelf: 'center', flexDirection: 'row', backgroundColor: W.kayu, borderTopWidth: 3, borderColor: W.tinta, padding: 6, gap: 6 }}>
        {menu.map((m) => {
          const pilih = aktif === m.nama;
          const tanda = (m.nama === 'harian' && tandaHarian) || (m.nama === 'kelas' && peran === 'siswa' && tandaTugas);
          return (
            <Pressable
              key={m.nama}
              accessibilityRole="tab"
              accessibilityLabel={m.label}
              accessibilityState={{ selected: pilih }}
              testID={'menu-' + m.nama}
              onPress={() => navigation.navigate(m.nama)}
              style={{ flex: 1 }}
            >
              <View style={{ backgroundColor: pilih ? W.navy : W.tinta, borderWidth: 3, borderColor: pilih ? W.emas : W.tinta, alignItems: 'center', paddingVertical: 6, gap: 3 }}>
                <Image source={m.ikon} style={{ width: 28, height: 28 }} contentFit="contain" />
                <Judul ukuran={7} warna={pilih ? W.emas : W.kertas} garis={1}>
                  {m.label}
                </Judul>
                {tanda ? <View style={{ position: 'absolute', right: 4, top: 4, width: 12, height: 12, backgroundColor: W.merah, borderWidth: 2, borderColor: W.kertas }} /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TataLetakUtama() {
  const s = useToko((k) => k.s);
  if (!s) return <Redirect href="/" />;
  return (
    <Tabs screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: W.malam3 } }} tabBar={(p) => <BilahMenu {...p} />}>
      <Tabs.Screen name="peta" />
      <Tabs.Screen name="harian" />
      <Tabs.Screen name="arsip" />
      <Tabs.Screen name="kelas" />
      <Tabs.Screen name="kasus-saya" />
      <Tabs.Screen name="profil" />
    </Tabs>
  );
}
