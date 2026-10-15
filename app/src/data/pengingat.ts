/*
 * Pengingat harian lewat notifikasi lokal. Tidak butuh server push, jadi tetap jalan di Expo Go.
 * Modul notifikasi baru dimuat saat pengingat diatur, supaya aplikasi tetap ringan saat dibuka.
 */
import { Platform } from 'react-native';

export const PENGINGAT_DIDUKUNG = true;

export async function aturPengingat(aktif: boolean, jam: number, menit: number): Promise<{ ok: boolean; pesan?: string }> {
  try {
    const Notifications = await import('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
    });
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!aktif) return { ok: true };
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('pengingat', {
        name: 'Pengingat Kasus Harian',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
    const izin = await Notifications.getPermissionsAsync();
    let status = izin.status;
    if (status !== 'granted') status = (await Notifications.requestPermissionsAsync()).status;
    if (status !== 'granted') return { ok: false, pesan: 'Izin notifikasi belum diberikan. Aktifkan di pengaturan HP.' };
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Kasus Harian sudah menunggu',
        body: 'Satu kasus singkat, 3 sampai 5 menit. Jaga streak-mu, Detektif.',
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: jam, minute: menit, channelId: 'pengingat' },
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, pesan: 'Pengingat gagal diatur di perangkat ini.' };
  }
}
