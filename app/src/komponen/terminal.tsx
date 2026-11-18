/* Terminal Query: tempat siswa menulis atau menyusun query, menjalankannya, dan melihat hasilnya. */
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, TextInput, View } from 'react-native';

import { A } from '../aset';
import type { Langkah, MetaTabel } from '../konten';
import { DbKasus, Hasil } from '../mesin/jenis';
import { HasilPeriksa, periksaLangkah, rapikanKutip } from '../mesin/periksa';
import { Tahap, lihatProses } from '../mesin/proses';
import { efek } from '../suara/mesin';
import { H, W } from '../tema';
import { BlokEditor } from './blokEditor';
import { Gerak } from './gerak';
import { LembarProses } from './lihatProses';
import { TabelHasil } from './tabel';
import { Ikon, Judul, Kode, Tombol } from './ui';

const TOMBOL_CEPAT = ['*', ',', "'", '=', '>', '<', '_', '(', ')', 'SELECT', 'FROM', 'WHERE', 'AND', 'OR'];
const NAMA_TANDA: Record<string, string> = {
  '*': 'bintang', ',': 'koma', "'": 'tanda kutip', '=': 'sama dengan', '>': 'lebih dari', '<': 'kurang dari', _: 'garis bawah', '(': 'kurung buka', ')': 'kurung tutup',
};

type Props = {
  langkah: Langkah;
  nomor: number;
  total: number;
  tabel: MetaTabel[];
  db: DbKasus | null;
  benih: string;
  sudahBenar: boolean;
  sisipan?: { teks: string; n: number } | null;
  saatPeriksa: (r: HasilPeriksa, sql: string) => void;
  petunjuk: string[];
  latihan?: boolean;
};

export function Terminal({ langkah, nomor, total, tabel, db, benih, sudahBenar, sisipan, saatPeriksa, petunjuk, latihan }: Props) {
  const [mode, setMode] = useState<'ketik' | 'blok'>('ketik');
  const [teks, setTeks] = useState('');
  const [teksBlok, setTeksBlok] = useState('');
  const [hasil, setHasil] = useState<Hasil | null>(null);
  const [pesan, setPesan] = useState<{ teks: string; benar: boolean } | null>(null);
  const [jalan, setJalan] = useState(false);
  const [nJalan, setNJalan] = useState(0);
  const [proses, setProses] = useState<{ tahap: Tahap[]; galat?: string } | null>(null);
  const terakhir = useRef('');
  const kotakKetik = useRef<any>(null);
  const kursor = useRef<{ start: number; end: number } | null>(null);

  /** Sisipkan kata kunci atau tanda di posisi kursor. Kata kunci diberi spasi agar tidak menempel. */
  const sisipDiKursor = (x: string) => {
    const t = teks;
    const awal = Math.min(kursor.current?.start ?? t.length, t.length);
    const akhir = Math.min(kursor.current?.end ?? t.length, t.length);
    const kiri = t.slice(0, awal);
    const kanan = t.slice(akhir);
    const kata = /^[A-Z]/.test(x);
    const isi = kata ? (kiri && !/\s$/.test(kiri) ? ' ' : '') + x + (/^\s/.test(kanan) ? '' : ' ') : x === ',' ? ', ' : x;
    const pos = awal + isi.length;
    setTeks(kiri + isi + kanan);
    kursor.current = { start: pos, end: pos };
    requestAnimationFrame(() => {
      const el = kotakKetik.current;
      if (!el) return;
      if (Platform.OS === 'web') {
        el.focus?.();
        el.setSelectionRange?.(pos, pos);
      } else {
        el.setSelection?.(pos, pos);
      }
    });
  };

  useEffect(() => {
    setTeks('');
    setTeksBlok('');
    setHasil(null);
    setPesan(null);
  }, [benih]);

  useEffect(() => {
    if (sisipan && mode === 'ketik') setTeks((t) => (t && !/\s$/.test(t) ? t + ' ' : t) + sisipan.teks);
  }, [sisipan?.n]);

  const query = mode === 'ketik' ? teks : teksBlok;

  const jalankan = async () => {
    if (!db || jalan) return;
    setJalan(true);
    efek('query_jalan');
    const mulai = Date.now();
    try {
      const r = await periksaLangkah(db, langkah, query);
      // Bunyi hasil diberi jeda supaya bunyi JALANKAN sempat terdengar.
      const hasilBunyi = r.benar ? 'query_benar' : r.jenis_error === 'hasil' || r.jenis_error === 'kata_wajib' ? 'query_salah' : 'query_error';
      efek(hasilBunyi, { tunda: Math.max(0, 320 - (Date.now() - mulai)) });
      terakhir.current = query;
      setHasil(r.hasil ?? null);
      setPesan({ teks: r.pesan, benar: r.benar });
      setNJalan((n) => n + 1);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(r.benar ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning).catch(() => {});
      }
      saatPeriksa(r, query);
    } finally {
      setJalan(false);
    }
  };

  const bukaProses = async () => {
    if (!db) return;
    setProses(await lihatProses(db, query.trim() ? query : terakhir.current));
  };

  return (
    <View style={{ gap: 10 }}>
      <View style={{ backgroundColor: W.abu1, borderWidth: 3, borderColor: W.tinta, padding: 8 }}>
        <View style={{ backgroundColor: W.layar, borderWidth: 3, borderColor: W.tinta, padding: 10, gap: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Kode ukuran={20}>SQLIDIK TERMINAL v1.0</Kode>
            <Kode ukuran={20} warna={W.layarKuning}>{`LANGKAH ${nomor}/${total}`}</Kode>
          </View>
          <View style={{ height: 2, backgroundColor: W.layarGaris }} />
          <Kode ukuran={21} warna={W.layarKuning} pilih>{langkah.instruksi}</Kode>
          {petunjuk.length ? (
            <View style={{ borderWidth: 2, borderColor: W.emasTua, padding: 6, gap: 4 }}>
              {petunjuk.map((p, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: 6 }}>
                  <Ikon src={A.ikon.petunjuk} ukuran={18} />
                  <Kode ukuran={20} warna={W.emasMuda} style={{ flex: 1 }} pilih>{p}</Kode>
                </View>
              ))}
            </View>
          ) : null}
          {mode === 'ketik' ? (
            <View style={{ flexDirection: 'row', gap: 6, alignItems: 'flex-start' }}>
              <Gerak jenis="kedip" durasi={1000} style={{ marginTop: 8 }}>
                <Kode ukuran={24}>{'>'}</Kode>
              </Gerak>
              <TextInput
                ref={kotakKetik}
                testID="editor-query"
                value={teks}
                onChangeText={(v) => setTeks(rapikanKutip(v))}
                onSelectionChange={(e) => {
                  kursor.current = e.nativeEvent.selection;
                }}
                multiline
                editable={!sudahBenar}
                placeholder="SELECT ... FROM ..."
                placeholderTextColor="#4E7A57"
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
                textAlignVertical="top"
                style={{ flex: 1, minHeight: 92, color: W.layarTeks, fontFamily: H.kode, fontSize: 23, lineHeight: 26, padding: 6, backgroundColor: W.layar2, borderWidth: 2, borderColor: W.layarGaris, ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}) } as any}
              />
            </View>
          ) : null}
          {mode === 'ketik' && !sudahBenar ? (
            // Tombol cepat untuk kata kunci dan tanda yang repot dicari di papan ketik HP.
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
              {TOMBOL_CEPAT.map((x) => (
                <Pressable
                  key={x}
                  onPress={() => {
                    efek('blok_pasang');
                    sisipDiKursor(x);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={'Sisipkan ' + (NAMA_TANDA[x] ?? x)}
                  testID={'cepat-' + x}
                  hitSlop={4}
                  style={({ pressed }) => ({ minWidth: 30, alignItems: 'center', borderWidth: 2, borderColor: W.layarGaris, backgroundColor: pressed ? W.layarGaris : W.layar2, paddingHorizontal: 5, paddingVertical: 2 })}
                >
                  <Kode ukuran={21} warna={/^[A-Z]/.test(x) ? W.biruMuda : W.layarKuning}>{x}</Kode>
                </Pressable>
              ))}
            </View>
          ) : null}
          {mode === 'blok' ? (
            <BlokEditor langkah={langkah} tabel={tabel} benih={benih} ubah={setTeksBlok} />
          ) : null}
          {hasil ? (
            <Gerak key={'hasil' + nJalan} jenis="naik" jarak={8} style={{ gap: 4 }}>
              <TabelHasil hasil={hasil} />
              <Kode ukuran={20}>{`${hasil.baris.length} baris ditemukan.`}</Kode>
            </Gerak>
          ) : null}
          {pesan ? (
            <Gerak key={'pesan' + nJalan} jenis={pesan.benar ? 'muncul' : 'goyang'} jarak={pesan.benar ? undefined : 5} tunda={320}>
              <Kode ukuran={21} warna={pesan.benar ? W.layarTeks : '#F28B82'} pilih>
                {pesan.benar ? (latihan ? 'BENAR. Hasil query-mu sesuai.' : '+1 BUKTI. ' + pesan.teks) : '! ' + pesan.teks}
              </Kode>
            </Gerak>
          ) : null}
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Pressable
          onPress={() => {
            efek('ui_tap');
            setMode(mode === 'ketik' ? 'blok' : 'ketik');
          }}
          accessibilityRole="button"
          accessibilityLabel={mode === 'ketik' ? 'Ganti ke mode blok' : 'Ganti ke mode ketik'}
          testID="ganti-mode"
          disabled={sudahBenar}
          style={{ flex: 1, backgroundColor: W.navy, borderWidth: 3, borderColor: W.tinta, alignItems: 'center', justifyContent: 'center', paddingVertical: 8 }}
        >
          <Judul ukuran={8} warna={W.kertas}>{mode === 'ketik' ? 'MODE BLOK' : 'MODE KETIK'}</Judul>
        </Pressable>
        <Pressable
          onPress={bukaProses}
          disabled={!query.trim() && !terakhir.current}
          accessibilityRole="button"
          accessibilityLabel="Lihat proses query"
          testID="lihat-proses"
          style={{ flex: 1, backgroundColor: W.navy, borderWidth: 3, borderColor: W.tinta, alignItems: 'center', justifyContent: 'center', paddingVertical: 8, opacity: !query.trim() && !terakhir.current ? 0.5 : 1 }}
        >
          <Judul ukuran={8} warna={W.kertas}>LIHAT PROSES</Judul>
        </Pressable>
        <Tombol label="JALANKAN" varian="hijau" kecil ikon={A.ikon.jalankan} suara={null} onPress={jalankan} memuat={jalan} mati={!db || sudahBenar || !query.trim()} style={{ flex: 1.3 }} testID="jalankan" />
      </View>
      <LembarProses terbuka={!!proses} tutup={() => setProses(null)} tahap={proses?.tahap ?? []} galat={proses?.galat} />
    </View>
  );
}
