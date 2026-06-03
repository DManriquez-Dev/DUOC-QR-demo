import { createContext, useState, useCallback } from 'react'

// Crear el contexto
export const QRContext = createContext()

// Proveedor del contexto
export function QRProvider({ children }) {
  const [roomData, setRoomData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Resetear el estado
  const resetQRState = useCallback(() => {
    setRoomData(null)
    setError(null)
    setLoading(false)
  }, [])

  // Establecer datos de sala
  const setRoom = useCallback((data) => {
    setRoomData(data)
    setError(null)
  }, [])

  // Establecer error
  const setErrorMessage = useCallback((message) => {
    setError(message)
    setRoomData(null)
  }, [])

  const value = {
    roomData,
    setRoom,
    loading,
    setLoading,
    error,
    setErrorMessage,
    resetQRState
  }

  return <QRContext.Provider value={value}>{children}</QRContext.Provider>
}
