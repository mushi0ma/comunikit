import { Page } from '@playwright/test'

export async function loginAsTestUser(page: Page) {
  await page.goto('http://localhost:3000/login')
  await page.fill('input[type="email"]', 'test@aitu.edu.kz')
  await page.fill('input[type="password"]', 'testpassword123')
  await page.click('button[type="submit"]')
  await page.waitForURL('**/feed', { timeout: 10000 })
}

// Alternative: set session via localStorage mock
export async function setMockSession(page: Page) {
  await page.goto('http://localhost:3000')
  await page.evaluate(() => {
    // Mock auth store to bypass login
    localStorage.setItem('bypass-auth', 'true')
  })
}
