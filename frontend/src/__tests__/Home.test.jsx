/**
 * Home.test.jsx
 *
 * Suite de tests para el componente Home.
 * No requiere MSW (el componente no hace llamadas a la API).
 *
 * Cobertura:
 *  - Renderizado de toda la estructura y contenido estático
 *  - Navegación con los dos botones de acción
 */
 
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
 
// Ajusta la ruta según la estructura real del proyecto
import Home from '../pages/Home'
 
/* ─────────────────────────────────────────────────────────────────────────────
   MOCKS
   ───────────────────────────────────────────────────────────────────────────── */
 
const mockNavigate = vi.fn()
 
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})
 
/* ─────────────────────────────────────────────────────────────────────────────
   HELPERS
   ───────────────────────────────────────────────────────────────────────────── */
 
function renderHome() {
  return render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  )
}
 
/* ─────────────────────────────────────────────────────────────────────────────
   TEARDOWN
   ───────────────────────────────────────────────────────────────────────────── */
 
beforeEach(() => {
  vi.clearAllMocks()
})
 
/* ─────────────────────────────────────────────────────────────────────────────
   TESTS
   ───────────────────────────────────────────────────────────────────────────── */
 
// ══════════════════════════════════════════════════════════════════════════════
describe('Home — sección hero', () => {
// ══════════════════════════════════════════════════════════════════════════════
 
  it('muestra el nombre de la institución "Duoc UC"', () => {
    renderHome()
    expect(screen.getByText('Duoc UC')).toBeInTheDocument()
  })
 
  it('muestra el título del campus "San Carlos de Apoquindo"', () => {
    renderHome()
    expect(
      screen.getByRole('heading', { name: /san carlos de apoquindo/i, level: 1 })
    ).toBeInTheDocument()
  })
 
  it('muestra la descripción principal del sistema', () => {
    renderHome()
    expect(
      screen.getByText(/usa este sistema interactivo para obtener información/i)
    ).toBeInTheDocument()
  })
})
 
// ══════════════════════════════════════════════════════════════════════════════
describe('Home — tarjeta "Escanear Código QR"', () => {
// ══════════════════════════════════════════════════════════════════════════════
 
  it('muestra el ícono de cámara', () => {
    renderHome()
    expect(screen.getByText('📷')).toBeInTheDocument()
  })
 
  it('muestra el título de la tarjeta', () => {
    renderHome()
    expect(
      screen.getByRole('heading', { name: /escanear código qr/i })
    ).toBeInTheDocument()
  })
 
  it('muestra la descripción de la tarjeta', () => {
    renderHome()
    expect(
      screen.getByText(/apunta con la cámara a los códigos qr/i)
    ).toBeInTheDocument()
  })
 
  it('muestra el botón "Iniciar Escáner" habilitado', () => {
    renderHome()
    expect(
      screen.getByRole('button', { name: /iniciar escáner/i })
    ).toBeEnabled()
  })
 
  it('navega a /scanner al pulsar "Iniciar Escáner"', async () => {
    renderHome()
    await userEvent.click(screen.getByRole('button', { name: /iniciar escáner/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/scanner')
  })
 
  it('llama a navigate una sola vez al pulsar "Iniciar Escáner"', async () => {
    renderHome()
    await userEvent.click(screen.getByRole('button', { name: /iniciar escáner/i }))
    expect(mockNavigate).toHaveBeenCalledOnce()
  })
})
 
// ══════════════════════════════════════════════════════════════════════════════
describe('Home — tarjeta "Ver Ubicaciones"', () => {
// ══════════════════════════════════════════════════════════════════════════════
 
  it('muestra el ícono de mapa', () => {
    renderHome()
    expect(screen.getByText('🗺️')).toBeInTheDocument()
  })
 
  it('muestra el título de la tarjeta', () => {
    renderHome()
    expect(
      screen.getByRole('heading', { name: /ver ubicaciones/i })
    ).toBeInTheDocument()
  })
 
  it('muestra la descripción de la tarjeta', () => {
    renderHome()
    expect(
      screen.getByText(/explora el listado completo y la ubicación de las salas/i)
    ).toBeInTheDocument()
  })
 
  it('muestra el botón "Explorar Mapa" habilitado', () => {
    renderHome()
    expect(
      screen.getByRole('button', { name: /explorar mapa/i })
    ).toBeEnabled()
  })
 
  it('navega a /room-info al pulsar "Explorar Mapa"', async () => {
    renderHome()
    await userEvent.click(screen.getByRole('button', { name: /explorar mapa/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/room-info')
  })
 
  it('llama a navigate una sola vez al pulsar "Explorar Mapa"', async () => {
    renderHome()
    await userEvent.click(screen.getByRole('button', { name: /explorar mapa/i }))
    expect(mockNavigate).toHaveBeenCalledOnce()
  })
})
 
// ══════════════════════════════════════════════════════════════════════════════
describe('Home — estructura general', () => {
// ══════════════════════════════════════════════════════════════════════════════
 
  it('renderiza exactamente dos botones de acción', () => {
    renderHome()
    expect(screen.getAllByRole('button')).toHaveLength(2)
  })
 
  it('los botones de acción apuntan a rutas distintas', async () => {
    renderHome()
 
    await userEvent.click(screen.getByRole('button', { name: /iniciar escáner/i }))
    await userEvent.click(screen.getByRole('button', { name: /explorar mapa/i }))
 
    expect(mockNavigate).toHaveBeenNthCalledWith(1, '/scanner')
    expect(mockNavigate).toHaveBeenNthCalledWith(2, '/room-info')
  })
})