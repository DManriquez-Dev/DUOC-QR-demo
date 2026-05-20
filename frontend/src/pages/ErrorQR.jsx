import { useNavigate } from 'react-router-dom'

function ErrorQR() {
  const navigate = useNavigate()

  return (
    <div className="page error">
      <h2>QR no válido</h2>
      <p>No se encontró información para este código QR. Asegúrate de escanear un código válido de la sede.</p>
      <button onClick={() => navigate('/scanner')}>Intentar de nuevo</button>
      <button onClick={() => navigate('/')}>Ir al inicio</button>
    </div>
  )
}

export default ErrorQR
