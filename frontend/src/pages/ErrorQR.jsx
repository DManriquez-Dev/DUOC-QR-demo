import { useNavigate, useLocation } from 'react-router-dom'

function ErrorQR() {
  const navigate = useNavigate()
  const location = useLocation()
  const errorMessage = location.state?.message || 'No se encontró información para este código QR'

  return (
    <div className="page error-page">
      <div className="error-container">
        <div className="error-icon">❌</div>
        <h2>Código QR no válido</h2>
        <p className="error-description">{errorMessage}</p>

        <div className="error-suggestions">
          <h3>Posibles causas:</h3>
          <ul>
            <li>El código QR está deteriorado o no es legible</li>
            <li>El código QR ha expirado</li>
            <li>Es un código QR de otra sede o sistema</li>
            <li>Problema temporal de conexión con el servidor</li>
          </ul>
        </div>

        <div className="error-actions">
          <button 
            className="btn btn-primary" 
            onClick={() => navigate('/scanner')}
          >
            🔄 Intentar de nuevo
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={() => navigate('/')}
          >
            🏠 Ir al inicio
          </button>
          <button 
            className="btn btn-outline" 
            onClick={() => navigate('/help')}
          >
            ❓ Ver ayuda
          </button>
        </div>
      </div>
    </div>
  )
}

export default ErrorQR
