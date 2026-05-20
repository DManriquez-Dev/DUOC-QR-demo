import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Html5QrcodeScanner } from 'html5-qrcode'

const API_QR_URL = import.meta.env.VITE_API_QR_URL || 'http://localhost:8001'

function Scanner() {
  const navigate = useNavigate()
  const scannerRef = useRef(null)

  useEffect(() => {
    const scanner = new Html5QrcodeScanner('qr-reader', { fps: 10, qrbox: 250 })
    scannerRef.current = scanner

    scanner.render(
      async (decodedText) => {
        await scanner.clear()
        try {
          const res = await fetch(`${API_QR_URL}/api/qr/${encodeURIComponent(decodedText)}`)
          if (!res.ok) throw new Error('QR no válido')
          const data = await res.json()
          navigate(`/sala/${data.id}`)
        } catch {
          navigate('/error')
        }
      },
      () => {}
    )

    return () => {
      scannerRef.current?.clear().catch(() => {})
    }
  }, [navigate])

  return (
    <div className="page scanner">
      <h2>Escanear Código QR</h2>
      <p>Apunta la cámara al código QR de la sala.</p>
      <div id="qr-reader"></div>
      <button onClick={() => navigate('/')}>Volver</button>
    </div>
  )
}

export default Scanner
