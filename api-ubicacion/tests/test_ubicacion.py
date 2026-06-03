from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from main import app

client = TestClient(app)


# ──────────────────────────────────────────────
#  Helper para simular filas de SQLAlchemy
# ──────────────────────────────────────────────
def _mock_row(**kwargs):
    """Crea un mock que se comporta como una Row de SQLAlchemy."""
    row = MagicMock()
    for k, v in kwargs.items():
        setattr(row, k, v)
    return row


def _mock_conn():
    """Crea un mock de conexión con soporte de context manager."""
    conn = MagicMock()
    conn.__enter__ = lambda s: s
    conn.__exit__ = MagicMock(return_value=False)
    return conn


SAMPLE_ROW = dict(
    id=1,
    nombre="Laboratorio 301",
    descripcion="Laboratorio de computación, 30 PCs",
    capacidad="30 personas",
    piso_id=3,
    piso_nombre="Tercer piso",
    tipo_id=2,
    tipo_espacio="Laboratorio",
)


# ──────────────────────────────────────────────
#  Tests – Health check
# ──────────────────────────────────────────────
def test_root():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "api-ubicacion"
    assert data["status"] == "ok"


# ──────────────────────────────────────────────
#  Tests – GET /api/ubicaciones
# ──────────────────────────────────────────────
def test_get_ubicaciones_empty():
    conn = _mock_conn()
    conn.execute.return_value.fetchall.return_value = []

    with patch("main.engine.connect", return_value=conn):
        response = client.get("/api/ubicaciones")
    assert response.status_code == 200
    assert response.json() == []


def test_get_ubicaciones_with_data():
    conn = _mock_conn()
    conn.execute.return_value.fetchall.return_value = [_mock_row(**SAMPLE_ROW)]

    with patch("main.engine.connect", return_value=conn):
        response = client.get("/api/ubicaciones")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["nombre"] == "Laboratorio 301"
    assert data[0]["piso_nombre"] == "Tercer piso"
    assert data[0]["tipo_espacio"] == "Laboratorio"


def test_get_ubicaciones_filter_piso():
    conn = _mock_conn()
    conn.execute.return_value.fetchall.return_value = [_mock_row(**SAMPLE_ROW)]

    with patch("main.engine.connect", return_value=conn):
        response = client.get("/api/ubicaciones?piso_id=3")
    assert response.status_code == 200


def test_get_ubicaciones_filter_tipo():
    conn = _mock_conn()
    conn.execute.return_value.fetchall.return_value = []

    with patch("main.engine.connect", return_value=conn):
        response = client.get("/api/ubicaciones?tipo_id=1")
    assert response.status_code == 200


# ──────────────────────────────────────────────
#  Tests – GET /api/ubicaciones/{id}
# ──────────────────────────────────────────────
def test_get_ubicacion_found():
    conn = _mock_conn()
    conn.execute.return_value.fetchone.return_value = _mock_row(**SAMPLE_ROW)

    with patch("main.engine.connect", return_value=conn):
        response = client.get("/api/ubicaciones/1")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == 1
    assert data["nombre"] == "Laboratorio 301"
    assert data["capacidad"] == "30 personas"


def test_get_ubicacion_not_found():
    conn = _mock_conn()
    conn.execute.return_value.fetchone.return_value = None

    with patch("main.engine.connect", return_value=conn):
        response = client.get("/api/ubicaciones/9999")
    assert response.status_code == 404
    assert "no encontrada" in response.json()["detail"]


# ──────────────────────────────────────────────
#  Tests – POST /api/ubicaciones
# ──────────────────────────────────────────────
def test_create_ubicacion_success():
    conn = _mock_conn()
    # Simular: piso existe, tipo existe, INSERT retorna id, luego SELECT
    piso_row = _mock_row(id=2)
    tipo_row = _mock_row(id=1)
    insert_row = _mock_row(id=11)
    detail_row = _mock_row(
        id=11, nombre="Sala 204", descripcion="Nueva sala",
        capacidad="25 personas", piso_id=2, piso_nombre="Segundo piso",
        tipo_id=1, tipo_espacio="Sala de clases",
    )

    # Secuencia de execute calls
    conn.execute.side_effect = [
        MagicMock(fetchone=MagicMock(return_value=piso_row)),   # piso check
        MagicMock(fetchone=MagicMock(return_value=tipo_row)),   # tipo check
        MagicMock(fetchone=MagicMock(return_value=insert_row)), # INSERT RETURNING
        MagicMock(fetchone=MagicMock(return_value=detail_row)), # SELECT detalle
    ]

    with patch("main.engine.connect", return_value=conn):
        response = client.post("/api/ubicaciones", json={
            "nombre": "Sala 204",
            "descripcion": "Nueva sala",
            "capacidad": "25 personas",
            "piso_id": 2,
            "tipo_id": 1,
        })
    assert response.status_code == 201
    assert response.json()["nombre"] == "Sala 204"


def test_create_ubicacion_invalid_piso():
    conn = _mock_conn()
    conn.execute.return_value.fetchone.return_value = None  # piso no existe

    with patch("main.engine.connect", return_value=conn):
        response = client.post("/api/ubicaciones", json={
            "nombre": "Sala X",
            "piso_id": 999,
        })
    assert response.status_code == 400
    assert "piso" in response.json()["detail"].lower()


def test_create_ubicacion_missing_nombre():
    response = client.post("/api/ubicaciones", json={"piso_id": 1})
    assert response.status_code == 422  # Validation error


# ──────────────────────────────────────────────
#  Tests – PUT /api/ubicaciones/{id}
# ──────────────────────────────────────────────
def test_update_ubicacion_success():
    conn = _mock_conn()
    existing_row = _mock_row(id=1)
    updated_row = _mock_row(**{**SAMPLE_ROW, "nombre": "Lab 301 Renovado"})

    conn.execute.side_effect = [
        MagicMock(fetchone=MagicMock(return_value=existing_row)),  # exists check
        MagicMock(),                                                # UPDATE
        MagicMock(fetchone=MagicMock(return_value=updated_row)),   # SELECT detalle
    ]

    with patch("main.engine.connect", return_value=conn):
        response = client.put("/api/ubicaciones/1", json={"nombre": "Lab 301 Renovado"})
    assert response.status_code == 200
    assert response.json()["nombre"] == "Lab 301 Renovado"


def test_update_ubicacion_not_found():
    conn = _mock_conn()
    conn.execute.return_value.fetchone.return_value = None

    with patch("main.engine.connect", return_value=conn):
        response = client.put("/api/ubicaciones/9999", json={"nombre": "X"})
    assert response.status_code == 404


def test_update_ubicacion_empty_body():
    conn = _mock_conn()
    existing_row = _mock_row(id=1)
    conn.execute.return_value.fetchone.return_value = existing_row

    with patch("main.engine.connect", return_value=conn):
        response = client.put("/api/ubicaciones/1", json={})
    assert response.status_code == 400
    assert "al menos un campo" in response.json()["detail"].lower()


# ──────────────────────────────────────────────
#  Tests – DELETE /api/ubicaciones/{id}
# ──────────────────────────────────────────────
def test_delete_ubicacion_success():
    conn = _mock_conn()
    conn.execute.return_value.fetchone.return_value = _mock_row(id=1)

    with patch("main.engine.connect", return_value=conn):
        response = client.delete("/api/ubicaciones/1")
    assert response.status_code == 200
    assert "eliminada" in response.json()["message"]


def test_delete_ubicacion_not_found():
    conn = _mock_conn()
    conn.execute.return_value.fetchone.return_value = None

    with patch("main.engine.connect", return_value=conn):
        response = client.delete("/api/ubicaciones/9999")
    assert response.status_code == 404
