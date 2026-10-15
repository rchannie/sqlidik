import os
import sys
import tempfile

import pytest

AKAR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, AKAR)

if not os.environ.get("DATABASE_URL"):
    _berkas = os.path.join(tempfile.mkdtemp(), "uji.db")
    os.environ["DATABASE_URL"] = "sqlite:///" + _berkas
os.environ["JWT_SECRET"] = "rahasia-uji-yang-cukup-panjang-untuk-hmac-256"
os.environ["KODE_DAFTAR_GURU"] = "kode-guru-uji"

from fastapi.testclient import TestClient  # noqa: E402

from app.db import Base, engine  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture()
def klien():
    Base.metadata.drop_all(engine)
    with TestClient(app) as c:
        yield c


def daftar(klien, nama="Raka", email="raka@uji.id", kode_kelas=None):
    r = klien.post("/api/auth/daftar", json={"nama": nama, "email": email, "kata_sandi": "rahasia1", "kode_kelas": kode_kelas})
    assert r.status_code == 200, r.text
    return {"Authorization": "Bearer " + r.json()["token"]}


def daftar_guru(klien, email="hendra@uji.id"):
    r = klien.post("/api/auth/daftar-guru", json={"nama": "Pak Hendra", "email": email, "kata_sandi": "rahasia1",
                                                  "kode_guru": "kode-guru-uji"})
    assert r.status_code == 200, r.text
    return {"Authorization": "Bearer " + r.json()["token"]}
