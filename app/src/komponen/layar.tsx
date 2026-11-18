import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ReactNode, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleProp, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { A, AVATAR } from '../aset';
import { useStatistik, useToko } from '../data/toko';
import { efek } from '../suara/mesin';
import { H, LEBAR_HP, W } from '../tema';
import { Gerak } from './gerak';
import { LatarHidup } from './latar';
import { Bilah, Ikon, Judul, Kode, Teks } from './ui';

/** Kembali ke layar judul (menu awal) tanpa keluar dari akun. */
export function keMenuAwal() {
  router.dismissTo('/');
}

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
  /** Lapisan di atas semua isi yang tidak bisa disentuh, misalnya konfeti. */
  lapisan?: ReactNode;
};

export function Layar({ children, latar, warna = W.malam, lebar = LEBAR_HP, gulir = true, atas, bawah, isi, segarkan, tanpaAmanAtas, lapisan }: LayarProps) {
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
        {latar ? <LatarHidup sumber={latar} /> : null}
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
        {lapisan ? (
          <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }}>
            {lapisan}
          </View>
        ) : null}
      </View>
    </View>
  );
}

function TombolMenuAwal({ ukuran = 24 }: { ukuran?: number }) {
  const [diatas, setDiatas] = useState(false);
  return (
    <Pressable
      onPress={() => {
        efek('ui_kembali');
        keMenuAwal();
      }}
      onHoverIn={() => setDiatas(true)}
      onHoverOut={() => setDiatas(false)}
      accessibilityRole="button"
      accessibilityLabel="Kembali ke menu awal"
      testID="menu-awal"
      hitSlop={10}
      style={{ padding: 4, transform: [{ translateX: diatas ? -2 : 0 }] }}
    >
      <Ikon src={A.ikon.kembali} ukuran={ukuran} />
    </Pressable>
  );
}

/** Bilah atas untuk tab yang tidak memakai HUD pemain (Profil dan layar guru): tombol kembali ke menu awal dan judul. */
export function HudMenu({ judul, label = 'MENU AWAL', kanan }: { judul: string; label?: string; kanan?: ReactNode }) {
  return (
    <View style={{ margin: 10, marginBottom: 0, backgroundColor: W.tinta, borderWidth: 3, borderColor: W.kertas, paddingVertical: 8, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <TombolMenuAwal />
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

/** HUD di atas Peta Kasus: avatar, pangkat, XP, streak, dan koin. */
export function HudPemain() {
  const s = useToko((k) => k.s);
  const st = useStatistik();
  if (!s || !st) return null;
  const jarak = st.xpPangkatBerikut ? (st.xp - st.xpPangkatIni) / (st.xpPangkatBerikut - st.xpPangkatIni) : 1;
  return (
    <View style={{ margin: 12, marginBottom: 0, backgroundColor: W.tinta, borderWidth: 3, borderColor: W.kertas, padding: 8, flexDirection: 'row', gap: 8, alignItems: 'center' }}>
      <TombolMenuAwal ukuran={22} />
      <Pressable
        onPress={() => {
          efek('ui_tab');
          router.navigate('/profil');
        }}
        accessibilityLabel="Buka profil"
      >
        <View style={{ borderWidth: 3, borderColor: W.emas, backgroundColor: W.kertas, overflow: 'hidden' }}>
          <Gerak jenis="melayang" jarak={2} durasi={1600}>
            <Image source={AVATAR[s.pengguna.avatar] ?? AVATAR.pemain_01} style={{ width: 52, height: 52 }} />
          </Gerak>
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
          <Gerak jenis="nyala" aktif={st.streak > 0}>
            <Ikon src={A.ikon.streak} ukuran={20} />
          </Gerak>
          <Judul ukuran={10} warna={W.kertas}>{st.streak}</Judul>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }} accessibilityLabel={`${st.koin} koin`}>
          <Gerak jenis="putarKoin">
            <Ikon src={A.ikon.koin} ukuran={20} />
          </Gerak>
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
        onPress={() => {
          efek('ui_kembali');
          if (kembali) kembali();
          else if (router.canGoBack()) router.back();
          else router.dismissTo('/peta');
        }}
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
      <Gerak jenis="putarKoin" tunda={900}>
        <Ikon src={A.ikon.koin} ukuran={22} />
      </Gerak>
      <Judul ukuran={10} warna={W.kertas}>
        {st?.koin ?? 0}
      </Judul>
    </View>
  );
}

type Ekspresi = 'normal' | 'senang' | 'serius';

/**
 * Dialog Komandan. Jika berisi beberapa kalimat, ketuk kotak atau LANJUT untuk kalimat berikutnya,
 * dan KEMBALI untuk membaca ulang kalimat sebelumnya. saatSelesai dipanggil setelah kalimat terakhir terbaca,
 * supaya layar bisa menahan tombol lanjut sampai dialog selesai dibaca.
 */
export function Dialog({ teks, ekspresi = 'normal', nama = 'KOMANDAN', saatSelesai, gelap = true, style, foto }: { teks: string | string[]; ekspresi?: Ekspresi; nama?: string; saatSelesai?: () => void; gelap?: boolean; style?: StyleProp<ViewStyle>; foto?: number }) {
  const daftar = Array.isArray(teks) ? teks : [teks];
  const kunci = daftar.join('|');
  // Posisi kalimat disimpan bersama isi dialognya, jadi dialog baru langsung mulai dari kalimat pertama.
  const [posisi, setPosisi] = useState({ kunci, i: 0 });
  const i = posisi.kunci === kunci ? Math.min(posisi.i, daftar.length - 1) : 0;
  const ke = (n: number) => setPosisi({ kunci, i: Math.max(0, Math.min(n, daftar.length - 1)) });
  const banyak = daftar.length > 1;
  const terakhir = i >= daftar.length - 1;
  useEffect(() => {
    if (terakhir) saatSelesai?.();
  }, [terakhir, kunci]);
  const warnaTeks = gelap ? W.kertas : W.tinta;
  const maju = () => {
    if (terakhir) return;
    efek('dialog_lanjut');
    ke(i + 1);
  };
  return (
    <Pressable
      onPress={maju}
      accessibilityRole={terakhir ? 'text' : 'button'}
      accessibilityLabel={terakhir ? undefined : 'Lanjutkan dialog'}
      testID="dialog"
      style={[{ backgroundColor: gelap ? W.tinta : W.kertasPutih, borderWidth: 3, borderColor: gelap ? W.kertas : W.tinta, padding: 10, flexDirection: 'row', gap: 12 }, style]}
    >
      <View style={{ borderWidth: 3, borderColor: W.emas, backgroundColor: W.navy, alignSelf: 'flex-start', overflow: 'hidden' }}>
        <Gerak jenis="melayang" jarak={2} durasi={1600}>
          <Image source={foto ?? A.komandan[ekspresi]} style={{ width: 64, height: 64 }} />
        </Gerak>
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Judul ukuran={9} warna={W.emas}>
          {nama}
        </Judul>
        <Gerak key={kunci + ':' + i} jenis="naik" jarak={6}>
          <Teks warna={warnaTeks} ukuran={17}>
            {daftar[i]}
          </Teks>
        </Gerak>
        {banyak ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <Pressable
              onPress={() => {
                efek('ui_kembali');
                ke(i - 1);
              }}
              disabled={i === 0}
              accessibilityRole="button"
              accessibilityLabel="Kalimat sebelumnya"
              testID="dialog-kembali"
              hitSlop={8}
              style={{ borderWidth: 2, borderColor: i === 0 ? W.abu3 : W.emas, paddingHorizontal: 8, paddingVertical: 6, opacity: i === 0 ? 0.35 : 1 }}
            >
              <Judul ukuran={8} warna={i === 0 ? W.abu2 : W.emas}>◀ KEMBALI</Judul>
            </Pressable>
            <Judul ukuran={8} warna={W.abu2} style={{ flex: 1, textAlign: 'center' }}>
              {`${i + 1}/${daftar.length}`}
            </Judul>
            {terakhir ? (
              <Judul ukuran={8} warna={W.hijau} style={{ paddingHorizontal: 8, paddingVertical: 6 }}>
                SELESAI
              </Judul>
            ) : (
              <Pressable onPress={maju} accessibilityRole="button" accessibilityLabel="Kalimat berikutnya" testID="dialog-lanjut" hitSlop={8} style={{ backgroundColor: W.emas, borderWidth: 2, borderColor: W.emas, paddingHorizontal: 8, paddingVertical: 6 }}>
                <Judul ukuran={8} warna={W.tinta}>LANJUT ▶</Judul>
              </Pressable>
            )}
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

/** Teks kecil di bawah tombol yang masih dikunci karena dialog belum selesai dibaca. */
export function SyaratDialog({ tampil }: { tampil: boolean }) {
  if (!tampil) return null;
  return (
    <Gerak jenis="kedip" durasi={1400}>
      <Judul ukuran={8} warna={W.emasMuda} style={{ textAlign: 'center' }}>
        BACA DIALOG KOMANDAN SAMPAI SELESAI DULU
      </Judul>
    </Gerak>
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
