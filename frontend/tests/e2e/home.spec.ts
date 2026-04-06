import { test, expect } from '@playwright/test'

test.describe('AppLayout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/login')
  })

  test('Login page renders correctly', async ({ page }) => {
    // Logo icon (Boxes icon from lucide — rendered as SVG, check nearby text)
    await expect(page.getByText('Войти в Comunikit')).toBeVisible()

    // Email input
    await expect(page.locator('input[type="email"]')).toBeVisible()

    // Password input
    await expect(page.locator('input[type="password"]')).toBeVisible()

    // Submit button — "Продолжить"
    await expect(page.getByRole('button', { name: /продолжить/i })).toBeVisible()

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

    // Student ID input with placeholder "12345"
    await expect(page.locator('input[placeholder="12345"]')).toBeVisible()

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
    // Navigating to /feed without auth should redirect to /login
    await page.goto('http://localhost:3000/feed')
    await expect(page).toHaveURL(/login/)
  })
})
