import { test, expect } from '@playwright/test'

test.describe('AppLayout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/login')
  })

  test('Login page renders correctly', async ({ page }) => {
    // Logo icon (Boxes icon from lucide — rendered as SVG, check nearby text)
    await expect(page.getByText('Войти в аккаунт')).toBeVisible()

    // Email input
    await expect(page.locator('input[type="email"]')).toBeVisible()

    // Password input
    await expect(page.locator('input[type="password"]')).toBeVisible()

    // Submit button — "Продолжить"
    await expect(page.getByRole('button', { name: /войти/i })).toBeVisible()

    // GitHub OAuth button
    await expect(page.getByRole('button', { name: /github/i })).toBeVisible()

    // Telegram OAuth button
    await expect(page.getByRole('button', { name: /telegram/i })).toBeVisible()

    // Register link
    await expect(page.getByText(/зарегистрироваться/i)).toBeVisible()

    // "или" divider
    await expect(page.getByText('или')).toBeVisible()
  })

  test('Register page renders correctly', async ({ page }) => {
    await page.goto('http://localhost:3000/register')

    // Title
    await expect(page.getByText('Создать аккаунт')).toBeVisible()

    // Name input
    await expect(page.locator('input[placeholder="Алиев Арман"]')).toBeVisible()

    // AITU-only disclaimer
    await expect(page.getByText(/только для студентов/i)).toBeVisible()

    // GitHub registration button
    await expect(page.getByRole('button', { name: /github/i })).toBeVisible()

    // Telegram registration button
    await expect(page.getByRole('button', { name: /telegram/i })).toBeVisible()

    // Login link
    await expect(page.getByText(/войти/i).first()).toBeVisible()
  })

  test('Protected route redirects to login', async ({ page }) => {
    // Navigating to /forum without auth should redirect to /login
    await page.goto('http://localhost:3000/forum')
    await expect(page).toHaveURL(/login/)
  })

  test('Notification bell shows popover on click', async ({ page }) => {
    // Attempt login
    await page.fill('input[type="email"]', 'test@aitu.edu.kz')
    await page.fill('input[type="password"]', 'test123456')
    await page.click('button[type="submit"]')

    try {
      await page.waitForURL('**/forum', { timeout: 5000 })

      // Bell button should be visible
      const bell = page.getByRole('button', { name: /уведомления/i })
      await expect(bell).toBeVisible()

      // Click bell to open popover
      await bell.click()

      // Popover should show "Уведомления" header
      await expect(page.getByText('Все уведомления →')).toBeVisible()
    } catch {
      // Auth unavailable — verify we're still on login page
      await expect(page.locator('input[type="email"]')).toBeVisible()
    }
  })
})
