import { useEffect, useState } from 'react';
import { Platform, Pressable, View } from 'react-native';

import { alamatBawaan, alamatServer, api, aturAlamatServer, muatAlamatServer } from '../api/klien';
import { muatInfoServer } from '../data/toko';
import { TINGKAT_MAKS, efek, ubahPengaturanSuara, usePengaturanSuara } from '../suara/mesin';
import { W } from '../tema';
import { Isian, Judul, Label, Lembar, Pemisah, Pesan, Teks, Tombol } from './ui';

export function Pengaturan({ terbuka, tutup }: { terbuka: boolean; tutup: () => void }) {
  const [alamat, setAlamat] = useState('');
  const [pesan, setPesan] = useState<{ teks: string; jenis: 'galat' | 'sukses' | 'info' } | null>(null);
  const [cek, setCek] = useState(false);
  const suara = usePengaturanSuara();

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
      <Label>SUARA</Label>
      <PengaturSuara
        judul="MUSIK"
        nyala={suara.musik}
        tingkat={suara.tingkatMusik}
        ubahNyala={(v) => {
          ubahPengaturanSuara({ musik: v });
          efek('ui_tap');
        }}
        ubahTingkat={(t) => {
          ubahPengaturanSuara({ tingkatMusik: t, musik: t > 0 });
          efek('ui_tap');
        }}
      />
      <PengaturSuara
        judul="EFEK SUARA"
        nyala={suara.efek}
        tingkat={suara.tingkatEfek}
        ubahNyala={(v) => {
          ubahPengaturanSuara({ efek: v });
          efek('ui_tap');
        }}
        ubahTingkat={(t) => {
          ubahPengaturanSuara({ tingkatEfek: t, efek: t > 0 });
          efek('ui_tap'); // contoh bunyi dengan volume yang baru
        }}
      />
      {Platform.OS === 'web' ? (
        <Teks ukuran={14} warna={W.teksRedup}>
          Di browser, musik mulai setelah layar diketuk pertama kali. Di iPhone dan iPad, volume hanya bisa diatur dengan tombol volume perangkat.
        </Teks>
      ) : Platform.OS === 'ios' ? (
        <Teks ukuran={14} warna={W.teksRedup}>Suara tidak berbunyi kalau iPhone dalam mode senyap.</Teks>
      ) : null}

      <Pemisah />
      <Label>SERVER</Label>
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

/** Saklar nyala/mati dan bilah volume 10 tingkat bergaya pixel. */
function PengaturSuara({ judul, nyala, tingkat, ubahNyala, ubahTingkat }: { judul: string; nyala: boolean; tingkat: number; ubahNyala: (v: boolean) => void; ubahTingkat: (t: number) => void }) {
  const atur = (t: number) => ubahTingkat(Math.max(0, Math.min(TINGKAT_MAKS, t)));
  const kunci = judul.toLowerCase().replace(/\s+/g, '-');
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Judul ukuran={10} style={{ flex: 1 }}>
          {judul}
        </Judul>
        <Pressable
          onPress={() => ubahNyala(!nyala)}
          accessibilityRole="switch"
          accessibilityState={{ checked: nyala }}
          accessibilityLabel={judul}
          testID={'saklar-' + kunci}
          hitSlop={6}
        >
          <View style={{ flexDirection: 'row', borderWidth: 3, borderColor: W.tinta }}>
            <View style={{ paddingHorizontal: 10, paddingVertical: 7, backgroundColor: nyala ? W.hijau : W.kertasPutih }}>
              <Judul ukuran={8} warna={nyala ? W.kertas : W.abu2}>
                NYALA
              </Judul>
            </View>
            <View style={{ paddingHorizontal: 10, paddingVertical: 7, borderLeftWidth: 3, borderColor: W.tinta, backgroundColor: nyala ? W.kertasPutih : W.merah }}>
              <Judul ukuran={8} warna={nyala ? W.abu2 : W.kertas}>
                MATI
              </Judul>
            </View>
          </View>
        </Pressable>
      </View>
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={`Volume ${judul.toLowerCase()}`}
        accessibilityValue={{ min: 0, max: TINGKAT_MAKS, now: tingkat, text: `${tingkat} dari ${TINGKAT_MAKS}` }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => atur(tingkat + (e.nativeEvent.actionName === 'increment' ? 1 : -1))}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 6, opacity: nyala ? 1 : 0.5 }}
      >
        <TombolVolume label="-" onPress={() => atur(tingkat - 1)} testID={'kurang-' + kunci} />
        <View style={{ flex: 1, flexDirection: 'row', gap: 3, height: 30 }}>
          {Array.from({ length: TINGKAT_MAKS }, (_, i) => (
            <Pressable key={i} style={{ flex: 1 }} onPress={() => atur(i + 1)} hitSlop={{ top: 8, bottom: 8 }} testID={`volume-${kunci}-${i + 1}`}>
              <View style={{ flex: 1, borderWidth: 2, borderColor: W.tinta, backgroundColor: i < tingkat ? W.emas : W.kertasPutih }} />
            </Pressable>
          ))}
        </View>
        <TombolVolume label="+" onPress={() => atur(tingkat + 1)} testID={'tambah-' + kunci} />
      </View>
    </View>
  );
}

function TombolVolume({ label, onPress, testID }: { label: string; onPress: () => void; testID?: string }) {
  return (
    <Pressable onPress={onPress} hitSlop={6} testID={testID} accessibilityLabel={label === '+' ? 'Tambah volume' : 'Kurangi volume'}>
      <View style={{ width: 34, height: 34, borderWidth: 3, borderColor: W.tinta, backgroundColor: W.navy, alignItems: 'center', justifyContent: 'center' }}>
        <Judul ukuran={11} warna={W.kertas}>
          {label}
        </Judul>
      </View>
    </Pressable>
  );
}
