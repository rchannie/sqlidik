import { Platform } from 'react-native';

import { bacaJson, simpanJson } from '../data/simpan';

/*
 * Alamat server:
 * - Versi web di Vercel memakai alamat yang sama (/api diteruskan ke Railway), jadi boleh kosong.
 * - Aplikasi Android memakai EXPO_PUBLIC_API_URL, misalnya https://sqlidik-api.up.railway.app.
 * - Alamat juga bisa diganti dari Pengaturan, berguna saat menguji dengan server di laptop.
 */
const BAWAAN = (process.env.EXPO_PUBLIC_API_URL ?? '').trim().replace(/\/+$/, '');
let kustom: string | null = null;
let sudahDimuat = false;

export async function muatAlamatServer() {
  if (sudahDimuat) return;
  kustom = await bacaJson<string | null>('sqlidik:server', null);
  sudahDimuat = true;
}

export function alamatServer(): string {
  return (kustom ?? BAWAAN).trim().replace(/\/+$/, '');
}

export function alamatBawaan(): string {
  return BAWAAN;
}

export async function aturAlamatServer(alamat: string | null) {
  let a = (alamat ?? '').trim().replace(/\/+$/, '');
  if (a && !/^https?:\/\//i.test(a)) a = 'http://' + a;
  kustom = a || null;
  await simpanJson('sqlidik:server', kustom);
}

export class GalatApi extends Error {
  status: number;
  bagian?: string;
  constructor(status: number, pesan: string, bagian?: string) {
    super(pesan);
    this.status = status;
    this.bagian = bagian;
  }
}

type Opsi = { metode?: string; isi?: unknown; token?: string | null; waktuHabis?: number };

export async function api<T = any>(jalur: string, opsi: Opsi = {}): Promise<T> {
  await muatAlamatServer();
  const dasar = alamatServer();
  if (!dasar && Platform.OS !== 'web') {
    throw new GalatApi(0, 'Alamat server belum diatur. Isi di Pengaturan pada layar judul.');
  }
  const ctrl = new AbortController();
  const jam = setTimeout(() => ctrl.abort(), opsi.waktuHabis ?? 40000);
  let res: Response;
  try {
    res = await fetch(dasar + jalur, {
      method: opsi.metode ?? (opsi.isi === undefined ? 'GET' : 'POST'),
      headers: {
        ...(opsi.isi !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(opsi.token ? { Authorization: 'Bearer ' + opsi.token } : {}),
      },
      body: opsi.isi !== undefined ? JSON.stringify(opsi.isi) : undefined,
      signal: ctrl.signal,
    });
  } catch {
    throw new GalatApi(0, 'Tidak bisa terhubung ke server. Periksa internet, lalu coba lagi.');
  } finally {
    clearTimeout(jam);
  }
  const teks = await res.text();
  let data: any = null;
  try {
    data = teks ? JSON.parse(teks) : null;
  } catch {
    data = null;
  }
  if (!res.ok) {
    const d = data?.detail;
    if (d && typeof d === 'object' && 'pesan' in d) throw new GalatApi(res.status, d.pesan, d.bagian);
    if (typeof d === 'string') throw new GalatApi(res.status, d);
    if (res.status >= 500 || res.status === 404) {
      throw new GalatApi(res.status, 'Server sedang bermasalah atau belum siap. Coba lagi sebentar.');
    }
    throw new GalatApi(res.status, 'Permintaan gagal (' + res.status + ').');
  }
  return data as T;
}

export async function unduhTeks(jalur: string, token: string): Promise<string> {
  await muatAlamatServer();
  const res = await fetch(alamatServer() + jalur, { headers: { Authorization: 'Bearer ' + token } });
  if (!res.ok) throw new GalatApi(res.status, 'Gagal mengunduh berkas.');
  return res.text();
}
