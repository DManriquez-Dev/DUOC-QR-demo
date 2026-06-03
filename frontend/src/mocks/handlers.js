import { http, HttpResponse } from 'msw'

// Debe coincidir con la variable de entorno VITE_API_QR_URL del proyecto
export const API_QR_URL = 'http://localhost:8001'

/**
 * Handlers por defecto: respuesta exitosa genérica.
 * Los tests los sobreescriben con server.use() para simular distintos escenarios.
 */
export const handlers = [
  http.get(`${API_QR_URL}/api/qr/:qrCode`, () =>
    HttpResponse.json({ id: 'sala-default' })
  ),
]