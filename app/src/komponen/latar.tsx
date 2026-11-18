/*
 * Latar bergerak. Gambar latar dipasang seperti biasa (contentFit cover), lalu di atasnya ada lapisan
 * animasi yang posisinya mengikuti piksel gambar asli (390 x 846), jadi hujan, jendela, dan lampu
 * tetap pas walaupun ukuran layar berbeda.
 */
import { Image } from 'expo-image';
import { ReactElement, useState } from 'react';
import { LayoutChangeEvent, View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';

import { A } from '../aset';
import { acak, keyframes, langkah } from './gerak';

const LEBAR_ASLI = 390;
const TINGGI_ASLI = 846;

type Ukuran = { s: number; kiri: number; atas: number; lebar: number; tinggi: number; wadahTinggi: number };

function hitung(w: number, h: number): Ukuran {
  const s = Math.max(w / LEBAR_ASLI, h / TINGGI_ASLI);
  const lebar = LEBAR_ASLI * s;
  const tinggi = TINGGI_ASLI * s;
  return { s, lebar, tinggi, kiri: (w - lebar) / 2, atas: (h - tinggi) / 2, wadahTinggi: h };
}

/** Kotak di koordinat piksel gambar asli. */
function kotak(u: Ukuran, x: number, y: number, w: number, h: number) {
  return { position: 'absolute' as const, left: x * u.s, top: y * u.s, width: w * u.s, height: h * u.s };
}

function Anim({ style, nama, isi, durasi, tunda = 0, patah = 1, ulang = true }: { style: any; nama: string; isi: Record<string, any>; durasi: number; tunda?: number; patah?: number; ulang?: boolean }) {
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        style,
        {
          animationName: keyframes(nama, isi),
          animationDuration: durasi,
          animationDelay: tunda,
          animationTimingFunction: langkah(patah),
          animationIterationCount: ulang ? 'infinite' : 1,
        } as any,
      ]}
    />
  );
}

/* ------------------------------------------------------------------ layar judul: kota malam berhujan */

const JENDELA = [
  [165, 531], [84, 555], [135, 567], [180, 567], [228, 582], [348, 582], [165, 585], [42, 588], [243, 600], [363, 600],
  [42, 606], [282, 621], [12, 624], [42, 624], [69, 627], [213, 636], [243, 636], [135, 639], [150, 639], [12, 642],
  [27, 642], [213, 654], [258, 654], [348, 654], [165, 657], [180, 657], [297, 657], [69, 663], [84, 663], [363, 672],
];
const JENDELA_REDUP = [[165, 567], [135, 585], [12, 588], [258, 618], [27, 624], [363, 636], [165, 639], [42, 642], [135, 657], [135, 675]];
const BINTANG = [
  [378, 21], [177, 57], [246, 57], [36, 84], [348, 138], [144, 141], [306, 210], [90, 219], [126, 288], [327, 297],
  [264, 6], [138, 39], [219, 48], [93, 84], [102, 111], [240, 129], [303, 150], [207, 180], [156, 189], [237, 246],
];

function LapisJudul({ u }: { u: Ukuran }) {
  const r = acak(11);
  // Lampu jendela: sebagian padam dan menyala bergantian dengan jeda berbeda-beda.
  const padam = JENDELA.filter((_, i) => i % 3 === 0).map(([x, y], i) => (
    <Anim
      key={'p' + i}
      style={[kotak(u, x, y, 6, 6), { backgroundColor: '#0F1220', opacity: 0 }]}
      nama="jendela-padam"
      isi={{ from: { opacity: 0 }, '55%': { opacity: 1 }, '88%': { opacity: 0 }, to: { opacity: 0 } }}
      durasi={5200 + r() * 6000}
      tunda={r() * 4000}
    />
  ));
  const terang = JENDELA_REDUP.filter((_, i) => i % 2 === 0).map(([x, y], i) => (
    <Anim
      key={'t' + i}
      style={[kotak(u, x, y, 6, 6), { backgroundColor: '#E8B33D', opacity: 0 }]}
      nama="jendela-terang"
      isi={{ from: { opacity: 0 }, '40%': { opacity: 1 }, '70%': { opacity: 0 }, to: { opacity: 0 } }}
      durasi={6000 + r() * 5000}
      tunda={r() * 5000}
    />
  ));
  // Bintang berkelip: tanda plus kecil yang muncul sebentar.
  const kelip = BINTANG.filter((_, i) => i % 2 === 0).map(([x, y], i) => {
    const d = 1800 + r() * 2600;
    const tunda = r() * 3000;
    const isi = { from: { opacity: 0 }, '70%': { opacity: 1 }, '85%': { opacity: 0 }, to: { opacity: 0 } };
    return (
      <View key={'b' + i} pointerEvents="none">
        <Anim style={[kotak(u, x - 3, y, 9, 3), { backgroundColor: '#F4F1E8', opacity: 0 }]} nama="bintang" isi={isi} durasi={d} tunda={tunda} />
        <Anim style={[kotak(u, x, y - 3, 3, 9), { backgroundColor: '#F4F1E8', opacity: 0 }]} nama="bintang" isi={isi} durasi={d} tunda={tunda} />
      </View>
    );
  });
  // Hujan: tetes 3 x 6 piksel jatuh patah-patah.
  const jatuh = { from: { transform: [{ translateY: -12 * u.s }] }, to: { transform: [{ translateY: u.tinggi }] } };
  const hujan = Array.from({ length: 22 }, (_, i) => {
    const d = 900 + r() * 700;
    return (
      <Anim
        key={'h' + i}
        style={[kotak(u, Math.floor(r() * 128) * 3, 0, 3, 6 + Math.floor(r() * 2) * 3), { backgroundColor: '#5E77A8', opacity: 0.9 }]}
        nama={`hujan:${Math.round(u.tinggi)}`}
        isi={jatuh}
        durasi={d}
        tunda={r() * 1500}
        patah={Math.round(d / 60)}
      />
    );
  });
  return (
    <>
      {hujan}
      {/* Cahaya bulan berdenyut pelan */}
      <Anim
        style={[kotak(u, 282, 30, 72, 72), { borderRadius: 36 * u.s, backgroundColor: '#F4F1E8', opacity: 0.08 }]}
        nama="bulan"
        isi={{ from: { opacity: 0.06, transform: [{ scale: 1 }] }, '50%': { opacity: 0.16, transform: [{ scale: 1.12 }] }, to: { opacity: 0.06, transform: [{ scale: 1 }] } }}
        durasi={4000}
        patah={4}
      />
      {kelip}
      {padam}
      {terang}
      {/* Lampu jalan: sorot cahaya di bawahnya, satu lampu sesekali berkedip */}
      <Anim
        style={[kotak(u, 45, 603, 21, 42), { backgroundColor: '#F7D77A', opacity: 0.1 }]}
        nama="lampu-jalan-1"
        isi={{ from: { opacity: 0.1 }, '50%': { opacity: 0.16 }, to: { opacity: 0.1 } }}
        durasi={1800}
        patah={2}
      />
      <Anim
        style={[kotak(u, 315, 603, 21, 42), { backgroundColor: '#F7D77A', opacity: 0.1 }]}
        nama="lampu-jalan-2"
        isi={{ from: { opacity: 0.12 }, '86%': { opacity: 0.12 }, '88%': { opacity: 0 }, '90%': { opacity: 0.12 }, '93%': { opacity: 0 }, '95%': { opacity: 0.12 }, to: { opacity: 0.12 } }}
        durasi={4600}
      />
    </>
  );
}

/* ------------------------------------------------------------------ meja investigasi */

function LapisMeja({ u }: { u: Ukuran }) {
  const r = acak(23);
  const panel = [
    [222, 18],
    [297, 18],
  ];
  const jatuh = { from: { transform: [{ translateY: -9 * u.s }] }, to: { transform: [{ translateY: 51 * u.s }] } };
  return (
    <>
      {/* Hujan di kaca jendela kantor */}
      {panel.map(([x, y], i) => (
        <View key={'k' + i} pointerEvents="none" style={[kotak(u, x, y, 69, 48), { overflow: 'hidden' }]}>
          {Array.from({ length: 5 }, (_, j) => {
            const d = 700 + r() * 500;
            return (
              <Anim
                key={j}
                style={{ position: 'absolute', left: Math.floor(r() * 22) * 3 * u.s, top: 0, width: 3 * u.s, height: 6 * u.s, backgroundColor: '#5E77A8' }}
                nama={`hujan-kaca:${Math.round(u.s * 100)}`}
                isi={jatuh}
                durasi={d}
                tunda={r() * 1200}
                patah={Math.round(d / 70)}
              />
            );
          })}
        </View>
      ))}
      {/* Garis pindai layar CRT bergerak turun */}
      <View pointerEvents="none" style={[kotak(u, 45, 93, 300, 384), { overflow: 'hidden' }]}>
        <Anim
          style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 9 * u.s, backgroundColor: 'rgba(155,231,165,0.07)' }}
          nama={`pindai:${Math.round(u.s * 100)}`}
          isi={{ from: { transform: [{ translateY: -9 * u.s }] }, to: { transform: [{ translateY: 384 * u.s }] } }}
          durasi={5200}
          patah={64}
        />
      </View>
      {/* Lampu daya monitor berkedip */}
      <Anim
        style={[kotak(u, 318, 498, 9, 6), { backgroundColor: '#9BE7A5' }]}
        nama="led"
        isi={{ from: { opacity: 1 }, '60%': { opacity: 0.2 }, to: { opacity: 0.2 } }}
        durasi={1400}
      />
      {/* Uap dari gelas di meja */}
      {[0, 1, 2].map((i) => (
        <Anim
          key={'u' + i}
          style={[kotak(u, 342 + i * 6, 510, 3, 6), { backgroundColor: '#F4F1E8', opacity: 0 }]}
          nama={`uap:${Math.round(u.s * 100)}`}
          isi={{
            from: { opacity: 0, transform: [{ translateY: 0 }, { translateX: 0 }] },
            '25%': { opacity: 0.55 },
            '60%': { transform: [{ translateY: -14 * u.s }, { translateX: 3 * u.s }] },
            to: { opacity: 0, transform: [{ translateY: -27 * u.s }, { translateX: 0 }] },
          }}
          durasi={2400}
          tunda={i * 800}
          patah={8}
        />
      ))}
    </>
  );
}

/* ------------------------------------------------------------------ papan kasus (gabus) */

function LapisPapan({ u }: { u: Ukuran }) {
  const r = acak(31);
  // Debu halus melayang turun di depan papan.
  return (
    <>
      {Array.from({ length: 8 }, (_, i) => {
        const x = 30 + Math.floor(r() * 110) * 3;
        const d = 7000 + r() * 6000;
        return (
          <Anim
            key={i}
            style={[kotak(u, x, 0, 3, 3), { backgroundColor: '#F4F1E8', opacity: 0 }]}
            nama={`debu:${Math.round(u.tinggi)}`}
            isi={{
              from: { opacity: 0, transform: [{ translateY: 0 }, { translateX: 0 }] },
              '15%': { opacity: 0.35 },
              '50%': { transform: [{ translateY: u.tinggi * 0.5 }, { translateX: 9 * u.s }] },
              '85%': { opacity: 0.35 },
              to: { opacity: 0, transform: [{ translateY: u.tinggi }, { translateX: 0 }] },
            }}
            durasi={d}
            tunda={r() * 6000}
            patah={Math.round(d / 120)}
          />
        );
      })}
    </>
  );
}

const LAPIS = new Map<number, (p: { u: Ukuran }) => ReactElement>([
  [A.latar.judul, LapisJudul],
  [A.latar.meja, LapisMeja],
  [A.latar.papan, LapisPapan],
]);

/** Gambar latar penuh layar. Latar judul, meja, dan papan diberi lapisan animasi. */
export function LatarHidup({ sumber }: { sumber: number }) {
  const [u, setU] = useState<Ukuran | null>(null);
  const kurangi = useReducedMotion();
  const Lapis = LAPIS.get(sumber);
  const ukur = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (!width || !height) return;
    if (u && Math.abs(u.kiri * 2 + u.lebar - width) < 1 && Math.abs(u.wadahTinggi - height) < 1) return;
    setU(hitung(width, height));
  };
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, overflow: 'hidden' }} onLayout={ukur}>
      <Image source={sumber} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} contentFit="cover" />
      {Lapis && u && !kurangi ? (
        <View pointerEvents="none" style={{ position: 'absolute', left: u.kiri, top: u.atas, width: u.lebar, height: u.tinggi }}>
          <Lapis u={u} />
        </View>
      ) : null}
    </View>
  );
}
