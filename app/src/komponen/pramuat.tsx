/* Di web, semua gambar game dimuat sejak awal supaya tetap tampil kalau internet putus di tengah permainan. */
import { Image } from 'expo-image';
import { Platform, View } from 'react-native';

import { A, AVATAR } from '../aset';

function kumpulkan(x: unknown, hasil: number[]) {
  if (typeof x === 'number' || (typeof x === 'object' && x !== null && 'uri' in (x as object))) hasil.push(x as number);
  else if (typeof x === 'string') hasil.push(x as unknown as number);
  else if (x && typeof x === 'object') Object.values(x).forEach((v) => kumpulkan(v, hasil));
}

export function PramuatGambar() {
  if (Platform.OS !== 'web') return null;
  const semua: number[] = [];
  kumpulkan(A, semua);
  kumpulkan(AVATAR, semua);
  return (
    <View pointerEvents="none" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', opacity: 0, left: -10, top: -10 }}>
      {semua.map((src, i) => (
        <Image key={i} source={src} style={{ width: 1, height: 1 }} />
      ))}
    </View>
  );
}
