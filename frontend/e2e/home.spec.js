/**
 * home.spec.js — Playwright E2E
 *
 * Pruebas end-to-end de la página principal (Home).
 * No requiere mocks de módulos: el componente es puramente estático + navegación.
 *
 * Requisito: baseURL: 'http://localhost:5173' en playwright.config.js
 */

import { test, expect } from '@playwright/test'

const HOME_ROUTE = '/'

// ══════════════════════════════════════════════════════════════════════════════
test.describe('Home — sección hero', () => {
// ══════════════════════════════════════════════════════════════════════════════

  test.beforeEach(async ({ page }) => {
    await page.goto(HOME_ROUTE)
  })

  test('muestra el nombre de la institución "Duoc UC"', async ({ page }) => {
    await expect(page.getByText('Duoc UC')).toBeVisible()
  })

  test('muestra el título del campus como h1', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /san carlos de apoquindo/i, level: 1 })
    ).toBeVisible()
  })

  test('muestra la descripción principal del sistema', async ({ page }) => {
    await expect(
      page.getByText(/usa este sistema interactivo para obtener información/i)
    ).toBeVisible()
  })
})

// ══════════════════════════════════════════════════════════════════════════════
test.describe('Home — tarjetas de acción', () => {
// ══════════════════════════════════════════════════════════════════════════════

  test.beforeEach(async ({ page }) => {
    await page.goto(HOME_ROUTE)
  })

  test('muestra el título de la tarjeta QR', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /escanear código qr/i })
    ).toBeVisible()
  })

  test('muestra el título de la tarjeta de mapa', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /ver ubicaciones/i })
    ).toBeVisible()
  })

  test('muestra el botón "Iniciar Escáner" habilitado', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /iniciar escáner/i })
    ).toBeEnabled()
  })

  test('muestra el botón "Explorar Mapa" habilitado', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /explorar mapa/i })
    ).toBeEnabled()
  })

  test('muestra exactamente dos botones de acción', async ({ page }) => {
    await expect(page.getByRole('button')).toHaveCount(2)
  })
})

// ══════════════════════════════════════════════════════════════════════════════
test.describe('Home — navegación', () => {
// ══════════════════════════════════════════════════════════════════════════════

  test('"Iniciar Escáner" navega a /scanner', async ({ page }) => {
    await page.goto(HOME_ROUTE)
    await page.getByRole('button', { name: /iniciar escáner/i }).click()
    await expect(page).toHaveURL('/scanner')
  })

  test('"Explorar Mapa" navega a /room-info', async ({ page }) => {
    await page.goto(HOME_ROUTE)
    await page.getByRole('button', { name: /explorar mapa/i }).click()
    await expect(page).toHaveURL('/room-info')
  })
})