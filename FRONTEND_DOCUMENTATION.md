# 📱 Implementación de Lector QR - Documentación

## 📋 Descripción General

Este documento describe la implementación completa del sistema de lectura de códigos QR para la aplicación DUOC-QR. El flujo integra:

1. **Escaneo QR** → Lectura de cámara y validación
2. **Consumo API** → Llamadas a backend para obtener datos
3. **Manejo de Estados** → Loading, error, éxito
4. **Redirección** → Navegación inteligente entre vistas

---

## 🏗️ Arquitectura

### Estructura de Carpetas

```
frontend/src/
├── components/        # Componentes reutilizables
│   ├── Layout.jsx
│   └── Navbar.jsx
├── pages/            # Vistas principales
│   ├── Home.jsx
│   ├── Scanner.jsx   ⭐ Lector QR
│   ├── RoomInfo.jsx  ⭐ Información de sala
│   ├── ErrorQR.jsx   ⭐ Página de error
│   └── Help.jsx
├── context/          # State Management
│   └── QRContext.jsx ⭐ Contexto global
├── hooks/            # Hooks personalizados
│   └── useQR.js      ⭐ Hook para contexto
├── services/         # Lógica de API
│   └── apiService.js ⭐ Utilidades HTTP
├── App.jsx           # Rutas principales
├── App.css           # Estilos globales
└── main.jsx          # Entry point
```

---

## 🔄 Flujo de Datos

```
USER INTERFACE
     ↓
Scanner.jsx (Lee QR con html5-qrcode)
     ↓
apiService.getQRData() (Valida QR en API_QR)
     ↓
SUCCESS: data.id obtenido → Navigate a /sala/:id
     ↓
RoomInfo.jsx (Lee route param :id)
     ↓
apiService.getRoomInfo(id) (Obtiene info en API_UBICACION)
     ↓
Muestra datos: nombre, piso, descripción, etc.

ERROR EN CUALQUIER PUNTO: Navigate a /error
```

---

## 🛠️ Componentes Implementados

### 1. **Scanner.jsx** (Lector QR)

**Características:**
- ✅ Activación de cámara con `html5-qrcode`
- ✅ Detección automática de QR
- ✅ Estado de carga con overlay spinner
- ✅ Manejo de errores con reintentos
- ✅ Cleanup de recursos al desmontar
- ✅ Pausa/Reanudación del scanner

**Flujo:**
```javascript
1. Scanner se inicializa con fps: 10, qrbox: 250
2. Al detectar QR → pausa scanner + inicia carga
3. Llama a apiService.getQRData(qrContent)
4. Si OK → navega a /sala/:id
5. Si ERROR → muestra mensaje + opción reintentar
```

**Estados:**
- `isLoading` - Procesando QR
- `error` - Mensaje de error
- Ambos se resetean en reintentos

---

### 2. **RoomInfo.jsx** (Información de Sala)

**Características:**
- ✅ Consume ruta param `:id`
- ✅ Fetch de datos con manejo de timeouts
- ✅ Estados: loading, error, data
- ✅ Fallback para datos faltantes
- ✅ Navegación post-visualización

**Datos mostrados:**
```javascript
{
  nombre: "Sala 101",
  piso: 1,
  descripcion: "Sala de laboratorio con 30 computadores",
  qr_code: "SALA-001-2024",
  capacidad: 30,        // Opcional
  recursos: "Proyector, pizarra digital"  // Opcional
}
```

---

### 3. **ErrorQR.jsx** (Página de Error)

**Características:**
- ✅ Mensajes descriptivos según el error
- ✅ Sugerencias sobre causas posibles
- ✅ Múltiples opciones de navegación
- ✅ Acceso a página de ayuda

---

## 🎯 Servicios API

### `apiService.js`

#### Función: `getQRData(qrContent)`
```javascript
// Obtiene información del QR
const qrData = await getQRData('SALA-001-2024')
// Returns: { id: 123, ... }
// Throws: Error con mensaje descriptivo
```

#### Función: `getRoomInfo(roomId)`
```javascript
// Obtiene información de la sala
const roomInfo = await getRoomInfo(123)
// Returns: { nombre, piso, descripcion, ... }
// Throws: Error con mensaje descriptivo
```

#### Función: `fetchRoomFromQR(qrContent)`
```javascript
// Flujo completo: QR -> Sala
const roomInfo = await fetchRoomFromQR('SALA-001-2024')
// Combina getQRData + getRoomInfo
```

#### Función: `checkAPIHealth()`
```javascript
// Verifica disponibilidad de APIs
const isHealthy = await checkAPIHealth()
// Returns: boolean
```

---

## 📊 Context API (QRContext)

### `QRContext.jsx`

**Estado disponible:**
```javascript
{
  roomData,              // Datos de sala cacheados
  loading,               // Estado de carga
  error,                 // Mensaje de error
  setRoom(data),         // Guardar datos
  setErrorMessage(msg),  // Guardar error
  setLoading(bool),      // Cambiar loading
  resetQRState()         // Limpiar estado
}
```

**Uso con hook:**
```javascript
import { useQR } from '../hooks/useQR'

function MyComponent() {
  const { roomData, loading, error, setRoom } = useQR()
  // ...
}
```

---

## 🎨 Estilos CSS Añadidos

### Loading Spinner
```css
.spinner {
  border: 4px solid rgba(165, 243, 252, 0.2);
  border-top: 4px solid #a5f3fc;
  animation: spin 1s linear infinite;
}
```

### Error Banner
```css
.error-banner {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
}
```

### Button Variants
```css
.btn-primary    /* Azul celeste */
.btn-secondary  /* Gris neutro */
.btn-outline    /* Borde celeste */
```

---

## 🚀 Cómo Usar

### 1. **Iniciar la aplicación**
```bash
npm run dev
```

### 2. **Validar variables de entorno** (.env)
```env
VITE_API_QR_URL=http://localhost:8001
VITE_API_UBICACION_URL=http://localhost:8002
```

### 3. **Flujo típico de usuario**
```
Home → [Click "Escanear QR"] 
  → Scanner [Escanear código] 
    → Procesando... 
      → RoomInfo [Ver datos] 
        → [Escanear otro o volver]
```

### 4. **Manejo de errores**
```
Si error en cualquier etapa → ErrorQR
  [Opciones: Reintentar, Ir al inicio, Ver ayuda]
```

---

## ⚙️ Variables de Entorno

```env
# APIs Backend
VITE_API_QR_URL=http://localhost:8001          # API para validar QR
VITE_API_UBICACION_URL=http://localhost:8002   # API para datos de salas

# Opcional
VITE_DEBUG=false                                # Logs verbosos
```

---

## 🔍 Testing Manual

### Test 1: QR Válido
```
1. Ir a Scanner
2. Escanear código QR válido
3. ✓ Debe mostrar "Procesando código QR..."
4. ✓ Debe redirigir a RoomInfo tras 2-3 seg
5. ✓ Debe mostrar datos de la sala
```

### Test 2: QR Inválido
```
1. Ir a Scanner
2. Escanear código QR inválido
3. ✓ Debe mostrar error
4. ✓ Debe oferecer opción "Reintentar"
5. ✓ Scanner debe reanudar automáticamente
```

### Test 3: Error de Red
```
1. Detener backend
2. Ir a Scanner
3. Intentar escanear
4. ✓ Debe mostrar "La solicitud tardó demasiado tiempo"
5. ✓ Botón Reintentar debe funcionar
```

### Test 4: Responsividad
```
1. Redimensionar ventana a <600px
2. ✓ Estilos deben adaptarse
3. ✓ Botones deben ser full-width
4. ✓ Texto debe ser legible
```

---

## 🐛 Troubleshooting

| Problema | Causa | Solución |
|----------|-------|----------|
| Scanner no carga | Permisos de cámara | Permitir acceso en navegador |
| Error "Timeout" | API lenta | Aumentar `DEFAULT_TIMEOUT` en apiService.js |
| QR no se detecta | Calidad de imagen | Mejorar iluminación, limpiar lente |
| Rutas no funcionan | React Router mal | Verificar `<Route path>` en App.jsx |
| Estilos rotos | CSS no importado | Verificar `import './App.css'` en main.jsx |

---

## 📚 Librerías Utilizadas

| Librería | Versión | Uso |
|----------|---------|-----|
| react | ^18.x | Framework principal |
| react-router-dom | ^6.x | Enrutamiento |
| html5-qrcode | ^2.x | Lectura de QR |
| vite | ^4.x | Build tool |

---

## 📝 Notas de Desarrollo

### Mejoras Futuras
- [ ] Agregar reintento automático en fallo temporal
- [ ] Caché de datos para evitar requests duplicadas
- [ ] Analytics para tracking de escaneos
- [ ] Soporte para múltiples formatos de QR
- [ ] Generador de QR en admin panel

### Performance
- Scanner inicializa solo si está en RoomInfo
- Cleanup automático de recursos
- Throttling de detecciones

### Seguridad
- Validación de entrada con `encodeURIComponent()`
- Timeout de 10s en todas las requests
- CORS configurado en backend

---

## ✅ Checklist de Implementación

- [x] Scanner.jsx con html5-qrcode
- [x] RoomInfo.jsx con fetch de datos
- [x] ErrorQR.jsx con manejo de errores
- [x] ApiService.js con utilidades
- [x] QRContext.jsx para estado global
- [x] useQR hook personalizado
- [x] CSS mejorado con loading/error states
- [x] main.jsx con QRProvider
- [x] Documentación completa

---

## 📞 Contacto y Soporte

Para issues o preguntas sobre la implementación:
1. Revisar console.log() en dev tools
2. Verificar network tab para requests
3. Consultar .env para URLs correctas
4. Revisar permisos de cámara en navegador

---

**Última actualización:** Junio 2024  
**Versión:** 1.0  
**Status:** ✅ Completo y Funcional
