import os
from typing import Optional, List

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import create_engine, text

# ──────────────────────────────────────────────
#  Configuración de la aplicación
# ──────────────────────────────────────────────
app = FastAPI(
    title="API Ubicación",
    description="Microservicio CRUD de ubicaciones – Duoc UC QR Inteligente",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/qr_duoc",
)
engine = create_engine(DATABASE_URL, pool_pre_ping=True)


# ──────────────────────────────────────────────
#  Modelos Pydantic (request / response)
# ──────────────────────────────────────────────
class UbicacionCreate(BaseModel):
    """Esquema para crear una ubicación."""
    nombre: str = Field(..., min_length=1, max_length=150, examples=["Sala 204"])
    descripcion: Optional[str] = Field(None, examples=["Sala de clases con proyector"])
    capacidad: Optional[str] = Field(None, max_length=50, examples=["30 personas"])
    piso_id: int = Field(..., gt=0, examples=[2])
    tipo_id: Optional[int] = Field(None, gt=0, examples=[1])


class UbicacionUpdate(BaseModel):
    """Esquema para actualizar una ubicación (todos los campos opcionales)."""
    nombre: Optional[str] = Field(None, min_length=1, max_length=150)
    descripcion: Optional[str] = None
    capacidad: Optional[str] = Field(None, max_length=50)
    piso_id: Optional[int] = Field(None, gt=0)
    tipo_id: Optional[int] = Field(None, gt=0)


class UbicacionResponse(BaseModel):
    """Esquema de respuesta de una ubicación con datos enriquecidos."""
    id: int
    nombre: str
    descripcion: Optional[str]
    capacidad: Optional[str]
    piso_id: int
    piso_nombre: Optional[str] = None
    tipo_id: Optional[int]
    tipo_espacio: Optional[str] = None


class MessageResponse(BaseModel):
    message: str


# ──────────────────────────────────────────────
#  Helpers
# ──────────────────────────────────────────────
QUERY_BASE = """
    SELECT u.id, u.nombre, u.descripcion, u.capacidad,
           u.piso_id, p.nombre AS piso_nombre,
           u.tipo_id, te.nombre AS tipo_espacio
    FROM ubicaciones u
    JOIN pisos p ON u.piso_id = p.id
    LEFT JOIN tipos_espacio te ON u.tipo_id = te.id
"""


def _row_to_dict(row) -> dict:
    """Convierte una fila de SQLAlchemy a diccionario de respuesta."""
    return {
        "id": row.id,
        "nombre": row.nombre,
        "descripcion": row.descripcion,
        "capacidad": row.capacidad,
        "piso_id": row.piso_id,
        "piso_nombre": row.piso_nombre,
        "tipo_id": row.tipo_id,
        "tipo_espacio": row.tipo_espacio,
    }


# ──────────────────────────────────────────────
#  Endpoints
# ──────────────────────────────────────────────

@app.get("/", response_model=dict, tags=["Health"])
def root():
    """Health-check del servicio."""
    return {"service": "api-ubicacion", "status": "ok"}


# ---- READ (listar) ----------------------------------------------------------
@app.get(
    "/api/ubicaciones",
    response_model=List[UbicacionResponse],
    tags=["Ubicaciones"],
    summary="Listar todas las ubicaciones",
)
def get_ubicaciones(
    piso_id: Optional[int] = Query(None, description="Filtrar por piso"),
    tipo_id: Optional[int] = Query(None, description="Filtrar por tipo de espacio"),
):
    """
    Retorna el listado completo de ubicaciones con información de piso y tipo
    de espacio. Opcionalmente se puede filtrar por `piso_id` y/o `tipo_id`.
    """
    query = QUERY_BASE
    params: dict = {}

    conditions = []
    if piso_id is not None:
        conditions.append("u.piso_id = :piso_id")
        params["piso_id"] = piso_id
    if tipo_id is not None:
        conditions.append("u.tipo_id = :tipo_id")
        params["tipo_id"] = tipo_id

    if conditions:
        query += " WHERE " + " AND ".join(conditions)

    query += " ORDER BY u.piso_id, u.nombre"

    with engine.connect() as conn:
        rows = conn.execute(text(query), params).fetchall()

    return [_row_to_dict(r) for r in rows]


# ---- READ (detalle) ---------------------------------------------------------
@app.get(
    "/api/ubicaciones/{ubicacion_id}",
    response_model=UbicacionResponse,
    tags=["Ubicaciones"],
    summary="Obtener detalle de una ubicación",
)
def get_ubicacion(ubicacion_id: int):
    """Retorna el detalle de una ubicación por su ID."""
    query = QUERY_BASE + " WHERE u.id = :id"
    with engine.connect() as conn:
        row = conn.execute(text(query), {"id": ubicacion_id}).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Ubicación no encontrada")
    return _row_to_dict(row)


# ---- CREATE ------------------------------------------------------------------
@app.post(
    "/api/ubicaciones",
    response_model=UbicacionResponse,
    status_code=201,
    tags=["Ubicaciones"],
    summary="Crear una nueva ubicación",
)
def create_ubicacion(data: UbicacionCreate):
    """
    Crea una nueva ubicación. Valida que el `piso_id` y `tipo_id` existan
    antes de insertar.
    """
    with engine.connect() as conn:
        # Validar piso
        piso = conn.execute(
            text("SELECT id FROM pisos WHERE id = :id"), {"id": data.piso_id}
        ).fetchone()
        if not piso:
            raise HTTPException(
                status_code=400,
                detail=f"El piso con id={data.piso_id} no existe",
            )

        # Validar tipo_espacio (si se envió)
        if data.tipo_id is not None:
            tipo = conn.execute(
                text("SELECT id FROM tipos_espacio WHERE id = :id"),
                {"id": data.tipo_id},
            ).fetchone()
            if not tipo:
                raise HTTPException(
                    status_code=400,
                    detail=f"El tipo de espacio con id={data.tipo_id} no existe",
                )

        result = conn.execute(
            text("""
                INSERT INTO ubicaciones (nombre, descripcion, capacidad, piso_id, tipo_id)
                VALUES (:nombre, :descripcion, :capacidad, :piso_id, :tipo_id)
                RETURNING id
            """),
            {
                "nombre": data.nombre,
                "descripcion": data.descripcion,
                "capacidad": data.capacidad,
                "piso_id": data.piso_id,
                "tipo_id": data.tipo_id,
            },
        )
        new_id = result.fetchone().id
        conn.commit()

    # Retornar el registro completo recién creado
    return get_ubicacion(new_id)


# ---- UPDATE ------------------------------------------------------------------
@app.put(
    "/api/ubicaciones/{ubicacion_id}",
    response_model=UbicacionResponse,
    tags=["Ubicaciones"],
    summary="Actualizar una ubicación existente",
)
def update_ubicacion(ubicacion_id: int, data: UbicacionUpdate):
    """
    Actualiza parcialmente una ubicación. Solo se modifican los campos
    enviados (no nulos).
    """
    # Verificar que la ubicación exista
    with engine.connect() as conn:
        existing = conn.execute(
            text("SELECT id FROM ubicaciones WHERE id = :id"),
            {"id": ubicacion_id},
        ).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Ubicación no encontrada")

        # Construir SET dinámico solo con campos proporcionados
        fields = data.model_dump(exclude_unset=True)
        if not fields:
            raise HTTPException(
                status_code=400,
                detail="Debe enviar al menos un campo para actualizar",
            )

        # Validar FK si se actualizan
        if "piso_id" in fields:
            piso = conn.execute(
                text("SELECT id FROM pisos WHERE id = :id"),
                {"id": fields["piso_id"]},
            ).fetchone()
            if not piso:
                raise HTTPException(
                    status_code=400,
                    detail=f"El piso con id={fields['piso_id']} no existe",
                )

        if "tipo_id" in fields and fields["tipo_id"] is not None:
            tipo = conn.execute(
                text("SELECT id FROM tipos_espacio WHERE id = :id"),
                {"id": fields["tipo_id"]},
            ).fetchone()
            if not tipo:
                raise HTTPException(
                    status_code=400,
                    detail=f"El tipo de espacio con id={fields['tipo_id']} no existe",
                )

        set_clauses = [f"{k} = :{k}" for k in fields]
        fields["id"] = ubicacion_id

        conn.execute(
            text(f"UPDATE ubicaciones SET {', '.join(set_clauses)} WHERE id = :id"),
            fields,
        )
        conn.commit()

    return get_ubicacion(ubicacion_id)


# ---- DELETE ------------------------------------------------------------------
@app.delete(
    "/api/ubicaciones/{ubicacion_id}",
    response_model=MessageResponse,
    tags=["Ubicaciones"],
    summary="Eliminar una ubicación",
)
def delete_ubicacion(ubicacion_id: int):
    """Elimina una ubicación por su ID. Retorna 404 si no existe."""
    with engine.connect() as conn:
        result = conn.execute(
            text("DELETE FROM ubicaciones WHERE id = :id RETURNING id"),
            {"id": ubicacion_id},
        )
        deleted = result.fetchone()
        conn.commit()

    if not deleted:
        raise HTTPException(status_code=404, detail="Ubicación no encontrada")

    return {"message": f"Ubicación id={ubicacion_id} eliminada correctamente"}