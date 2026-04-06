# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: home.spec.ts >> AppLayout >> Register page renders correctly
- Location: frontend/tests/e2e/home.spec.ts:34:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('input[placeholder="12345"]')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('input[placeholder="12345"]')

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - region "Notifications alt+T"
  - generic [ref=e3]:
    - generic [ref=e5]:
      - generic [ref=e6]:
        - img [ref=e7]
        - generic [ref=e17]: comunikit
      - generic [ref=e18]:
        - heading "Создать аккаунт" [level=1] [ref=e19]
        - paragraph [ref=e20]: Добро пожаловать в Comunikit! Создайте аккаунт для начала
      - generic [ref=e21]:
        - button "Зарегистрироваться через GitHub" [ref=e22] [cursor=pointer]:
          - img [ref=e23]
          - text: Зарегистрироваться через GitHub
        - button "Зарегистрироваться через Telegram" [ref=e26] [cursor=pointer]:
          - img [ref=e27]
          - text: Зарегистрироваться через Telegram
      - generic [ref=e32]: или
      - generic [ref=e34]:
        - generic [ref=e35]:
          - generic [ref=e36]: Код доступа
          - textbox "Код доступа" [ref=e38]:
            - /placeholder: Введите код
        - generic [ref=e39]:
          - generic [ref=e40]: Полное имя
          - textbox "Полное имя" [ref=e41]:
            - /placeholder: Алиев Арман
        - generic [ref=e42]:
          - generic [ref=e43]: Email
          - textbox "Email" [ref=e44]:
            - /placeholder: student@aitu.edu.kz
        - generic [ref=e45]:
          - generic [ref=e46]: Пароль
          - generic [ref=e47]:
            - textbox "Пароль" [ref=e48]:
              - /placeholder: Минимум 8 символов
            - button "Показать пароль" [ref=e49] [cursor=pointer]:
              - img [ref=e50]
        - button "Продолжить" [disabled]
      - paragraph [ref=e53]:
        - text: Уже есть аккаунт?
        - link "Войти" [ref=e54] [cursor=pointer]:
          - /url: /login
      - paragraph [ref=e55]: Только для студентов AITU. Ваш код доступа будет проверен.
    - generic [ref=e56]:
      - generic [ref=e57]:
        - generic [ref=e58]: comunikit
        - generic [ref=e59]: Маркетплейс студентов AITU
      - generic [ref=e60]:
        - generic [ref=e61]:
          - img [ref=e63]
          - generic [ref=e65]: Покупай и продавай внутри кампуса
        - generic [ref=e66]:
          - img [ref=e68]
          - generic [ref=e70]: Находи потерянные вещи
        - generic [ref=e71]:
          - img [ref=e73]
          - generic [ref=e75]: Общайся на форуме
      - generic [ref=e76]: Уже 500+ студентов AITU
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test'
  2  | 
  3  | test.describe('AppLayout', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     await page.goto('http://localhost:3000/login')
  6  |   })
  7  | 
  8  |   test('Login page renders correctly', async ({ page }) => {
  9  |     // Logo icon (Boxes icon from lucide — rendered as SVG, check nearby text)
  10 |     await expect(page.getByText('Войти в Comunikit')).toBeVisible()
  11 | 
  12 |     // Email input
  13 |     await expect(page.locator('input[type="email"]')).toBeVisible()
  14 | 
  15 |     // Password input
  16 |     await expect(page.locator('input[type="password"]')).toBeVisible()
  17 | 
  18 |     // Submit button — "Продолжить"
  19 |     await expect(page.getByRole('button', { name: /продолжить/i })).toBeVisible()
  20 | 
  21 |     // GitHub OAuth button
  22 |     await expect(page.getByRole('button', { name: /github/i })).toBeVisible()
  23 | 
  24 |     // Telegram OAuth button
  25 |     await expect(page.getByRole('button', { name: /telegram/i })).toBeVisible()
  26 | 
  27 |     // Register link
  28 |     await expect(page.getByText(/зарегистрироваться/i)).toBeVisible()
  29 | 
  30 |     // "или" divider
  31 |     await expect(page.getByText('или')).toBeVisible()
  32 |   })
  33 | 
  34 |   test('Register page renders correctly', async ({ page }) => {
  35 |     await page.goto('http://localhost:3000/register')
  36 | 
  37 |     // Title
  38 |     await expect(page.getByText('Создать аккаунт')).toBeVisible()
  39 | 
  40 |     // Student ID input with placeholder "12345"
> 41 |     await expect(page.locator('input[placeholder="12345"]')).toBeVisible()
     |                                                              ^ Error: expect(locator).toBeVisible() failed
  42 | 
  43 |     // AITU-only disclaimer
  44 |     await expect(page.getByText(/только для студентов/i)).toBeVisible()
  45 | 
  46 |     // GitHub registration button
  47 |     await expect(page.getByRole('button', { name: /github/i })).toBeVisible()
  48 | 
  49 |     // Telegram registration button
  50 |     await expect(page.getByRole('button', { name: /telegram/i })).toBeVisible()
  51 | 
  52 |     // Login link
  53 |     await expect(page.getByText(/войти/i).first()).toBeVisible()
  54 |   })
  55 | 
  56 |   test('Protected route redirects to login', async ({ page }) => {
  57 |     // Navigating to /feed without auth should redirect to /login
  58 |     await page.goto('http://localhost:3000/feed')
  59 |     await expect(page).toHaveURL(/login/)
  60 |   })
  61 | })
  62 | 
```