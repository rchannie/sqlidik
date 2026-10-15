/* Peta gambar pixel art. Gambar sudah diperbesar dengan nearest neighbor, jadi jangan diperbesar lagi. */
export const A = {
  logo: require('../assets/game/logo_sqlidik.png'),
  ikonAplikasi: require('../assets/game/ikon_aplikasi.png'),
  komandan: {
    normal: require('../assets/game/komandan_normal.png'),
    senang: require('../assets/game/komandan_senang.png'),
    serius: require('../assets/game/komandan_serius.png'),
  },
  latar: {
    judul: require('../assets/game/latar_layar_judul.png'),
    papan: require('../assets/game/latar_papan_kasus.png'),
    meja: require('../assets/game/latar_meja_investigasi.png'),
    lineup: require('../assets/game/latar_lineup.png'),
    gabus: require('../assets/game/tekstur_papan_ubin.png'),
  },
  ikon: {
    kasus: require('../assets/game/ikon_menu_kasus.png'),
    harian: require('../assets/game/ikon_menu_kasus_harian.png'),
    arsip: require('../assets/game/ikon_menu_ruang_arsip.png'),
    profil: require('../assets/game/ikon_menu_profil.png'),
    koin: require('../assets/game/ikon_koin.png'),
    streak: require('../assets/game/ikon_streak.png'),
    bintang: require('../assets/game/ikon_bintang.png'),
    xp: require('../assets/game/ikon_xp.png'),
    petunjuk: require('../assets/game/ikon_petunjuk.png'),
    gembok: require('../assets/game/ikon_gembok.png'),
    kaca: require('../assets/game/ikon_kaca_pembesar.png'),
    jalankan: require('../assets/game/ikon_jalankan.png'),
    hapus: require('../assets/game/ikon_hapus.png'),
    undo: require('../assets/game/ikon_undo.png'),
    pengaturan: require('../assets/game/ikon_pengaturan.png'),
    notifikasi: require('../assets/game/ikon_notifikasi.png'),
    kembali: require('../assets/game/ikon_kembali.png'),
  },
  berkas: {
    select: require('../assets/game/ikon_berkas_select.png'),
    where: require('../assets/game/ikon_berkas_where.png'),
    like: require('../assets/game/ikon_berkas_like.png'),
    sum_count: require('../assets/game/ikon_berkas_sum_count.png'),
    join: require('../assets/game/ikon_berkas_join.png'),
    kasus_besar: require('../assets/game/ikon_berkas_kasus_besar.png'),
  } as Record<string, number>,
  kartu: {
    terkunci: require('../assets/game/kartu_berkas_terkunci.png'),
    terbuka: require('../assets/game/kartu_berkas_terbuka.png'),
    selesai: require('../assets/game/kartu_berkas_selesai.png'),
  },
  pangkat: {
    magang: require('../assets/game/pangkat_1_magang.png'),
    junior: require('../assets/game/pangkat_2_junior.png'),
    senior: require('../assets/game/pangkat_3_senior.png'),
    kepala: require('../assets/game/pangkat_4_kepala.png'),
  } as Record<string, number>,
  lencana: {
    kasus_pertama: require('../assets/game/lencana_kasus_pertama.png'),
    raja_join: require('../assets/game/lencana_raja_join.png'),
    tanpa_petunjuk: require('../assets/game/lencana_tanpa_petunjuk.png'),
    streak_7_hari: require('../assets/game/lencana_streak_7_hari.png'),
    detektif_kilat: require('../assets/game/lencana_detektif_kilat.png'),
    kolektor_bukti: require('../assets/game/lencana_kolektor_bukti.png'),
  } as Record<string, number>,
  stempel: {
    terbukti: require('../assets/game/stempel_terbukti.png'),
    ditolak: require('../assets/game/stempel_ditolak.png'),
  },
  dekor: {
    koran: require('../assets/game/dekor_guntingan_koran.png'),
    catatan: require('../assets/game/dekor_kertas_catatan.png'),
    polaroid: require('../assets/game/dekor_polaroid.png'),
    bukti: require('../assets/game/item_bukti.png'),
    panah: require('../assets/game/kursor_panah.png'),
    sorot: require('../assets/game/lampu_sorot_biasa.png'),
    sorotPilih: require('../assets/game/lampu_sorot_terpilih.png'),
    paku: require('../assets/game/paku_payung.png'),
    nomor: require('../assets/game/papan_nomor_kosong.png'),
  },
};

export const AVATAR: Record<string, number> = {
  raka: require('../assets/game/tersangka_01_raka.png'),
  nadia: require('../assets/game/tersangka_02_nadia.png'),
  bima: require('../assets/game/tersangka_03_bima.png'),
  sinta: require('../assets/game/tersangka_04_sinta.png'),
  pak_hendra: require('../assets/game/tersangka_05_pak_hendra.png'),
  pak_darto: require('../assets/game/tersangka_06_pak_darto.png'),
  bu_sri: require('../assets/game/tersangka_07_bu_sri.png'),
  bu_ratna: require('../assets/game/tersangka_08_bu_ratna.png'),
  pemain_01: require('../assets/game/pemain_01_fedora_cokelat.png'),
  pemain_02: require('../assets/game/pemain_02_hijab_ungu.png'),
  pemain_03: require('../assets/game/pemain_03_fedora_navy.png'),
  pemain_04: require('../assets/game/pemain_04_rambut_panjang.png'),
};

export const AVATAR_PEMAIN = ['pemain_01', 'pemain_02', 'pemain_03', 'pemain_04'];
export const AVATAR_TERSANGKA = ['raka', 'nadia', 'bima', 'sinta', 'pak_hendra', 'pak_darto', 'bu_sri', 'bu_ratna'];
export const NAMA_AVATAR: Record<string, string> = {
  raka: 'Raka', nadia: 'Nadia', bima: 'Bima', sinta: 'Sinta', pak_hendra: 'Pak Hendra', pak_darto: 'Pak Darto',
  bu_sri: 'Bu Sri', bu_ratna: 'Bu Ratna',
};
