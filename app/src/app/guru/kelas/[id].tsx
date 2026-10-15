/* Dasbor kelas untuk guru: siswa, tugas, rekap konsep, peringkat harian, dan pengaturan kelas. */
import { Image } from 'expo-image';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Platform, Pressable, Share, View } from 'react-native';

import { AVATAR } from '../../../aset';
import { api, unduhTeks } from '../../../api/klien';
import { HudKasus, JudulBagian, Layar } from '../../../komponen/layar';
import { Bilah, Bintang, Isian, Judul, Kode, Kotak, Label, Lembar, Memuat, Pesan, Tab, Teks, Tombol } from '../../../komponen/ui';
import { BERKAS } from '../../../konten';
import { useToko } from '../../../data/toko';
import { durasiTeks, geserTanggal, sisaWaktu, tanggalSingkat, tanggalWIB, waktuSingkat } from '../../../permainan/waktu';
import { LEBAR_GURU, NAMA_KONSEP, W } from '../../../tema';

type Anggota = {
  id: number; nama: string; email: string; avatar: string; xp: number; pangkat: string; streak: number; terakhir_aktif: string | null;
  kasus_selesai: number; rata_bintang: number; jumlah_query: number; persen_salah: number; tugas_selesai: number;
  konsep_lemah: string | null; perlu_perhatian: string[];
};
type TugasGuru = { id_tugas: number; id_kasus: string; judul: string; konsep: string; tenggat: string; selesai: number; terlambat: number; belum: number; siswa_belum: string[] };
type Rekap = { konsep: string; total: number; salah: number; persen_salah: number; jumlah_siswa_salah: number; kesalahan_umum: { jenis: string; nama: string; jumlah: number }[] };
type Detail = {
  kelas: { id_kelas: number; nama_kelas: string; kode_kelas: string };
  anggota: Anggota[];
  tugas: TugasGuru[];
  rekap_konsep: Rekap[];
  kasus_sulit: { id_kasus: string; judul: string; konsep: string; rata_percobaan: number; salah_tuduh: number; selesai: number; dimainkan: number }[];
  peringkat_harian: { judul: string; jumlah_anggota: number; daftar: { peringkat: number; id: number; nama: string; avatar: string; durasi_detik: number; bintang: number }[] };
};
type PilihanKasus = { bawaan: { id_kasus: string; judul: string; konsep: string; berkas: number }[]; buatan: { id_kasus: string; judul: string; konsep: string }[] };

export default function DasborKelas() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const token = useToko((k) => k.token);
  const [d, setD] = useState<Detail | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [tab, setTab] = useState<'siswa' | 'tugas' | 'rekap' | 'peringkat' | 'atur'>('siswa');
  const [pesan, setPesan] = useState<{ teks: string; jenis: 'galat' | 'sukses' | 'info' } | null>(null);

  const muat = useCallback(async () => {
    try {
      setD(await api<Detail>(`/api/guru/kelas/${id}`, { token }));
      setGalat(null);
    } catch (e: any) {
      setGalat(e?.message ?? 'Gagal memuat kelas.');
    }
  }, [id, token]);

  useFocusEffect(
    useCallback(() => {
      muat();
    }, [muat]),
  );

  if (!d) {
    return (
      <Layar lebar={LEBAR_GURU} atas={<HudKasus label="MODE KELAS" judul="Dasbor kelas" kembali={() => router.replace('/kelas')} />}>
        {galat ? <Pesan teks={galat} jenis="galat" /> : <Memuat />}
      </Layar>
    );
  }
  const perhatian = d.anggota.filter((a) => a.perlu_perhatian.length);
  return (
    <Layar lebar={LEBAR_GURU} segarkan={muat} atas={<HudKasus label="MODE KELAS" judul={d.kelas.nama_kelas} kembali={() => router.replace('/kelas')} />}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        <Kartu label="KODE KELAS" nilai={d.kelas.kode_kelas} warna={W.merah} />
        <Kartu label="SISWA" nilai={String(d.anggota.length)} />
        <Kartu label="PERLU PERHATIAN" nilai={String(perhatian.length)} warna={perhatian.length ? W.oranye : W.hijauTua} />
        <Kartu label="TUGAS" nilai={String(d.tugas.length)} />
      </View>
      {pesan ? <Pesan teks={pesan.teks} jenis={pesan.jenis} onTutup={() => setPesan(null)} /> : null}
      <Tab
        gelap
        pilihan={[
          { kode: 'siswa', label: 'SISWA' },
          { kode: 'tugas', label: 'TUGAS' },
          { kode: 'rekap', label: 'REKAP' },
          { kode: 'peringkat', label: 'PERINGKAT' },
          { kode: 'atur', label: 'ATUR' },
        ]}
        nilai={tab}
        ubah={setTab}
      />
      {tab === 'siswa' ? <TabSiswa d={d} /> : null}
      {tab === 'tugas' ? <TabTugas d={d} muat={muat} setPesan={setPesan} /> : null}
      {tab === 'rekap' ? <TabRekap d={d} setPesan={setPesan} /> : null}
      {tab === 'peringkat' ? <TabPeringkat d={d} /> : null}
      {tab === 'atur' ? <TabAtur d={d} muat={muat} setPesan={setPesan} /> : null}
    </Layar>
  );
}

function Kartu({ label, nilai, warna = W.tinta }: { label: string; nilai: string; warna?: string }) {
  return (
    <View style={{ flexGrow: 1, flexBasis: 150, backgroundColor: W.kertas, borderWidth: 3, borderColor: W.tinta, padding: 10, gap: 4 }}>
      <Judul ukuran={7} warna={W.biru}>{label}</Judul>
      <Kode ukuran={30} warna={warna} pilih>{nilai}</Kode>
    </View>
  );
}

function TabSiswa({ d }: { d: Detail }) {
  if (!d.anggota.length) {
    return (
      <Kotak isi={{ gap: 8 }}>
        <Teks>{`Belum ada siswa. Bagikan kode kelas ${d.kelas.kode_kelas}. Siswa memasukkannya saat mendaftar atau di menu Kelas.`}</Teks>
      </Kotak>
    );
  }
  const urut = [...d.anggota].sort((a, b) => b.perlu_perhatian.length - a.perlu_perhatian.length || a.nama.localeCompare(b.nama));
  return (
    <View style={{ gap: 10 }}>
      <Teks warna={W.biruMuda} ukuran={15}>Siswa yang perlu perhatian ditampilkan paling atas. Ketuk nama siswa untuk melihat riwayat query-nya.</Teks>
      {urut.map((a) => (
        <Pressable key={a.id} onPress={() => router.push({ pathname: '/guru/siswa', params: { kelas: String(d.kelas.id_kelas), siswa: String(a.id) } })} accessibilityRole="button" accessibilityLabel={`Detail ${a.nama}`}>
          <View style={{ backgroundColor: W.kertas, borderWidth: 3, borderColor: a.perlu_perhatian.length ? W.oranye : W.tinta, padding: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
            <Image source={AVATAR[a.avatar] ?? AVATAR.pemain_01} style={{ width: 48, height: 48 }} />
            <View style={{ flexGrow: 1, flexBasis: 180, gap: 2 }}>
              <Teks tebal>{a.nama}</Teks>
              <Teks ukuran={14} warna={W.teksRedup}>{`${a.xp} XP · streak ${a.streak} · terakhir aktif ${tanggalSingkat(a.terakhir_aktif)}`}</Teks>
              {a.perlu_perhatian.map((p) => (
                <Teks key={p} ukuran={14} warna={W.merahTua}>{'! ' + p}</Teks>
              ))}
            </View>
            <Angka label="KASUS" nilai={String(a.kasus_selesai)} />
            <Angka label="BINTANG" nilai={a.rata_bintang ? String(a.rata_bintang) : '-'} />
            <Angka label="QUERY SALAH" nilai={a.jumlah_query ? `${a.persen_salah}%` : '-'} warna={a.persen_salah >= 60 ? W.merah : W.tinta} />
            <Angka label="TUGAS" nilai={`${a.tugas_selesai}/${d.tugas.length}`} />
            <Angka label="KONSEP LEMAH" nilai={a.konsep_lemah ? NAMA_KONSEP[a.konsep_lemah] ?? a.konsep_lemah : '-'} />
          </View>
        </Pressable>
      ))}
    </View>
  );
}

function Angka({ label, nilai, warna = W.tinta }: { label: string; nilai: string; warna?: string }) {
  return (
    <View style={{ minWidth: 76, gap: 2 }}>
      <Judul ukuran={6} warna={W.biru}>{label}</Judul>
      <Kode ukuran={24} warna={warna}>{nilai}</Kode>
    </View>
  );
}

function TabTugas({ d, muat, setPesan }: { d: Detail; muat: () => Promise<void>; setPesan: (p: any) => void }) {
  const token = useToko((k) => k.token);
  const [buka, setBuka] = useState(false);
  const [pilihan, setPilihan] = useState<PilihanKasus | null>(null);
  const [kasus, setKasus] = useState<string | null>(null);
  const [hari, setHari] = useState(3);
  const [jam, setJam] = useState('23:59');
  const [proses, setProses] = useState(false);

  const bukaLembar = async () => {
    setBuka(true);
    if (!pilihan) {
      try {
        setPilihan(await api<PilihanKasus>('/api/guru/daftar-kasus', { token }));
      } catch (e: any) {
        setPesan({ teks: e?.message ?? 'Gagal memuat daftar kasus.', jenis: 'galat' });
      }
    }
  };

  const tenggatIso = () => {
    const [h, m] = (jam.match(/^(\d{1,2})[:.](\d{2})$/) ? jam.split(/[:.]/) : ['23', '59']).map(Number);
    const tgl = geserTanggal(tanggalWIB(), hari);
    const utc = Date.parse(`${tgl}T${String(Math.min(h, 23)).padStart(2, '0')}:${String(Math.min(m, 59)).padStart(2, '0')}:00+07:00`);
    return new Date(utc).toISOString();
  };

  const simpan = async () => {
    if (!kasus) return setPesan({ teks: 'Pilih kasus untuk tugas ini.', jenis: 'galat' });
    setProses(true);
    try {
      await api(`/api/guru/kelas/${d.kelas.id_kelas}/tugas`, { isi: { id_kasus: kasus, tenggat: tenggatIso() }, token });
      setBuka(false);
      setKasus(null);
      setPesan({ teks: 'Tugas dibuat dan langsung terlihat oleh siswa.', jenis: 'sukses' });
      await muat();
    } catch (e: any) {
      setPesan({ teks: e?.message ?? 'Gagal membuat tugas.', jenis: 'galat' });
    } finally {
      setProses(false);
    }
  };

  const hapus = async (t: TugasGuru) => {
    try {
      await api(`/api/guru/tugas/${t.id_tugas}`, { metode: 'DELETE', token });
      await muat();
    } catch (e: any) {
      setPesan({ teks: e?.message ?? 'Gagal menghapus tugas.', jenis: 'galat' });
    }
  };

  const n = d.anggota.length;
  return (
    <View style={{ gap: 12 }}>
      <Tombol label="+ TUGAS BARU" onPress={bukaLembar} testID="tugas-baru" style={{ alignSelf: 'flex-start' }} />
      {d.tugas.length === 0 ? <Teks warna={W.kertas}>Belum ada tugas.</Teks> : null}
      {d.tugas.map((t) => (
        <Kotak key={t.id_tugas} warna={W.kertas} isi={{ gap: 8 }}>
          <Label>{`${NAMA_KONSEP[t.konsep] ?? t.konsep} · TENGGAT ${waktuSingkat(t.tenggat).toUpperCase()} (${sisaWaktu(t.tenggat).toUpperCase()})`}</Label>
          <Judul ukuran={11}>{t.judul.toUpperCase()}</Judul>
          <Bilah nilai={n ? t.selesai / n : 0} warna={W.hijau} latar={W.abu1} tinggi={16} />
          <Teks ukuran={15}>{`${t.selesai} dari ${n} siswa selesai${t.terlambat ? `, ${t.terlambat} terlambat` : ''}.`}</Teks>
          {t.siswa_belum.length ? <Teks ukuran={14} warna={W.teksRedup}>{`Belum: ${t.siswa_belum.join(', ')}`}</Teks> : null}
          <Tombol kecil varian="merah" label="HAPUS TUGAS" onPress={() => hapus(t)} style={{ alignSelf: 'flex-start' }} />
        </Kotak>
      ))}
      <Lembar terbuka={buka} tutup={() => setBuka(false)} judul="TUGAS BARU" lebar={640}>
        <Label>PILIH KASUS</Label>
        {!pilihan ? <Memuat gelap={false} /> : null}
        {pilihan?.buatan.length ? <Teks tebal>Kasus buatan sendiri</Teks> : null}
        {pilihan?.buatan.map((k) => <PilihKasus key={k.id_kasus} judul={k.judul} info={NAMA_KONSEP[k.konsep]} aktif={kasus === k.id_kasus} pilih={() => setKasus(k.id_kasus)} />)}
        {BERKAS.map((b) => (
          <View key={b.nomor} style={{ gap: 6 }}>
            <Teks tebal>{`Berkas ${b.nomor}: ${b.judul}`}</Teks>
            {pilihan?.bawaan.filter((k) => k.berkas === b.nomor).map((k) => (
              <PilihKasus key={k.id_kasus} judul={k.judul} info={NAMA_KONSEP[k.konsep]} aktif={kasus === k.id_kasus} pilih={() => setKasus(k.id_kasus)} />
            ))}
          </View>
        ))}
        <Label>TENGGAT</Label>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {[
            { h: 0, l: 'HARI INI' },
            { h: 1, l: 'BESOK' },
            { h: 3, l: '3 HARI' },
            { h: 7, l: '1 MINGGU' },
            { h: 14, l: '2 MINGGU' },
          ].map((x) => (
            <Tombol key={x.h} kecil label={x.l} varian={hari === x.h ? 'emas' : 'kertas'} onPress={() => setHari(x.h)} />
          ))}
        </View>
        <Isian label="JAM (WIB)" value={jam} onChangeText={setJam} placeholder="23:59" maxLength={5} />
        <Teks ukuran={15} warna={W.teksRedup}>{`Tenggat: ${waktuSingkat(tenggatIso())} WIB`}</Teks>
        <Tombol label="SIMPAN TUGAS" onPress={simpan} memuat={proses} testID="simpan-tugas" />
      </Lembar>
    </View>
  );
}

function PilihKasus({ judul, info, aktif, pilih }: { judul: string; info: string; aktif: boolean; pilih: () => void }) {
  return (
    <Pressable onPress={pilih} accessibilityRole="radio" accessibilityState={{ checked: aktif }} accessibilityLabel={judul}>
      <View style={{ borderWidth: 3, borderColor: aktif ? W.emas : W.tinta, backgroundColor: aktif ? W.navy : W.kertasPutih, padding: 10, flexDirection: 'row', gap: 10 }}>
        <Teks warna={aktif ? W.kertas : W.tinta} style={{ flex: 1 }}>{judul}</Teks>
        <Teks ukuran={14} warna={aktif ? W.emas : W.biru}>{info}</Teks>
      </View>
    </Pressable>
  );
}

function TabRekap({ d, setPesan }: { d: Detail; setPesan: (p: any) => void }) {
  const token = useToko((k) => k.token);
  const unduh = async () => {
    try {
      const teks = await unduhTeks(`/api/guru/kelas/${d.kelas.id_kelas}/rekap.csv`, token!);
      const nama = `rekap_${d.kelas.nama_kelas.replace(/[^A-Za-z0-9]+/g, '_')}.csv`;
      if (Platform.OS === 'web') {
        const url = URL.createObjectURL(new Blob([teks], { type: 'text/csv;charset=utf-8' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = nama;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
      } else {
        await Share.share({ title: nama, message: teks });
      }
    } catch (e: any) {
      setPesan({ teks: e?.message ?? 'Gagal mengunduh rekap.', jenis: 'galat' });
    }
  };
  const ada = d.rekap_konsep.some((r) => r.total > 0);
  return (
    <View style={{ gap: 12 }}>
      <Kotak isi={{ gap: 12 }}>
        <Label>KONSEP YANG PALING SERING SALAH (60 HARI TERAKHIR)</Label>
        {!ada ? <Teks warna={W.teksRedup}>Belum ada query dari siswa di kelas ini.</Teks> : null}
        {d.rekap_konsep.map((r) => (
          <View key={r.konsep} style={{ gap: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
              <Judul ukuran={9}>{NAMA_KONSEP[r.konsep] ?? r.konsep}</Judul>
              <Teks ukuran={15}>{r.total ? `${r.persen_salah}% salah (${r.salah}/${r.total} query, ${r.jumlah_siswa_salah} siswa)` : 'belum ada data'}</Teks>
            </View>
            <Bilah nilai={r.persen_salah / 100} warna={r.persen_salah >= 60 ? W.merah : r.persen_salah >= 35 ? W.oranye : W.hijau} latar={W.abu1} tinggi={16} />
            {r.kesalahan_umum.length ? <Teks ukuran={14} warna={W.teksRedup}>{'Kesalahan umum: ' + r.kesalahan_umum.map((k) => `${k.nama} (${k.jumlah})`).join(', ')}</Teks> : null}
          </View>
        ))}
      </Kotak>
      <Kotak isi={{ gap: 8 }}>
        <Label>KASUS PALING MENANTANG</Label>
        {d.kasus_sulit.length === 0 ? <Teks warna={W.teksRedup}>Belum ada data.</Teks> : null}
        {d.kasus_sulit.map((k) => (
          <View key={k.id_kasus} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, borderTopWidth: 2, borderColor: W.abu1, paddingTop: 6 }}>
            <Teks tebal style={{ flexGrow: 1, flexBasis: 200 }}>{k.judul}</Teks>
            <Teks ukuran={15}>{`rata-rata ${k.rata_percobaan} percobaan · ${k.salah_tuduh} salah tuduh · ${k.selesai}/${k.dimainkan} selesai`}</Teks>
          </View>
        ))}
      </Kotak>
      <Tombol label={Platform.OS === 'web' ? 'UNDUH REKAP (CSV)' : 'BAGIKAN REKAP (CSV)'} varian="navy" onPress={unduh} style={{ alignSelf: 'flex-start' }} />
    </View>
  );
}

function TabPeringkat({ d }: { d: Detail }) {
  const p = d.peringkat_harian;
  return (
    <Kotak isi={{ gap: 8 }}>
      <Label>{`KASUS HARIAN HARI INI: ${p.judul.toUpperCase()}`}</Label>
      {p.daftar.length === 0 ? <Teks warna={W.teksRedup}>Belum ada siswa yang menyelesaikan kasus harian hari ini.</Teks> : null}
      {p.daftar.map((x) => (
        <View key={x.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Judul ukuran={11} warna={x.peringkat <= 3 ? W.emasTua : W.abu3} style={{ width: 30 }}>{String(x.peringkat)}</Judul>
          <Image source={AVATAR[x.avatar] ?? AVATAR.pemain_01} style={{ width: 36, height: 36 }} />
          <Teks style={{ flex: 1 }}>{x.nama}</Teks>
          <Bintang jumlah={x.bintang} ukuran={14} />
          <Teks ukuran={15} warna={W.teksRedup}>{durasiTeks(x.durasi_detik)}</Teks>
        </View>
      ))}
      <Teks ukuran={14} warna={W.abu3}>{`${p.daftar.length} dari ${p.jumlah_anggota} siswa sudah menyelesaikan.`}</Teks>
    </Kotak>
  );
}

function TabAtur({ d, muat, setPesan }: { d: Detail; muat: () => Promise<void>; setPesan: (p: any) => void }) {
  const token = useToko((k) => k.token);
  const [nama, setNama] = useState(d.kelas.nama_kelas);
  const [yakinHapus, setYakinHapus] = useState(false);
  const aksi = async (fn: () => Promise<unknown>, sukses: string) => {
    try {
      await fn();
      setPesan({ teks: sukses, jenis: 'sukses' });
      await muat();
    } catch (e: any) {
      setPesan({ teks: e?.message ?? 'Gagal.', jenis: 'galat' });
    }
  };
  return (
    <View style={{ gap: 12 }}>
      <Kotak isi={{ gap: 10 }}>
        <Isian label="NAMA KELAS" value={nama} onChangeText={setNama} maxLength={80} />
        <Tombol kecil label="SIMPAN NAMA" onPress={() => aksi(() => api(`/api/guru/kelas/${d.kelas.id_kelas}`, { metode: 'PATCH', isi: { nama_kelas: nama }, token }), 'Nama kelas disimpan.')} style={{ alignSelf: 'flex-start' }} />
      </Kotak>
      <Kotak isi={{ gap: 10 }}>
        <Teks>{`Kode kelas sekarang: ${d.kelas.kode_kelas}. Buat kode baru jika kode lama tersebar ke orang di luar kelas. Siswa yang sudah bergabung tetap menjadi anggota.`}</Teks>
        <Tombol kecil varian="navy" label="BUAT KODE BARU" onPress={() => aksi(() => api(`/api/guru/kelas/${d.kelas.id_kelas}/kode-baru`, { metode: 'POST', isi: {}, token }), 'Kode kelas baru dibuat.')} style={{ alignSelf: 'flex-start' }} />
      </Kotak>
      <Kotak isi={{ gap: 10 }}>
        <Teks>Menghapus kelas akan mengeluarkan semua siswa dan menghapus tugasnya. Progres siswa tetap tersimpan di akun masing-masing.</Teks>
        <Tombol kecil varian="merah" label="HAPUS KELAS" onPress={() => setYakinHapus(true)} style={{ alignSelf: 'flex-start' }} />
      </Kotak>
      <Lembar terbuka={yakinHapus} tutup={() => setYakinHapus(false)} judul="HAPUS KELAS">
        <Teks>{`Hapus kelas ${d.kelas.nama_kelas}? Tindakan ini tidak bisa dibatalkan.`}</Teks>
        <Tombol
          label="YA, HAPUS"
          varian="merah"
          onPress={async () => {
            setYakinHapus(false);
            try {
              await api(`/api/guru/kelas/${d.kelas.id_kelas}`, { metode: 'DELETE', token });
              router.replace('/kelas');
            } catch (e: any) {
              setPesan({ teks: e?.message ?? 'Gagal menghapus kelas.', jenis: 'galat' });
            }
          }}
        />
      </Lembar>
    </View>
  );
}
