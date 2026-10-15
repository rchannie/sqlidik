/* Kasus Harian, streak, kasus pemulihan, dan papan peringkat kelas. */
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { View } from 'react-native';

import { A, AVATAR } from '../../aset';
import { api } from '../../api/klien';
import { HudPemain, JudulBagian, Layar } from '../../komponen/layar';
import { Bintang, Ikon, Judul, Kotak, Label, Pesan, Tab, Teks, Tombol } from '../../komponen/ui';
import { muatKelas, useStatistik, useToko } from '../../data/toko';
import { durasiTeks, geserTanggal, harianUntuk, tanggalPanjang, tanggalWIB } from '../../permainan/waktu';
import { NAMA_KONSEP, W } from '../../tema';

type Peringkat = { tanggal: string; judul: string; jumlah_anggota: number; daftar: { peringkat: number; id: number; nama: string; avatar: string; durasi_detik: number; jumlah_percobaan: number; bintang: number }[] };

export default function Harian() {
  const s = useToko((k) => k.s)!;
  const token = useToko((k) => k.token);
  const st = useStatistik()!;
  const hariIni = tanggalWIB();
  const kasus = harianUntuk(hariIni);
  const hasil = s.harian[hariIni];
  const kemarin = geserTanggal(hariIni, -1);
  const bisaPulih = !s.hariAktif[kemarin] && !!s.hariAktif[geserTanggal(hariIni, -2)];
  const kelas = s.kelas ?? [];
  const [pilihKelas, setPilihKelas] = useState<number | null>(null);
  const [papan, setPapan] = useState<Peringkat | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const idKelas = pilihKelas ?? kelas[0]?.id_kelas ?? null;

  const muatPapan = useCallback(async () => {
    if (!idKelas || !token) return;
    try {
      setGalat(null);
      setPapan(await api<Peringkat>(`/api/harian/peringkat?id_kelas=${idKelas}`, { token }));
    } catch (e: any) {
      setGalat(e?.message ?? 'Papan peringkat belum bisa dimuat.');
    }
  }, [idKelas, token]);

  useFocusEffect(
    useCallback(() => {
      muatPapan();
    }, [muatPapan]),
  );

  return (
    <Layar latar={A.latar.papan} atas={<HudPemain />} segarkan={async () => { await muatKelas(); await muatPapan(); }}>
      <Kotak warna={W.tinta} tepi={W.emas} isi={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Ikon src={A.ikon.harian} ukuran={40} />
          <View style={{ flex: 1, gap: 4 }}>
            <Label warna={W.emas}>KASUS HARIAN</Label>
            <Teks ukuran={15} warna={W.biruMuda}>{tanggalPanjang(hariIni)}</Teks>
          </View>
        </View>
        <Judul ukuran={13} warna={W.kertas}>{kasus.judul.toUpperCase()}</Judul>
        <Teks warna={W.kertas} ukuran={16}>{kasus.briefing[0]}</Teks>
        <Teks warna={W.biruMuda} ukuran={15}>{`Konsep: ${NAMA_KONSEP[kasus.konsep]} · Hadiah: 30 XP dan 10 koin`}</Teks>
        {hasil ? (
          <View style={{ backgroundColor: W.hijauTua, borderWidth: 3, borderColor: W.kertas, padding: 10, gap: 6 }}>
            <Judul ukuran={9} warna={W.kertas}>SELESAI HARI INI</Judul>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Bintang jumlah={hasil.bintang} />
              <Teks warna={W.kertas}>{durasiTeks(hasil.durasi_detik)}</Teks>
            </View>
          </View>
        ) : null}
        <Tombol label={hasil ? 'MAIN LAGI' : 'MAINKAN'} onPress={() => router.push(`/kasus/${kasus.id}`)} testID="main-harian" />
        {hasil ? <Teks ukuran={14} warna={W.biruMuda}>Main lagi tidak menambah hadiah, tetapi waktu tercepatmu tetap dipakai di papan peringkat.</Teks> : null}
      </Kotak>

      <Kotak isi={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <Image source={A.ikon.streak} style={{ width: 54, height: 54 }} />
        <View style={{ flex: 1, gap: 4 }}>
          <Judul ukuran={13}>{`${st.streak} HARI`}</Judul>
          <Teks ukuran={15} warna={W.teksRedup}>{`Streak terpanjang ${st.streakTerpanjang} hari. Selesaikan minimal satu kasus atau latihan setiap hari.`}</Teks>
        </View>
      </Kotak>

      {bisaPulih ? (
        <Kotak warna={W.emasMuda} isi={{ gap: 8 }}>
          <Label warna={W.merahTua}>KASUS PEMULIHAN</Label>
          <Teks>Kemarin kamu tidak bermain. Selesaikan kasus harian kemarin untuk memulihkan streak.</Teks>
          <Tombol label={`PULIHKAN: ${harianUntuk(kemarin).judul.toUpperCase()}`} varian="merah" kecil onPress={() => router.push({ pathname: '/kasus/[id]', params: { id: harianUntuk(kemarin).id, mode: 'pemulihan' } })} testID="pemulihan" />
        </Kotak>
      ) : null}

      <JudulBagian>PAPAN PERINGKAT KELAS</JudulBagian>
      {kelas.length === 0 ? (
        <Kotak isi={{ gap: 8 }}>
          <Teks>Gabung ke kelas gurumu untuk melihat peringkat Kasus Harian bersama teman sekelas.</Teks>
          <Tombol label="GABUNG KELAS" kecil varian="navy" onPress={() => router.navigate('/kelas')} />
        </Kotak>
      ) : (
        <>
          {kelas.length > 1 ? (
            <Tab pilihan={kelas.map((k) => ({ kode: String(k.id_kelas), label: k.nama_kelas.toUpperCase() }))} nilai={String(idKelas)} ubah={(k) => setPilihKelas(Number(k))} gelap />
          ) : null}
          {galat ? <Pesan teks={galat} jenis="galat" /> : null}
          <Kotak isi={{ gap: 8 }}>
            {!papan ? (
              <Teks warna={W.teksRedup}>Memuat peringkat...</Teks>
            ) : papan.daftar.length === 0 ? (
              <Teks warna={W.teksRedup}>Belum ada yang menyelesaikan kasus hari ini. Jadilah yang pertama.</Teks>
            ) : (
              papan.daftar.map((x) => (
                <View key={x.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: x.id === s.pengguna.id ? W.emasMuda : 'transparent', padding: 4 }}>
                  <Judul ukuran={11} warna={x.peringkat <= 3 ? W.emasTua : W.abu3} style={{ width: 30 }}>{`${x.peringkat}`}</Judul>
                  <Image source={AVATAR[x.avatar] ?? AVATAR.pemain_01} style={{ width: 36, height: 36 }} />
                  <Teks style={{ flex: 1 }} garis={1}>{x.nama}</Teks>
                  <Bintang jumlah={x.bintang} ukuran={14} />
                  <Teks ukuran={15} warna={W.teksRedup}>{durasiTeks(x.durasi_detik)}</Teks>
                </View>
              ))
            )}
            {papan ? <Teks ukuran={14} warna={W.abu3}>{`${papan.daftar.length} dari ${papan.jumlah_anggota} siswa sudah selesai. Urutan: bintang, lalu waktu tercepat.`}</Teks> : null}
          </Kotak>
        </>
      )}
    </Layar>
  );
}
