import * as SecureStore from 'expo-secure-store';

const KUNCI = 'sqlidik_token';

export async function bacaToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(KUNCI);
  } catch {
    return null;
  }
}

export async function simpanToken(token: string | null): Promise<void> {
  try {
    if (token) await SecureStore.setItemAsync(KUNCI, token);
    else await SecureStore.deleteItemAsync(KUNCI);
  } catch {
    // abaikan
  }
}
