import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      <main className="home-container">
        
        <header className="hero-section">
          <span>Duoc UC</span>
          <h1>San Carlos de Apoquindo</h1>
          <p>Usa este sistema interactivo para obtener información de las salas o laboratorios del edificio.</p>
        </header>

        <section className="actions-grid">
          
          <div className="action-card card-celeste">
            <div className="card-icon">📷</div>
            <h3>Escanear Código QR</h3>
            <p>Apunta con la cámara a los códigos QR ubicados en las puertas de las salas.</p>
            <button className="btn btn-celeste" onClick={() => navigate('/scanner')}>
              Iniciar Escáner
            </button>
          </div>

          <div className="action-card card-morado">
            <div className="card-icon">🗺️</div>
            <h3>Ver Ubicaciones</h3>
            <p>Explora el listado completo y la ubicación de las salas manualmente.</p>
            <button className="btn btn-morado" onClick={() => navigate('/roominfo')}>
              Explorar Mapa
            </button>
          </div>

        </section>
      </main>
    </div>
  );
}

export default Home;