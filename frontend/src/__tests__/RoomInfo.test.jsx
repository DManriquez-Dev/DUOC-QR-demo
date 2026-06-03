/**
 * RoomInfo.test.jsx
 *
 * Suite de tests para el componente RoomInfo.
 * Usa MSW para interceptar llamadas a la API de ubicación.
 *
 * Cobertura:
 *  - Estado de carga (spinner)
 *  - Renderizado con datos completos
 *  - Campos opcionales ausentes (capacidad, recursos)
 *  - Error 404 (sala no encontrada)
 *  - Error 500 (error de servidor)
 *  - Navegación desde el estado de error
 */

import { describe, it, expect, vi, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { http, HttpResponse } from 'msw'

import RoomInfo from '../pages/RoomInfo'
import { server } from '../mocks/server'

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

const API_UBICACION_URL = 'http://localhost:8002'

/* ─────────────────────────────────────────────────────────────────────────────
   DATOS DE PRUEBA
   ───────────────────────────────────────────────────────────────────────────── */

const salaCompleta = {
  id: 'sala-1',
  nombre: 'Sala A101',
  tipo_espacio: 'Sala de clases',
  piso_nombre: 'Primer Piso',
  piso_id: 1,
  capacidad: 30,
  descripcion: 'Sala equipada con proyector y pizarrón',
  qr_code: 'QR-A101',
  recursos: 'Proyector, pizarrón, aire acondicionado',
}

const salaMinima = {
  id: 'sala-2',
  nombre: 'Sala B202',
  tipo_espacio: 'Laboratorio',
  piso_nombre: null,
  piso_id: 2,
  capacidad: null,
  descripcion: null,
  qr_code: 'QR-B202',
  recursos: null,
}

/* ─────────────────────────────────────────────────────────────────────────────
   HELPERS
   ───────────────────────────────────────────────────────────────────────────── */

function renderRoomInfo(id = 'sala-1') {
  return render(
    <MemoryRouter initialEntries={[`/sala/${id}`]}>
      <Routes>
        <Route path="/sala/:id" element={<RoomInfo />} />
      </Routes>
    </MemoryRouter>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   CICLO DE VIDA DEL SERVIDOR MSW
   ───────────────────────────────────────────────────────────────────────────── */

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))

afterEach(() => {
  server.resetHandlers()
  vi.clearAllMocks()
})

afterAll(() => server.close())

/* ─────────────────────────────────────────────────────────────────────────────
   TESTS
   ───────────────────────────────────────────────────────────────────────────── */

// ══════════════════════════════════════════════════════════════════════════════
describe('RoomInfo — estado de carga', () => {
// ══════════════════════════════════════════════════════════════════════════════

  it('muestra el spinner mientras carga', () => {
    server.use(
      http.get(`${API_UBICACION_URL}/api/ubicaciones/:id`, () => new Promise(() => {}))
    )
    renderRoomInfo()
    expect(screen.getByText(/cargando información de la sala/i)).toBeInTheDocument()
  })
})

// ══════════════════════════════════════════════════════════════════════════════
describe('RoomInfo — datos completos', () => {
// ══════════════════════════════════════════════════════════════════════════════

  beforeEach(() => {
    server.use(
      http.get(`${API_UBICACION_URL}/api/ubicaciones/:id`, () =>
        HttpResponse.json(salaCompleta)
      )
    )
  })

  it('muestra el nombre de la sala', async () => {
    renderRoomInfo()
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /sala a101/i })).toBeInTheDocument()
    )
  })

    it('muestra el tipo de espacio', async () => {
    renderRoomInfo()
    await waitFor(() =>
      expect(screen.getAllByText(/sala de clases/i)).toHaveLength(2)
    )
  })

  it('muestra el nombre del piso', async () => {
    renderRoomInfo()
    await waitFor(() =>
      expect(screen.getByText(/primer piso/i)).toBeInTheDocument()
    )
  })

  it('muestra la capacidad', async () => {
    renderRoomInfo()
    await waitFor(() =>
      expect(screen.getByText('30')).toBeInTheDocument()
    )
  })

  it('muestra la descripción', async () => {
    renderRoomInfo()
    await waitFor(() =>
      expect(screen.getByText(/sala equipada con proyector/i)).toBeInTheDocument()
    )
  })

  it('muestra los recursos disponibles', async () => {
    renderRoomInfo()
    await waitFor(() =>
      expect(screen.getByText(/proyector, pizarrón, aire acondicionado/i)).toBeInTheDocument()
    )
  })

  it('muestra el código QR de la sala', async () => {
    renderRoomInfo()
    await waitFor(() =>
      expect(screen.getByText('QR-A101')).toBeInTheDocument()
    )
  })
})

// ══════════════════════════════════════════════════════════════════════════════
describe('RoomInfo — campos opcionales ausentes', () => {
// ══════════════════════════════════════════════════════════════════════════════

  beforeEach(() => {
    server.use(
      http.get(`${API_UBICACION_URL}/api/ubicaciones/:id`, () =>
        HttpResponse.json(salaMinima)
      )
    )
  })

  it('no muestra la tarjeta de capacidad si es null', async () => {
    renderRoomInfo('sala-2')
    await waitFor(() => screen.getByRole('heading', { name: /sala b202/i }))
    expect(screen.queryByRole('heading', { name: /capacidad/i })).not.toBeInTheDocument()
  })

  it('no muestra la tarjeta de recursos si es null', async () => {
    renderRoomInfo('sala-2')
    await waitFor(() => screen.getByRole('heading', { name: /sala b202/i }))
    expect(screen.queryByText(/recursos disponibles/i)).not.toBeInTheDocument()
  })

  it('muestra fallback de descripción cuando es null', async () => {
    renderRoomInfo('sala-2')
    await waitFor(() =>
      expect(screen.getByText(/sin descripción disponible/i)).toBeInTheDocument()
    )
  })

  it('muestra "Piso 2" cuando piso_nombre es null pero piso_id tiene valor', async () => {
    renderRoomInfo('sala-2')
    await waitFor(() =>
      expect(screen.getByText('Piso 2')).toBeInTheDocument()
    )
  })
})

// ══════════════════════════════════════════════════════════════════════════════
describe('RoomInfo — error 404', () => {
// ══════════════════════════════════════════════════════════════════════════════

  beforeEach(() => {
    server.use(
      http.get(`${API_UBICACION_URL}/api/ubicaciones/:id`, () =>
        new HttpResponse(null, { status: 404 })
      )
    )
  })

  it('muestra el mensaje de sala no encontrada', async () => {
    renderRoomInfo()
    await waitFor(() =>
      expect(
        screen.getByText(/sala no encontrada en la base de datos/i)
      ).toBeInTheDocument()
    )
  })

  it('muestra el botón "Escanear otro QR"', async () => {
    renderRoomInfo()
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /escanear otro qr/i })
      ).toBeInTheDocument()
    )
  })

  it('muestra el botón "Ir al inicio"', async () => {
    renderRoomInfo()
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /ir al inicio/i })
      ).toBeInTheDocument()
    )
  })

  it('navega a /scanner al pulsar "Escanear otro QR"', async () => {
    renderRoomInfo()
    await waitFor(() => screen.getByRole('button', { name: /escanear otro qr/i }))
    await userEvent.click(screen.getByRole('button', { name: /escanear otro qr/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/scanner')
  })

  it('navega a / al pulsar "Ir al inicio"', async () => {
    renderRoomInfo()
    await waitFor(() => screen.getByRole('button', { name: /ir al inicio/i }))
    await userEvent.click(screen.getByRole('button', { name: /ir al inicio/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/')
  })
})

// ══════════════════════════════════════════════════════════════════════════════
describe('RoomInfo — error 500', () => {
// ══════════════════════════════════════════════════════════════════════════════

  it('muestra mensaje de error de servidor', async () => {
    server.use(
      http.get(`${API_UBICACION_URL}/api/ubicaciones/:id`, () =>
        new HttpResponse(null, { status: 500 })
      )
    )
    renderRoomInfo()
    await waitFor(() =>
      expect(screen.getByText(/error del servidor \(500\)/i)).toBeInTheDocument()
    )
  })
})