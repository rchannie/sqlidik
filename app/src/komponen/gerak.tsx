/*
 * Animasi pixel SQLidik. Gerakannya patah-patah (steps) seperti game Jejak Kode, bukan halus,
 * supaya cocok dengan gambar pixel art. Memakai animasi CSS Reanimated, jadi jalan di Android, iOS, dan web.
 * Kalau perangkat memakai pengaturan "kurangi gerakan", semua animasi dimatikan.
 */
import { ReactNode } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import Animated, { css, steps, useReducedMotion } from 'react-native-reanimated';

type Bingkai = Record<string, any>;
const simpananKeyframes = new Map<string, ReturnType<typeof css.keyframes>>();

/** Keyframes disimpan per nama supaya tidak dibuat ulang setiap render. */
export function keyframes(nama: string, isi: Bingkai) {
  let k = simpananKeyframes.get(nama);
  if (!k) {
    k = css.keyframes(isi);
    simpananKeyframes.set(nama, k);
  }
  return k;
}

const simpananSteps = new Map<number, ReturnType<typeof steps>>();
export function langkah(n: number) {
  const bulat = Math.max(1, Math.round(n));
  let s = simpananSteps.get(bulat);
  if (!s) {
    s = steps(bulat);
    simpananSteps.set(bulat, s);
  }
  return s;
}

export type JenisGerak =
  | 'melayang' // naik turun pelan, untuk karakter, logo, ikon
  | 'denyut' // membesar sedikit, untuk tombol utama dan hadiah
  | 'kedip' // muncul hilang, untuk kursor dan tanda KETUK
  | 'muncul' // meletup dari kecil, sekali
  | 'naik' // geser dari bawah, sekali (lembar)
  | 'turun' // jatuh dari atas, sekali (spanduk)
  | 'pudar' // muncul pelan, sekali
  | 'goyang' // geleng kiri kanan, sekali (galat, berkas terkunci)
  | 'ayun' // miring kiri kanan, untuk kertas di papan
  | 'cap' // dihentak dari besar, sekali (stempel)
  | 'lompat' // melompat terus, untuk tersangka terpilih
  | 'nyala' // api berkobar
  | 'putarKoin' // koin berputar sesekali
  | 'sorot'; // lampu sorot berkedip pelan

type Pengaturan = { durasi: number; langkah: number; ulang: boolean | number; isi: (jarak: number) => Bingkai };

const t = (y: number) => ({ transform: [{ translateY: y }] });

const PRESET: Record<JenisGerak, Pengaturan> = {
  melayang: { durasi: 1400, langkah: 2, ulang: true, isi: (j) => ({ from: t(0), '50%': t(-j), to: t(0) }) },
  denyut: {
    durasi: 1600,
    langkah: 2,
    ulang: true,
    isi: (j) => ({ from: { transform: [{ scale: 1 }] }, '50%': { transform: [{ scale: 1 + j / 100 }] }, to: { transform: [{ scale: 1 }] } }),
  },
  kedip: { durasi: 1000, langkah: 1, ulang: true, isi: () => ({ from: { opacity: 1 }, '50%': { opacity: 0 }, to: { opacity: 0 } }) },
  muncul: {
    durasi: 320,
    langkah: 3,
    ulang: 1,
    isi: () => ({ from: { opacity: 0, transform: [{ scale: 0.2 }] }, '65%': { opacity: 1, transform: [{ scale: 1.12 }] }, to: { opacity: 1, transform: [{ scale: 1 }] } }),
  },
  naik: { durasi: 180, langkah: 3, ulang: 1, isi: (j) => ({ from: { opacity: 0, ...t(j) }, to: { opacity: 1, ...t(0) } }) },
  turun: {
    durasi: 420,
    langkah: 4,
    ulang: 1,
    isi: (j) => ({ from: { opacity: 0, ...t(-j) }, '70%': { opacity: 1, ...t(4) }, to: { opacity: 1, ...t(0) } }),
  },
  pudar: { durasi: 240, langkah: 3, ulang: 1, isi: () => ({ from: { opacity: 0 }, to: { opacity: 1 } }) },
  goyang: {
    durasi: 360,
    langkah: 1,
    ulang: 1,
    isi: (j) => {
      const x = (v: number) => ({ transform: [{ translateX: v }] });
      return { from: x(0), '17%': x(-j), '34%': x(j), '51%': x(-j * 0.6), '68%': x(j * 0.6), '85%': x(0), to: x(0) };
    },
  },
  ayun: {
    durasi: 2600,
    langkah: 2,
    ulang: true,
    isi: (j) => ({ from: { transform: [{ rotate: `${-j}deg` }] }, '50%': { transform: [{ rotate: `${j}deg` }] }, to: { transform: [{ rotate: `${-j}deg` }] } }),
  },
  cap: {
    durasi: 360,
    langkah: 4,
    ulang: 1,
    isi: () => ({ from: { opacity: 0, transform: [{ scale: 2.4 }] }, '60%': { opacity: 1, transform: [{ scale: 0.92 }] }, to: { opacity: 1, transform: [{ scale: 1 }] } }),
  },
  lompat: { durasi: 520, langkah: 2, ulang: true, isi: (j) => ({ from: t(0), '50%': t(-j), to: t(0) }) },
  nyala: {
    durasi: 560,
    langkah: 2,
    ulang: true,
    isi: (j) => ({
      from: { transform: [{ scaleY: 1 }, { scaleX: 1 }] },
      '50%': { transform: [{ scaleY: 1 + j / 100 }, { scaleX: 1 - j / 200 }] },
      to: { transform: [{ scaleY: 1 }, { scaleX: 1 }] },
    }),
  },
  putarKoin: {
    durasi: 3200,
    langkah: 2,
    ulang: true,
    isi: () => ({
      from: { transform: [{ scaleX: 1 }] },
      '84%': { transform: [{ scaleX: 1 }] },
      '90%': { transform: [{ scaleX: 0.15 }] },
      '96%': { transform: [{ scaleX: 1 }] },
      to: { transform: [{ scaleX: 1 }] },
    }),
  },
  sorot: { durasi: 2200, langkah: 2, ulang: true, isi: (j) => ({ from: { opacity: 1 }, '50%': { opacity: 1 - j / 100 }, to: { opacity: 1 } }) },
};

const JARAK_BAWAAN: Partial<Record<JenisGerak, number>> = {
  melayang: 3,
  denyut: 4,
  naik: 48,
  turun: 40,
  goyang: 7,
  ayun: 2,
  lompat: 8,
  nyala: 12,
  sorot: 30,
};

type GerakProps = {
  jenis: JenisGerak;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Besar gerakan: piksel untuk melayang, naik, goyang, lompat; derajat untuk ayun; persen untuk denyut, nyala, sorot. */
  jarak?: number;
  durasi?: number;
  tunda?: number;
  /** Jumlah langkah patah-patah. Makin kecil makin kasar. */
  patah?: number;
  /** false atau 0 untuk menghentikan animasi tanpa menghapus isinya. */
  aktif?: boolean;
  pointerEvents?: 'auto' | 'none' | 'box-none' | 'box-only';
};

/** Bungkus apa saja supaya bergerak. Contoh: <Gerak jenis="melayang"><Image .../></Gerak> */
export function Gerak({ jenis, children, style, jarak, durasi, tunda = 0, patah, aktif = true, pointerEvents }: GerakProps) {
  const kurangi = useReducedMotion();
  if (kurangi || !aktif) {
    return (
      <View style={style} pointerEvents={pointerEvents}>
        {children}
      </View>
    );
  }
  const p = PRESET[jenis];
  const j = jarak ?? JARAK_BAWAAN[jenis] ?? 0;
  const animasi = keyframes(`${jenis}:${j}`, p.isi(j));
  return (
    <Animated.View
      pointerEvents={pointerEvents}
      style={[
        style,
        {
          animationName: animasi,
          animationDuration: durasi ?? p.durasi,
          animationDelay: tunda,
          animationTimingFunction: langkah(patah ?? p.langkah),
          animationIterationCount: p.ulang === true ? 'infinite' : (p.ulang as number),
          animationFillMode: p.ulang === true ? 'none' : 'both',
        } as any,
      ]}
    >
      {children}
    </Animated.View>
  );
}

/** Angka acak yang selalu sama untuk benih yang sama, supaya posisi hujan dan bintang tidak berubah setiap render. */
export function acak(benih: number): () => number {
  let s = benih >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Konfeti pixel yang jatuh sekali, untuk layar KASUS SELESAI. */
export function Konfeti({ lebar, tinggi, jumlah = 28 }: { lebar: number; tinggi: number; jumlah?: number }) {
  const kurangi = useReducedMotion();
  if (kurangi || !lebar || !tinggi) return null;
  const r = acak(77);
  const WARNA = ['#E8B33D', '#C8453B', '#4E9A5B', '#9DC3E6', '#F7D77A', '#7B5EA7', '#F4F1E8'];
  const jatuh = keyframes(`konfeti:${Math.round(tinggi)}`, {
    from: { opacity: 1, transform: [{ translateY: -20 }, { rotate: '0deg' }] },
    '85%': { opacity: 1 },
    to: { opacity: 0, transform: [{ translateY: tinggi + 20 }, { rotate: '540deg' }] },
  });
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, width: lebar, height: tinggi, overflow: 'hidden' }}>
      {Array.from({ length: jumlah }, (_, i) => {
        const ukuran = 6 + Math.floor(r() * 3) * 3;
        return (
          <Animated.View
            key={i}
            style={
              {
                position: 'absolute',
                top: 0,
                left: r() * (lebar - ukuran),
                width: ukuran,
                height: ukuran,
                backgroundColor: WARNA[i % WARNA.length],
                borderWidth: 2,
                borderColor: '#1B1B2F',
                opacity: 0,
                animationName: jatuh,
                animationDuration: 1800 + r() * 1400,
                animationDelay: r() * 700,
                animationTimingFunction: langkah(16),
                animationIterationCount: 1,
                animationFillMode: 'both',
              } as any
            }
          />
        );
      })}
    </View>
  );
}
