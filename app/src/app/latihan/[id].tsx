/* Satu soal latihan Ruang Arsip. */
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { A } from '../../aset';
import { Dialog, HudKasus, Layar } from '../../komponen/layar';
import { PetaTabel } from '../../komponen/petaTabel';
import { Terminal } from '../../komponen/terminal';
import { Tab, Teks, Tombol } from '../../komponen/ui';
import { ARSIP, LATIHAN, cariLatihan } from '../../konten';
import type { DbKasus } from '../../mesin/jenis';
import type { HasilPeriksa } from '../../mesin/periksa';
import { bukaDb } from '../../mesin/sqlite';
import { catatLatihan, catatPercobaan, useToko } from '../../data/toko';
import { NAMA_KONSEP, W } from '../../tema';

export default function Latihan() {
  const { id, ulang } = useLocalSearchParams<{ id: string; ulang?: string }>();
  const latihan = cariLatihan(id);
  const guru = useToko((k) => k.s?.pengguna.peran === 'guru');
  const [db, setDb] = useState<DbKasus | null>(null);
  const [tab, setTab] = useState<'terminal' | 'peta'>('terminal');
  const [benar, setBenar] = useState(false);
  const [petunjuk, setPetunjuk] = useState(0);
  const [dialog, setDialog] = useState<{ teks: string; ekspresi: 'normal' | 'senang' | 'serius' }>({ teks: 'Latihan bebas. Petunjuk gratis, jadi jangan ragu membukanya.', ekspresi: 'normal' });
  const [sisipan, setSisipan] = useState<{ teks: string; n: number } | null>(null);
  const modeUlang = ulang === '1';

  useEffect(() => {
    let d0: DbKasus | null = null;
    bukaDb(ARSIP.sql).then((d) => {
      d0 = d;
      setDb(d);
    });
    return () => {
      d0?.tutup();
    };
  }, []);

  useEffect(() => {
    setBenar(false);
    setPetunjuk(0);
  }, [id]);

  if (!latihan) {
    return (
      <Layar atas={<HudKasus label="RUANG ARSIP" judul="Latihan tidak ditemukan" />}>
        <Tombol label="KEMBALI" onPress={() => router.back()} />
      </Layar>
    );
  }
  const sejenis = LATIHAN.filter((l) => l.konsep === latihan.konsep);
  const berikut = sejenis[(sejenis.findIndex((l) => l.id === latihan.id) + 1) % sejenis.length];

  const saatPeriksa = (r: HasilPeriksa, sql: string) => {
    if (!guru) {
      catatPercobaan(`latihan:${latihan.id}`, {
        id_langkah: null, konsep: latihan.konsep, teks_query: sql, hasil_benar: r.benar,
        jenis_error: r.jenis_error ?? null, pesan_error: r.benar ? null : r.pesan,
      }, false);
    }
    if (r.benar) {
      setBenar(true);
      const hasil = guru ? { paham: false } : catatLatihan(latihan.id, latihan.konsep, modeUlang);
      setDialog({
        teks: hasil.paham
          ? `Tiga kali benar berturut-turut. Konsep ${NAMA_KONSEP[latihan.konsep]} sudah kamu kuasai lagi.`
          : 'Benar. Query-mu menghasilkan data yang dicari.',
        ekspresi: 'senang',
      });
    } else {
      setDialog({ teks: r.jenis_error === 'hasil' || r.jenis_error === 'kata_wajib' ? r.pesan : 'Baca pesan di terminal, lalu coba lagi.', ekspresi: 'serius' });
    }
  };

  return (
    <Layar latar={A.latar.meja} atas={<HudKasus label={`${modeUlang ? 'LATIHAN ULANG' : 'RUANG ARSIP'} · ${NAMA_KONSEP[latihan.konsep]}`} judul={latihan.judul} />}>
      <Tab gelap pilihan={[{ kode: 'terminal', label: 'TERMINAL' }, { kode: 'peta', label: 'PETA TABEL' }]} nilai={tab} ubah={setTab} />
      <View style={{ display: tab === 'terminal' ? 'flex' : 'none' }}>
        <Terminal
          langkah={latihan}
          nomor={1}
          total={1}
          tabel={ARSIP.tabel}
          db={db}
          benih={latihan.id}
          sudahBenar={benar}
          sisipan={sisipan}
          saatPeriksa={saatPeriksa}
          petunjuk={latihan.petunjuk.slice(0, petunjuk)}
          latihan
        />
      </View>
      {tab === 'peta' ? <PetaTabel tabel={ARSIP.tabel} db={db} sisip={(t) => { setSisipan({ teks: t, n: Date.now() }); setTab('terminal'); }} /> : null}
      {!benar && petunjuk < 3 ? <Tombol label={`BUKA PETUNJUK ${petunjuk + 1} (GRATIS)`} varian="navy" kecil ikon={A.ikon.petunjuk} onPress={() => setPetunjuk(petunjuk + 1)} /> : null}
      <Dialog teks={dialog.teks} ekspresi={dialog.ekspresi} />
      {benar ? (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Tombol label="KE ARSIP" varian="navy" onPress={() => router.replace('/arsip')} style={{ flex: 1 }} />
          <Tombol label="SOAL BERIKUTNYA" onPress={() => router.replace({ pathname: '/latihan/[id]', params: { id: berikut.id, ulang: modeUlang ? '1' : undefined } })} style={{ flex: 1 }} testID="latihan-berikut" />
        </View>
      ) : (
        <Teks ukuran={14} warna={W.biruMuda}>Latihan tidak memberi XP, tetapi tetap menjaga streak harianmu.</Teks>
      )}
    </Layar>
  );
}
