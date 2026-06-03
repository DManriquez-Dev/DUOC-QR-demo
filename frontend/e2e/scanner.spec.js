/**
 * scanner.spec.js — Playwright E2E
 *
 * Pruebas end-to-end del flujo completo de la página Scanner.
 *
 * Estrategia de mocking:
 *  - Html5QrcodeScanner: interceptado vía page.route() antes de que Vite
 *    sirva el bundle. El mock expone los callbacks en window para que los
 *    tests puedan disparar escaneos a voluntad.
 *  - API QR: interceptada con page.route() sobre la URL del backend.
 *
 * Requisitos del playwright.config.js:
 *  baseURL: 'http://localhost:5173'   (puerto del dev server de Vite)
 */

import { test, expect } from '@playwright/test'

/* ─────────────────────────────────────────────────────────────────────────────
   CONSTANTES
   ───────────────────────────────────────────────────────────────────────────── */

const SCANNER_ROUTE = '/scanner'          // Ruta de la página en la app
const API_QR_URL   = 'http://localhost:8001'

/* ─────────────────────────────────────────────────────────────────────────────
   HELPERS
   ───────────────────────────────────────────────────────────────────────────── */

/**
 * Intercepta el bundle de html5-qrcode y lo reemplaza por un módulo ES mock.
 * El mock expone en window:
 *   __qrSuccess(text)  → dispara el callback de lectura exitosa
 *   __qrError(msg)     → dispara el callback de error de lectura
 *   __scannerPaused    → true si se llamó pause()
 *   __scannerResumed   → true si se llamó resume()
 *   __scannerConfig    → config pasada al constructor
 */
async function mockHtml5QrcodeScanner(page) {
  await page.route(
    (url) => url.includes('html5-qrcode'),
    (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/javascript',
        body: `
          export class Html5QrcodeScanner {
            constructor(id, config) {
              window.__scannerConfig = config;
            }
            render(successCb, errorCb) {
              window.__qrSuccess = successCb;
              window.__qrError   = errorCb;
            }
            clear()  { return Promise.resolve(); }
            pause()  {
              window.__scannerPaused = true;
              return Promise.resolve();
            }
            resume() {
              window.__scannerResumed = true;
              return Promise.resolve();
            }
          }
        `,
      })
  )
}

/**
 * Intercepta la API del backend y responde con el payload indicado.
 * @param {import('@playwright/test').Page} page
 * @param {{ status?: number, body?: object }} options
 */
async function mockQrApi(page, { status = 200, body = { id: 'sala-e2e' } } = {}) {
  await page.route(`${API_QR_URL}/api/qr/**`, (route) => {
    if (status >= 400) {
      return route.fulfill({ status, body: '' })
    }
    return route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(body),
    })
  })
}

/**
 * Dispara un escaneo QR en el contexto del navegador.
 */
async function triggerScan(page, qrText = 'qr-e2e-test') {
  await page.evaluate((text) => window.__qrSuccess(text), qrText)
}

/* ─────────────────────────────────────────────────────────────────────────────
   TESTS
   ───────────────────────────────────────────────────────────────────────────── */

// ══════════════════════════════════════════════════════════════════════════════
test.describe('Scanner — estructura de la página', () => {
// ══════════════════════════════════════════════════════════════════════════════

  test.beforeEach(async ({ page }) => {
    await mockHtml5QrcodeScanner(page)
    await page.goto(SCANNER_ROUTE)
  })

  test('muestra el título "Escanear Código QR"', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /escanear código qr/i })
    ).toBeVisible()
  })

  test('muestra el texto de instrucción', async ({ page }) => {
    await expect(
      page.getByText(/apunta la cámara al código qr de la sala/i)
    ).toBeVisible()
  })

  test('renderiza el contenedor del lector (#qr-reader)', async ({ page }) => {
    await expect(page.locator('#qr-reader')).toBeVisible()
  })

  test('muestra el botón "Volver" habilitado', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /volver/i })
    ).toBeEnabled()
  })

  test('no muestra el banner de error en el estado inicial', async ({ page }) => {
    await expect(page.locator('.error-banner')).not.toBeVisible()
  })

  test('no muestra el overlay de carga en el estado inicial', async ({ page }) => {
    await expect(page.locator('.loading-overlay')).not.toBeVisible()
  })
})

// ══════════════════════════════════════════════════════════════════════════════
test.describe('Scanner — navegación', () => {
// ══════════════════════════════════════════════════════════════════════════════

  test.beforeEach(async ({ page }) => {
    await mockHtml5QrcodeScanner(page)
    await page.goto(SCANNER_ROUTE)
  })

  test('el botón "Volver" lleva a la página de inicio', async ({ page }) => {
    await page.getByRole('button', { name: /volver/i }).click()
    await expect(page).toHaveURL('/')
  })
})

// ══════════════════════════════════════════════════════════════════════════════
test.describe('Scanner — escaneado exitoso', () => {
// ══════════════════════════════════════════════════════════════════════════════

  test.beforeEach(async ({ page }) => {
    await mockHtml5QrcodeScanner(page)
    await mockQrApi(page, { body: { id: 'sala-42' } })
    await page.goto(SCANNER_ROUTE)
  })

  test('navega a /sala/:id tras escanear un QR válido', async ({ page }) => {
    await triggerScan(page, 'qr-valido')
    await expect(page).toHaveURL('/sala/sala-42')
  })

  test('muestra el overlay de carga mientras procesa el QR', async ({ page }) => {
    // Retrasamos la respuesta para ver el estado de carga
    await page.route(`${API_QR_URL}/api/qr/**`, async (route) => {
      await page.waitForTimeout(300)
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'sala-42' }),
      })
    })

    // Disparamos sin await para capturar el estado intermedio
    page.evaluate(() => window.__qrSuccess('qr-carga'))

    await expect(page.locator('.loading-overlay')).toBeVisible()
    await expect(page.getByText(/procesando código qr/i)).toBeVisible()
  })

  test('el botón "Volver" se deshabilita durante el procesamiento', async ({ page }) => {
    await page.route(`${API_QR_URL}/api/qr/**`, async (route) => {
      await page.waitForTimeout(300)
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'sala-42' }),
      })
    })

    page.evaluate(() => window.__qrSuccess('qr-carga'))

    await expect(
      page.getByRole('button', { name: /volver/i })
    ).toBeDisabled()
  })
})

// ══════════════════════════════════════════════════════════════════════════════
test.describe('Scanner — error de API', () => {
// ══════════════════════════════════════════════════════════════════════════════

  test.beforeEach(async ({ page }) => {
    await mockHtml5QrcodeScanner(page)
    await page.goto(SCANNER_ROUTE)
  })

  test('muestra el banner de error cuando la API retorna 404', async ({ page }) => {
    await mockQrApi(page, { status: 404 })
    await triggerScan(page, 'qr-inexistente')

    await expect(page.locator('.error-banner')).toBeVisible()
    await expect(page.getByText(/error 404: qr no válido o expirado/i)).toBeVisible()
  })

  test('muestra el botón "Reintentar" después del error', async ({ page }) => {
    await mockQrApi(page, { status: 404 })
    await triggerScan(page, 'qr-invalido')

    await expect(
      page.getByRole('button', { name: /reintentar/i })
    ).toBeVisible()
  })

  test('"Reintentar" oculta el banner de error', async ({ page }) => {
    await mockQrApi(page, { status: 404 })
    await triggerScan(page, 'qr-invalido')

    await page.getByRole('button', { name: /reintentar/i }).click()

    await expect(page.locator('.error-banner')).not.toBeVisible()
  })

  test('"Reintentar" restablece scanner.resume()', async ({ page }) => {
    await mockQrApi(page, { status: 404 })
    await triggerScan(page, 'qr-invalido')

    // Limpiamos el flag antes de pulsar Reintentar
    await page.evaluate(() => { window.__scannerResumed = false })
    await page.getByRole('button', { name: /reintentar/i }).click()

    const resumed = await page.evaluate(() => window.__scannerResumed)
    expect(resumed).toBe(true)
  })

  test('no navega cuando la API devuelve error', async ({ page }) => {
    await mockQrApi(page, { status: 404 })
    await triggerScan(page, 'qr-invalido')

    await expect(page.locator('.error-banner')).toBeVisible()
    // La URL debe seguir siendo /scanner, no /sala/...
    await expect(page).toHaveURL(SCANNER_ROUTE)
  })
})

// ══════════════════════════════════════════════════════════════════════════════
test.describe('Scanner — inicialización del escáner (config)', () => {
// ══════════════════════════════════════════════════════════════════════════════

  test('el escáner se inicializa con fps=10 y qrbox=250', async ({ page }) => {
    await mockHtml5QrcodeScanner(page)
    await page.goto(SCANNER_ROUTE)

    const config = await page.evaluate(() => window.__scannerConfig)
    expect(config.fps).toBe(10)
    expect(config.qrbox).toBe(250)
  })
})