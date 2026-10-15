/* Detail satu siswa untuk guru: statistik, progres kasus, konsep, dan riwayat query. */
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { A, AVATAR } from '../../aset';
import { api } from '../../api/klien';
import { HudKasus, Layar } from '../../komponen/layar';
import { Bilah, Bintang, Ikon, Judul, Kode, Kotak, Label, Lembar, Memuat, Pesan, Teks, Tombol } from '../../komponen/ui';
import { BERKAS, PANGKAT } from '../../konten';
import { useToko } from '../../data/toko';
import { durasiTeks, tanggalSingkat, waktuSingkat } from '../../permainan/waktu';
import { LEBAR_GURU, NAMA_KONSEP, W } from '../../tema';

type Detail = {
  siswa: { id: number; nama: string; email: string; avatar: string; penempatan: number | null };
  statistik: { xp: number; koin: number; pangkat: string; streak_saat_ini: number; streak_terpanjang: number; terakhir_aktif: string | null; lencana: string[] };
  progres: { id_kasus: string; judul: string; konsep: string; status: string; bintang: number; jumlah_percobaan: number; petunjuk_dipakai: number; salah_tuduh: number; durasi_detik: number | null; selesai_pada: string | null }[];
  konsep: { konsep: string; total: number; salah: number; persen_salah: number }[];
  riwayat: { teks_query: string; hasil_benar: boolean; jenis_error: string | null; pesan_error: string | null; konsep: string | null; id_kasus: string | null; dijalankan_pada: string }[];
};

export default function DetailSiswa() {
  const { kelas, siswa } = useLocalSearchParams<{ kelas: string; siswa: string }>();
  const token = useToko((k) => k.token);
  const [d, setD] = useState<Detail | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [yakin, setYakin] = useState(false);

  useEffect(() => {
    api<Detail>(`/api/guru/kelas/${kelas}/siswa/${siswa}`, { token }).then(setD, (e) => setGalat(e?.message ?? 'Gagal memuat.'));
  }, [kelas, siswa]);

  const kembali = () => router.replace(`/guru/kelas/${kelas}`);
  if (!d) {
    return (
      <Layar lebar={LEBAR_GURU} atas={<HudKasus label="DETAIL SISWA" judul="Memuat" kembali={kembali} />}>
        {galat ? <Pesan teks={galat} jenis="galat" /> : <Memuat />}
      </Layar>
    );
  }
  const pangkat = PANGKAT.find((p) => p.kode === d.statistik.pangkat);
  return (
    <Layar lebar={LEBAR_GURU} atas={<HudKasus label="DETAIL SISWA" judul={d.siswa.nama} kembali={kembali} />}>
      <Kotak warna={W.tinta} tepi={W.kertas} isi={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, alignItems: 'center' }}>
        <Image source={AVATAR[d.siswa.avatar] ?? AVATAR.pemain_01} style={{ width: 72, height: 72 }} />
        <View style={{ flexGrow: 1, flexBasis: 200, gap: 4 }}>
          <Judul ukuran={12} warna={W.kertas}>{d.siswa.nama.toUpperCase()}</Judul>
          <Teks ukuran={15} warna={W.biruMuda}>{d.siswa.email}</Teks>
          <Teks ukuran={15} warna={W.biruMuda}>{`Tes penempatan: ${d.siswa.penempatan === null ? 'belum' : `mulai dari Berkas ${BERKAS[d.siswa.penempatan]?.nomor ?? 1}`}`}</Teks>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ikon src={A.pangkat[d.statistik.pangkat]} ukuran={36} />
          <View>
            <Judul ukuran={8} warna={W.emas}>{pangkat?.nama.toUpperCase()}</Judul>
            <Teks warna={W.kertas}>{`${d.statistik.xp} XP · streak ${d.statistik.streak_saat_ini} hari`}</Teks>
            <Teks ukuran={14} warna={W.biruMuda}>{`Terakhir aktif: ${tanggalSingkat(d.statistik.terakhir_aktif)}`}</Teks>
          </View>
        </View>
      </Kotak>

      <Kotak isi={{ gap: 10 }}>
        <Label>KETEPATAN PER KONSEP</Label>
        {d.konsep.length === 0 ? <Teks warna={W.teksRedup}>Belum ada query.</Teks> : null}
        {d.konsep.map((k) => (
          <View key={k.konsep} style={{ gap: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Judul ukuran={9}>{NAMA_KONSEP[k.konsep] ?? k.konsep}</Judul>
              <Teks ukuran={15}>{`${k.persen_salah}% salah dari ${k.total} query`}</Teks>
            </View>
            <Bilah nilai={k.persen_salah / 100} warna={k.persen_salah >= 60 ? W.merah : k.persen_salah >= 35 ? W.oranye : W.hijau} latar={W.abu1} tinggi={14} />
          </View>
        ))}
      </Kotak>

      <Kotak isi={{ gap: 8 }}>
        <Label>PROGRES KASUS</Label>
        {d.progres.length === 0 ? <Teks warna={W.teksRedup}>Belum memainkan kasus.</Teks> : null}
        {d.progres.map((p) => (
          <View key={p.id_kasus} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center', borderTopWidth: 2, borderColor: W.abu1, paddingTop: 6 }}>
            <View style={{ flexGrow: 1, flexBasis: 200 }}>
              <Teks tebal>{p.judul}</Teks>
              <Teks ukuran={14} warna={W.teksRedup}>
                {`${p.status === 'selesai' ? 'Selesai' : 'Belum selesai'} · ${p.jumlah_percobaan} percobaan · ${p.petunjuk_dipakai} petunjuk · ${p.salah_tuduh} salah tuduh · waktu terbaik ${durasiTeks(p.durasi_detik)}`}
              </Teks>
            </View>
            {p.status === 'selesai' ? <Bintang jumlah={p.bintang} ukuran={16} /> : null}
          </View>
        ))}
      </Kotak>

      <Kotak isi={{ gap: 8 }}>
        <Label>40 QUERY TERAKHIR</Label>
        {d.riwayat.length === 0 ? <Teks warna={W.teksRedup}>Belum ada query.</Teks> : null}
        {d.riwayat.map((r, i) => (
          <View key={i} style={{ borderLeftWidth: 6, borderColor: r.hasil_benar ? W.hijau : W.merah, paddingLeft: 8, gap: 2 }}>
            <Kode ukuran={20} warna={W.tinta} pilih>{r.teks_query}</Kode>
            <Teks ukuran={14} warna={W.teksRedup}>{`${waktuSingkat(r.dijalankan_pada)} · ${r.konsep ? NAMA_KONSEP[r.konsep] ?? r.konsep : '-'} · ${r.hasil_benar ? 'benar' : r.pesan_error ?? 'salah'}`}</Teks>
          </View>
        ))}
      </Kotak>
      <Tombol kecil varian="merah" label="KELUARKAN DARI KELAS" onPress={() => setYakin(true)} style={{ alignSelf: 'flex-start' }} />
      <Lembar terbuka={yakin} tutup={() => setYakin(false)} judul="KELUARKAN SISWA">
        <Teks>{`Keluarkan ${d.siswa.nama} dari kelas? Akun dan progresnya tetap ada, dan ia bisa bergabung lagi dengan kode kelas.`}</Teks>
        <Tombol
          label="YA, KELUARKAN"
          varian="merah"
          onPress={async () => {
            setYakin(false);
            try {
              await api(`/api/guru/kelas/${kelas}/anggota/${siswa}`, { metode: 'DELETE', token });
              kembali();
            } catch (e: any) {
              setGalat(e?.message ?? 'Gagal.');
            }
          }}
        />
      </Lembar>
    </Layar>
  );
}
