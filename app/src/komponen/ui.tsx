/* Komponen dasar bergaya pixel: teks, kotak bertepi tebal, tombol, isian, tab, dan lainnya. */
import { Image } from 'expo-image';
import { ReactNode, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

import { A } from '../aset';
import { H, W } from '../tema';

type TeksProps = { children: ReactNode; style?: StyleProp<TextStyle>; warna?: string; ukuran?: number; tebal?: boolean; garis?: number; pilih?: boolean };

export function Teks({ children, style, warna = W.tinta, ukuran = 17, tebal, garis, pilih }: TeksProps) {
  return (
    <Text selectable={pilih} style={[{ fontFamily: tebal ? H.teksTebal : H.teks, fontSize: ukuran, color: warna, lineHeight: Math.round(ukuran * 1.35) }, style]} numberOfLines={garis}>
      {children}
    </Text>
  );
}

export function Judul({ children, style, warna = W.tinta, ukuran = 12, garis }: TeksProps) {
  return (
    <Text style={[{ fontFamily: H.judul, fontSize: ukuran, color: warna, lineHeight: Math.round(ukuran * 1.6), letterSpacing: 0.5 }, style]} numberOfLines={garis}>
      {children}
    </Text>
  );
}

export function Kode({ children, style, warna = W.layarTeks, ukuran = 21, pilih }: TeksProps) {
  return <Text selectable={pilih} style={[{ fontFamily: H.kode, fontSize: ukuran, color: warna, lineHeight: Math.round(ukuran * 1.05) }, style]}>{children}</Text>;
}

type KotakProps = {
  children?: ReactNode;
  warna?: string;
  tepi?: string;
  bayangan?: string | null;
  tebal?: number;
  style?: StyleProp<ViewStyle>;
  isi?: StyleProp<ViewStyle>;
  geser?: number;
};

/** Kotak bertepi tebal dengan bayangan kotak di kanan bawah. */
export function Kotak({ children, warna = W.kertasPutih, tepi = W.tinta, bayangan = W.tinta, tebal = 3, style, isi, geser = 5 }: KotakProps) {
  return (
    <View style={[{ marginRight: bayangan ? geser : 0, marginBottom: bayangan ? geser : 0 }, style]}>
      {bayangan ? <View style={{ position: 'absolute', left: geser, top: geser, right: -geser, bottom: -geser, backgroundColor: bayangan }} /> : null}
      <View style={[{ backgroundColor: warna, borderWidth: tebal, borderColor: tepi, padding: 14 }, isi]}>{children}</View>
    </View>
  );
}

type Varian = 'emas' | 'navy' | 'merah' | 'hijau' | 'kertas' | 'gelap';
const GAYA_TOMBOL: Record<Varian, { bg: string; teks: string; bayang: string }> = {
  emas: { bg: W.emas, teks: W.tinta, bayang: W.emasTua },
  navy: { bg: W.navy, teks: W.kertas, bayang: W.malam3 },
  merah: { bg: W.merah, teks: W.kertas, bayang: W.merahTua },
  hijau: { bg: W.hijau, teks: W.kertas, bayang: W.hijauTua },
  kertas: { bg: W.kertas, teks: W.tinta, bayang: W.abu2 },
  gelap: { bg: W.malam2, teks: W.kertas, bayang: W.malam3 },
};

type TombolProps = {
  label: string;
  onPress?: () => void;
  varian?: Varian;
  kecil?: boolean;
  mati?: boolean;
  memuat?: boolean;
  ikon?: number;
  style?: StyleProp<ViewStyle>;
  ukuranTeks?: number;
  testID?: string;
};

export function Tombol({ label, onPress, varian = 'emas', kecil, mati, memuat, ikon, style, ukuranTeks, testID }: TombolProps) {
  const g = GAYA_TOMBOL[varian];
  const nonaktif = mati || memuat;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={nonaktif}
      onPress={onPress}
      style={[{ opacity: nonaktif ? 0.55 : 1 }, style]}
    >
      {({ pressed }) => (
        <View style={{ paddingBottom: pressed ? 0 : 4, marginTop: pressed ? 4 : 0 }}>
          <View style={{ position: 'absolute', left: 0, right: 0, top: 4, bottom: 0, backgroundColor: g.bayang, borderWidth: 3, borderColor: W.tinta }} />
          <View
            style={{
              backgroundColor: g.bg,
              borderWidth: 3,
              borderColor: W.tinta,
              paddingVertical: kecil ? 8 : 14,
              paddingHorizontal: kecil ? 12 : 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              minHeight: kecil ? 40 : 52,
            }}
          >
            {memuat ? <ActivityIndicator size="small" color={g.teks} /> : ikon ? <Image source={ikon} style={{ width: kecil ? 18 : 22, height: kecil ? 18 : 22 }} contentFit="contain" /> : null}
            <Judul ukuran={ukuranTeks ?? (kecil ? 10 : 12)} warna={g.teks} style={{ textAlign: 'center', flexShrink: 1 }}>
              {label}
            </Judul>
          </View>
        </View>
      )}
    </Pressable>
  );
}

export function Ikon({ src, ukuran = 24, style }: { src: number; ukuran?: number; style?: StyleProp<any> }) {
  return <Image source={src} style={[{ width: ukuran, height: ukuran }, style]} contentFit="contain" />;
}

export function Gambar({ src, lebar, tinggi, style }: { src: number; lebar: number; tinggi: number; style?: StyleProp<any> }) {
  return <Image source={src} style={[{ width: lebar, height: tinggi }, style]} contentFit="contain" />;
}

export function Label({ children, warna = W.biru, style }: { children: ReactNode; warna?: string; style?: StyleProp<TextStyle> }) {
  return (
    <Judul ukuran={9} warna={warna} style={[{ letterSpacing: 1 }, style]}>
      {children}
    </Judul>
  );
}

export function Chip({ label, warna = W.navy, teks = W.kertas, onPress, aktif, style }: { label: string; warna?: string; teks?: string; onPress?: () => void; aktif?: boolean; style?: StyleProp<ViewStyle> }) {
  const isi = (
    <View style={[{ backgroundColor: aktif === false ? W.kertas : warna, borderWidth: 2, borderColor: W.tinta, paddingHorizontal: 10, paddingVertical: 6 }, style]}>
      <Kode ukuran={20} warna={aktif === false ? W.tinta : teks}>
        {label}
      </Kode>
    </View>
  );
  if (!onPress) return isi;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      {isi}
    </Pressable>
  );
}

export function Isian(props: TextInputProps & { label?: string; galat?: string | null; kode?: boolean; gelap?: boolean }) {
  const { label, galat, kode, gelap, style, ...sisa } = props;
  const [fokus, setFokus] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      {label ? <Label warna={gelap ? W.biruMuda : W.biru}>{label}</Label> : null}
      <TextInput
        placeholderTextColor={gelap ? '#6E7E6F' : W.abu3}
        autoCapitalize="none"
        autoCorrect={false}
        {...sisa}
        onFocus={(e) => {
          setFokus(true);
          sisa.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFokus(false);
          sisa.onBlur?.(e);
        }}
        style={[
          {
            fontFamily: kode ? H.kode : H.teks,
            fontSize: kode ? 22 : 17,
            color: gelap ? W.layarTeks : W.tinta,
            backgroundColor: gelap ? W.layar : W.kertasPutih,
            borderWidth: 3,
            borderColor: galat ? W.merah : fokus ? W.emas : gelap ? W.layarGaris : W.tinta,
            paddingHorizontal: 12,
            paddingVertical: 10,
            minHeight: 48,
            ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
          } as any,
          style,
        ]}
      />
      {galat ? <Teks ukuran={15} warna={W.merah}>{galat}</Teks> : null}
    </View>
  );
}

export function Tab<T extends string>({ pilihan, nilai, ubah, gelap }: { pilihan: { kode: T; label: string; lencana?: number }[]; nilai: T; ubah: (k: T) => void; gelap?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', borderWidth: 3, borderColor: W.tinta, backgroundColor: gelap ? W.malam2 : W.kertas }}>
      {pilihan.map((p, i) => {
        const aktif = p.kode === nilai;
        return (
          <Pressable
            key={p.kode}
            accessibilityRole="tab"
            accessibilityState={{ selected: aktif }}
            accessibilityLabel={p.label}
            onPress={() => ubah(p.kode)}
            style={{
              flex: 1,
              paddingVertical: 11,
              paddingHorizontal: 4,
              alignItems: 'center',
              backgroundColor: aktif ? (gelap ? W.emas : W.tinta) : 'transparent',
              borderLeftWidth: i ? 3 : 0,
              borderColor: W.tinta,
            }}
          >
            <Judul ukuran={9} warna={aktif ? (gelap ? W.tinta : W.kertas) : gelap ? W.kertas : W.tinta} style={{ textAlign: 'center' }}>
              {p.label}
              {p.lencana ? ` (${p.lencana})` : ''}
            </Judul>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Bintang({ jumlah, ukuran = 22, maks = 3 }: { jumlah: number; ukuran?: number; maks?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 3 }} accessibilityLabel={`${jumlah} dari ${maks} bintang`}>
      {Array.from({ length: maks }, (_, i) => (
        <Ikon key={i} src={A.ikon.bintang} ukuran={ukuran} style={{ opacity: i < jumlah ? 1 : 0.25 }} />
      ))}
    </View>
  );
}

export function Bilah({ nilai, warna = W.biruMuda, latar = W.malam3, tinggi = 12 }: { nilai: number; warna?: string; latar?: string; tinggi?: number }) {
  return (
    <View style={{ height: tinggi, borderWidth: 2, borderColor: W.kertas, backgroundColor: latar }}>
      <View style={{ width: `${Math.max(0, Math.min(1, nilai)) * 100}%`, height: '100%', backgroundColor: warna }} />
    </View>
  );
}

export function Memuat({ teks = 'Memuat...', gelap = true }: { teks?: string; gelap?: boolean }) {
  return (
    <View style={{ padding: 30, alignItems: 'center', gap: 14 }}>
      <ActivityIndicator color={gelap ? W.emas : W.tinta} />
      <Judul ukuran={10} warna={gelap ? W.kertas : W.tinta}>
        {teks}
      </Judul>
    </View>
  );
}

export function Pesan({ teks, jenis = 'info', onTutup }: { teks: string; jenis?: 'info' | 'galat' | 'sukses'; onTutup?: () => void }) {
  const warna = jenis === 'galat' ? W.merah : jenis === 'sukses' ? W.hijau : W.biru;
  return (
    <View style={{ borderWidth: 3, borderColor: W.tinta, backgroundColor: W.kertasPutih, flexDirection: 'row' }}>
      <View style={{ width: 10, backgroundColor: warna }} />
      <View style={{ flex: 1, padding: 10 }}>
        <Teks ukuran={16}>{teks}</Teks>
      </View>
      {onTutup ? (
        <Pressable onPress={onTutup} style={{ padding: 10 }} accessibilityLabel="Tutup pesan">
          <Judul ukuran={10}>X</Judul>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Lembar dari bawah layar untuk pilihan dan formulir singkat. */
export function Lembar({ terbuka, tutup, judul, children, lebar = 520 }: { terbuka: boolean; tutup: () => void; judul: string; children: ReactNode; lebar?: number }) {
  return (
    <Modal visible={terbuka} transparent animationType={Platform.OS === 'web' ? 'none' : 'fade'} onRequestClose={tutup}>
      <View style={{ flex: 1, backgroundColor: 'rgba(11,13,22,0.75)', justifyContent: 'flex-end', alignItems: 'center' }}>
        <Pressable style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} onPress={tutup} accessibilityLabel="Tutup" />
        <View style={{ width: '100%', maxWidth: lebar, maxHeight: '88%', backgroundColor: W.kertas, borderWidth: 3, borderColor: W.tinta, borderBottomWidth: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: W.tinta, paddingHorizontal: 14, paddingVertical: 12 }}>
            <Judul ukuran={11} warna={W.emas} style={{ flex: 1 }}>
              {judul}
            </Judul>
            <Pressable onPress={tutup} accessibilityLabel="Tutup" hitSlop={12}>
              <Judul ukuran={12} warna={W.kertas}>
                X
              </Judul>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 30 }} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export function Pemisah({ warna = W.abu2 }: { warna?: string }) {
  return <View style={{ height: 0, borderTopWidth: 2, borderStyle: 'dashed', borderColor: warna }} />;
}

export function Baris({ children, gap = 10, style }: { children: ReactNode; gap?: number; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>;
}
