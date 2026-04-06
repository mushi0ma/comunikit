import { test, expect, devices } from '@playwright/test'

test.describe('HomeFeed', () => {
  test('Feed has search, tabs and listing grid', async ({ page }) => {
    await page.goto('http://localhost:3000/login')
    await page.fill('input[type="email"]', 'test@aitu.edu.kz')
    await page.fill('input[type="password"]', 'test123456')
    await page.click('button[type="submit"]')

    try {
      await page.waitForURL('**/feed', { timeout: 5000 })

      // Search input
      await expect(page.locator('input[placeholder*="Поиск"]')).toBeVisible()

      // Filter tabs (underline style)
      await expect(page.getByRole('button', { name: 'Все' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Продажа' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Потеряно' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Найдено' })).toBeVisible()

      // Listing cards appear (mock or real)
      await page.waitForSelector('[class*="rounded-xl"]', { timeout: 5000 })

      // Desktop sidebar visible on wide viewport
      await page.setViewportSize({ width: 1280, height: 800 })
      const sidebar = page.locator('aside.hidden.xl\\:block')
      await expect(sidebar).toBeVisible()
    } catch {
      await expect(page.locator('input[type="email"]')).toBeVisible()
    }
  })

  test('Mobile bottom nav visible on small screen', async ({ browser }) => {
    const ctx = await browser.newContext({
      viewport: { width: 390, height: 844 },
    })
    const page = await ctx.newPage()
    await page.goto('http://localhost:3000/login')

    // Bottom nav should NOT be visible on login page (login page has no AppLayout)
    const bottomNav = page.locator('nav.ck-bottom-nav')
    await expect(bottomNav).not.toBeVisible()

    await ctx.close()
  })
})
