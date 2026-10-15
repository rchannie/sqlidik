import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { alamatBawaan, alamatServer, api, aturAlamatServer, muatAlamatServer } from '../api/klien';
import { muatInfoServer } from '../data/toko';
import { W } from '../tema';
import { Isian, Lembar, Pesan, Teks, Tombol } from './ui';

export function Pengaturan({ terbuka, tutup }: { terbuka: boolean; tutup: () => void }) {
  const [alamat, setAlamat] = useState('');
  const [pesan, setPesan] = useState<{ teks: string; jenis: 'galat' | 'sukses' | 'info' } | null>(null);
  const [cek, setCek] = useState(false);

  useEffect(() => {
    if (!terbuka) return;
    setPesan(null);
    muatAlamatServer().then(() => setAlamat(alamatServer()));
  }, [terbuka]);

  const uji = async () => {
    setCek(true);
    setPesan(null);
    try {
      await aturAlamatServer(alamat);
      setAlamat(alamatServer());
      await api('/api/info', { waktuHabis: 30000 });
      await muatInfoServer();
      setPesan({ teks: 'Server terhubung.', jenis: 'sukses' });
    } catch (e: any) {
      setPesan({ teks: e?.message ?? 'Server tidak bisa dihubungi.', jenis: 'galat' });
    } finally {
      setCek(false);
    }
  };

  return (
    <Lembar terbuka={terbuka} tutup={tutup} judul="PENGATURAN">
      <Teks ukuran={16} warna={W.teksRedup}>
        Alamat server SQLidik. Biarkan seperti bawaan, kecuali gurumu meminta alamat lain atau kamu sedang menguji server di laptop
        (contoh: http://192.168.1.5:8000).
      </Teks>
      <Isian label="ALAMAT SERVER" value={alamat} onChangeText={setAlamat} placeholder={Platform.OS === 'web' ? 'kosong = alamat situs ini' : 'https://...'} keyboardType="url" />
      {alamatBawaan() ? <Teks ukuran={14} warna={W.abu3}>Bawaan: {alamatBawaan()}</Teks> : null}
      {pesan ? <Pesan teks={pesan.teks} jenis={pesan.jenis} /> : null}
      <Tombol label="SIMPAN DAN UJI" onPress={uji} memuat={cek} />
      <Tombol
        label="KEMBALIKAN KE BAWAAN"
        varian="kertas"
        kecil
        onPress={async () => {
          await aturAlamatServer(null);
          setAlamat(alamatServer());
          setPesan({ teks: 'Alamat dikembalikan ke bawaan.', jenis: 'info' });
        }}
      />
    </Lembar>
  );
}
