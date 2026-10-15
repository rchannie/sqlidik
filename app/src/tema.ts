import { Platform } from 'react-native';

export const W = {
  tinta: '#1B1B2F',
  navy: '#2E3A59',
  biru: '#4A6FA5',
  biruMuda: '#9DC3E6',
  kertas: '#F4F1E8',
  kertasPutih: '#FFFDF7',
  abu1: '#D8D4C8',
  abu2: '#B8B5AD',
  abu3: '#6B6A72',
  emas: '#E8B33D',
  emasTua: '#B07C1E',
  emasMuda: '#F7D77A',
  merah: '#C8453B',
  merahTua: '#8A2B2B',
  oranye: '#E07B39',
  hijau: '#4E9A5B',
  hijauTua: '#2F6B3A',
  gabus: '#B9874E',
  kayu: '#5A3A22',
  kayuTua: '#3A2A20',
  malam: '#141826',
  malam2: '#232C47',
  malam3: '#0F1220',
  teksRedup: '#3A3F5C',
  layar: '#0B1A12',
  layar2: '#0E2117',
  layarGaris: '#1C4A30',
  layarTeks: '#9BE7A5',
  layarKuning: '#F7D77A',
  ungu: '#7B5EA7',
};

export const H = {
  judul: 'PressStart2P_400Regular',
  teks: 'PixelifySans_400Regular',
  teksTebal: 'PixelifySans_700Bold',
  kode: 'VT323_400Regular',
};

export const LEBAR_HP = 480;
export const LEBAR_GURU = 1040;
export const WEB = Platform.OS === 'web';

export const WARNA_KONSEP: Record<string, string> = {
  SELECT: W.biru,
  WHERE: W.hijau,
  LIKE: W.ungu,
  AGREGASI: W.oranye,
  JOIN: W.merah,
};

export const NAMA_KONSEP: Record<string, string> = {
  SELECT: 'SELECT',
  WHERE: 'WHERE',
  LIKE: 'LIKE',
  AGREGASI: 'SUM / COUNT',
  JOIN: 'JOIN',
};
