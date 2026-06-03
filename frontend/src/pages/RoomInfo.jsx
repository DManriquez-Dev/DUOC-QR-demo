import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

const API_UBICACION_URL = import.meta.env.VITE_API_UBICACION_URL || 'http://localhost:8002'

function RoomInfo() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [info, setInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchRoomInfo = async () => {
      try {
        setLoading(true)
        setError(null)

        const res = await fetch(`${API_UBICACION_URL}/api/ubicaciones/${id}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        })

        if (!res.ok) {
          throw new Error(
            res.status === 404 
              ? 'Sala no encontrada en la base de datos'
              : `Error del servidor (${res.status})`
          )
        }

        const data = await res.json()
        setInfo(data)
      } catch (err) {
        console.error('Error al obtener información:', err)
        setError(err.message || 'Error al cargar la información de la sala')
      } finally {
        setLoading(false)
      }
    }

    fetchRoomInfo()
  }, [id])

  if (loading) {
    return (
      <div className="page loading-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Cargando información de la sala...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page error-page">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h2>Error al cargar información</h2>
          <p>{error}</p>
          <div className="error-actions">
            <button 
              className="btn btn-primary" 
              onClick={() => navigate('/scanner')}
            >
              Escanear otro QR
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => navigate('/')}
            >
              Ir al inicio
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!info) {
    return (
      <div className="page error-page">
        <p>No hay información disponible</p>
      </div>
    )
  }

  return (
    <div className="page room-info">
      <div className="room-container">
        {/* HERO SECTION CON GRADIENTE */}
        <div className="room-hero">
          <div className="hero-backdrop"></div>
          <div className="hero-content">
            <div className="room-icon-large">🏛️</div>
            <h1 className="room-title">{info.nombre || 'Sala sin nombre'}</h1>
            <p className="room-type">{info.tipo_espacio || 'Espacio'}</p>
          </div>
        </div>

        {/* GRID DE INFORMACIÓN */}
        <div className="room-grid">
          {/* TARJETA: UBICACIÓN */}
          <div className="info-card-premium">
            <div className="card-header-premium">
              <span className="card-icon">📍</span>
              <h3>Ubicación</h3>
            </div>
            <div className="card-body-premium">
              <p className="info-label">Piso</p>
              <p className="info-value">{info.piso_nombre || `Piso ${info.piso_id}` || 'No especificado'}</p>
            </div>
          </div>

          {/* TARJETA: CAPACIDAD */}
          {info.capacidad && (
            <div className="info-card-premium">
              <div className="card-header-premium">
                <span className="card-icon">👥</span>
                <h3>Capacidad</h3>
              </div>
              <div className="card-body-premium">
                <p className="info-value-large">{info.capacidad}</p>
              </div>
            </div>
          )}

          {/* TARJETA: TIPO DE ESPACIO */}
          {info.tipo_espacio && (
            <div className="info-card-premium">
              <div className="card-header-premium">
                <span className="card-icon">🏢</span>
                <h3>Tipo</h3>
              </div>
              <div className="card-body-premium">
                <p className="info-value">{info.tipo_espacio}</p>
              </div>
            </div>
          )}
        </div>

        {/* DESCRIPCIÓN - TARJETA GRANDE */}
        <div className="description-card-premium">
          <div className="desc-header-premium">
            <span className="desc-icon">📋</span>
            <h3>Descripción</h3>
          </div>
          <p className="desc-text-premium">{info.descripcion || 'Sin descripción disponible'}</p>
        </div>

        {/* CÓDIGO QR - TARJETA DESTACADA */}
        <div className="qr-card-premium">
          <div className="qr-header-premium">
            <span className="qr-icon">🔐</span>
            <h3>Identificador QR</h3>
          </div>
          <div className="qr-display">
            <code className="qr-code-text">{info.qr_code || id}</code>
          </div>
          <p className="qr-hint">Código único de esta sala</p>
        </div>

        {/* RECURSOS (si existen) */}
        {info.recursos && (
          <div className="resources-card-premium">
            <div className="resources-header">
              <span className="resources-icon">🛠️</span>
              <h3>Recursos Disponibles</h3>
            </div>
            <p className="resources-text">{info.recursos}</p>
          </div>
        )}

        {/* BOTONES DE ACCIÓN */}
        <div className="room-actions-premium">
          <button 
            className="btn btn-primary" 
            onClick={() => navigate('/scanner')}
          >
            Escanear otro QR
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={() => navigate('/')}
          >
            🏠 Ir al inicio
          </button>
        </div>
      </div>
    </div>
  )
}

export default RoomInfo
