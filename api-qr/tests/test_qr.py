from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from main import app

client = TestClient(app)


def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["service"] == "api-qr"


def test_qr_not_found():
    mock_conn = MagicMock()
    mock_conn.__enter__ = lambda s: s
    mock_conn.__exit__ = MagicMock(return_value=False)
    mock_conn.execute.return_value.fetchone.return_value = None

    with patch("main.engine.connect", return_value=mock_conn):
        response = client.get("/api/qr/CODIGO_INVALIDO")
    assert response.status_code == 404


def test_qr_found():
    mock_row = MagicMock()
    mock_row.id = 1
    mock_row.nombre = "Laboratorio 301"
    mock_row.piso = 3

    mock_conn = MagicMock()
    mock_conn.__enter__ = lambda s: s
    mock_conn.__exit__ = MagicMock(return_value=False)
    mock_conn.execute.return_value.fetchone.return_value = mock_row

    with patch("main.engine.connect", return_value=mock_conn):
        response = client.get("/api/qr/QR-LAB-301")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == 1
    assert data["piso"] == 3
