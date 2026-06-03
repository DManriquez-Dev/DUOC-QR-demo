/**
 * Scanner.test.jsx
 *
 * Suite de tests unitarios/integración para el componente Scanner.
 *
 * Cobertura:
 *  - Renderizado inicial
 *  - Inicialización del escáner QR (Html5QrcodeScanner)
 *  - Flujo exitoso de escaneo (API OK → navegación)
 *  - Estado de carga (overlay + botón Volver deshabilitado)
 *  - Errores de API (4xx / 5xx) y de red
 *  - Botón "Volver"
 *  - Botón "Reintentar"
 *  - Error de acceso a cámara
 */
 
import { describe, it, expect, vi, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
 
// Ajusta la ruta según la estructura real del proyecto
import Scanner from '../pages/Scanner'
import { server, } from '../mocks/server'
import { API_QR_URL } from '../mocks/handlers'
 
/* ─────────────────────────────────────────────────────────────────────────────
   MOCKS GLOBALES
   ───────────────────────────────────────────────────────────────────────────── */
 
// ── react-router-dom ──────────────────────────────────────────────────────────
const mockNavigate = vi.fn()
 
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})
 
// ── html5-qrcode ──────────────────────────────────────────────────────────────
// Almacenamos los callbacks que el componente pasa a scanner.render()
// para poder disparar escaneos manualmente en los tests.
let capturedOnSuccess = null
let capturedOnError   = null
 
const mockInstance = {
  render: vi.fn((onSuccess, onError) => {
    capturedOnSuccess = onSuccess
    capturedOnError   = onError
  }),
  clear:  vi.fn().mockResolvedValue(undefined),
  pause:  vi.fn().mockResolvedValue(undefined),
  resume: vi.fn().mockResolvedValue(undefined),
}
 
const MockHtml5QrcodeScanner = vi.fn(() => mockInstance)
 
vi.mock('html5-qrcode', () => ({
  Html5QrcodeScanner: MockHtml5QrcodeScanner,
}))
 
/* ─────────────────────────────────────────────────────────────────────────────
   HELPERS
   ───────────────────────────────────────────────────────────────────────────── */
 
/** Renderiza Scanner dentro de un router de memoria */
function renderScanner() {
  return render(
    <MemoryRouter>
      <Scanner />
    </MemoryRouter>
  )
}
 
/**
 * Simula que el lector QR detecta un código y dispara el callback de éxito.
 * Devuelve la promesa de act para que los tests puedan hacer await.
 */
async function simulateScan(qrText = 'qr-test') {
  await act(async () => {
    await capturedOnSuccess(qrText)
  })
}
 
/* ─────────────────────────────────────────────────────────────────────────────
   CICLO DE VIDA DEL SERVIDOR MSW
   ───────────────────────────────────────────────────────────────────────────── */
 
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
 
afterEach(() => {
  server.resetHandlers()     // Limpia overrides de cada test
  vi.clearAllMocks()         // Resetea contadores y llamadas
  capturedOnSuccess = null
  capturedOnError   = null
})
 
afterAll(() => server.close())
 
/* ─────────────────────────────────────────────────────────────────────────────
   TESTS
   ───────────────────────────────────────────────────────────────────────────── */
 
// ══════════════════════════════════════════════════════════════════════════════
describe('Scanner — renderizado inicial', () => {
// ══════════════════════════════════════════════════════════════════════════════
 
  it('muestra el título "Escanear Código QR"', () => {
    renderScanner()
    expect(
      screen.getByRole('heading', { name: /escanear código qr/i })
    ).toBeInTheDocument()
  })
 
  it('muestra el texto de instrucción de la cámara', () => {
    renderScanner()
    expect(
      screen.getByText(/apunta la cámara al código qr de la sala/i)
    ).toBeInTheDocument()
  })
 
  it('renderiza el contenedor del lector con id="qr-reader"', () => {
    renderScanner()
    expect(document.getElementById('qr-reader')).toBeInTheDocument()
  })
 
  it('muestra el botón "Volver" habilitado', () => {
    renderScanner()
    expect(screen.getByRole('button', { name: /volver/i })).toBeEnabled()
  })
 
  it('NO muestra el banner de error en el estado inicial', () => {
    renderScanner()
    expect(screen.queryByText(/⚠️/)).not.toBeInTheDocument()
  })
 
  it('NO muestra el overlay de carga en el estado inicial', () => {
    renderScanner()
    expect(screen.queryByText(/procesando código qr/i)).not.toBeInTheDocument()
  })
})
 
// ══════════════════════════════════════════════════════════════════════════════
describe('Scanner — inicialización de Html5QrcodeScanner', () => {
// ══════════════════════════════════════════════════════════════════════════════
 
  it('crea el escáner con el id de elemento "qr-reader"', () => {
    renderScanner()
    expect(MockHtml5QrcodeScanner).toHaveBeenCalledWith(
      'qr-reader',
      expect.any(Object),
      false
    )
  })
 
  it('configura fps = 10 y qrbox = 250', () => {
    renderScanner()
    const [, config] = MockHtml5QrcodeScanner.mock.calls[0]
    expect(config).toMatchObject({ fps: 10, qrbox: 250 })
  })
 
  it('llama a scanner.render() pasando callback de éxito y de error', () => {
    renderScanner()
    expect(mockInstance.render).toHaveBeenCalledWith(
      expect.any(Function), // onSuccess
      expect.any(Function)  // onError
    )
  })
 
  it('invoca scanner.clear() al desmontar el componente', () => {
    const { unmount } = renderScanner()
    unmount()
    expect(mockInstance.clear).toHaveBeenCalledOnce()
  })
})
 
// ══════════════════════════════════════════════════════════════════════════════
describe('Scanner — escaneado exitoso', () => {
// ══════════════════════════════════════════════════════════════════════════════
 
  beforeEach(() => {
    server.use(
      http.get(`${API_QR_URL}/api/qr/:qrCode`, () =>
        HttpResponse.json({ id: 'sala-99' })
      )
    )
  })
 
  it('navega a /sala/:id cuando la API confirma el QR', async () => {
    renderScanner()
    await simulateScan('qr-valido')
 
    expect(mockNavigate).toHaveBeenCalledWith('/sala/sala-99', { replace: true })
  })
 
  it('llama a fetch con el texto del QR codificado en la URL', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    renderScanner()
 
    const qrRaw = 'Sala Principal & Edificio A'
    await simulateScan(qrRaw)
 
    expect(fetchSpy).toHaveBeenCalledWith(
      `${API_QR_URL}/api/qr/${encodeURIComponent(qrRaw)}`,
      expect.objectContaining({ method: 'GET' })
    )
  })
 
  it('pausa el escáner antes de consultar la API', async () => {
    renderScanner()
    await simulateScan('qr-valido')
 
    expect(mockInstance.pause).toHaveBeenCalledOnce()
  })
})
 
// ══════════════════════════════════════════════════════════════════════════════
describe('Scanner — estado de carga', () => {
// ══════════════════════════════════════════════════════════════════════════════
 
  it('muestra el overlay "Procesando código QR..." mientras espera la API', async () => {
    // Petición que nunca resuelve → mantiene isLoading = true
    server.use(
      http.get(`${API_QR_URL}/api/qr/:qrCode`, () => new Promise(() => {}))
    )
 
    renderScanner()
 
    // No hacemos await para capturar el estado intermedio
    act(() => { capturedOnSuccess('qr-test') })
 
    await waitFor(() =>
      expect(screen.getByText(/procesando código qr\.\.\./i)).toBeInTheDocument()
    )
  })
 
  it('deshabilita el botón "Volver" mientras procesa el QR', async () => {
    server.use(
      http.get(`${API_QR_URL}/api/qr/:qrCode`, () => new Promise(() => {}))
    )
 
    renderScanner()
    act(() => { capturedOnSuccess('qr-test') })
 
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /volver/i })).toBeDisabled()
    )
  })
})
 
// ══════════════════════════════════════════════════════════════════════════════
describe('Scanner — error de API (respuesta HTTP no OK)', () => {
// ══════════════════════════════════════════════════════════════════════════════
 
  it('muestra el banner de error con el código 404', async () => {
    server.use(
      http.get(`${API_QR_URL}/api/qr/:qrCode`, () =>
        new HttpResponse(null, { status: 404 })
      )
    )
 
    renderScanner()
    await simulateScan('qr-inexistente')
 
    await waitFor(() =>
      expect(
        screen.getByText(/error 404: qr no válido o expirado/i)
      ).toBeInTheDocument()
    )
  })
 
  it('muestra el banner de error con el código 500', async () => {
    server.use(
      http.get(`${API_QR_URL}/api/qr/:qrCode`, () =>
        new HttpResponse(null, { status: 500 })
      )
    )
 
    renderScanner()
    await simulateScan('qr-error-servidor')
 
    await waitFor(() =>
      expect(screen.getByText(/error 500/i)).toBeInTheDocument()
    )
  })
 
  it('muestra el botón "Reintentar" tras un error de API', async () => {
    server.use(
      http.get(`${API_QR_URL}/api/qr/:qrCode`, () =>
        new HttpResponse(null, { status: 404 })
      )
    )
 
    renderScanner()
    await simulateScan('qr-invalido')
 
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument()
    )
  })
 
  it('reanuda el escáner después del error', async () => {
    server.use(
      http.get(`${API_QR_URL}/api/qr/:qrCode`, () =>
        new HttpResponse(null, { status: 404 })
      )
    )
 
    renderScanner()
    await simulateScan('qr-invalido')
 
    await waitFor(() =>
      expect(mockInstance.resume).toHaveBeenCalledOnce()
    )
  })
 
  it('oculta el overlay de carga después del error', async () => {
    server.use(
      http.get(`${API_QR_URL}/api/qr/:qrCode`, () =>
        new HttpResponse(null, { status: 404 })
      )
    )
 
    renderScanner()
    await simulateScan('qr-invalido')
 
    await waitFor(() =>
      expect(screen.queryByText(/procesando código qr/i)).not.toBeInTheDocument()
    )
  })
 
  it('NO navega cuando la API devuelve error', async () => {
    server.use(
      http.get(`${API_QR_URL}/api/qr/:qrCode`, () =>
        new HttpResponse(null, { status: 404 })
      )
    )
 
    renderScanner()
    await simulateScan('qr-invalido')
 
    await waitFor(() => screen.getByText(/⚠️/))
    expect(mockNavigate).not.toHaveBeenCalledWith(
      expect.stringMatching(/^\/sala\//),
      expect.anything()
    )
  })
})
 
// ══════════════════════════════════════════════════════════════════════════════
describe('Scanner — error de red (fallo de conexión)', () => {
// ══════════════════════════════════════════════════════════════════════════════
 
  it('muestra el banner de error cuando la petición falla por red', async () => {
    server.use(
      http.get(`${API_QR_URL}/api/qr/:qrCode`, () => HttpResponse.error())
    )
 
    renderScanner()
    await simulateScan('qr-test')
 
    await waitFor(() =>
      expect(screen.getByText(/⚠️/)).toBeInTheDocument()
    )
  })
 
  it('usa el mensaje de respaldo cuando el error carece de mensaje', async () => {
    // Hacemos que scanner.pause() lance un Error sin message
    mockInstance.pause.mockRejectedValueOnce(new Error())
 
    renderScanner()
    await simulateScan('qr-test')
 
    await waitFor(() =>
      expect(
        screen.getByText(/error al procesar el código qr/i)
      ).toBeInTheDocument()
    )
  })
})
 
// ══════════════════════════════════════════════════════════════════════════════
describe('Scanner — botón "Volver"', () => {
// ══════════════════════════════════════════════════════════════════════════════
 
  it('navega a "/" al hacer clic en Volver', async () => {
    renderScanner()
    await userEvent.click(screen.getByRole('button', { name: /volver/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/')
  })
 
  it('el botón Volver está habilitado en reposo', () => {
    renderScanner()
    expect(screen.getByRole('button', { name: /volver/i })).toBeEnabled()
  })
})
 
// ══════════════════════════════════════════════════════════════════════════════
describe('Scanner — botón "Reintentar"', () => {
// ══════════════════════════════════════════════════════════════════════════════
 
  /** Lleva el componente al estado de error para testear Reintentar */
  async function goToErrorState() {
    server.use(
      http.get(`${API_QR_URL}/api/qr/:qrCode`, () =>
        new HttpResponse(null, { status: 404 })
      )
    )
    renderScanner()
    await simulateScan('qr-invalido')
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument()
    )
  }
 
  it('oculta el banner de error al pulsar Reintentar', async () => {
    await goToErrorState()
 
    await userEvent.click(screen.getByRole('button', { name: /reintentar/i }))
 
    await waitFor(() =>
      expect(screen.queryByText(/⚠️/)).not.toBeInTheDocument()
    )
  })
 
  it('llama a scanner.resume() al pulsar Reintentar', async () => {
    await goToErrorState()
    vi.clearAllMocks() // resetea el conteo previo de resume()
 
    await userEvent.click(screen.getByRole('button', { name: /reintentar/i }))
 
    await waitFor(() =>
      expect(mockInstance.resume).toHaveBeenCalledOnce()
    )
  })
})
 
// ══════════════════════════════════════════════════════════════════════════════
describe('Scanner — error de inicialización de cámara', () => {
// ══════════════════════════════════════════════════════════════════════════════
 
  it('muestra el mensaje de error de cámara cuando el constructor lanza', () => {
    MockHtml5QrcodeScanner.mockImplementationOnce(() => {
      throw new Error('Camera not found')
    })
 
    renderScanner()
 
    expect(
      screen.getByText(/no se pudo acceder a la cámara\. verifica los permisos\./i)
    ).toBeInTheDocument()
  })
 
  it('muestra el banner de error (con icono ⚠️) ante fallo de cámara', () => {
    MockHtml5QrcodeScanner.mockImplementationOnce(() => {
      throw new Error('Permission denied')
    })
 
    renderScanner()
 
    expect(screen.getByText(/⚠️/)).toBeInTheDocument()
  })
 
  it('no intenta navegar cuando el escáner no pudo inicializarse', () => {
    MockHtml5QrcodeScanner.mockImplementationOnce(() => {
      throw new Error('Camera error')
    })
 
    renderScanner()
 
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})