import { useContext } from 'react'
import { QRContext } from '../context/QRContext'

/**
 * Hook personalizado para acceder al contexto QR
 * @returns {object} Contexto QR con métodos y estado
 * @throws {Error} Si se usa fuera del QRProvider
 */
export function useQR() {
  const context = useContext(QRContext)

  if (!context) {
    throw new Error('useQR debe ser usado dentro de un QRProvider')
  }

  return context
}
