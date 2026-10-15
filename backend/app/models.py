"""Tabel basis data server, mengikuti ERD di dokumen perancangan SQLidik."""
from datetime import date, datetime, timezone

from sqlalchemy import (JSON, Boolean, Date, DateTime, ForeignKey, Integer, String, Text,
                        UniqueConstraint)
from sqlalchemy.orm import Mapped, mapped_column

from .db import Base


def sekarang():
    return datetime.now(timezone.utc)


class Pengguna(Base):
    __tablename__ = "pengguna"
    id_pengguna: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nama: Mapped[str] = mapped_column(String(80))
    email: Mapped[str] = mapped_column(String(160), unique=True, index=True)
    kata_sandi_hash: Mapped[str] = mapped_column(String(200))
    peran: Mapped[str] = mapped_column(String(10), default="siswa")  # siswa atau guru
    sekolah: Mapped[str | None] = mapped_column(String(120), nullable=True)
    avatar: Mapped[str] = mapped_column(String(40), default="pemain_01")
    penempatan: Mapped[int | None] = mapped_column(Integer, nullable=True)
    dibuat_pada: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=sekarang)


class StatistikPemain(Base):
    __tablename__ = "statistik_pemain"
    id_pengguna: Mapped[int] = mapped_column(ForeignKey("pengguna.id_pengguna", ondelete="CASCADE"), primary_key=True)
    xp: Mapped[int] = mapped_column(Integer, default=0)
    pangkat: Mapped[str] = mapped_column(String(30), default="magang")
    koin: Mapped[int] = mapped_column(Integer, default=0)
    streak_saat_ini: Mapped[int] = mapped_column(Integer, default=0)
    streak_terpanjang: Mapped[int] = mapped_column(Integer, default=0)
    terakhir_aktif: Mapped[date | None] = mapped_column(Date, nullable=True)


class Kelas(Base):
    __tablename__ = "kelas"
    id_kelas: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    id_guru: Mapped[int] = mapped_column(ForeignKey("pengguna.id_pengguna", ondelete="CASCADE"), index=True)
    nama_kelas: Mapped[str] = mapped_column(String(80))
    kode_kelas: Mapped[str] = mapped_column(String(12), unique=True, index=True)
    dibuat_pada: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=sekarang)


class AnggotaKelas(Base):
    __tablename__ = "anggota_kelas"
    id_kelas: Mapped[int] = mapped_column(ForeignKey("kelas.id_kelas", ondelete="CASCADE"), primary_key=True)
    id_siswa: Mapped[int] = mapped_column(ForeignKey("pengguna.id_pengguna", ondelete="CASCADE"), primary_key=True, index=True)
    bergabung_pada: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=sekarang)


class Berkas(Base):
    __tablename__ = "berkas"
    id_berkas: Mapped[int] = mapped_column(Integer, primary_key=True)
    urutan: Mapped[int] = mapped_column(Integer)
    judul: Mapped[str] = mapped_column(String(80))
    konsep_sql: Mapped[str] = mapped_column(String(20))
    ringkasan_materi: Mapped[str] = mapped_column(Text)


class Kasus(Base):
    __tablename__ = "kasus"
    id_kasus: Mapped[str] = mapped_column(String(40), primary_key=True)
    id_berkas: Mapped[int | None] = mapped_column(ForeignKey("berkas.id_berkas"), nullable=True)
    id_pembuat: Mapped[int | None] = mapped_column(ForeignKey("pengguna.id_pengguna", ondelete="CASCADE"), nullable=True, index=True)
    judul: Mapped[str] = mapped_column(String(120))
    konsep: Mapped[str] = mapped_column(String(20))
    cerita_briefing: Mapped[str] = mapped_column(Text)
    file_database: Mapped[str] = mapped_column(Text)
    jenis: Mapped[str] = mapped_column(String(10))  # utama, harian, guru
    tanggal_harian: Mapped[date | None] = mapped_column(Date, nullable=True)
    xp_hadiah: Mapped[int] = mapped_column(Integer, default=40)
    koin_hadiah: Mapped[int] = mapped_column(Integer, default=15)
    data: Mapped[dict] = mapped_column(JSON)  # isi lengkap kasus untuk aplikasi
    aktif: Mapped[bool] = mapped_column(Boolean, default=True)
    dibuat_pada: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=sekarang)
    diperbarui_pada: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=sekarang, onupdate=sekarang)


class LangkahKasus(Base):
    __tablename__ = "langkah_kasus"
    id_langkah: Mapped[str] = mapped_column(String(50), primary_key=True)
    id_kasus: Mapped[str] = mapped_column(ForeignKey("kasus.id_kasus", ondelete="CASCADE"), index=True)
    urutan: Mapped[int] = mapped_column(Integer)
    instruksi: Mapped[str] = mapped_column(Text)
    query_kunci: Mapped[str] = mapped_column(Text)
    petunjuk_1: Mapped[str] = mapped_column(Text)
    petunjuk_2: Mapped[str] = mapped_column(Text)
    petunjuk_3: Mapped[str] = mapped_column(Text)


class Tersangka(Base):
    __tablename__ = "tersangka"
    id_tersangka: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    id_kasus: Mapped[str] = mapped_column(ForeignKey("kasus.id_kasus", ondelete="CASCADE"), index=True)
    nama: Mapped[str] = mapped_column(String(80))
    peran: Mapped[str] = mapped_column(String(120))
    avatar: Mapped[str | None] = mapped_column(String(40), nullable=True)
    adalah_pelaku: Mapped[bool] = mapped_column(Boolean, default=False)


class ProgresKasus(Base):
    __tablename__ = "progres_kasus"
    __table_args__ = (UniqueConstraint("id_siswa", "id_kasus"),)
    id_progres: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    id_siswa: Mapped[int] = mapped_column(ForeignKey("pengguna.id_pengguna", ondelete="CASCADE"), index=True)
    id_kasus: Mapped[str] = mapped_column(ForeignKey("kasus.id_kasus", ondelete="CASCADE"), index=True)
    status: Mapped[str] = mapped_column(String(10), default="berjalan")
    bintang: Mapped[int] = mapped_column(Integer, default=0)
    jumlah_percobaan: Mapped[int] = mapped_column(Integer, default=0)
    petunjuk_dipakai: Mapped[int] = mapped_column(Integer, default=0)
    salah_tuduh: Mapped[int] = mapped_column(Integer, default=0)
    durasi_detik: Mapped[int | None] = mapped_column(Integer, nullable=True)
    selesai_pada: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    diperbarui_pada: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=sekarang, onupdate=sekarang)


class RiwayatQuery(Base):
    __tablename__ = "riwayat_query"
    id_riwayat: Mapped[str] = mapped_column(String(40), primary_key=True)  # dibuat aplikasi, supaya sinkron tidak dobel
    id_progres: Mapped[int | None] = mapped_column(ForeignKey("progres_kasus.id_progres", ondelete="SET NULL"), nullable=True)
    id_langkah: Mapped[str | None] = mapped_column(String(50), nullable=True)
    id_siswa: Mapped[int] = mapped_column(ForeignKey("pengguna.id_pengguna", ondelete="CASCADE"), index=True)
    id_kasus: Mapped[str | None] = mapped_column(String(40), nullable=True)
    konsep: Mapped[str | None] = mapped_column(String(20), nullable=True)
    teks_query: Mapped[str] = mapped_column(Text)
    hasil_benar: Mapped[bool] = mapped_column(Boolean, default=False)
    jenis_error: Mapped[str | None] = mapped_column(String(30), nullable=True)
    pesan_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    dijalankan_pada: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=sekarang)


class Lencana(Base):
    __tablename__ = "lencana"
    id_lencana: Mapped[str] = mapped_column(String(40), primary_key=True)
    nama: Mapped[str] = mapped_column(String(80))
    deskripsi: Mapped[str] = mapped_column(Text)
    syarat: Mapped[str] = mapped_column(Text)
    gambar: Mapped[str] = mapped_column(String(80))


class LencanaPemain(Base):
    __tablename__ = "lencana_pemain"
    id_pengguna: Mapped[int] = mapped_column(ForeignKey("pengguna.id_pengguna", ondelete="CASCADE"), primary_key=True)
    id_lencana: Mapped[str] = mapped_column(ForeignKey("lencana.id_lencana", ondelete="CASCADE"), primary_key=True)
    didapat_pada: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=sekarang)


class TugasKelas(Base):
    __tablename__ = "tugas_kelas"
    id_tugas: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    id_kelas: Mapped[int] = mapped_column(ForeignKey("kelas.id_kelas", ondelete="CASCADE"), index=True)
    id_kasus: Mapped[str] = mapped_column(ForeignKey("kasus.id_kasus", ondelete="CASCADE"))
    tenggat: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    dibuat_pada: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=sekarang)


class HariAktif(Base):
    """Hari ketika siswa menyelesaikan minimal satu kasus. Dipakai untuk menghitung streak."""
    __tablename__ = "hari_aktif"
    id_pengguna: Mapped[int] = mapped_column(ForeignKey("pengguna.id_pengguna", ondelete="CASCADE"), primary_key=True)
    tanggal: Mapped[date] = mapped_column(Date, primary_key=True)
    pemulihan: Mapped[bool] = mapped_column(Boolean, default=False)


class HasilHarian(Base):
    """Hasil Kasus Harian per tanggal, dipakai untuk papan peringkat kelas."""
    __tablename__ = "hasil_harian"
    id_pengguna: Mapped[int] = mapped_column(ForeignKey("pengguna.id_pengguna", ondelete="CASCADE"), primary_key=True)
    tanggal: Mapped[date] = mapped_column(Date, primary_key=True)
    id_kasus: Mapped[str] = mapped_column(String(40))
    durasi_detik: Mapped[int] = mapped_column(Integer)
    jumlah_percobaan: Mapped[int] = mapped_column(Integer, default=0)
    petunjuk_dipakai: Mapped[int] = mapped_column(Integer, default=0)
    bintang: Mapped[int] = mapped_column(Integer, default=1)
    selesai_pada: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=sekarang)
