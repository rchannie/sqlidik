/* Penyunting kasus buatan guru. Server memeriksa skrip dan query kunci dengan SQLite sebelum disimpan. */
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import { AVATAR, AVATAR_TERSANGKA, NAMA_AVATAR } from '../../aset';
import { GalatApi, api } from '../../api/klien';
import { HudKasus, Layar } from '../../komponen/layar';
import { PetaTabel } from '../../komponen/petaTabel';
import { TabelHasil } from '../../komponen/tabel';
import { Chip, Isian, Judul, Kotak, Label, Pesan, Tab, Teks, Tombol } from '../../komponen/ui';
import { ARSIP, Kasus, URUTAN_KONSEP } from '../../konten';
import { muatKasusGuruSendiri, useToko } from '../../data/toko';
import { LEBAR_GURU, NAMA_KONSEP, W } from '../../tema';

type LangkahForm = { instruksi: string; query_kunci: string; petunjuk: string[]; komentar_benar: string };
type TersangkaForm = { nama: string; peran: string; avatar: string; pelaku: boolean; alasan: string };
type Form = {
  judul: string; konsep: string; tkp: string; briefing: string[]; sumber_data: 'arsip' | 'sendiri'; sql: string;
  langkah: LangkahForm[]; tersangka: TersangkaForm[]; penjelasan: string;
};

const CONTOH_SQL = `CREATE TABLE peminjaman (
  id INTEGER PRIMARY KEY,
  nama TEXT,
  barang TEXT,
  jam_pinjam TEXT
);
INSERT INTO peminjaman VALUES
  (1, 'Raka', 'Proyektor', '07:30'),
  (2, 'Nadia', 'Kabel HDMI', '09:15'),
  (3, 'Bima', 'Proyektor', '13:10'),
  (4, 'Sinta', 'Speaker', '13:40');`;

const KOSONG: Record<string, Kasus> = {};

const langkahKosong = (): LangkahForm => ({ instruksi: '', query_kunci: '', petunjuk: ['', '', ''], komentar_benar: '' });

function formBaru(): Form {
  return {
    judul: '', konsep: 'WHERE', tkp: '', briefing: ['', ''], sumber_data: 'sendiri', sql: CONTOH_SQL,
    langkah: [langkahKosong()],
    tersangka: [
      { nama: 'Raka', peran: 'Siswa XI RPL', avatar: 'raka', pelaku: false, alasan: '' },
      { nama: 'Nadia', peran: 'Siswi XI RPL', avatar: 'nadia', pelaku: false, alasan: '' },
      { nama: 'Bima', peran: 'Siswa XII TKJ', avatar: 'bima', pelaku: true, alasan: '' },
    ],
    penjelasan: '',
  };
}

function dariKasus(k: Kasus & { sumber_data?: string }): Form {
  return {
    judul: k.judul, konsep: k.konsep, tkp: k.tkp ?? '', briefing: [...k.briefing, '', ''].slice(0, Math.max(2, k.briefing.length)),
    sumber_data: k.sumber_data === 'arsip' ? 'arsip' : 'sendiri', sql: k.sumber_data === 'arsip' ? CONTOH_SQL : k.sql,
    langkah: k.langkah.map((l) => ({ instruksi: l.instruksi, query_kunci: l.query_kunci, petunjuk: [...l.petunjuk], komentar_benar: l.komentar_benar })),
    tersangka: k.tersangka.map((t) => ({ nama: t.nama, peran: t.peran, avatar: t.avatar ?? 'raka', pelaku: t.pelaku, alasan: t.alasan })),
    penjelasan: k.penjelasan,
  };
}

export default function PenyuntingKasus() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const token = useToko((k) => k.token);
  const kasusGuru = useToko((k) => k.s?.kasusGuru ?? KOSONG);
  const [f, setF] = useState<Form>(() => (id && kasusGuru[id] ? dariKasus(kasusGuru[id]) : formBaru()));
  const [pratinjau, setPratinjau] = useState<{ kolom: string[]; baris: any[][]; jumlah: number }[] | null>(null);
  const [galat, setGalat] = useState<{ pesan: string; bagian?: string } | null>(null);
  const [proses, setProses] = useState<'periksa' | 'simpan' | null>(null);
  const [tersimpan, setTersimpan] = useState<string | null>(id ?? null);
  const [lihatArsip, setLihatArsip] = useState(false);

  useEffect(() => {
    if (id && !kasusGuru[id]) {
      muatKasusGuruSendiri().then((d) => {
        const k = d.find((x) => x.id === id);
        if (k) setF(dariKasus(k));
      });
    }
  }, [id]);

  const ubah = (x: Partial<Form>) => {
    setF((lama) => ({ ...lama, ...x }));
    setPratinjau(null);
  };
  const ubahLangkah = (i: number, x: Partial<LangkahForm>) => ubah({ langkah: f.langkah.map((l, j) => (j === i ? { ...l, ...x } : l)) });
  const ubahTersangka = (i: number, x: Partial<TersangkaForm>) =>
    ubah({ tersangka: f.tersangka.map((t, j) => (j === i ? { ...t, ...x } : x.pelaku ? { ...t, pelaku: false } : t)) });

  const muatan = () => ({ ...f, briefing: f.briefing.filter((b) => b.trim()), sql: f.sumber_data === 'arsip' ? '' : f.sql });

  const periksa = async () => {
    setProses('periksa');
    setGalat(null);
    try {
      const r = await api<{ pratinjau: any[] }>('/api/guru/kasus/periksa', { isi: muatan(), token });
      setPratinjau(r.pratinjau);
    } catch (e) {
      setGalat({ pesan: e instanceof Error ? e.message : 'Gagal memeriksa.', bagian: e instanceof GalatApi ? e.bagian : undefined });
    } finally {
      setProses(null);
    }
  };

  const simpan = async () => {
    setProses('simpan');
    setGalat(null);
    try {
      const r = await api<{ data: Kasus; pratinjau: any[] }>(tersimpan ? `/api/guru/kasus/${tersimpan}` : '/api/guru/kasus', { metode: tersimpan ? 'PUT' : 'POST', isi: muatan(), token });
      setTersimpan(r.data.id);
      setPratinjau(r.pratinjau);
      await muatKasusGuruSendiri();
    } catch (e) {
      setGalat({ pesan: e instanceof Error ? e.message : 'Gagal menyimpan.', bagian: e instanceof GalatApi ? e.bagian : undefined });
    } finally {
      setProses(null);
    }
  };

  const tandai = (bagian: string) => (galat?.bagian === bagian ? { borderColor: W.merah } : undefined);

  return (
    <Layar lebar={LEBAR_GURU} atas={<HudKasus label="KASUS BUATAN GURU" judul={tersimpan ? 'Ubah kasus' : 'Kasus baru'} kembali={() => router.replace('/kasus-saya')} />}>
      <View style={{ width: '100%', maxWidth: 780, alignSelf: 'center', gap: 16 }}>
        <Kotak isi={{ gap: 12 }}>
          <Label>1. IDENTITAS KASUS</Label>
          <Isian label="JUDUL" value={f.judul} onChangeText={(t) => ubah({ judul: t })} placeholder="Contoh: Proyektor yang Tertukar" maxLength={80} autoCapitalize="sentences" />
          <Label>KONSEP SQL YANG DILATIH</Label>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {URUTAN_KONSEP.map((k) => (
              <Chip key={k} label={NAMA_KONSEP[k]} aktif={f.konsep === k} warna={W.navy} onPress={() => ubah({ konsep: k })} />
            ))}
          </View>
          <Teks ukuran={14} warna={W.teksRedup}>Siswa wajib memakai kata kunci konsep ini di query-nya, misalnya WHERE atau JOIN.</Teks>
          <Isian label="TEMPAT KEJADIAN (BOLEH KOSONG)" value={f.tkp} onChangeText={(t) => ubah({ tkp: t })} placeholder="Contoh: Ruang multimedia, pukul 14.00" maxLength={80} autoCapitalize="sentences" />
          <Label>CERITA BRIEFING DARI KOMANDAN</Label>
          {f.briefing.map((b, i) => (
            <Isian key={i} value={b} onChangeText={(t) => ubah({ briefing: f.briefing.map((x, j) => (j === i ? t : x)) })} placeholder={i === 0 ? 'Apa yang terjadi?' : 'Apa yang harus diperiksa siswa? (boleh kosong)'} multiline maxLength={300} autoCapitalize="sentences" style={tandai('briefing')} />
          ))}
        </Kotak>

        <Kotak isi={{ gap: 12 }}>
          <Label>2. BASIS DATA KASUS</Label>
          <Tab
            pilihan={[
              { kode: 'sendiri', label: 'TULIS SENDIRI' },
              { kode: 'arsip', label: 'ARSIP SEKOLAH' },
            ]}
            nilai={f.sumber_data}
            ubah={(k) => ubah({ sumber_data: k })}
          />
          {f.sumber_data === 'sendiri' ? (
            <>
              <Teks ukuran={15} warna={W.teksRedup}>Tulis CREATE TABLE dan INSERT. Perintah lain seperti DROP, DELETE, atau ATTACH akan ditolak. Maksimal 10 tabel dan 2.000 baris.</Teks>
              <Isian kode gelap value={f.sql} onChangeText={(t) => ubah({ sql: t })} multiline style={[{ minHeight: 220, textAlignVertical: 'top' }, tandai('sql')]} />
            </>
          ) : (
            <>
              <Teks ukuran={15} warna={W.teksRedup}>Memakai basis data Arsip Sekolah yang sudah tersedia: siswa, ekskul, keterlambatan, kantin, pinjam_buku, dan nilai.</Teks>
              <Tombol kecil varian="kertas" label={lihatArsip ? 'TUTUP DAFTAR TABEL' : 'LIHAT DAFTAR TABEL'} onPress={() => setLihatArsip(!lihatArsip)} style={{ alignSelf: 'flex-start' }} />
              {lihatArsip ? <PetaTabel tabel={ARSIP.tabel} db={null} /> : null}
            </>
          )}
        </Kotak>

        <Kotak isi={{ gap: 12 }}>
          <Label>3. LANGKAH INVESTIGASI</Label>
          <Teks ukuran={15} warna={W.teksRedup}>Setiap langkah punya instruksi dan query kunci. Jawaban siswa dianggap benar jika hasilnya sama dengan hasil query kunci. Petunjuk boleh dikosongkan, nanti dibuat otomatis.</Teks>
          {f.langkah.map((l, i) => (
            <View key={i} style={{ borderWidth: 3, borderColor: galat?.bagian === `langkah${i + 1}` ? W.merah : W.tinta, padding: 10, gap: 10, backgroundColor: W.kertas }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Judul ukuran={9} style={{ flex: 1 }}>{`LANGKAH ${i + 1}`}</Judul>
                {f.langkah.length > 1 ? (
                  <Pressable onPress={() => ubah({ langkah: f.langkah.filter((_, j) => j !== i) })} accessibilityLabel={`Hapus langkah ${i + 1}`}>
                    <Judul ukuran={8} warna={W.merah}>HAPUS</Judul>
                  </Pressable>
                ) : null}
              </View>
              <Isian label="INSTRUKSI UNTUK SISWA" value={l.instruksi} onChangeText={(t) => ubahLangkah(i, { instruksi: t })} placeholder="Contoh: Cari siapa saja yang meminjam proyektor." multiline maxLength={300} autoCapitalize="sentences" />
              <Isian label="QUERY KUNCI" kode gelap value={l.query_kunci} onChangeText={(t) => ubahLangkah(i, { query_kunci: t })} placeholder="SELECT nama, jam_pinjam FROM peminjaman WHERE barang = 'Proyektor'" multiline />
              {pratinjau?.[i] ? (
                <View style={{ gap: 4 }}>
                  <Label warna={W.hijauTua}>{`HASIL QUERY KUNCI (${pratinjau[i].jumlah} BARIS)`}</Label>
                  <TabelHasil hasil={{ kolom: pratinjau[i].kolom, baris: pratinjau[i].baris }} terang ukuran={18} />
                </View>
              ) : null}
              {[0, 1, 2].map((p) => (
                <Isian key={p} label={`PETUNJUK ${p + 1} (BOLEH KOSONG)`} value={l.petunjuk[p]} onChangeText={(t) => ubahLangkah(i, { petunjuk: l.petunjuk.map((x, j) => (j === p ? t : x)) })} maxLength={300} autoCapitalize="sentences" />
              ))}
              <Isian label="KOMENTAR KOMANDAN JIKA BENAR (BOLEH KOSONG)" value={l.komentar_benar} onChangeText={(t) => ubahLangkah(i, { komentar_benar: t })} maxLength={300} autoCapitalize="sentences" />
            </View>
          ))}
          {f.langkah.length < 5 ? <Tombol kecil varian="navy" label="+ TAMBAH LANGKAH" onPress={() => ubah({ langkah: [...f.langkah, langkahKosong()] })} style={{ alignSelf: 'flex-start' }} /> : null}
        </Kotak>

        <Kotak isi={{ gap: 12 }}>
          <Label>4. TERSANGKA DAN PELAKU</Label>
          {f.tersangka.map((t, i) => (
            <View key={i} style={{ borderWidth: 3, borderColor: galat?.bagian === 'tersangka' ? W.merah : t.pelaku ? W.emas : W.tinta, padding: 10, gap: 10, backgroundColor: t.pelaku ? W.emasMuda : W.kertas }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Image source={AVATAR[t.avatar]} style={{ width: 48, height: 48 }} />
                <Judul ukuran={9} style={{ flex: 1 }}>{`TERSANGKA ${i + 1}`}</Judul>
                {f.tersangka.length > 2 ? (
                  <Pressable onPress={() => ubah({ tersangka: f.tersangka.filter((_, j) => j !== i) })} accessibilityLabel={`Hapus tersangka ${i + 1}`}>
                    <Judul ukuran={8} warna={W.merah}>HAPUS</Judul>
                  </Pressable>
                ) : null}
              </View>
              <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                {AVATAR_TERSANGKA.map((a) => (
                  <Pressable key={a} onPress={() => ubahTersangka(i, { avatar: a, nama: t.nama && !Object.values(NAMA_AVATAR).includes(t.nama) ? t.nama : NAMA_AVATAR[a] })} accessibilityLabel={'Avatar ' + NAMA_AVATAR[a]}>
                    <View style={{ borderWidth: 2, borderColor: t.avatar === a ? W.emas : W.abu2, backgroundColor: W.kertasPutih }}>
                      <Image source={AVATAR[a]} style={{ width: 40, height: 40 }} />
                    </View>
                  </Pressable>
                ))}
              </View>
              <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
                <View style={{ flexGrow: 1, flexBasis: 200 }}>
                  <Isian label="NAMA" value={t.nama} onChangeText={(x) => ubahTersangka(i, { nama: x })} maxLength={40} autoCapitalize="words" />
                </View>
                <View style={{ flexGrow: 1, flexBasis: 200 }}>
                  <Isian label="PERAN" value={t.peran} onChangeText={(x) => ubahTersangka(i, { peran: x })} maxLength={60} autoCapitalize="sentences" />
                </View>
              </View>
              <Tombol kecil label={t.pelaku ? 'INI PELAKUNYA' : 'JADIKAN PELAKU'} varian={t.pelaku ? 'merah' : 'kertas'} onPress={() => ubahTersangka(i, { pelaku: true })} style={{ alignSelf: 'flex-start' }} />
              {!t.pelaku ? (
                <Isian label="ALASAN BUKAN PELAKU (DITAMPILKAN JIKA SISWA SALAH TUDUH)" value={t.alasan} onChangeText={(x) => ubahTersangka(i, { alasan: x })} multiline maxLength={300} autoCapitalize="sentences" />
              ) : null}
            </View>
          ))}
          {f.tersangka.length < 4 ? (
            <Tombol kecil varian="navy" label="+ TAMBAH TERSANGKA" onPress={() => ubah({ tersangka: [...f.tersangka, { nama: 'Sinta', peran: 'Siswi X RPL', avatar: 'sinta', pelaku: false, alasan: '' }] })} style={{ alignSelf: 'flex-start' }} />
          ) : null}
          <Isian label="PENJELASAN SETELAH KASUS SELESAI" value={f.penjelasan} onChangeText={(t) => ubah({ penjelasan: t })} placeholder="Apa yang sebenarnya terjadi?" multiline maxLength={500} autoCapitalize="sentences" />
        </Kotak>

        {galat ? <Pesan teks={galat.pesan} jenis="galat" /> : null}
        {pratinjau && !galat ? <Pesan teks={tersimpan ? 'Kasus tersimpan dan sudah bisa dimainkan siswa di kelas Bapak/Ibu.' : 'Semua query kunci berjalan. Hasilnya ditampilkan di setiap langkah.'} jenis="sukses" /> : null}
        <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
          <Tombol label="PERIKSA" varian="navy" onPress={periksa} memuat={proses === 'periksa'} style={{ flexGrow: 1 }} testID="periksa-kasus" />
          <Tombol label="SIMPAN" onPress={simpan} memuat={proses === 'simpan'} style={{ flexGrow: 1 }} testID="simpan-kasus" />
          {tersimpan ? <Tombol label="COBA MAIN" varian="hijau" onPress={() => router.push(`/kasus/${tersimpan}`)} style={{ flexGrow: 1 }} /> : null}
        </View>
      </View>
    </Layar>
  );
}
