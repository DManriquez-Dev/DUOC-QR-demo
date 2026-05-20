import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, text

app = FastAPI(title="API QR", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/qr_duoc")
engine = create_engine(DATABASE_URL)


@app.get("/")
def root():
    return {"service": "api-qr", "status": "ok"}


@app.get("/api/qr/{qr_code}")
def get_qr_info(qr_code: str):
    with engine.connect() as conn:
        row = conn.execute(
            text("SELECT id, nombre, piso FROM ubicaciones WHERE qr_code = :code"),
            {"code": qr_code},
        ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="QR no encontrado")
    return {"id": row.id, "ubicacion": row.nombre, "piso": row.piso}
