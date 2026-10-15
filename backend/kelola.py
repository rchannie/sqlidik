"""Perintah pengelolaan dari terminal.

  python kelola.py buat-guru       membuat akun guru tanpa kode pendaftaran
  python kelola.py ganti-sandi     mengganti kata sandi akun mana pun
  python kelola.py daftar-guru     menampilkan semua akun guru
"""
import getpass
import sys

from sqlalchemy import select

from app.keamanan import hash_sandi
from app.main import siapkan_basis_data
from app.db import SesiLokal
from app.models import Pengguna


def buat_guru():
    nama = input("Nama guru: ").strip()
    email = input("Email: ").strip().lower()
    sandi = getpass.getpass("Kata sandi (minimal 6 karakter): ")
    if not nama or "@" not in email or len(sandi) < 6:
        print("Isian belum lengkap.")
        return
    with SesiLokal() as db:
        if db.scalar(select(Pengguna).where(Pengguna.email == email)):
            print("Email sudah terdaftar.")
            return
        db.add(Pengguna(nama=nama, email=email, kata_sandi_hash=hash_sandi(sandi), peran="guru", avatar="pak_hendra"))
        db.commit()
    print("Akun guru dibuat.")


def ganti_sandi():
    email = input("Email akun: ").strip().lower()
    sandi = getpass.getpass("Kata sandi baru: ")
    with SesiLokal() as db:
        p = db.scalar(select(Pengguna).where(Pengguna.email == email))
        if not p or len(sandi) < 6:
            print("Akun tidak ditemukan atau kata sandi terlalu pendek.")
            return
        p.kata_sandi_hash = hash_sandi(sandi)
        db.commit()
    print("Kata sandi diganti.")


def daftar_guru():
    with SesiLokal() as db:
        for p in db.scalars(select(Pengguna).where(Pengguna.peran == "guru")):
            print(f"{p.id_pengguna}\t{p.nama}\t{p.email}")


if __name__ == "__main__":
    perintah = {"buat-guru": buat_guru, "ganti-sandi": ganti_sandi, "daftar-guru": daftar_guru}
    if len(sys.argv) < 2 or sys.argv[1] not in perintah:
        print(__doc__)
        sys.exit(1)
    siapkan_basis_data()
    perintah[sys.argv[1]]()
