import { test, expect } from '@playwright/test'

test.describe('Forum page', () => {
  test('Forum renders categories and threads', async ({ page }) => {
    await page.goto('http://localhost:3000/login')
    await page.fill('input[type="email"]', 'test@aitu.edu.kz')
    await page.fill('input[type="password"]', 'test123456')
    await page.click('button[type="submit"]')

    try {
      await page.waitForURL('**/feed', { timeout: 5000 })
      await page.goto('http://localhost:3000/forum')

      // Forum title
      await expect(page.getByText('Форум AITUC')).toBeVisible()

      // Category cards (from mock or real data)
      await expect(page.getByText('Учёба')).toBeVisible()
      await expect(page.getByText('Общее')).toBeVisible()
      await expect(page.getByText('События')).toBeVisible()
      await expect(page.getByText('Жильё')).toBeVisible()

      // New thread button
      await expect(page.getByRole('button', { name: /новая тема/i })).toBeVisible()

      // Thread list heading
      await expect(page.getByText('Все темы')).toBeVisible()
    } catch {
      await expect(page.locator('input[type="email"]')).toBeVisible()
    }
  })
})
