import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Html5QrcodeScanner } from 'html5-qrcode'

const API_QR_URL = import.meta.env.VITE_API_QR_URL || 'http://localhost:8001'

function Scanner() {
  const navigate = useNavigate()
  const scannerRef = useRef(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    let scanner = null

    try {
      scanner = new Html5QrcodeScanner(
        'qr-reader',
        { 
          fps: 10, 
          qrbox: 250,
          rememberLastUsedCamera: true,
          supportedScanTypes: ['SCAN_TYPE_CAMERA']
        },
        false
      )
      scannerRef.current = scanner

      scanner.render(
        async (decodedText) => {
          if (!isMountedRef.current || isLoading) return

          setIsLoading(true)
          setError(null)

          try {
            await scanner.pause()

            const res = await fetch(`${API_QR_URL}/api/qr/${encodeURIComponent(decodedText)}`, {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
              timeout: 5000
            })

            if (!res.ok) {
              throw new Error(`Error ${res.status}: QR no válido o expirado`)
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
              await scanner.resume().catch(() => {})
            }
          }
        },
        (err) => {
          // Errores de lectura silenciosos (no interfieren con el flujo)
          console.debug('Error de lectura QR:', err)
        }
      )
    } catch (err) {
      console.error('Error al inicializar scanner:', err)
      setError('No se pudo acceder a la cámara. Verifica los permisos.')
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(() => {})
      }
    }
  }, [navigate, isLoading])

  const handleRetry = async () => {
    setError(null)
    setIsLoading(false)
    if (scannerRef.current) {
      try {
        await scannerRef.current.resume()
      } catch (err) {
        console.error('Error al reintentar:', err)
      }
    }
  }

  return (
    <div className="page scanner">
      <h2>Escanear Código QR</h2>
      <p>Apunta la cámara al código QR de la sala.</p>

      {error && (
        <div className="error-banner">
          <p>⚠️ {error}</p>
          <button className="btn btn-secondary" onClick={handleRetry}>
            Reintentar
          </button>
        </div>
      )}

      {isLoading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Procesando código QR...</p>
        </div>
      )}

      <div id="qr-reader" style={{ width: '100%', maxWidth: '500px', margin: '0 auto' }}></div>

      <div className="scanner-actions">
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
