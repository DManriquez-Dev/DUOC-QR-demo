# Sistema QR Inteligente — Duoc UC San Carlos de Apoquindo 2

Proyecto EA3 · Software Factory FullStack · Arquitectura de Microservicios

## Estructura del proyecto

```
qr-duoc-sca2/
├── docker-compose.yml
├── .env.example
├── database/
│   └── init.sql              # Esquema y datos semilla
├── api-qr/                   # Microservicio QR (puerto 8001)
│   ├── main.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── tests/
├── api-ubicacion/            # Microservicio Ubicación (puerto 8002)
│   ├── main.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── tests/
└── frontend/                 # React + Vite (puerto 5173)
    ├── index.html
    ├── vite.config.js
    ├── package.json
    ├── Dockerfile
    └── src/
        ├── App.jsx
        ├── App.css
        └── pages/
            ├── Home.jsx
            ├── Scanner.jsx
            ├── RoomInfo.jsx
            └── ErrorQR.jsx
```

## Levantar con Docker Compose

```bash
# Copiar variables de entorno
cp .env.example .env

# Construir e iniciar todos los servicios
docker compose up --build
```

| Servicio       | URL                          |
|----------------|------------------------------|
| Frontend       | http://localhost:5173        |
| API QR         | http://localhost:8001/docs   |
| API Ubicación  | http://localhost:8002/docs   |
| PostgreSQL     | localhost:5432               |

## Endpoints

### API QR
| Método | Ruta             | Descripción                        |
|--------|------------------|------------------------------------|
| GET    | `/api/qr/{code}` | Retorna id, nombre y piso del QR   |

### API Ubicación
| Método | Ruta                    | Descripción                        |
|--------|-------------------------|------------------------------------|
| GET    | `/api/ubicaciones`      | Lista todas las ubicaciones        |
| GET    | `/api/ubicaciones/{id}` | Detalle de una ubicación           |

## Ejecutar tests

```bash
cd api-qr
pip install -r requirements.txt
pytest tests/

cd ../api-ubicacion
pip install -r requirements.txt
pytest tests/
```

## Stack tecnológico

- **Frontend:** React 18 + Vite + html5-qrcode
- **Backend:** Python 3.11 + FastAPI + SQLAlchemy
- **Base de datos:** PostgreSQL 15
- **DevOps:** Docker + Docker Compose
- **Testing:** Pytest + Postman
