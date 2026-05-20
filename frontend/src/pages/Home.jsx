import { useNavigate } from 'react-router-dom'

function Home() {
  const navigate = useNavigate()

  return (
    <div className="page home">
      <h1>Duoc UC</h1>
      <h2>San Carlos de Apoquindo 2</h2>
      <p>Escanea un código QR ubicado en el edificio para obtener información de la sala o laboratorio.</p>
      <button onClick={() => navigate('/scanner')}>Escanear QR</button>
    </div>
  )
}

export default Home
