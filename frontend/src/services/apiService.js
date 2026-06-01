/**
 * API Service - Utilidades para hacer llamadas HTTP
 * Encapsula la lógica de consumo de APIs con manejo de errores y timeouts
 */

const API_QR_URL = import.meta.env.VITE_API_QR_URL || 'http://localhost:8001'
const API_UBICACION_URL = import.meta.env.VITE_API_UBICACION_URL || 'http://localhost:8002'

// Configuración de timeouts
const DEFAULT_TIMEOUT = 10000 // 10 segundos

/**
 * Realiza una petición fetch con timeout
 * @param {string} url - URL de la petición
 * @param {object} options - Opciones de fetch (method, headers, body, etc)
 * @param {number} timeout - Timeout en milisegundos
 * @returns {Promise} Respuesta del servidor
 */
async function fetchWithTimeout(url, options = {}, timeout = DEFAULT_TIMEOUT) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    })

    return response
  } finally {
    clearTimeout(id)
  }
}

/**
 * Decodifica y obtiene la información de un código QR
 * @param {string} qrContent - Contenido del QR (usualmente un ID o URL)
 * @returns {Promise<object>} Datos del QR (incluye ID de sala)
 * @throws {Error} Si el QR no es válido o hay error de red
 */
export async function getQRData(qrContent) {
  if (!qrContent || qrContent.trim() === '') {
    throw new Error('Código QR vacío o inválido')
  }

  try {
    const url = `${API_QR_URL}/api/qr/${encodeURIComponent(qrContent)}`
    console.log('🔍 Consultando QR:', url)

    const response = await fetchWithTimeout(url, { method: 'GET' })

    if (!response.ok) {
      const message = response.status === 404
        ? 'Código QR no encontrado en la base de datos'
        : response.status === 400
        ? 'Código QR con formato inválido'
        : `Error del servidor (${response.status})`

      throw new Error(message)
    }

    const data = await response.json()

    if (!data.id) {
      throw new Error('Respuesta inválida: no contiene ID de sala')
    }

    return data
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('La solicitud tardó demasiado tiempo. Intenta de nuevo.')
    }
    throw err
  }
}

/**
 * Obtiene la información de una sala específica
 * @param {string|number} roomId - ID de la sala
 * @returns {Promise<object>} Información de la sala
 * @throws {Error} Si no se encuentra la sala o hay error de red
 */
export async function getRoomInfo(roomId) {
  if (!roomId) {
    throw new Error('ID de sala requerido')
  }

  try {
    const url = `${API_UBICACION_URL}/api/ubicaciones/${roomId}`
    console.log('🏛️ Consultando sala:', url)

    const response = await fetchWithTimeout(url, { method: 'GET' })

    if (!response.ok) {
      const message = response.status === 404
        ? 'Sala no encontrada'
        : response.status === 400
        ? 'ID de sala inválido'
        : `Error del servidor (${response.status})`

      throw new Error(message)
    }

    const data = await response.json()
    return data
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('La solicitud tardó demasiado tiempo. Intenta de nuevo.')
    }
    throw err
  }
}

/**
 * Flujo completo: QR -> Sala Info
 * @param {string} qrContent - Contenido del QR
 * @returns {Promise<object>} Información de la sala
 * @throws {Error} Si falla en cualquier etapa
 */
export async function fetchRoomFromQR(qrContent) {
  console.log('▶️ Iniciando flujo: QR -> Sala Info')

  // Paso 1: Obtener datos del QR
  const qrData = await getQRData(qrContent)
  console.log('✓ QR validado, ID:', qrData.id)

  // Paso 2: Obtener información de la sala
  const roomInfo = await getRoomInfo(qrData.id)
  console.log('✓ Información de sala obtenida')

  return roomInfo
}

/**
 * Verifica si los servicios de API están disponibles
 * @returns {Promise<boolean>} true si ambas APIs responden
 */
export async function checkAPIHealth() {
  try {
    const qrCheck = fetch(`${API_QR_URL}/health`, { method: 'GET' })
      .then(r => r.ok)
      .catch(() => false)

    const ubicacionCheck = fetch(`${API_UBICACION_URL}/health`, { method: 'GET' })
      .then(r => r.ok)
      .catch(() => false)

    const [qr, ubicacion] = await Promise.all([qrCheck, ubicacionCheck])
    return qr && ubicacion
  } catch {
    return false
  }
}
