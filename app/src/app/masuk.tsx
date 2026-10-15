import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';

import { AVATAR, AVATAR_PEMAIN, A } from '../aset';
import { Layar } from '../komponen/layar';
import { Pengaturan } from '../komponen/pengaturan';
import { Isian, Judul, Kotak, Label, Pesan, Tab, Teks, Tombol } from '../komponen/ui';
import { daftar, daftarGuru, masuk, useToko } from '../data/toko';
import { W } from '../tema';

type Mode = 'masuk' | 'daftar' | 'guru';

export default function LayarMasuk() {
  const param = useLocalSearchParams<{ tab?: string }>();
  const [mode, setMode] = useState<Mode>(param.tab === 'daftar' ? 'daftar' : 'masuk');
  const info = useToko((k) => k.infoServer);
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [sandi, setSandi] = useState('');
  const [sekolah, setSekolah] = useState('');
  const [kodeKelas, setKodeKelas] = useState('');
  const [kodeGuru, setKodeGuru] = useState('');
  const [avatar, setAvatar] = useState('pemain_01');
  const [galat, setGalat] = useState<string | null>(null);
  const [proses, setProses] = useState(false);
  const [atur, setAtur] = useState(false);

  const kirim = async () => {
    setGalat(null);
    if (!email.trim() || !sandi) return setGalat('Email dan kata sandi belum diisi.');
    if (mode !== 'masuk' && !nama.trim()) return setGalat('Nama belum diisi.');
    if (mode !== 'masuk' && sandi.length < 6) return setGalat('Kata sandi minimal 6 karakter.');
    if (mode === 'guru' && !kodeGuru.trim()) return setGalat('Kode pendaftaran guru belum diisi.');
    setProses(true);
    try {
      const p =
        mode === 'masuk'
          ? await masuk(email, sandi)
          : mode === 'daftar'
            ? await daftar({ nama, email, kata_sandi: sandi, sekolah, kode_kelas: kodeKelas || undefined, avatar })
            : await daftarGuru({ nama, email, kata_sandi: sandi, sekolah, kode_guru: kodeGuru });
      if (p.peran === 'guru') router.replace('/kelas');
      else if (p.penempatan === null && mode === 'daftar') router.replace('/penempatan');
      else router.replace('/peta');
    } catch (e: any) {
      setGalat(e?.message ?? 'Terjadi kesalahan.');
    } finally {
      setProses(false);
    }
  };

  const pilihan: { kode: Mode; label: string }[] = [
    { kode: 'masuk', label: 'MASUK' },
    { kode: 'daftar', label: 'DAFTAR' },
  ];
  if (info?.daftar_guru_terbuka || mode === 'guru') pilihan.push({ kode: 'guru', label: 'GURU' });

  return (
    <Layar latar={A.latar.judul}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ gap: 16 }}>
        <View style={{ alignItems: 'center', marginTop: 8 }}>
          <Image source={A.logo} style={{ width: 220, height: 48 }} contentFit="contain" />
        </View>
        <Tab pilihan={pilihan} nilai={mode} ubah={(m) => { setMode(m); setGalat(null); }} gelap />
        <Kotak warna={W.kertas} isi={{ gap: 14 }}>
          <Judul ukuran={11}>{mode === 'masuk' ? 'MASUK KE AKUN' : mode === 'daftar' ? 'DAFTAR SEBAGAI SISWA' : 'DAFTAR SEBAGAI GURU'}</Judul>
          {mode !== 'masuk' ? <Isian label="NAMA" value={nama} onChangeText={setNama} placeholder="Nama lengkap" autoCapitalize="words" maxLength={80} /> : null}
          <Isian label="EMAIL" value={email} onChangeText={setEmail} placeholder="nama@email.com" keyboardType="email-address" autoComplete="email" />
          <Isian label="KATA SANDI" value={sandi} onChangeText={setSandi} placeholder="Minimal 6 karakter" secureTextEntry onSubmitEditing={mode === 'masuk' ? kirim : undefined} />
          {mode !== 'masuk' ? <Isian label="SEKOLAH (BOLEH KOSONG)" value={sekolah} onChangeText={setSekolah} placeholder="Contoh: SMK Negeri 1 Bandung" autoCapitalize="words" /> : null}
          {mode === 'daftar' ? (
            <>
              <Isian label="KODE KELAS (BOLEH KOSONG)" value={kodeKelas} onChangeText={(t) => setKodeKelas(t.toUpperCase())} placeholder="Dari gurumu, misalnya K7RPL2" maxLength={12} autoCapitalize="characters" />
              <Label>PILIH AVATAR</Label>
              <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
                {AVATAR_PEMAIN.map((a) => (
                  <Pressable key={a} onPress={() => setAvatar(a)} accessibilityLabel={'Avatar ' + a} accessibilityState={{ selected: avatar === a }}>
                    <View style={{ borderWidth: 3, borderColor: avatar === a ? W.emas : W.tinta, backgroundColor: avatar === a ? W.emasMuda : W.kertasPutih }}>
                      <Image source={AVATAR[a]} style={{ width: 58, height: 58 }} />
                    </View>
                  </Pressable>
                ))}
              </View>
            </>
          ) : null}
          {mode === 'guru' ? (
            <>
              <Isian label="KODE PENDAFTARAN GURU" value={kodeGuru} onChangeText={setKodeGuru} placeholder="Dari pengelola SQLidik" secureTextEntry />
              <Teks ukuran={15} warna={W.teksRedup}>Akun guru hanya bisa dibuat dengan kode dari pengelola, supaya Mode Kelas tidak bisa dibuka sembarang orang.</Teks>
            </>
          ) : null}
          {galat ? <Pesan teks={galat} jenis="galat" /> : null}
          <Tombol label={mode === 'masuk' ? 'MASUK' : 'DAFTAR'} onPress={kirim} memuat={proses} testID="tombol-kirim" />
        </Kotak>
        <Tombol label="PENGATURAN SERVER" varian="navy" kecil onPress={() => setAtur(true)} />
      </KeyboardAvoidingView>
      <Pengaturan terbuka={atur} tutup={() => setAtur(false)} />
    </Layar>
  );
}
