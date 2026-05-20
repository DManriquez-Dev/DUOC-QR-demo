import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

const API_UBICACION_URL = import.meta.env.VITE_API_UBICACION_URL || 'http://localhost:8002'

function RoomInfo() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [info, setInfo] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_UBICACION_URL}/api/ubicaciones/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error()
        return res.json()
      })
      .then(setInfo)
      .catch(() => navigate('/error'))
      .finally(() => setLoading(false))
  }, [id, navigate])

  if (loading) {
    return (
      <div className="page">
        <p>Cargando información...</p>
      </div>
    )
  }

  return (
    <div className="page room-info">
      <h2>{info.nombre}</h2>
      <div className="info-card">
        <p><strong>Piso:</strong> {info.piso}</p>
        <p><strong>Descripción:</strong> {info.descripcion}</p>
        <p><strong>Código QR:</strong> {info.qr_code}</p>
      </div>
      <button onClick={() => navigate('/scanner')}>Escanear otro QR</button>
      <button onClick={() => navigate('/')}>Ir al inicio</button>
    </div>
  )
}

export default RoomInfo
