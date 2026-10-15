/* Tab Kelas: siswa bergabung dan melihat tugas, guru mengelola kelas. */
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';

import { A } from '../../aset';
import { api } from '../../api/klien';
import { HudPemain, JudulBagian, Layar } from '../../komponen/layar';
import { Bintang, Isian, Judul, Kode, Kotak, Label, Lembar, Pesan, Teks, Tombol } from '../../komponen/ui';
import { KelasSiswa, Tugas, gabungKelas, keluarKelas, muatKelas, useToko } from '../../data/toko';
import { sisaWaktu, waktuSingkat } from '../../permainan/waktu';
import { LEBAR_GURU, NAMA_KONSEP, W } from '../../tema';

export default function Kelas() {
  const peran = useToko((k) => k.s?.pengguna.peran);
  return peran === 'guru' ? <KelasGuru /> : <KelasSiswaLayar />;
}

function StatusTugas({ t }: { t: Tugas }) {
  const [label, warna] = t.selesai
    ? t.terlambat
      ? ['SELESAI TERLAMBAT', W.oranye]
      : ['SELESAI', W.hijau]
    : t.lewat_tenggat
      ? ['LEWAT TENGGAT', W.merah]
      : ['BELUM', W.biru];
  return (
    <View style={{ backgroundColor: warna, borderWidth: 2, borderColor: W.tinta, paddingHorizontal: 6, paddingVertical: 3, alignSelf: 'flex-start' }}>
      <Judul ukuran={7} warna={W.kertas}>{label}</Judul>
    </View>
  );
}

function KelasSiswaLayar() {
  const s = useToko((k) => k.s)!;
  const [kode, setKode] = useState('');
  const [pesan, setPesan] = useState<{ teks: string; jenis: 'galat' | 'sukses' | 'info' } | null>(null);
  const [proses, setProses] = useState(false);
  const [keluarDari, setKeluarDari] = useState<KelasSiswa | null>(null);
  const kelas = s.kelas;

  useFocusEffect(
    useCallback(() => {
      muatKelas().catch(() => {});
    }, []),
  );

  const gabung = async () => {
    if (!kode.trim()) return setPesan({ teks: 'Masukkan kode kelas dari gurumu.', jenis: 'galat' });
    setProses(true);
    setPesan(null);
    try {
      const r = await gabungKelas(kode.trim());
      setKode('');
      setPesan({ teks: r.sudah ? `Kamu sudah menjadi anggota ${r.nama_kelas}.` : `Berhasil bergabung ke ${r.nama_kelas}.`, jenis: 'sukses' });
    } catch (e: any) {
      setPesan({ teks: e?.message ?? 'Gagal bergabung.', jenis: 'galat' });
    } finally {
      setProses(false);
    }
  };

  return (
    <Layar latar={A.latar.papan} atas={<HudPemain />} segarkan={muatKelas}>
      <Kotak isi={{ gap: 10 }}>
        <Label>GABUNG KELAS</Label>
        <Isian value={kode} onChangeText={(t) => setKode(t.toUpperCase())} placeholder="Kode kelas, misalnya K7RPL2" autoCapitalize="characters" maxLength={12} onSubmitEditing={gabung} testID="isian-kode-kelas" />
        {pesan ? <Pesan teks={pesan.teks} jenis={pesan.jenis} /> : null}
        <Tombol label="GABUNG" kecil onPress={gabung} memuat={proses} testID="tombol-gabung" />
      </Kotak>
      {kelas === null ? (
        <Kotak>
          <Teks>Daftar kelas akan muncul saat terhubung ke internet.</Teks>
        </Kotak>
      ) : kelas.length === 0 ? (
        <Kotak>
          <Teks>Kamu belum bergabung ke kelas mana pun. Minta kode kelas dari gurumu.</Teks>
        </Kotak>
      ) : (
        kelas.map((c) => (
          <Kotak key={c.id_kelas} warna={W.kertas} isi={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ flex: 1, gap: 4 }}>
                <Judul ukuran={12}>{c.nama_kelas.toUpperCase()}</Judul>
                <Teks ukuran={15} warna={W.teksRedup}>{`Guru: ${c.guru}`}</Teks>
              </View>
              <Pressable onPress={() => setKeluarDari(c)} accessibilityRole="button" accessibilityLabel={`Keluar dari ${c.nama_kelas}`}>
                <Judul ukuran={7} warna={W.merah}>KELUAR</Judul>
              </Pressable>
            </View>
            <Label>TUGAS</Label>
            {c.tugas.length === 0 ? <Teks ukuran={15} warna={W.teksRedup}>Belum ada tugas.</Teks> : null}
            {c.tugas.map((t) => (
              <View key={t.id_tugas} style={{ borderWidth: 3, borderColor: W.tinta, backgroundColor: W.kertasPutih, padding: 10, gap: 6 }}>
                <StatusTugas t={t} />
                <Teks tebal>{t.judul}</Teks>
                <Teks ukuran={15} warna={W.teksRedup}>{`${NAMA_KONSEP[t.konsep] ?? t.konsep} · tenggat ${waktuSingkat(t.tenggat)}${t.selesai ? '' : ` (${sisaWaktu(t.tenggat)})`}`}</Teks>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  {t.selesai ? <Bintang jumlah={t.bintang} ukuran={18} /> : <View />}
                  <Tombol kecil label={t.selesai ? 'ULANGI' : 'KERJAKAN'} varian={t.selesai ? 'navy' : 'emas'} onPress={() => router.push(`/kasus/${t.id_kasus}`)} testID={'tugas-' + t.id_kasus} />
                </View>
              </View>
            ))}
            {c.kasus_guru.length ? (
              <>
                <Label>KASUS DARI GURU</Label>
                {c.kasus_guru.map((k) => (
                  <View key={k.id_kasus} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: 2, borderColor: W.abu1, paddingTop: 8 }}>
                    <View style={{ flex: 1 }}>
                      <Teks tebal>{k.judul}</Teks>
                      <Teks ukuran={14} warna={W.teksRedup}>{`${NAMA_KONSEP[k.konsep] ?? k.konsep} · ${k.jumlah_langkah} langkah`}</Teks>
                    </View>
                    {s.progres[k.id_kasus]?.status === 'selesai' ? <Bintang jumlah={s.progres[k.id_kasus].bintang} ukuran={16} /> : null}
                    <Tombol kecil label="MAINKAN" onPress={() => router.push(`/kasus/${k.id_kasus}`)} />
                  </View>
                ))}
              </>
            ) : null}
          </Kotak>
        ))
      )}
      <Lembar terbuka={!!keluarDari} tutup={() => setKeluarDari(null)} judul="KELUAR DARI KELAS">
        <Teks>{`Keluar dari ${keluarDari?.nama_kelas}? Tugas dan peringkat kelas ini tidak akan terlihat lagi. Progresmu tetap tersimpan.`}</Teks>
        <Tombol
          label="YA, KELUAR"
          varian="merah"
          onPress={async () => {
            const c = keluarDari;
            setKeluarDari(null);
            if (c) await keluarKelas(c.id_kelas).catch((e) => setPesan({ teks: e?.message ?? 'Gagal keluar.', jenis: 'galat' }));
          }}
        />
      </Lembar>
    </Layar>
  );
}

type KelasRingkas = { id_kelas: number; nama_kelas: string; kode_kelas: string; jumlah_siswa: number; jumlah_tugas: number };

function KelasGuru() {
  const token = useToko((k) => k.token);
  const nama = useToko((k) => k.s?.pengguna.nama);
  const [daftar, setDaftar] = useState<KelasRingkas[] | null>(null);
  const [baru, setBaru] = useState('');
  const [pesan, setPesan] = useState<{ teks: string; jenis: 'galat' | 'sukses' } | null>(null);
  const [proses, setProses] = useState(false);

  const muat = useCallback(async () => {
    try {
      setDaftar(await api<KelasRingkas[]>('/api/guru/kelas', { token }));
    } catch (e: any) {
      setPesan({ teks: e?.message ?? 'Gagal memuat kelas.', jenis: 'galat' });
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      muat();
    }, [muat]),
  );

  const buat = async () => {
    if (!baru.trim()) return setPesan({ teks: 'Isi nama kelas dulu, misalnya XI RPL 1.', jenis: 'galat' });
    setProses(true);
    try {
      const k = await api<KelasRingkas>('/api/guru/kelas', { isi: { nama_kelas: baru }, token });
      setBaru('');
      setPesan({ teks: `Kelas ${k.nama_kelas} dibuat. Bagikan kode ${k.kode_kelas} kepada siswa.`, jenis: 'sukses' });
      await muat();
    } catch (e: any) {
      setPesan({ teks: e?.message ?? 'Gagal membuat kelas.', jenis: 'galat' });
    } finally {
      setProses(false);
    }
  };

  return (
    <Layar warna={W.malam} lebar={LEBAR_GURU} segarkan={muat}>
      <View style={{ gap: 6 }}>
        <Judul ukuran={14} warna={W.emas}>MODE KELAS</Judul>
        <Teks warna={W.kertas}>{`Selamat datang, ${nama}. Buat kelas, bagikan kodenya, lalu pantau perkembangan siswa di sini.`}</Teks>
      </View>
      <Kotak isi={{ gap: 10 }}>
        <Label>BUAT KELAS BARU</Label>
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <View style={{ flex: 1, minWidth: 220 }}>
            <Isian value={baru} onChangeText={setBaru} placeholder="Nama kelas, misalnya XI RPL 1" autoCapitalize="words" maxLength={80} onSubmitEditing={buat} testID="isian-kelas-baru" />
          </View>
          <Tombol label="BUAT KELAS" onPress={buat} memuat={proses} testID="tombol-buat-kelas" />
        </View>
        {pesan ? <Pesan teks={pesan.teks} jenis={pesan.jenis} onTutup={() => setPesan(null)} /> : null}
      </Kotak>
      <JudulBagian>KELAS SAYA</JudulBagian>
      {daftar === null ? <Teks warna={W.kertas}>Memuat...</Teks> : null}
      {daftar?.length === 0 ? <Teks warna={W.kertas}>Belum ada kelas.</Teks> : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
        {daftar?.map((k) => (
          <Pressable key={k.id_kelas} onPress={() => router.push(`/guru/kelas/${k.id_kelas}`)} accessibilityRole="button" accessibilityLabel={`Buka kelas ${k.nama_kelas}`} style={{ flexGrow: 1, flexBasis: 300, maxWidth: 480 }} testID={'kelas-' + k.id_kelas}>
            <Kotak warna={W.kertas} isi={{ gap: 8 }}>
              <Judul ukuran={12}>{k.nama_kelas.toUpperCase()}</Judul>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Label>KODE</Label>
                <Kode ukuran={30} warna={W.merah} pilih>{k.kode_kelas}</Kode>
              </View>
              <Teks ukuran={15} warna={W.teksRedup}>{`${k.jumlah_siswa} siswa · ${k.jumlah_tugas} tugas`}</Teks>
              <Judul ukuran={8} warna={W.biru}>BUKA DASBOR KELAS</Judul>
            </Kotak>
          </Pressable>
        ))}
      </View>
    </Layar>
  );
}
