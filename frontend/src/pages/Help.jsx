import { useNavigate } from 'react-router-dom'

function Help() {
  const navigate = useNavigate()

  return (
    <div className="page help-page">
      <h2>Ayuda</h2>
      <p>Si tienes problemas para escanear un código QR, revisa la iluminación y mantén la cámara estable. Asegúrate de permitir el acceso a la cámara cuando el navegador lo solicite.</p>

      <div className="info-card">
        <p><strong>Escáner:</strong> Usa la opción "Escáner" en el menú para abrir la cámara.</p>
        <p><strong>Ubicaciones:</strong> Si necesitas ver la ubicación de una sala manualmente, busca la sala por su código en el personal de soporte.</p>
      </div>

      <div className="help-actions">
        <button className="btn btn-celeste" onClick={() => navigate('/scanner')}>Ir al Escáner</button>
        <button className="btn btn-morado" onClick={() => navigate('/')}>Volver al Inicio</button>
      </div>
    </div>
  )
}

export default Help
