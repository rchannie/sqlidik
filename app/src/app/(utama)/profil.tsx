/* Profil: pangkat, statistik, lencana, pengingat, sinkron, dan akun. */
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { A, AVATAR, AVATAR_PEMAIN } from '../../aset';
import { Pengaturan } from '../../komponen/pengaturan';
import { JudulBagian, Layar } from '../../komponen/layar';
import { Bilah, Ikon, Isian, Judul, Kotak, Label, Lembar, Pesan, Teks, Tombol } from '../../komponen/ui';
import { LENCANA, PANGKAT } from '../../konten';
import { PENGINGAT_DIDUKUNG } from '../../data/pengingat';
import { adaAntrian, aturPengingatHarian, keluar, sinkron, ubahProfil, useStatistik, useToko } from '../../data/toko';
import { waktuSingkat } from '../../permainan/waktu';
import { LEBAR_GURU, LEBAR_HP, W } from '../../tema';

export default function Profil() {
  const s = useToko((k) => k.s)!;
  const sink = useToko((k) => k.sinkron);
  const st = useStatistik()!;
  const guru = s.pengguna.peran === 'guru';
  const [ubahAvatar, setUbahAvatar] = useState(false);
  const [ubahNama, setUbahNama] = useState(false);
  const [nama, setNama] = useState(s.pengguna.nama);
  const [lencana, setLencana] = useState<string | null>(null);
  const [atur, setAtur] = useState(false);
  const [pesan, setPesan] = useState<{ teks: string; jenis: 'galat' | 'sukses' | 'info' } | null>(null);
  const [yakinKeluar, setYakinKeluar] = useState(false);
  const antrian = adaAntrian(s);
  const jarak = st.xpPangkatBerikut ? (st.xp - st.xpPangkatIni) / (st.xpPangkatBerikut - st.xpPangkatIni) : 1;

  const simpanNama = async () => {
    try {
      await ubahProfil({ nama });
      setUbahNama(false);
      setPesan({ teks: 'Nama disimpan.', jenis: 'sukses' });
    } catch (e: any) {
      setPesan({ teks: e?.message ?? 'Gagal menyimpan.', jenis: 'galat' });
    }
  };

  const aturJam = async (aktif: boolean, jam: number) => {
    const r = await aturPengingatHarian(aktif, (jam + 24) % 24, 0);
    setPesan(r.ok ? { teks: aktif ? `Pengingat aktif setiap pukul ${String((jam + 24) % 24).padStart(2, '0')}.00.` : 'Pengingat dimatikan.', jenis: 'sukses' } : { teks: r.pesan ?? 'Pengingat gagal diatur.', jenis: 'galat' });
  };

  return (
    <Layar latar={guru ? undefined : A.latar.papan} warna={W.malam} lebar={guru ? LEBAR_GURU : LEBAR_HP}>
      <View style={{ width: '100%', maxWidth: LEBAR_HP, alignSelf: 'center', gap: 16 }}>
        <Kotak warna={W.tinta} tepi={W.kertas} isi={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
          <Pressable disabled={guru} onPress={() => setUbahAvatar(true)} accessibilityLabel="Ganti avatar">
            <View style={{ borderWidth: 3, borderColor: W.emas, backgroundColor: W.kertas }}>
              <Image source={AVATAR[s.pengguna.avatar] ?? AVATAR.pemain_01} style={{ width: 84, height: 84 }} />
            </View>
          </Pressable>
          <View style={{ flex: 1, gap: 6 }}>
            <Judul ukuran={12} warna={W.kertas}>{s.pengguna.nama.toUpperCase()}</Judul>
            <Teks ukuran={15} warna={W.biruMuda}>{s.pengguna.email}</Teks>
            <Teks ukuran={15} warna={W.biruMuda}>{guru ? 'Guru' : 'Siswa'}{s.pengguna.sekolah ? ` · ${s.pengguna.sekolah}` : ''}</Teks>
            <Pressable onPress={() => { setNama(s.pengguna.nama); setUbahNama(true); }} accessibilityRole="button">
              <Judul ukuran={8} warna={W.emas}>UBAH NAMA</Judul>
            </Pressable>
          </View>
        </Kotak>
        {pesan ? <Pesan teks={pesan.teks} jenis={pesan.jenis} onTutup={() => setPesan(null)} /> : null}

        {!guru ? (
          <>
            <Kotak isi={{ gap: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Ikon src={A.pangkat[st.pangkat]} ukuran={44} />
                <View style={{ flex: 1, gap: 4 }}>
                  <Label>PANGKAT</Label>
                  <Judul ukuran={12}>{st.namaPangkat.toUpperCase()}</Judul>
                </View>
              </View>
              <Bilah nilai={jarak} warna={W.biru} latar={W.abu1} tinggi={16} />
              <Teks ukuran={15} warna={W.teksRedup}>
                {st.xpPangkatBerikut ? `${st.xp} XP. ${st.xpPangkatBerikut - st.xp} XP lagi menuju ${PANGKAT.find((p) => p.xp === st.xpPangkatBerikut)?.nama}.` : `${st.xp} XP. Pangkat tertinggi sudah tercapai.`}
              </Teks>
            </Kotak>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {[
                { ikon: A.ikon.kasus, label: 'KASUS SELESAI', nilai: st.kasusSelesai },
                { ikon: A.ikon.bintang, label: 'TOTAL BINTANG', nilai: st.totalBintang },
                { ikon: A.ikon.streak, label: 'STREAK', nilai: `${st.streak} HARI` },
                { ikon: A.ikon.streak, label: 'TERPANJANG', nilai: `${st.streakTerpanjang} HARI` },
                { ikon: A.dekor.bukti, label: 'BUKTI', nilai: st.bukti },
                { ikon: A.ikon.koin, label: 'KOIN', nilai: st.koin },
              ].map((x) => (
                <View key={x.label} style={{ width: '48%', backgroundColor: W.kertas, borderWidth: 3, borderColor: W.tinta, padding: 10, flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  <Ikon src={x.ikon} ukuran={28} />
                  <View style={{ flex: 1 }}>
                    <Judul ukuran={7} warna={W.biru}>{x.label}</Judul>
                    <Judul ukuran={11}>{String(x.nilai)}</Judul>
                  </View>
                </View>
              ))}
            </View>

            <JudulBagian>LENCANA</JudulBagian>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {LENCANA.map((l) => {
                const punya = st.lencana.includes(l.kode);
                return (
                  <Pressable key={l.kode} onPress={() => setLencana(l.kode)} accessibilityRole="button" accessibilityLabel={`${l.nama}${punya ? '' : ', belum didapat'}`} style={{ width: '31%' }}>
                    <View style={{ backgroundColor: punya ? W.navy : W.malam3, borderWidth: 3, borderColor: punya ? W.emas : W.abu3, alignItems: 'center', padding: 8, gap: 6, minHeight: 130 }}>
                      <Image source={A.lencana[l.kode]} style={{ width: 48, height: 63, opacity: punya ? 1 : 0.25 }} />
                      <Judul ukuran={7} warna={punya ? W.kertas : W.abu2} style={{ textAlign: 'center' }}>{l.nama.toUpperCase()}</Judul>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <JudulBagian>PENGINGAT HARIAN</JudulBagian>
            <Kotak isi={{ gap: 10 }}>
              {PENGINGAT_DIDUKUNG ? (
                <>
                  <Teks ukuran={16}>{s.pengingat.aktif ? `Aktif setiap pukul ${String(s.pengingat.jam).padStart(2, '0')}.00.` : 'Notifikasi untuk mengingatkan Kasus Harian di jam pilihanmu.'}</Teks>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Tombol kecil varian="navy" label="-1 JAM" onPress={() => aturJam(true, s.pengingat.jam - 1)} />
                    <Judul ukuran={14} style={{ flex: 1, textAlign: 'center' }}>{`${String(s.pengingat.jam).padStart(2, '0')}.00`}</Judul>
                    <Tombol kecil varian="navy" label="+1 JAM" onPress={() => aturJam(true, s.pengingat.jam + 1)} />
                  </View>
                  <Tombol kecil varian={s.pengingat.aktif ? 'kertas' : 'emas'} label={s.pengingat.aktif ? 'MATIKAN PENGINGAT' : 'AKTIFKAN PENGINGAT'} ikon={A.ikon.notifikasi} onPress={() => aturJam(!s.pengingat.aktif, s.pengingat.jam)} />
                </>
              ) : (
                <Teks ukuran={16}>Pengingat hanya tersedia di aplikasi Android.</Teks>
              )}
            </Kotak>

            <JudulBagian>SINKRON</JudulBagian>
            <Kotak isi={{ gap: 8 }}>
              <Teks ukuran={16}>
                {antrian ? 'Ada progres yang belum terkirim ke server. Progres tetap aman di perangkat ini.' : 'Semua progres sudah tersimpan di server.'}
              </Teks>
              {sink.terakhir ? <Teks ukuran={14} warna={W.abu3}>{`Terakhir sinkron: ${waktuSingkat(sink.terakhir)}`}</Teks> : null}
              {sink.galat ? <Teks ukuran={14} warna={W.merah}>{sink.galat}</Teks> : null}
              <Tombol kecil varian="navy" label="SINKRONKAN SEKARANG" memuat={sink.jalan} onPress={() => sinkron()} />
            </Kotak>
          </>
        ) : null}

        <Tombol label="PENGATURAN SERVER" varian="navy" kecil onPress={() => setAtur(true)} />
        <Tombol label="KELUAR" varian="merah" kecil onPress={() => setYakinKeluar(true)} testID="keluar" />
      </View>

      <Lembar terbuka={ubahAvatar} tutup={() => setUbahAvatar(false)} judul="PILIH AVATAR">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {AVATAR_PEMAIN.map((a) => (
            <Pressable
              key={a}
              onPress={async () => {
                setUbahAvatar(false);
                try {
                  await ubahProfil({ avatar: a });
                } catch (e: any) {
                  setPesan({ teks: e?.message ?? 'Gagal mengganti avatar.', jenis: 'galat' });
                }
              }}
              accessibilityLabel={'Avatar ' + a}
            >
              <View style={{ borderWidth: 3, borderColor: s.pengguna.avatar === a ? W.emas : W.tinta, backgroundColor: W.kertasPutih }}>
                <Image source={AVATAR[a]} style={{ width: 80, height: 80 }} />
              </View>
            </Pressable>
          ))}
        </View>
        <Teks ukuran={15} warna={W.teksRedup}>Mengganti avatar butuh koneksi internet.</Teks>
      </Lembar>
      <Lembar terbuka={ubahNama} tutup={() => setUbahNama(false)} judul="UBAH NAMA">
        <Isian label="NAMA" value={nama} onChangeText={setNama} maxLength={80} autoCapitalize="words" />
        <Tombol label="SIMPAN" onPress={simpanNama} />
      </Lembar>
      <Lembar terbuka={!!lencana} tutup={() => setLencana(null)} judul="LENCANA">
        {lencana ? (
          <View style={{ alignItems: 'center', gap: 10 }}>
            <Image source={A.lencana[lencana]} style={{ width: 80, height: 105, opacity: st.lencana.includes(lencana) ? 1 : 0.3 }} />
            <Judul ukuran={12}>{LENCANA.find((l) => l.kode === lencana)?.nama.toUpperCase()}</Judul>
            <Teks style={{ textAlign: 'center' }}>{LENCANA.find((l) => l.kode === lencana)?.syarat}</Teks>
            <Teks ukuran={15} warna={W.teksRedup}>
              {st.lencana.includes(lencana) ? (s.lencanaDidapat[lencana] ? `Didapat ${waktuSingkat(s.lencanaDidapat[lencana])}` : 'Sudah didapat.') : 'Belum didapat.'}
            </Teks>
          </View>
        ) : null}
      </Lembar>
      <Lembar terbuka={yakinKeluar} tutup={() => setYakinKeluar(false)} judul="KELUAR DARI AKUN">
        <Teks>{antrian ? 'Masih ada progres yang belum terkirim. Progres itu tetap tersimpan di perangkat ini dan akan dikirim saat kamu masuk lagi dengan akun yang sama.' : 'Progresmu sudah tersimpan di server.'}</Teks>
        <Tombol
          label="YA, KELUAR"
          varian="merah"
          testID="yakin-keluar"
          onPress={async () => {
            setYakinKeluar(false);
            await keluar();
            router.replace('/');
          }}
        />
      </Lembar>
      <Pengaturan terbuka={atur} tutup={() => setAtur(false)} />
    </Layar>
  );
}
