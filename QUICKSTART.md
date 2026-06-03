# 🚀 Guía de Inicio Rápido - Frontend QR

> ⏱️ **5 minutos para tener el lector QR funcionando**

---

## ✅ Pre-requisitos

```bash
# Node.js instalado (v16+)
node --version

# NPM instalado
npm --version

# Dependencias ya instaladas
npm install
```

---

## 1️⃣ Configurar Variables de Entorno

```bash
# En la carpeta frontend/
cp .env.example .env

# Editar .env con tus URLs
cat .env
```

```env
VITE_API_QR_URL=http://localhost:8001
VITE_API_UBICACION_URL=http://localhost:8002
```

---

## 2️⃣ Iniciar el Servidor de Desarrollo

```bash
# En la carpeta frontend/
npm run dev
```

**Output esperado:**
```
  Local:        http://localhost:5173/
  Press q to quit
```

---

## 3️⃣ Probar el Flujo Completo

### ✨ Escenario 1: Escanear QR Válido

1. Abre `http://localhost:5173/`
2. Click en **"Iniciar Escáner"**
3. Permite acceso a cámara
4. Escanea un código QR válido
5. ✅ Debes ver: Pantalla de sala con información

### ⚠️ Escenario 2: Escanear QR Inválido

1. En Scanner, escanea algo que no sea QR
2. ✅ Debes ver: Mensaje de error
3. Click **"Reintentar"**
4. ✅ Scanner debe volver a funcionar

### 🔄 Escenario 3: Ver Información de Sala

1. Después de escanear exitoso
2. ✅ Debes ver:
   - Nombre de la sala
   - Piso
   - Descripción
   - Botones: "Escanear otro QR", "Ir al inicio"

---

## 4️⃣ Estructura de Carpetas (Creada)

```
frontend/src/
├── context/
│   └── QRContext.jsx          ← Manejo de estado global
├── hooks/
│   └── useQR.js               ← Hook personalizado
├── services/
│   └── apiService.js          ← Utilidades de API
└── pages/
    ├── Scanner.jsx            ← Lector QR mejorado
    ├── RoomInfo.jsx           ← Info de sala mejorada
    └── ErrorQR.jsx            ← Manejo de errores
```

---

## 5️⃣ Archivos Modificados

| Archivo | Cambios |
|---------|---------|
| `Scanner.jsx` | ✅ Loading state, error handling, retry |
| `RoomInfo.jsx` | ✅ Better loading/error states |
| `ErrorQR.jsx` | ✅ Mensajes descriptivos |
| `App.css` | ✅ +200 líneas de estilos mejorados |
| `main.jsx` | ✅ Agregado QRProvider |

---

## 6️⃣ API Endpoints Esperados

### Backend API QR (puerto 8001)
```
GET /api/qr/:qrContent
Response: { id: number, ... }
```

### Backend API Ubicación (puerto 8002)
```
GET /api/ubicaciones/:id
Response: { nombre, piso, descripcion, qr_code, ... }
```

---

## 🐛 Troubleshooting Rápido

| ¿Qué pasa? | Solución |
|-----------|----------|
| "Cannot find module" | `npm install` en frontend/ |
| Scanner no muestra | Permisos cámara: Verificar navegador |
| API no responde | ¿Está corriendo el backend en puertos 8001/8002? |
| Página en blanco | Abre DevTools (F12) y verifica errores |
| Botones no funcionan | Verifica React Router en App.jsx |

---

## 📱 Testar en Móvil

```bash
# Obtén tu IP local
ipconfig getifaddr en0    # Mac
hostname -I               # Linux
ipconfig                  # Windows

# Accede desde móvil
http://<TU_IP>:5173
```

---

## 📊 Flujo Visual

```
🏠 Home
  ↓ [Iniciar Escáner]
📷 Scanner
  ↓ [Escanear QR]
  ├─ ✅ Éxito → 🏛️ RoomInfo
  └─ ❌ Error → ⚠️ ErrorQR
      ↓ [Reintentar]
      ↻ Volver a Scanner
```

---

## 🎯 Checklist de Validación

- [ ] Frontend inicia sin errores (`npm run dev`)
- [ ] Página Home carga correctamente
- [ ] Botón "Iniciar Escáner" funciona
- [ ] Scanner pide permisos de cámara
- [ ] QR válido → muestra RoomInfo
- [ ] QR inválido → muestra ErrorQR
- [ ] Botón "Reintentar" funciona
- [ ] Navegación entre vistas funciona
- [ ] Estilos se ven correctos
- [ ] Sin errores en consola (F12)

---

## 🔧 Comandos Útiles

```bash
# Instalar dependencias
npm install

# Desarrollo local
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview

# Linting (si existe)
npm run lint
```

---

## 📚 Documentación Completa

Para más detalles, consulta:
- [`FRONTEND_DOCUMENTATION.md`](./FRONTEND_DOCUMENTATION.md) - Documentación completa
- [`ADVANCED_EXAMPLES.md`](./ADVANCED_EXAMPLES.md) - Ejemplos avanzados
- [html5-qrcode Docs](https://github.com/mebjas/html5-qrcode) - Librería QR

---

## 💡 Tips Profesionales

1. **DevTools:** Presiona F12 y ve la pestaña "Network" para debug de API
2. **Console Logs:** `apiService.js` tiene logs automáticos (🔍, ✓, etc)
3. **Mobile Testing:** Usa ngrok para testing en móvil real
4. **Performance:** El scanner pausará automáticamente tras encontrar QR

---

**¿Necesitas ayuda?** Revisa la consola del navegador (F12) para mensajes de error detallados.

🎉 **¡Listo para usar!**
