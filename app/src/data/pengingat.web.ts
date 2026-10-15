export const PENGINGAT_DIDUKUNG = false;

export async function aturPengingat(_aktif: boolean, _jam: number, _menit: number): Promise<{ ok: boolean; pesan?: string }> {
  return { ok: false, pesan: 'Pengingat hanya tersedia di aplikasi Android.' };
}
