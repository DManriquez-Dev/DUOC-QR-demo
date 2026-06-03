# 🎯 Ejemplos de Uso Avanzado

## 📖 Tabla de Contenidos
1. [Usar Context en Componentes](#usar-context-en-componentes)
2. [Manejo de Errores Personalizado](#manejo-de-errores-personalizado)
3. [Integración con States Globales](#integración-con-states-globales)
4. [Testing de Componentes](#testing-de-componentes)

---

## Usar Context en Componentes

### Ejemplo 1: Componente que accede al estado compartido

```javascript
// CustomRoomDisplay.jsx
import { useQR } from '../hooks/useQR'

export function CustomRoomDisplay() {
  const { roomData, loading, error } = useQR()

  if (loading) return <p>Cargando...</p>
  if (error) return <p>Error: {error}</p>
  if (!roomData) return <p>Sin datos</p>

  return (
    <div className="custom-display">
      <h3>{roomData.nombre}</h3>
      <p>Piso: {roomData.piso}</p>
    </div>
  )
}
```

### Ejemplo 2: Componente que modifica el estado

```javascript
// RoomSelector.jsx
import { useQR } from '../hooks/useQR'
import { getRoomInfo } from '../services/apiService'

export function RoomSelector({ roomId }) {
  const { setRoom, setErrorMessage, setLoading } = useQR()

  const handleSelectRoom = async () => {
    setLoading(true)
    try {
      const data = await getRoomInfo(roomId)
      setRoom(data)
    } catch (err) {
      setErrorMessage(err.message)
    }
  }

  return (
    <button onClick={handleSelectRoom}>
      Cargar Sala {roomId}
    </button>
  )
}
```

---

## Manejo de Errores Personalizado

### Ejemplo 3: Retry automático con backoff

```javascript
// hooks/useQRWithRetry.js
import { useState } from 'react'
import { getQRData } from '../services/apiService'

export function useQRWithRetry(maxRetries = 3) {
  const [attempts, setAttempts] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)

  const scanWithRetry = async (qrContent) => {
    let lastError

    for (let i = 0; i < maxRetries; i++) {
      try {
        setAttempts(i + 1)
        setIsRetrying(i > 0)

        // Esperar exponencial entre reintentos
        if (i > 0) {
          await new Promise(resolve => 
            setTimeout(resolve, Math.pow(2, i) * 1000)
          )
        }

        return await getQRData(qrContent)
      } catch (err) {
        lastError = err
        console.warn(`Intento ${i + 1} falló:`, err.message)
      }
    }

    throw new Error(
      `Falló tras ${maxRetries} intentos: ${lastError.message}`
    )
  }

  return { scanWithRetry, attempts, isRetrying }
}
```

### Ejemplo 4: Mensajes de error traducibles

```javascript
// utils/errorMessages.js
export const ERROR_MESSAGES = {
  CAMERA_DENIED: 'La aplicación no tiene permiso para usar la cámara. Verifica los permisos del navegador.',
  QR_INVALID: 'El código QR no es válido o no pertenece a esta sede.',
  QR_EXPIRED: 'El código QR ha expirado. Contacta al administrador.',
  NETWORK_ERROR: 'Error de conexión. Verifica tu conexión a internet.',
  API_TIMEOUT: 'El servidor tardó mucho tiempo. Intenta de nuevo.',
  NOT_FOUND: 'La sala no existe en el sistema.',
  SERVER_ERROR: 'Error en el servidor. Por favor intenta más tarde.',
  UNKNOWN: 'Ha ocurrido un error desconocido.'
}

// services/apiService.js - mejorado
export async function getQRData(qrContent) {
  try {
    // ...código...
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(ERROR_MESSAGES.API_TIMEOUT)
    }
    if (err instanceof TypeError) {
      throw new Error(ERROR_MESSAGES.NETWORK_ERROR)
    }
    throw new Error(ERROR_MESSAGES[err.code] || ERROR_MESSAGES.UNKNOWN)
  }
}
```

---

## Integración con States Globales

### Ejemplo 5: Redux Integration (si usas Redux)

```javascript
// store/qrSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import * as apiService from '../services/apiService'

export const fetchQRData = createAsyncThunk(
  'qr/fetchData',
  async (qrContent) => {
    return await apiService.getQRData(qrContent)
  }
)

const qrSlice = createSlice({
  name: 'qr',
  initialState: {
    roomData: null,
    loading: false,
    error: null
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchQRData.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchQRData.fulfilled, (state, action) => {
        state.loading = false
        state.roomData = action.payload
      })
      .addCase(fetchQRData.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message
      })
  }
})

export default qrSlice.reducer
```

### Ejemplo 6: Recoil Integration (alternativa moderna)

```javascript
// atoms/qrAtoms.js
import { atom } from 'recoil'

export const roomDataAtom = atom({
  key: 'roomData',
  default: null
})

export const qrLoadingAtom = atom({
  key: 'qrLoading',
  default: false
})

export const qrErrorAtom = atom({
  key: 'qrError',
  default: null
})

// pages/Scanner.jsx con Recoil
import { useSetRecoilState } from 'recoil'
import { roomDataAtom, qrLoadingAtom, qrErrorAtom } from '../atoms/qrAtoms'

function Scanner() {
  const setRoomData = useSetRecoilState(roomDataAtom)
  const setLoading = useSetRecoilState(qrLoadingAtom)
  const setError = useSetRecoilState(qrErrorAtom)

  // Usar en el scanner...
}
```

---

## Testing de Componentes

### Ejemplo 7: Tests con Vitest + React Testing Library

```javascript
// pages/Scanner.test.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QRProvider } from '../context/QRContext'
import Scanner from './Scanner'

// Mock de html5-qrcode
vi.mock('html5-qrcode', () => ({
  Html5QrcodeScanner: vi.fn(() => ({
    render: vi.fn(),
    clear: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn()
  }))
}))

describe('Scanner Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('debe renderizar el título correcto', () => {
    render(
      <BrowserRouter>
        <QRProvider>
          <Scanner />
        </QRProvider>
      </BrowserRouter>
    )

    expect(screen.getByText('Escanear Código QR')).toBeInTheDocument()
  })

  it('debe mostrar botón volver', () => {
    render(
      <BrowserRouter>
        <QRProvider>
          <Scanner />
        </QRProvider>
      </BrowserRouter>
    )

    const button = screen.getByText('Volver')
    expect(button).toBeInTheDocument()
    expect(button).not.toBeDisabled()
  })

  it('debe mostrar overlay de loading cuando isLoading es true', async () => {
    // Simulación de estado de loading
    render(
      <BrowserRouter>
        <QRProvider>
          <Scanner />
        </QRProvider>
      </BrowserRouter>
    )

    // Triggerear el loading state
    // ...
    // expect(screen.getByText('Procesando código QR...')).toBeInTheDocument()
  })
})
```

### Ejemplo 8: Tests de API Service

```javascript
// services/apiService.test.js
import { describe, it, expect, vi } from 'vitest'
import * as apiService from './apiService'

// Mock de fetch
global.fetch = vi.fn()

describe('apiService', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('getQRData debe lanzar error si QR está vacío', async () => {
    await expect(apiService.getQRData('')).rejects.toThrow()
  })

  it('getQRData debe hacer request a la URL correcta', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 123 })
    })

    const result = await apiService.getQRData('SALA-001')
    
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/qr/SALA-001'),
      expect.any(Object)
    )
    expect(result.id).toBe(123)
  })

  it('debe manejar errors de timeout', async () => {
    global.fetch.mockImplementation(() => {
      throw new Error('AbortError')
    })

    await expect(apiService.getQRData('SALA-001')).rejects.toThrow(
      /tardó demasiado tiempo/
    )
  })
})
```

---

## Ejemplo 9: Componente Wrapper para Reutilización

```javascript
// components/QRScanner/QRScanner.jsx
import { useEffect, useRef, useState } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { getQRData } from '../../services/apiService'

export function QRScanner({
  onSuccess,    // Callback: (data) => {}
  onError,      // Callback: (error) => {}
  onLoading,    // Callback: (isLoading) => {}
  scannerConfig = {} // Config adicional
}) {
  const scannerRef = useRef(null)
  const [isScanning, setIsScanning] = useState(true)

  useEffect(() => {
    if (!isScanning) return

    const config = {
      fps: 10,
      qrbox: 250,
      rememberLastUsedCamera: true,
      ...scannerConfig
    }

    const scanner = new Html5QrcodeScanner('qr-reader', config, false)
    scannerRef.current = scanner

    scanner.render(
      async (decodedText) => {
        setIsScanning(false)
        onLoading?.(true)

        try {
          const data = await getQRData(decodedText)
          onSuccess?.(data)
        } catch (err) {
          onError?.(err)
          setIsScanning(true)
          await scanner.resume().catch(() => {})
        } finally {
          onLoading?.(false)
        }
      },
      () => {}
    )

    return () => {
      scanner.clear().catch(() => {})
    }
  }, [isScanning, onSuccess, onError, onLoading, scannerConfig])

  return <div id="qr-reader" />
}

// Uso en Scanner.jsx
import { QRScanner } from '../../components/QRScanner/QRScanner'

function Scanner() {
  const handleQRSuccess = (data) => {
    navigate(`/sala/${data.id}`)
  }

  const handleQRError = (error) => {
    setError(error.message)
  }

  return (
    <div className="scanner">
      <h2>Escanear QR</h2>
      <QRScanner
        onSuccess={handleQRSuccess}
        onError={handleQRError}
        onLoading={setIsLoading}
        scannerConfig={{ fps: 10, qrbox: 300 }}
      />
    </div>
  )
}
```

### Ejemplo 10: Hook Personalizado para Validación de QR

```javascript
// hooks/useQRValidation.js
import { useState } from 'react'
import { getQRData } from '../services/apiService'

export function useQRValidation() {
  const [validationResult, setValidationResult] = useState(null)
  const [isValidating, setIsValidating] = useState(false)
  const [error, setError] = useState(null)

  const validateQR = async (qrContent) => {
    setIsValidating(true)
    setError(null)

    try {
      // Validaciones básicas
      if (!qrContent || qrContent.trim().length === 0) {
        throw new Error('QR vacío')
      }

      if (qrContent.length > 500) {
        throw new Error('QR demasiado largo')
      }

      // Validación con API
      const result = await getQRData(qrContent)

      // Validaciones adicionales
      if (!result.id || !Number.isInteger(result.id)) {
        throw new Error('ID de QR inválido')
      }

      setValidationResult(result)
      return result
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setIsValidating(false)
    }
  }

  const reset = () => {
    setValidationResult(null)
    setError(null)
    setIsValidating(false)
  }

  return {
    validateQR,
    validationResult,
    isValidating,
    error,
    reset
  }
}
```

---

## 📚 Más Recursos

- [React Context Docs](https://react.dev/reference/react/useContext)
- [html5-qrcode Docs](https://github.com/mebjas/html5-qrcode)
- [React Router Docs](https://reactrouter.com)
- [Vitest Testing](https://vitest.dev)

---

**Última actualización:** Junio 2024  
**Versión:** 1.0
