const KUNCI = 'sqlidik_token';

export async function bacaToken(): Promise<string | null> {
  try {
    return window.localStorage.getItem(KUNCI);
  } catch {
    return null;
  }
}

export async function simpanToken(token: string | null): Promise<void> {
  try {
    if (token) window.localStorage.setItem(KUNCI, token);
    else window.localStorage.removeItem(KUNCI);
  } catch {
    // abaikan
  }
}
