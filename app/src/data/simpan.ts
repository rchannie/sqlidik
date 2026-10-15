import AsyncStorage from '@react-native-async-storage/async-storage';

export async function bacaJson<T>(kunci: string, cadangan: T): Promise<T> {
  try {
    const t = await AsyncStorage.getItem(kunci);
    return t ? (JSON.parse(t) as T) : cadangan;
  } catch {
    return cadangan;
  }
}

export async function simpanJson(kunci: string, nilai: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(kunci, JSON.stringify(nilai));
  } catch {
    // Penyimpanan penuh atau tidak tersedia. Data tetap ada di memori selama aplikasi terbuka.
  }
}

export async function hapus(kunci: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(kunci);
  } catch {
    // abaikan
  }
}
