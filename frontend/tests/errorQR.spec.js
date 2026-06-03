// @ts-check
import { test, expect } from '@playwright/test'

// ─── BLOQUE 1: Renderizado ────────────────────────────────────────────────────
test.describe('ErrorQR - Renderizado', () => {

  test('muestra el título "Código QR no válido"', async ({ page }) => {
    await page.goto('/error')
    await expect(page.getByRole('heading', { name: 'Código QR no válido' })).toBeVisible()
  })

  test('muestra el ícono ❌', async ({ page }) => {
    await page.goto('/error')
    await expect(page.locator('.error-icon')).toBeVisible()
  })

  test('muestra el mensaje de error por defecto', async ({ page }) => {
    await page.goto('/error')
    await expect(
      page.getByText('No se encontró información para este código QR')
    ).toBeVisible()
  })

  test('muestra el título "Posibles causas:"', async ({ page }) => {
    await page.goto('/error')
    await expect(page.getByRole('heading', { name: 'Posibles causas:' })).toBeVisible()
  })

  test('muestra exactamente 4 causas en la lista', async ({ page }) => {
    await page.goto('/error')
    const items = page.locator('.error-suggestions ul li')
    await expect(items).toHaveCount(4)
  })

  test('muestra los textos correctos en cada causa', async ({ page }) => {
    await page.goto('/error')
    await expect(page.getByText('El código QR está deteriorado o no es legible')).toBeVisible()
    await expect(page.getByText('El código QR ha expirado')).toBeVisible()
    await expect(page.getByText('Es un código QR de otra sede o sistema')).toBeVisible()
    await expect(page.getByText('Problema temporal de conexión con el servidor')).toBeVisible()
  })

  test('muestra los 3 botones de acción', async ({ page }) => {
    await page.goto('/error')
    await expect(page.getByRole('button', { name: /Intentar de nuevo/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Ir al inicio/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Ver ayuda/i })).toBeVisible()
  })

})

// ─── BLOQUE 2: Navegación ─────────────────────────────────────────────────────
test.describe('ErrorQR - Navegación', () => {

  test('botón "Intentar de nuevo" navega a /scanner', async ({ page }) => {
    await page.goto('/error')
    await page.getByRole('button', { name: /Intentar de nuevo/i }).click()
    await expect(page).toHaveURL(/\/scanner/)
  })

  test('botón "Ir al inicio" navega a /', async ({ page }) => {
    await page.goto('/error')
    await page.getByRole('button', { name: /Ir al inicio/i }).click()
    await expect(page).toHaveURL(/\/$/)
  })

  test('botón "Ver ayuda" navega a /help', async ({ page }) => {
    await page.goto('/error')
    await page.getByRole('button', { name: /Ver ayuda/i }).click()
    await expect(page).toHaveURL(/\/help/)
  })

})

// ─── BLOQUE 3: Estructura CSS ─────────────────────────────────────────────────
test.describe('ErrorQR - Estructura CSS', () => {

  test('el contenedor principal tiene la clase .error-page', async ({ page }) => {
    await page.goto('/error')
    await expect(page.locator('.error-page')).toBeVisible()
  })

  test('existe el contenedor .error-container', async ({ page }) => {
    await page.goto('/error')
    await expect(page.locator('.error-container')).toBeVisible()
  })

  test('los botones tienen las clases correctas', async ({ page }) => {
    await page.goto('/error')
    await expect(page.locator('.btn.btn-primary')).toBeVisible()
    await expect(page.locator('.btn.btn-secondary')).toBeVisible()
    await expect(page.locator('.btn.btn-outline')).toBeVisible()
  })

})