import os
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/qr_duoc")
JWT_SECRET = os.getenv("JWT_SECRET", "duoc-qr-secret-cambia-esto-en-produccion-1234567890")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

engine = create_engine(DATABASE_URL)
security = HTTPBearer()


def _create_default_users():
    with engine.connect() as conn:
        if not conn.execute(text("SELECT id FROM usuarios WHERE username = 'admin'")).fetchone():
            pw = bcrypt.hashpw(b"admin", bcrypt.gensalt()).decode()
            conn.execute(
                text("INSERT INTO usuarios (username, email, password, rol) VALUES ('admin', 'admin@duoc.cl', :pw, 'ADMIN')"),
                {"pw": pw},
            )
        if not conn.execute(text("SELECT id FROM usuarios WHERE username = 'usuario'")).fetchone():
            pw = bcrypt.hashpw(b"usuario", bcrypt.gensalt()).decode()
            conn.execute(
                text("INSERT INTO usuarios (username, email, password, rol) VALUES ('usuario', 'usuario@duoc.cl', :pw, 'USER')"),
                {"pw": pw},
            )
        conn.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    _create_default_users()
    yield


app = FastAPI(title="API QR", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class LoginRequest(BaseModel):
    username: str
    password: str


class CreateUserRequest(BaseModel):
    username: str
    email: str
    password: str
    rol: str = "USER"


def _create_token(user_id: int, username: str, rol: str) -> str:
    payload = {
        "sub": str(user_id),
        "username": username,
        "rol": rol,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        return jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")


def require_admin(payload=Depends(verify_token)):
    if payload.get("rol") != "ADMIN":
        raise HTTPException(status_code=403, detail="Se requiere rol ADMIN")
    return payload


@app.get("/")
def root():
    return {"service": "api-qr", "status": "ok"}


@app.post("/api/auth/login")
def login(data: LoginRequest):
    with engine.connect() as conn:
        row = conn.execute(
            text("SELECT id, username, password, rol, activo FROM usuarios WHERE username = :u"),
            {"u": data.username},
        ).fetchone()
    if not row or not row.activo:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    if not bcrypt.checkpw(data.password.encode(), row.password.encode()):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    token = _create_token(row.id, row.username, row.rol)
    return {"access_token": token, "token_type": "bearer", "username": row.username, "rol": row.rol}


@app.get("/api/usuarios")
def list_users(payload=Depends(require_admin)):
    with engine.connect() as conn:
        rows = conn.execute(
            text("SELECT id, username, email, rol, activo, creado_en FROM usuarios ORDER BY id")
        ).fetchall()
    return [
        {"id": r.id, "username": r.username, "email": r.email, "rol": r.rol, "activo": r.activo, "creado_en": str(r.creado_en)}
        for r in rows
    ]


@app.post("/api/usuarios")
def create_user(data: CreateUserRequest, payload=Depends(require_admin)):
    hashed = bcrypt.hashpw(data.password.encode(), bcrypt.gensalt()).decode()
    with engine.connect() as conn:
        try:
            conn.execute(
                text("INSERT INTO usuarios (username, email, password, rol) VALUES (:u, :e, :p, :r)"),
                {"u": data.username, "e": data.email, "p": hashed, "r": data.rol.upper()},
            )
            conn.commit()
        except Exception:
            raise HTTPException(status_code=400, detail="Usuario ya existe")
    return {"message": "Usuario creado exitosamente"}


@app.get("/api/usuarios/me")
def get_me(payload=Depends(verify_token)):
    with engine.connect() as conn:
        row = conn.execute(
            text("SELECT id, username, email, rol, activo FROM usuarios WHERE id = :id"),
            {"id": int(payload["sub"])},
        ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return {"id": row.id, "username": row.username, "email": row.email, "rol": row.rol, "activo": row.activo}


@app.get("/api/qr/{qr_code}")
def get_qr_info(qr_code: str):
    with engine.connect() as conn:
        row = conn.execute(
            text("""
                SELECT cq.id AS qr_id, u.id AS ubicacion_id, u.nombre, p.numero AS piso
                FROM codigos_qr cq
                JOIN ubicaciones u ON cq.ubicacion_id = u.id
                JOIN pisos p ON u.piso_id = p.id
                WHERE cq.codigo = :codigo AND cq.activo = TRUE
            """),
            {"codigo": qr_code},
        ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="QR no encontrado o inactivo")
    with engine.connect() as conn:
        conn.execute(text("INSERT INTO escaneos (qr_id) VALUES (:qr_id)"), {"qr_id": row.qr_id})
        conn.commit()
    return {"id": row.ubicacion_id, "ubicacion": row.nombre, "piso": row.piso}
