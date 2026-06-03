import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'

const API_QR_URL = import.meta.env.VITE_API_QR_URL || 'http://localhost:8001'

function Scanner() {
  const navigate = useNavigate()
  const html5QrCodeRef = useRef(null)
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isCameraActive, setIsCameraActive] = useState(false)
  
  const isMountedRef = useRef(true)
  const qrRegionId = "html5qr-code-full-region"

  useEffect(() => {
    isMountedRef.current = true
    
    // Inicializamos el objeto avanzado de html5-qrcode
    const html5QrCode = new Html5Qrcode(qrRegionId)
    html5QrCodeRef.current = html5QrCode

    // Intentamos arrancar la cámara de manera automática al entrar
    startCameraScanner(html5QrCode)

    return () => {
      isMountedRef.current = false
      // Apagado seguro de flujos de video si se sale de la vista
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(() => {})
      }
    }
  }, [navigate])

  // Lógica unificada para consumir tu API (sirve para cámara y para imágenes subidas)
  const processDecodedQr = async (decodedText) => {
    if (!isMountedRef.current || isLoading) return

    setIsLoading(true)
    setError(null)

    try {
      // Detenemos la cámara si está activa para que no siga consumiendo recursos
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        await html5QrCodeRef.current.stop()
        if (isMountedRef.current) setIsCameraActive(false)
      }

      // Tu petición fetch exacta
      const res = await fetch(`${API_QR_URL}/api/qr/${encodeURIComponent(decodedText)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!res.ok) {
        throw new Error(`Error ${res.status}: QR no válido o expirado en el sistema`)
      }

      const data = await res.json()

      if (isMountedRef.current) {
        navigate(`/sala/${data.id}`, { replace: true })
      }
    } catch (err) {
      console.error('Error al procesar QR:', err)
      if (isMountedRef.current) {
        setError(err.message || 'Error al procesar el código QR')
        setIsLoading(false)
        // Intentamos reactivar la cámara de pruebas tras un error si estaba usándose
        startCameraScanner()
      }
    }
  }

  // Función para encender la cámara web
  const startCameraScanner = (instance = html5QrCodeRef.current) => {
    if (!instance) return
    setError(null)

    instance.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: 250 },
      (decodedText) => {
        processDecodedQr(decodedText)
      },
      () => {
        // Errores de escaneo de cuadros vacíos silenciosos
      }
    )
    .then(() => {
      if (isMountedRef.current) setIsCameraActive(true)
    })
    .catch((err) => {
      console.warn('Cámara no iniciada/no disponible:', err)
      if (isMountedRef.current) {
        setIsCameraActive(false)
        // No bloqueamos la UI con un error crítico porque puede subir imágenes
      }
    })
  }

  // 📁 NUEVO: Lógica encargada de procesar archivos locales cargados desde la PC
  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file || !html5QrCodeRef.current) return

    setError(null)
    try {
      // Si la cámara web estaba encendida y el usuario prefiere subir un archivo, la paramos
      if (html5QrCodeRef.current.isScanning) {
        await html5QrCodeRef.current.stop()
        setIsCameraActive(false)
      }

      // Escanea la imagen local directamente
      const decodedText = await html5QrCodeRef.current.scanFile(file, true)
      processDecodedQr(decodedText)
    } catch (err) {
      console.error("Error al leer archivo QR:", err)
      setError("No se detectó ningún código QR en la imagen seleccionada.")
    }
  }

  return (
    <div className="page scanner">
      <h2>Escanear Código QR</h2>
      <p>Usa tu cámara web o carga un archivo de imagen de prueba desde tu PC.</p>

      {/* Caja de subida de archivos (Exclusiva para tus pruebas de desarrollo) */}
      <div className="file-tester-box" style={{
        backgroundColor: '#1b222d',
        border: '2px dashed #00bfff',
        borderRadius: '8px',
        padding: '15px',
        marginBottom: '20px',
        textAlign: 'center'
      }}>
        <label htmlFor="file-qr" style={{ color: '#00bfff', display: 'block', marginBottom: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
          📂 Simular prueba: Cargar Imagen QR (.png/.jpg)
        </label>
        <input 
          id="file-qr"
          type="file" 
          accept="image/*" 
          onChange={handleFileUpload} 
          disabled={isLoading}
        />
      </div>

      {error && (
        <div className="error-banner">
          <p>⚠️ {error}</p>
          {!isCameraActive && (
            <button className="btn btn-secondary" onClick={() => startCameraScanner()}>
              Intentar activar cámara de nuevo
            </button>
          )}
        </div>
      )}

      {isLoading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Procesando código QR...</p>
        </div>
      )}

      {/* Contenedor del visor de cámara */}
      <div id={qrRegionId} style={{ width: '100%', maxWidth: '500px', margin: '0 auto', background: '#000', borderRadius: '6px' }}></div>

      <div className="scanner-actions" style={{ marginTop: '20px' }}>
        <button 
          className="btn btn-primary" 
          onClick={() => navigate('/')}
          disabled={isLoading}
        >
          Volver
        </button>
      </div>
    </div>
  )
}

export default Scanner