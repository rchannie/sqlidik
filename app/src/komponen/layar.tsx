import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ReactNode, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleProp, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { A, AVATAR } from '../aset';
import { useStatistik, useToko } from '../data/toko';
import { H, LEBAR_HP, W } from '../tema';
import { Bilah, Ikon, Judul, Kode, Teks } from './ui';

type LayarProps = {
  children: ReactNode;
  latar?: number;
  warna?: string;
  lebar?: number;
  gulir?: boolean;
  atas?: ReactNode;
  bawah?: ReactNode;
  isi?: StyleProp<ViewStyle>;
  segarkan?: () => Promise<unknown>;
  tanpaAmanAtas?: boolean;
};

export function Layar({ children, latar, warna = W.malam, lebar = LEBAR_HP, gulir = true, atas, bawah, isi, segarkan, tanpaAmanAtas }: LayarProps) {
  const aman = useSafeAreaInsets();
  const [muat, setMuat] = useState(false);
  const tarik = segarkan
    ? async () => {
        setMuat(true);
        try {
          await segarkan();
        } catch {
          // galat ditampilkan oleh layar masing-masing
        } finally {
          setMuat(false);
        }
      }
    : undefined;
  return (
    <View style={{ flex: 1, backgroundColor: W.malam3 }}>
      <View style={{ flex: 1, width: '100%', maxWidth: lebar, alignSelf: 'center', backgroundColor: warna, overflow: 'hidden' }}>
        {latar ? <Image source={latar} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} contentFit="cover" /> : null}
        <View style={{ height: tanpaAmanAtas ? 0 : aman.top }} />
        {atas}
        {gulir ? (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={[{ padding: 16, gap: 16, paddingBottom: 28 }, isi]}
            keyboardShouldPersistTaps="handled"
            refreshControl={tarik ? <RefreshControl refreshing={muat} onRefresh={tarik} tintColor={W.emas} colors={[W.emas]} /> : undefined}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[{ flex: 1 }, isi]}>{children}</View>
        )}
        {bawah}
        <View style={{ height: aman.bottom, backgroundColor: bawah ? W.tinta : 'transparent' }} />
      </View>
    </View>
  );
}

/** HUD di atas Peta Kasus: avatar, pangkat, XP, streak, dan koin. */
export function HudPemain() {
  const s = useToko((k) => k.s);
  const st = useStatistik();
  if (!s || !st) return null;
  const jarak = st.xpPangkatBerikut ? (st.xp - st.xpPangkatIni) / (st.xpPangkatBerikut - st.xpPangkatIni) : 1;
  return (
    <View style={{ margin: 12, marginBottom: 0, backgroundColor: W.tinta, borderWidth: 3, borderColor: W.kertas, padding: 8, flexDirection: 'row', gap: 10, alignItems: 'center' }}>
      <Pressable onPress={() => router.navigate('/profil')} accessibilityLabel="Buka profil">
        <View style={{ borderWidth: 3, borderColor: W.emas, backgroundColor: W.kertas }}>
          <Image source={AVATAR[s.pengguna.avatar] ?? AVATAR.pemain_01} style={{ width: 52, height: 52 }} />
        </View>
      </Pressable>
      <View style={{ flex: 1, gap: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ikon src={A.pangkat[st.pangkat] ?? A.pangkat.magang} ukuran={22} />
          <Judul ukuran={9} warna={W.emas} garis={1} style={{ flex: 1 }}>
            {st.namaPangkat.toUpperCase()}
          </Judul>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Kode ukuran={18} warna={W.biruMuda}>XP</Kode>
          <View style={{ flex: 1 }}>
            <Bilah nilai={jarak} />
          </View>
        </View>
      </View>
      <View style={{ gap: 4, alignItems: 'flex-end' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }} accessibilityLabel={`Streak ${st.streak} hari`}>
          <Ikon src={A.ikon.streak} ukuran={20} />
          <Judul ukuran={10} warna={W.kertas}>{st.streak}</Judul>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }} accessibilityLabel={`${st.koin} koin`}>
          <Ikon src={A.ikon.koin} ukuran={20} />
          <Judul ukuran={10} warna={W.kertas}>{st.koin}</Judul>
        </View>
      </View>
    </View>
  );
}

/** HUD di layar kasus: tombol kembali, nama berkas, judul kasus, dan isian kanan. */
export function HudKasus({ label, judul, kanan, kembali }: { label: string; judul: string; kanan?: ReactNode; kembali?: () => void }) {
  return (
    <View style={{ margin: 10, marginBottom: 0, backgroundColor: W.tinta, borderWidth: 3, borderColor: W.kertas, paddingVertical: 8, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <Pressable
        onPress={kembali ?? (() => (router.canGoBack() ? router.back() : router.replace('/peta')))}
        accessibilityLabel="Kembali"
        hitSlop={10}
        style={{ padding: 4 }}
      >
        <Ikon src={A.ikon.kembali} ukuran={24} />
      </Pressable>
      <View style={{ flex: 1, gap: 3 }}>
        <Judul ukuran={8} warna={W.emas} garis={1}>
          {label}
        </Judul>
        <Judul ukuran={10} warna={W.kertas} garis={2}>
          {judul.toUpperCase()}
        </Judul>
      </View>
      {kanan}
    </View>
  );
}

export function KoinHud() {
  const st = useStatistik();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }} accessibilityLabel={`${st?.koin ?? 0} koin`}>
      <Ikon src={A.ikon.koin} ukuran={22} />
      <Judul ukuran={10} warna={W.kertas}>
        {st?.koin ?? 0}
      </Judul>
    </View>
  );
}

type Ekspresi = 'normal' | 'senang' | 'serius';

/** Dialog Komandan. Jika berisi beberapa kalimat, ketuk untuk lanjut. */
export function Dialog({ teks, ekspresi = 'normal', nama = 'KOMANDAN', saatSelesai, gelap = true, style, foto }: { teks: string | string[]; ekspresi?: Ekspresi; nama?: string; saatSelesai?: () => void; gelap?: boolean; style?: StyleProp<ViewStyle>; foto?: number }) {
  const daftar = Array.isArray(teks) ? teks : [teks];
  const [i, setI] = useState(0);
  const kunci = daftar.join('|');
  useEffect(() => setI(0), [kunci]);
  const terakhir = i >= daftar.length - 1;
  useEffect(() => {
    if (terakhir) saatSelesai?.();
  }, [terakhir, kunci]);
  return (
    <Pressable
      onPress={() => !terakhir && setI(i + 1)}
      disabled={terakhir}
      accessibilityRole={terakhir ? 'text' : 'button'}
      accessibilityLabel={terakhir ? undefined : 'Lanjutkan dialog'}
      style={[{ backgroundColor: gelap ? W.tinta : W.kertasPutih, borderWidth: 3, borderColor: gelap ? W.kertas : W.tinta, padding: 10, flexDirection: 'row', gap: 12 }, style]}
    >
      <View style={{ borderWidth: 3, borderColor: W.emas, backgroundColor: W.navy, alignSelf: 'flex-start' }}>
        <Image source={foto ?? A.komandan[ekspresi]} style={{ width: 64, height: 64 }} />
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Judul ukuran={9} warna={W.emas}>
          {nama}
        </Judul>
        <Teks warna={gelap ? W.kertas : W.tinta} ukuran={17}>
          {daftar[Math.min(i, daftar.length - 1)]}
        </Teks>
        {!terakhir ? (
          <Judul ukuran={9} warna={W.emas} style={{ alignSelf: 'flex-end' }}>
            {`${i + 1}/${daftar.length}  KETUK`}
          </Judul>
        ) : null}
      </View>
    </Pressable>
  );
}

export function JudulBagian({ children, warna = W.kertas, kanan }: { children: string; warna?: string; kanan?: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View style={{ flex: 1, alignItems: 'flex-start' }}>
        <View style={{ backgroundColor: W.tinta, borderWidth: 3, borderColor: W.tinta, paddingHorizontal: 10, paddingVertical: 6 }}>
          <Judul ukuran={10} warna={warna}>
            {children}
          </Judul>
        </View>
      </View>
      {kanan}
    </View>
  );
}

export function PapanJudul({ children }: { children: string }) {
  return (
    <View style={{ alignSelf: 'flex-start', backgroundColor: W.kertas, borderWidth: 3, borderColor: W.tinta, paddingVertical: 10, paddingHorizontal: 14 }}>
      <Judul ukuran={12}>{children}</Judul>
    </View>
  );
}

export const gayaTeksKode = { fontFamily: H.kode };
