import os
import secrets

from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))


def _url_db():
    url = os.getenv("DATABASE_URL", "").strip()
    if not url:
        return "sqlite:///" + os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "sqlidik.db")
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://"):]
    if url.startswith("postgresql://"):
        url = "postgresql+psycopg://" + url[len("postgresql://"):]
    return url


DATABASE_URL = _url_db()
JWT_SECRET = os.getenv("JWT_SECRET", "").strip()
JWT_SEMENTARA = not JWT_SECRET
if JWT_SEMENTARA:
    # Tanpa JWT_SECRET, token akan hangus setiap server dinyalakan ulang.
    JWT_SECRET = secrets.token_urlsafe(48)
KODE_DAFTAR_GURU = os.getenv("KODE_DAFTAR_GURU", "").strip()
MASA_TOKEN_HARI = int(os.getenv("MASA_TOKEN_HARI", "30"))
ASAL_DIIZINKAN = [a.strip() for a in os.getenv("CORS_ORIGINS", "*").split(",") if a.strip()]
