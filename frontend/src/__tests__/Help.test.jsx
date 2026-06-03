/**
 * Help.test.jsx
 *
 * Suite de tests para el componente Help.
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

import Help from '../pages/Help'

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

function renderHelp() {
  return render(
    <MemoryRouter>
      <Help />
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
describe('Help — contenido estático', () => {
// ══════════════════════════════════════════════════════════════════════════════

  it('muestra el título "Ayuda"', () => {
    renderHelp()
    expect(
      screen.getByRole('heading', { name: /ayuda/i })
    ).toBeInTheDocument()
  })

  it('muestra el texto de instrucción principal', () => {
    renderHelp()
    expect(
      screen.getByText(/si tienes problemas para escanear un código qr/i)
    ).toBeInTheDocument()
  })

  it('muestra la etiqueta "Escáner:" en la tarjeta de info', () => {
    renderHelp()
    expect(screen.getByText(/escáner:/i)).toBeInTheDocument()
  })

  it('muestra la etiqueta "Ubicaciones:" en la tarjeta de info', () => {
    renderHelp()
    expect(screen.getByText(/ubicaciones:/i)).toBeInTheDocument()
  })
})

// ══════════════════════════════════════════════════════════════════════════════
describe('Help — botones de acción', () => {
// ══════════════════════════════════════════════════════════════════════════════

  it('muestra el botón "Ir al Escáner" habilitado', () => {
    renderHelp()
    expect(
      screen.getByRole('button', { name: /ir al escáner/i })
    ).toBeEnabled()
  })

  it('muestra el botón "Volver al Inicio" habilitado', () => {
    renderHelp()
    expect(
      screen.getByRole('button', { name: /volver al inicio/i })
    ).toBeEnabled()
  })

  it('navega a /scanner al pulsar "Ir al Escáner"', async () => {
    renderHelp()
    await userEvent.click(screen.getByRole('button', { name: /ir al escáner/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/scanner')
  })

  it('navega a / al pulsar "Volver al Inicio"', async () => {
    renderHelp()
    await userEvent.click(screen.getByRole('button', { name: /volver al inicio/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/')
  })

  it('cada botón llama a navigate una sola vez', async () => {
    renderHelp()
    await userEvent.click(screen.getByRole('button', { name: /ir al escáner/i }))
    expect(mockNavigate).toHaveBeenCalledOnce()
  })

  it('renderiza exactamente dos botones de acción', () => {
    renderHelp()
    expect(screen.getAllByRole('button')).toHaveLength(2)
  })

  it('los botones navegan a rutas distintas', async () => {
    renderHelp()
    await userEvent.click(screen.getByRole('button', { name: /ir al escáner/i }))
    await userEvent.click(screen.getByRole('button', { name: /volver al inicio/i }))
    expect(mockNavigate).toHaveBeenNthCalledWith(1, '/scanner')
    expect(mockNavigate).toHaveBeenNthCalledWith(2, '/')
  })
})