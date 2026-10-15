/* Daftar kasus buatan guru. */
import { Redirect, router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { View } from 'react-native';

import { api } from '../../api/klien';
import { JudulBagian, Layar } from '../../komponen/layar';
import { Judul, Kotak, Label, Lembar, Pesan, Teks, Tombol } from '../../komponen/ui';
import type { Kasus } from '../../konten';
import { muatKasusGuruSendiri, useToko } from '../../data/toko';
import { waktuSingkat } from '../../permainan/waktu';
import { LEBAR_GURU, NAMA_KONSEP, W } from '../../tema';

export default function KasusSaya() {
  const peran = useToko((k) => k.s?.pengguna.peran);
  const token = useToko((k) => k.token);
  const [daftar, setDaftar] = useState<(Kasus & { diperbarui_pada?: string; sumber_data?: string })[] | null>(null);
  const [hapus, setHapus] = useState<Kasus | null>(null);
  const [pesan, setPesan] = useState<string | null>(null);

  const muat = useCallback(async () => {
    try {
      setDaftar((await muatKasusGuruSendiri()) as any);
    } catch (e: any) {
      setPesan(e?.message ?? 'Gagal memuat kasus.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (peran === 'guru') muat();
    }, [muat, peran]),
  );

  if (peran !== 'guru') return <Redirect href="/peta" />;

  return (
    <Layar warna={W.malam} lebar={LEBAR_GURU} segarkan={muat}>
      <View style={{ gap: 6 }}>
        <Judul ukuran={14} warna={W.emas}>KASUS BUATAN SAYA</Judul>
        <Teks warna={W.kertas}>Buat kasus sesuai materi di kelas. Kasus otomatis bisa dimainkan siswa di semua kelas Bapak/Ibu, dan bisa dijadikan tugas.</Teks>
      </View>
      <Tombol label="BUAT KASUS BARU" onPress={() => router.push('/guru/kasus')} testID="buat-kasus" />
      {pesan ? <Pesan teks={pesan} jenis="galat" onTutup={() => setPesan(null)} /> : null}
      <JudulBagian>{`DAFTAR KASUS${daftar ? ` (${daftar.length})` : ''}`}</JudulBagian>
      {daftar?.length === 0 ? <Teks warna={W.kertas}>Belum ada kasus buatan.</Teks> : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
        {daftar?.map((k) => (
          <View key={k.id} style={{ flexGrow: 1, flexBasis: 320, maxWidth: 500 }}>
            <Kotak warna={W.kertas} isi={{ gap: 8 }}>
              <Label>{`${NAMA_KONSEP[k.konsep]} · ${k.langkah.length} LANGKAH · ${k.sumber_data === 'arsip' ? 'ARSIP SEKOLAH' : 'DATA SENDIRI'}`}</Label>
              <Judul ukuran={11}>{k.judul.toUpperCase()}</Judul>
              <Teks ukuran={15} warna={W.teksRedup} garis={2}>{k.briefing[0]}</Teks>
              {k.diperbarui_pada ? <Teks ukuran={13} warna={W.abu3}>{`Diperbarui ${waktuSingkat(k.diperbarui_pada)}`}</Teks> : null}
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                <Tombol kecil label="UBAH" varian="navy" onPress={() => router.push({ pathname: '/guru/kasus', params: { id: k.id } })} />
                <Tombol kecil label="COBA MAIN" onPress={() => router.push(`/kasus/${k.id}`)} />
                <Tombol kecil label="HAPUS" varian="merah" onPress={() => setHapus(k)} />
              </View>
            </Kotak>
          </View>
        ))}
      </View>
      <Lembar terbuka={!!hapus} tutup={() => setHapus(null)} judul="HAPUS KASUS">
        <Teks>{`Hapus kasus "${hapus?.judul}"? Tugas yang memakai kasus ini ikut dihapus. Nilai siswa yang sudah ada tetap tersimpan.`}</Teks>
        <Tombol
          label="YA, HAPUS"
          varian="merah"
          onPress={async () => {
            const k = hapus;
            setHapus(null);
            if (!k) return;
            try {
              await api(`/api/guru/kasus/${k.id}`, { metode: 'DELETE', token });
              await muat();
            } catch (e: any) {
              setPesan(e?.message ?? 'Gagal menghapus.');
            }
          }}
        />
      </Lembar>
    </Layar>
  );
}
