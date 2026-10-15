/* Layar kasus: Briefing, Investigasi, Tuduh Pelaku, dan Hasil Kasus. */
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';

import { A, AVATAR } from '../../aset';
import { KartuKonsep } from '../../komponen/kartu';
import { Dialog, HudKasus, KoinHud, Layar } from '../../komponen/layar';
import { PetaTabel } from '../../komponen/petaTabel';
import { TabelHasil } from '../../komponen/tabel';
import { Terminal } from '../../komponen/terminal';
import { Bintang, Chip, Ikon, Judul, Kotak, Label, Lembar, Memuat, Pemisah, Tab, Teks, Tombol } from '../../komponen/ui';
import { ATURAN, BERKAS, Kasus, LENCANA, kasusDiBerkas } from '../../konten';
import { bukaDb } from '../../mesin/sqlite';
import type { DbKasus, Hasil } from '../../mesin/jenis';
import type { HasilPeriksa } from '../../mesin/periksa';
import { bintangSesi, kasusTerbuka } from '../../permainan/aturan';
import { geserTanggal, tanggalWIB } from '../../permainan/waktu';
import {
  Hadiah,
  ambilKasusDariServer,
  belanjaPetunjuk,
  catatPercobaan,
  catatSalahTuduh,
  kasusDariId,
  selesaikanHarian,
  selesaikanKasus,
  statistikDari,
  tandaiKasusTerakhir,
  useToko,
} from '../../data/toko';
import { NAMA_KONSEP, W } from '../../tema';

type Fase = 'briefing' | 'investigasi' | 'tuduh' | 'hasil';

export default function LayarKasus() {
  const { id, mode } = useLocalSearchParams<{ id: string; mode?: string }>();
  const s = useToko((k) => k.s);
  const [kasus, setKasus] = useState<Kasus | null | undefined>(() => kasusDariId(id));
  const [galatMuat, setGalatMuat] = useState<string | null>(null);

  useEffect(() => {
    if (kasus || !id) return;
    ambilKasusDariServer(id)
      .then((k) => setKasus(k ?? null))
      .catch((e) => setGalatMuat(e?.message ?? 'Kasus tidak ditemukan.'));
  }, [id]);

  if (!s) return null;
  if (!kasus) {
    return (
      <Layar latar={A.latar.papan} atas={<HudKasus label="BERKAS" judul="Memuat kasus" />}>
        {galatMuat ? (
          <Kotak isi={{ gap: 10 }}>
            <Teks>{galatMuat}</Teks>
            <Tombol label="KEMBALI" onPress={() => router.back()} />
          </Kotak>
        ) : (
          <Memuat />
        )}
      </Layar>
    );
  }
  const guru = s.pengguna.peran === 'guru';
  if (kasus.jenis === 'utama' && !guru && !kasusTerbuka(kasus, s.progres, s.penempatan)) {
    return (
      <Layar latar={A.latar.papan} atas={<HudKasus label={`BERKAS ${kasus.berkas}`} judul={kasus.judul} />}>
        <Dialog ekspresi="serius" teks="Berkas ini masih terkunci, Detektif. Selesaikan kasus sebelumnya dulu." />
        <Tombol label="KE PAPAN KASUS" onPress={() => router.replace('/peta')} />
      </Layar>
    );
  }
  return <Permainan key={kasus.id + (mode ?? '')} kasus={kasus} pemulihan={mode === 'pemulihan'} guru={guru} />;
}

function labelKasus(k: Kasus): string {
  if (k.jenis === 'harian') return `KASUS HARIAN · ${NAMA_KONSEP[k.konsep]}`;
  if (k.jenis === 'guru') return `KASUS DARI GURU · ${NAMA_KONSEP[k.konsep]}`;
  return `BERKAS ${k.berkas} · ${NAMA_KONSEP[k.konsep]}`;
}

function Permainan({ kasus, pemulihan, guru }: { kasus: Kasus; pemulihan: boolean; guru: boolean }) {
  const [fase, setFase] = useState<Fase>('briefing');
  const [db, setDb] = useState<DbKasus | null>(null);
  const [galatDb, setGalatDb] = useState<string | null>(null);
  const [langkahKe, setLangkahKe] = useState(0);
  const [bukti, setBukti] = useState<Hasil[]>([]);
  const [benarSekarang, setBenarSekarang] = useState(false);
  const [petunjukTerbuka, setPetunjukTerbuka] = useState<number[]>(() => kasus.langkah.map(() => 0));
  const [sesi, setSesi] = useState({ salahQuery: 0, petunjuk: 0, salahTuduh: 0, percobaan: 0 });
  const [dialog, setDialog] = useState<{ teks: string; ekspresi: 'normal' | 'senang' | 'serius' } | null>(null);
  const [tab, setTab] = useState<'terminal' | 'peta' | 'bukti'>('terminal');
  const [sisipan, setSisipan] = useState<{ teks: string; n: number } | null>(null);
  const [lembarPetunjuk, setLembarPetunjuk] = useState(false);
  const [hadiah, setHadiah] = useState<Hadiah | null>(null);
  const [bintangAkhir, setBintangAkhir] = useState(0);
  const mulai = useRef(Date.now());
  const koin = useToko((k) => (k.s ? statistikDari(k.s).koin : 0));
  const total = kasus.langkah.length;
  const langkah = kasus.langkah[langkahKe];
  const gratis = guru;

  useEffect(() => {
    let db0: DbKasus | null = null;
    let batal = false;
    bukaDb(kasus.sql)
      .then((d) => {
        db0 = d;
        if (batal) d.tutup();
        else setDb(d);
      })
      .catch((e) => setGalatDb(e?.message ?? 'Basis data kasus gagal dibuka.'));
    if (!guru) tandaiKasusTerakhir(kasus.id);
    return () => {
      batal = true;
      db0?.tutup();
    };
  }, [kasus.id]);

  const mulaiInvestigasi = () => {
    mulai.current = Date.now();
    setFase('investigasi');
    setDialog({ teks: 'Baca instruksi di terminal, tulis query, lalu tekan JALANKAN. Kalau buntu, buka petunjuk.', ekspresi: 'normal' });
  };

  const saatPeriksa = (r: HasilPeriksa, sql: string) => {
    if (!guru) {
      catatPercobaan(kasus.id, {
        id_langkah: `${kasus.id}-${langkahKe + 1}`,
        konsep: kasus.konsep,
        teks_query: sql,
        hasil_benar: r.benar,
        jenis_error: r.jenis_error ?? null,
        pesan_error: r.benar ? null : r.pesan,
      });
    }
    setSesi((x) => ({ ...x, percobaan: x.percobaan + 1, salahQuery: x.salahQuery + (r.benar ? 0 : 1) }));
    if (r.benar) {
      setBenarSekarang(true);
      if (r.hasil) setBukti((b) => [...b.slice(0, langkahKe), r.hasil!]);
      setDialog({ teks: r.pesan, ekspresi: 'senang' });
    } else {
      setDialog({ teks: r.jenis_error === 'hasil' || r.jenis_error === 'kata_wajib' ? r.pesan : 'Ada yang perlu diperbaiki. Baca pesan di terminal, lalu coba lagi.', ekspresi: 'serius' });
    }
  };

  const lanjutLangkah = () => {
    if (langkahKe + 1 < total) {
      setLangkahKe(langkahKe + 1);
      setBenarSekarang(false);
      setTab('terminal');
      setDialog({ teks: 'Bukti tersimpan. Lanjut ke langkah berikutnya.', ekspresi: 'normal' });
    } else {
      setFase('tuduh');
      setDialog({ teks: 'Pilih tersangka, lalu tunjukkan buktinya.', ekspresi: 'normal' });
    }
  };

  const bukaPetunjuk = () => {
    const n = petunjukTerbuka[langkahKe];
    if (n >= 3) return;
    if (!gratis) {
      if (!belanjaPetunjuk(kasus.id)) {
        setDialog({ teks: `Koinmu kurang. Satu petunjuk butuh ${ATURAN.biaya_petunjuk} koin. Kumpulkan koin dari kasus lain.`, ekspresi: 'serius' });
        return;
      }
    }
    setPetunjukTerbuka((p) => p.map((v, i) => (i === langkahKe ? v + 1 : v)));
    setSesi((x) => ({ ...x, petunjuk: x.petunjuk + 1 }));
  };

  const tuduh = (i: number) => {
    const t = kasus.tersangka[i];
    if (!t.pelaku) {
      if (!guru) catatSalahTuduh(kasus.id);
      setSesi((x) => ({ ...x, salahTuduh: x.salahTuduh + 1 }));
      return false;
    }
    const durasi = Math.round((Date.now() - mulai.current) / 1000);
    const b = bintangSesi(sesi.petunjuk, sesi.salahTuduh, sesi.salahQuery);
    setBintangAkhir(b);
    if (!guru) {
      const h =
        kasus.jenis === 'harian'
          ? selesaikanHarian(kasus, pemulihan ? geserTanggal(tanggalWIB(), -1) : tanggalWIB(), { durasi, percobaan: sesi.percobaan, petunjuk: sesi.petunjuk, bintang: b }, pemulihan)
          : selesaikanKasus(kasus.id, b, durasi);
      setHadiah(h);
    }
    setTimeout(() => setFase('hasil'), 900);
    return true;
  };

  const ulangi = () => {
    setFase('briefing');
    setLangkahKe(0);
    setBukti([]);
    setBenarSekarang(false);
    setPetunjukTerbuka(kasus.langkah.map(() => 0));
    setSesi({ salahQuery: 0, petunjuk: 0, salahTuduh: 0, percobaan: 0 });
    setHadiah(null);
    setDialog(null);
  };

  const label = labelKasus(kasus);

  if (fase === 'briefing') {
    return (
      <Layar warna={W.malam} atas={<HudKasus label={label} judul={kasus.judul} kanan={guru ? undefined : <KoinHud />} />}>
        <View style={{ borderWidth: 3, borderColor: W.kayuTua, height: 170 }}>
          <Image source={A.latar.gabus} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} contentFit="cover" />
          <Image source={A.dekor.polaroid} style={{ position: 'absolute', left: 16, top: 14, width: 86, height: 100, transform: [{ rotate: '-4deg' }] }} />
          <Image source={A.dekor.koran} style={{ position: 'absolute', left: 124, top: 18, width: 140, height: 94, transform: [{ rotate: '3deg' }] }} />
          <Image source={A.dekor.catatan} style={{ position: 'absolute', right: 14, top: 74, width: 66, height: 58 }} />
          <View style={{ position: 'absolute', left: 14, bottom: 10, backgroundColor: W.kertasPutih, borderWidth: 3, borderColor: W.tinta, paddingHorizontal: 8, paddingVertical: 4, maxWidth: '78%' }}>
            <Label warna={W.merah}>TKP</Label>
            <Teks ukuran={15} garis={2}>{kasus.tkp ?? 'Sekolah'}</Teks>
          </View>
        </View>
        <Dialog teks={kasus.briefing} />
        <KartuKonsep kartu={kasus.kartu} konsep={kasus.konsep} />
        <View style={{ gap: 8 }}>
          <Label warna={W.biruMuda}>TABEL YANG BISA DIPERIKSA</Label>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {kasus.tabel.map((t) => <Chip key={t.nama} label={t.nama} warna={W.malam2} teks={W.kertas} />)}
          </View>
        </View>
        {galatDb ? <Teks warna={W.merah}>{galatDb}</Teks> : null}
        <Tombol label="MULAI INVESTIGASI" onPress={mulaiInvestigasi} mati={!db} memuat={!db && !galatDb} testID="mulai-investigasi" />
        <Judul ukuran={8} warna={W.abu2} style={{ textAlign: 'center' }}>
          {`LANGKAH: ${total} · DURASI ${kasus.durasi ?? '3-5 MENIT'}`.toUpperCase()}
        </Judul>
      </Layar>
    );
  }

  if (fase === 'investigasi') {
    const terbuka = petunjukTerbuka[langkahKe];
    return (
      <Layar
        latar={A.latar.meja}
        atas={
          <HudKasus
            label={label}
            judul={kasus.judul}
            kanan={
              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                <Pressable onPress={() => setLembarPetunjuk(true)} accessibilityLabel="Petunjuk" testID="tombol-petunjuk" style={{ borderWidth: 3, borderColor: W.kertas, backgroundColor: W.navy, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6, paddingVertical: 4 }}>
                  <Ikon src={A.ikon.petunjuk} ukuran={20} />
                  <Judul ukuran={9} warna={W.kertas}>{3 - terbuka}</Judul>
                </Pressable>
                {guru ? null : <KoinHud />}
              </View>
            }
          />
        }
      >
        <Tab
          gelap
          pilihan={[
            { kode: 'terminal', label: 'TERMINAL' },
            { kode: 'peta', label: 'PETA TABEL' },
            { kode: 'bukti', label: 'BUKTI', lencana: bukti.length },
          ]}
          nilai={tab}
          ubah={setTab}
        />
        <View style={{ display: tab === 'terminal' ? 'flex' : 'none' }}>
          <Terminal
            langkah={langkah}
            nomor={langkahKe + 1}
            total={total}
            tabel={kasus.tabel}
            db={db}
            benih={`${kasus.id}-${langkahKe}`}
            sudahBenar={benarSekarang}
            sisipan={sisipan}
            saatPeriksa={saatPeriksa}
            petunjuk={langkah.petunjuk.slice(0, terbuka)}
          />
        </View>
        {tab === 'peta' ? (
          <PetaTabel
            tabel={kasus.tabel}
            db={db}
            sisip={(t) => {
              setSisipan({ teks: t, n: Date.now() });
              setTab('terminal');
            }}
          />
        ) : null}
        {tab === 'bukti' ? <DaftarBukti kasus={kasus} bukti={bukti} /> : null}
        {benarSekarang ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: W.emas, borderWidth: 3, borderColor: W.tinta, paddingHorizontal: 10, paddingVertical: 6 }}>
              <Image source={A.dekor.bukti} style={{ width: 28, height: 28 }} />
              <Judul ukuran={9}>+1 BUKTI</Judul>
            </View>
            <Tombol label={langkahKe + 1 < total ? 'LANGKAH BERIKUTNYA' : 'TUDUH PELAKU'} varian={langkahKe + 1 < total ? 'emas' : 'merah'} onPress={lanjutLangkah} style={{ flex: 1 }} testID="lanjut-langkah" />
          </View>
        ) : null}
        {dialog ? <Dialog teks={dialog.teks} ekspresi={dialog.ekspresi} /> : null}
        <Lembar terbuka={lembarPetunjuk} tutup={() => setLembarPetunjuk(false)} judul={`PETUNJUK LANGKAH ${langkahKe + 1}`}>
          {langkah.petunjuk.slice(0, terbuka).map((p, i) => (
            <Kotak key={i} isi={{ gap: 4 }}>
              <Label>{`PETUNJUK ${i + 1}`}</Label>
              <Teks pilih>{p}</Teks>
            </Kotak>
          ))}
          {terbuka < 3 ? (
            <>
              <Teks ukuran={15} warna={W.teksRedup}>
                {gratis
                  ? 'Petunjuk bertingkat: tabel yang dipakai, kolom atau syarat, lalu kerangka query.'
                  : `Petunjuk bertingkat: tabel, kolom atau syarat, lalu kerangka query. Satu petunjuk ${ATURAN.biaya_petunjuk} koin. Membuka dua petunjuk atau lebih mengurangi satu bintang.`}
              </Teks>
              <Tombol
                label={gratis ? `BUKA PETUNJUK ${terbuka + 1}` : `BUKA PETUNJUK ${terbuka + 1} (${ATURAN.biaya_petunjuk} KOIN)`}
                ikon={A.ikon.petunjuk}
                onPress={bukaPetunjuk}
                mati={!gratis && koin < ATURAN.biaya_petunjuk}
                testID="buka-petunjuk"
              />
              {!gratis && koin < ATURAN.biaya_petunjuk ? <Teks ukuran={15} warna={W.merah}>Koinmu belum cukup.</Teks> : null}
            </>
          ) : (
            <Teks ukuran={15}>Semua petunjuk untuk langkah ini sudah terbuka.</Teks>
          )}
        </Lembar>
      </Layar>
    );
  }

  if (fase === 'tuduh') {
    return <Tuduh kasus={kasus} label={label} bukti={bukti} tuduh={tuduh} dialogAwal={dialog} />;
  }

  return <HasilKasus kasus={kasus} label={label} bintang={bintangAkhir} hadiah={hadiah} guru={guru} ulangi={ulangi} pemulihan={pemulihan} />;
}

function DaftarBukti({ kasus, bukti }: { kasus: Kasus; bukti: Hasil[] }) {
  if (!bukti.length) return <Dialog teks="Belum ada bukti. Selesaikan langkah di terminal, hasil query yang benar otomatis tersimpan di sini." />;
  return (
    <View style={{ gap: 12 }}>
      {bukti.map((h, i) => (
        <Kotak key={i} warna={W.tinta} tepi={W.emas} isi={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Image source={A.dekor.bukti} style={{ width: 30, height: 30 }} />
            <Label warna={W.emas}>{`BUKTI ${i + 1}`}</Label>
          </View>
          <Teks ukuran={15} warna={W.kertas}>{kasus.langkah[i].instruksi}</Teks>
          <TabelHasil hasil={h} />
        </Kotak>
      ))}
    </View>
  );
}

function Tuduh({ kasus, label, bukti, tuduh, dialogAwal }: { kasus: Kasus; label: string; bukti: Hasil[]; tuduh: (i: number) => boolean; dialogAwal: { teks: string; ekspresi: 'normal' | 'senang' | 'serius' } | null }) {
  const [pilih, setPilih] = useState<number | null>(null);
  const [ditolak, setDitolak] = useState<number | null>(null);
  const [terbukti, setTerbukti] = useState(false);
  const [lihatBukti, setLihatBukti] = useState(false);
  const pakaiAvatar = kasus.tersangka.every((t) => t.avatar);
  const dialog = ditolak !== null
    ? { teks: kasus.tersangka[ditolak].alasan + ' Coba periksa lagi buktimu.', ekspresi: 'serius' as const }
    : terbukti
      ? { teks: 'Tuduhanmu didukung bukti. Kasus terpecahkan!', ekspresi: 'senang' as const }
      : dialogAwal ?? { teks: 'Pilih tersangka, lalu tunjukkan buktinya.', ekspresi: 'normal' as const };

  return (
    <Layar warna={W.malam2} atas={<HudKasus label={label} judul={kasus.judul} kanan={<KoinHud />} />}>
      <Judul ukuran={13} warna={W.emas} style={{ textAlign: 'center' }}>
        {kasus.jenis === 'harian' ? 'APA JAWABANNYA?' : 'SIAPA PELAKUNYA?'}
      </Judul>
      {pakaiAvatar ? (
        <View style={{ height: 270, borderWidth: 3, borderColor: W.tinta, overflow: 'hidden' }}>
          <Image source={A.latar.lineup} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} contentFit="cover" contentPosition="center" />
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', paddingBottom: 6 }}>
            {kasus.tersangka.map((t, i) => {
              const dipilih = pilih === i;
              return (
                <Pressable
                  key={t.nama}
                  onPress={() => {
                    setPilih(i);
                    setDitolak(null);
                  }}
                  disabled={terbukti}
                  accessibilityRole="button"
                  accessibilityLabel={`Pilih ${t.nama}`}
                  accessibilityState={{ selected: dipilih }}
                  testID={'tersangka-' + i}
                  style={{ alignItems: 'center', width: `${Math.floor(100 / kasus.tersangka.length)}%` as any }}
                >
                  <Image source={dipilih ? A.dekor.sorotPilih : A.dekor.sorot} style={{ position: 'absolute', top: -120, width: 100, height: 260, opacity: dipilih ? 0.95 : 0.55 }} contentFit="contain" />
                  {dipilih ? <Image source={A.dekor.panah} style={{ width: 30, height: 20, transform: [{ rotate: '90deg' }], marginBottom: 4 }} /> : <View style={{ height: 24 }} />}
                  <Image source={AVATAR[t.avatar!]} style={{ width: 96, height: 96 }} />
                  <View style={{ marginTop: -14, width: 44, height: 28, alignItems: 'center', justifyContent: 'center' }}>
                    <Image source={A.dekor.nomor} style={{ position: 'absolute', width: 44, height: 28 }} />
                    <Judul ukuran={10}>{i + 1}</Judul>
                  </View>
                  <Judul ukuran={9} warna={dipilih ? W.emas : W.kertas} style={{ marginTop: 6 }}>{t.nama.toUpperCase()}</Judul>
                </Pressable>
              );
            })}
          </View>
          {terbukti || ditolak !== null ? (
            <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 90, alignItems: 'center' }}>
              <Image source={terbukti ? A.stempel.terbukti : A.stempel.ditolak} style={{ width: 240, height: 70, transform: [{ rotate: '-8deg' }] }} />
            </View>
          ) : null}
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {kasus.tersangka.map((t, i) => (
            <Pressable key={t.nama} onPress={() => { setPilih(i); setDitolak(null); }} disabled={terbukti} accessibilityRole="button" accessibilityLabel={`Pilih ${t.nama}`} testID={'tersangka-' + i}>
              <View style={{ borderWidth: 3, borderColor: pilih === i ? W.emas : W.tinta, backgroundColor: pilih === i ? W.navy : W.kertas, padding: 14, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                <Judul ukuran={12} warna={pilih === i ? W.emas : W.biru}>{i + 1}</Judul>
                <Teks tebal warna={pilih === i ? W.kertas : W.tinta} style={{ flex: 1 }}>{t.nama}</Teks>
              </View>
            </Pressable>
          ))}
          {terbukti || ditolak !== null ? (
            <View style={{ alignItems: 'center' }}>
              <Image source={terbukti ? A.stempel.terbukti : A.stempel.ditolak} style={{ width: 240, height: 70, transform: [{ rotate: '-6deg' }] }} />
            </View>
          ) : null}
        </View>
      )}
      {pilih !== null && kasus.tersangka[pilih].peran ? (
        <Teks warna={W.kertas} style={{ textAlign: 'center' }}>{`${kasus.tersangka[pilih].nama}, ${kasus.tersangka[pilih].peran}`}</Teks>
      ) : null}
      <Pressable onPress={() => setLihatBukti(true)} accessibilityRole="button" accessibilityLabel="Lihat bukti yang dilampirkan">
        <View style={{ backgroundColor: W.tinta, borderWidth: 3, borderColor: W.kertas, padding: 10, gap: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Label warna={W.emas}>BUKTI DILAMPIRKAN</Label>
            <Label warna={W.biruMuda}>{`${bukti.length}/${kasus.langkah.length}`}</Label>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {kasus.langkah.map((_, i) => (
              <View key={i} style={{ width: 62, height: 62, borderWidth: 3, borderStyle: i < bukti.length ? 'solid' : 'dashed', borderColor: i < bukti.length ? W.emas : W.abu3, alignItems: 'center', justifyContent: 'center', backgroundColor: W.navy }}>
                {i < bukti.length ? <Image source={A.dekor.bukti} style={{ width: 40, height: 40 }} /> : null}
              </View>
            ))}
          </View>
          <Teks ukuran={14} warna={W.biruMuda}>Ketuk untuk membaca ulang bukti.</Teks>
        </View>
      </Pressable>
      <Tombol
        label={terbukti ? 'TERBUKTI!' : 'TUDUH!'}
        varian="merah"
        ukuranTeks={16}
        mati={pilih === null || terbukti}
        testID="tombol-tuduh"
        onPress={() => {
          if (pilih === null) return;
          if (tuduh(pilih)) setTerbukti(true);
          else setDitolak(pilih);
        }}
      />
      <Dialog teks={dialog.teks} ekspresi={dialog.ekspresi} />
      <Lembar terbuka={lihatBukti} tutup={() => setLihatBukti(false)} judul="BUKTI">
        {bukti.map((h, i) => (
          <View key={i} style={{ gap: 6 }}>
            <Label>{`BUKTI ${i + 1}`}</Label>
            <Teks ukuran={15}>{kasus.langkah[i].instruksi}</Teks>
            <TabelHasil hasil={h} terang />
          </View>
        ))}
      </Lembar>
    </Layar>
  );
}

function HasilKasus({ kasus, label, bintang, hadiah, guru, ulangi, pemulihan }: { kasus: Kasus; label: string; bintang: number; hadiah: Hadiah | null; guru: boolean; ulangi: () => void; pemulihan: boolean }) {
  const s = useToko((k) => k.s)!;
  const pelaku = kasus.tersangka.find((t) => t.pelaku)!;
  const daftar = kasus.jenis === 'utama' ? kasusDiBerkas(kasus.berkas ?? 1) : [];
  const idx = daftar.findIndex((k) => k.id === kasus.id);
  const berikutDiBerkas = idx >= 0 ? daftar[idx + 1] : undefined;
  const berkasBerikut = kasus.jenis === 'utama' && !berikutDiBerkas ? BERKAS.find((b) => b.nomor === (kasus.berkas ?? 0) + 1) : undefined;
  const lanjut = () => {
    if (berikutDiBerkas) router.replace(`/kasus/${berikutDiBerkas.id}`);
    else if (kasus.jenis === 'harian') router.replace('/harian');
    else if (kasus.jenis === 'guru') router.replace(guru ? '/kasus-saya' : '/kelas');
    else router.replace('/peta');
  };
  const pesanPenutup = pemulihan
    ? 'Streak-mu pulih. Besok jangan sampai terlewat lagi, Detektif.'
    : berkasBerikut
      ? `${kasus.penutup} Berkas ${berkasBerikut.nomor} sudah terbuka.`
      : kasus.penutup;
  return (
    <Layar latar={A.latar.papan} atas={<HudKasus label={label} judul={kasus.judul} kembali={() => router.replace(kasus.jenis === 'harian' ? '/harian' : '/peta')} />}>
      <View style={{ alignSelf: 'center', backgroundColor: W.tinta, borderWidth: 3, borderColor: W.emas, paddingHorizontal: 16, paddingVertical: 10 }}>
        <Judul ukuran={16} warna={W.emas} style={{ textAlign: 'center' }}>
          KASUS SELESAI
        </Judul>
      </View>
      <Kotak isi={{ gap: 12, alignItems: 'center' }}>
        <Label warna={W.abu3}>{label}</Label>
        <Image source={A.stempel.terbukti} style={{ width: 260, height: 74, transform: [{ rotate: '-4deg' }] }} />
        <Teks tebal style={{ textAlign: 'center' }}>
          {kasus.jenis === 'harian' ? `Jawaban: ${pelaku.nama}` : `Pelaku: ${pelaku.nama}${pelaku.peran ? ` (${pelaku.peran})` : ''}`}
        </Teks>
        <Bintang jumlah={bintang} ukuran={46} />
        {guru ? (
          <Teks ukuran={15} warna={W.teksRedup}>Mode coba main: hadiah tidak dicatat.</Teks>
        ) : hadiah ? (
          <View style={{ alignSelf: 'stretch', gap: 8 }}>
            <BarisHadiah ikon={A.ikon.xp} label="XP" nilai={hadiah.xp > 0 ? `+${hadiah.xp}` : '+0'} />
            <Pemisah />
            <BarisHadiah ikon={A.ikon.koin} label="Koin" nilai={hadiah.koin >= 0 ? `+${hadiah.koin}` : `${hadiah.koin}`} />
            <Pemisah />
            <BarisHadiah ikon={A.ikon.streak} label="Streak" nilai={`${hadiah.streak} HARI`} />
            {hadiah.bintangSebelumnya >= bintang && hadiah.bintangSebelumnya > 0 ? (
              <Teks ukuran={14} warna={W.teksRedup}>XP dan koin kasus ini sudah didapat sebelumnya. Kejar bintang yang lebih banyak untuk tambahan XP.</Teks>
            ) : null}
            {kasus.jenis === 'harian' && pemulihan ? <Teks ukuran={14} warna={W.teksRedup}>Kasus pemulihan menutup hari yang terlewat, tanpa hadiah Kasus Harian.</Teks> : null}
          </View>
        ) : null}
      </Kotak>
      <Kotak warna={W.tinta} tepi={W.kertas} isi={{ gap: 6 }}>
        <Label warna={W.biruMuda}>APA YANG TERJADI</Label>
        <Teks warna={W.kertas}>{kasus.penjelasan}</Teks>
      </Kotak>
      <Pressable onPress={() => router.push(`/catatan/${kasus.konsep}`)} accessibilityRole="button">
        <Kotak warna={W.tinta} tepi={W.kertas} isi={{ gap: 6 }}>
          <Label warna={W.biruMuda}>KONSEP DIPELAJARI</Label>
          <Teks warna={W.kertas}>
            <Teks warna={W.emas} tebal>{kasus.kartu.judul}</Teks> tersimpan di Buku Catatan Detektif. Ketuk untuk membuka.
          </Teks>
        </Kotak>
      </Pressable>
      {hadiah?.lencanaBaru.map((l) => {
        const info = LENCANA.find((x) => x.kode === l);
        return (
          <View key={l} style={{ borderWidth: 3, borderStyle: 'dashed', borderColor: W.emas, backgroundColor: W.navy, padding: 12, flexDirection: 'row', gap: 14, alignItems: 'center' }}>
            <Image source={A.lencana[l]} style={{ width: 56, height: 74 }} />
            <View style={{ flex: 1, gap: 4 }}>
              <Label warna={W.emas}>LENCANA BARU!</Label>
              <Teks warna={W.kertas} tebal>{info?.nama ?? l}</Teks>
              <Teks ukuran={14} warna={W.biruMuda}>{info?.syarat}</Teks>
            </View>
          </View>
        );
      })}
      <Dialog ekspresi="senang" teks={pesanPenutup} />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Tombol label="ULANGI" varian="navy" onPress={ulangi} style={{ flex: 1 }} />
        <Tombol label="LANJUT" onPress={lanjut} style={{ flex: 1 }} testID="tombol-lanjut-hasil" />
      </View>
    </Layar>
  );
}

function BarisHadiah({ ikon, label, nilai }: { ikon: number; label: string; nilai: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <Ikon src={ikon} ukuran={28} />
      <Teks style={{ flex: 1 }}>{label}</Teks>
      <Judul ukuran={11} warna={W.hijauTua}>{nilai}</Judul>
    </View>
  );
}

