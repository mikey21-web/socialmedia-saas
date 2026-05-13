---
name: playwright
description: Write Playwright end-to-end tests for web applications. Use when writing E2E tests, browser automation scripts, testing user flows, taking screenshots for visual regression, or setting up Playwright in CI/CD pipelines.
---

# Playwright E2E Testing Expert

## Setup

```bash
npm init playwright@latest  # interactive setup
# or manual:
npm install -D @playwright/test
npx playwright install  # installs browsers
```

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 14'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

## Writing Tests

```typescript
import { test, expect } from '@playwright/test'

test('user can sign up and log in', async ({ page }) => {
  // Navigate
  await page.goto('/signup')

  // Fill form using accessible selectors (preferred)
  await page.getByLabel('Email').fill('test@example.com')
  await page.getByLabel('Password').fill('SecurePass123!')
  await page.getByRole('button', { name: 'Create account' }).click()

  // Wait for navigation
  await expect(page).toHaveURL('/dashboard')

  // Verify element is visible
  await expect(page.getByText('Welcome back')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
})
```

## Selectors (Priority Order)

```typescript
// 1. Role + name (most resilient to refactoring)
page.getByRole('button', { name: 'Submit' })
page.getByRole('link', { name: 'Home' })
page.getByRole('heading', { level: 1 })
page.getByRole('textbox', { name: 'Search' })
page.getByRole('checkbox', { name: 'Accept terms' })

// 2. Label (for form inputs)
page.getByLabel('Email address')
page.getByLabel('Password')

// 3. Placeholder
page.getByPlaceholder('Enter your email')

// 4. Text content
page.getByText('Sign in')
page.getByText(/error/i)  // regex

// 5. Alt text (images)
page.getByAltText('Company logo')

// 6. Test ID (when above don't work)
page.getByTestId('submit-button')
// HTML: <button data-testid="submit-button">

// 7. CSS (last resort)
page.locator('.submit-btn')
page.locator('#login-form')
```

## Assertions

```typescript
// Visibility
await expect(element).toBeVisible()
await expect(element).toBeHidden()
await expect(element).not.toBeVisible()

// Text
await expect(element).toHaveText('exact text')
await expect(element).toHaveText(/partial match/i)
await expect(element).toContainText('substring')

// State
await expect(input).toHaveValue('current value')
await expect(checkbox).toBeChecked()
await expect(button).toBeDisabled()
await expect(button).toBeEnabled()

// URL
await expect(page).toHaveURL('/dashboard')
await expect(page).toHaveURL(/\/user\/\d+/)

// Title
await expect(page).toHaveTitle('My App - Dashboard')

// Count
await expect(page.getByRole('listitem')).toHaveCount(5)

// Attribute
await expect(element).toHaveAttribute('href', '/home')
await expect(element).toHaveClass(/active/)
```

## Handling Common Scenarios

```typescript
// Dropdowns / Selects
await page.getByLabel('Country').selectOption('US')
await page.getByLabel('Country').selectOption({ label: 'United States' })

// File upload
await page.getByLabel('Upload').setInputFiles('path/to/file.pdf')

// Dialogs (alert, confirm, prompt)
page.on('dialog', dialog => dialog.accept())
page.on('dialog', async dialog => {
  expect(dialog.message()).toContain('Are you sure?')
  await dialog.accept()
})

// New tab/popup
const [newPage] = await Promise.all([
  page.waitForEvent('popup'),
  page.getByRole('link', { name: 'Open in new tab' }).click(),
])
await newPage.waitForLoadState()
await expect(newPage).toHaveURL(/expected/)

// API responses
await page.route('**/api/users', route => {
  route.fulfill({ json: [{ id: 1, name: 'Alice' }] })
})

// Intercept & modify
await page.route('**/api/data', async route => {
  const response = await route.fetch()
  const json = await response.json()
  json.extra = 'injected'
  await route.fulfill({ json })
})
```

## Page Object Model

```typescript
// pages/LoginPage.ts
import { Page, Locator } from '@playwright/test'

export class LoginPage {
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly submitButton: Locator
  readonly errorMessage: Locator

  constructor(readonly page: Page) {
    this.emailInput = page.getByLabel('Email')
    this.passwordInput = page.getByLabel('Password')
    this.submitButton = page.getByRole('button', { name: 'Sign in' })
    this.errorMessage = page.getByRole('alert')
  }

  async navigate() {
    await this.page.goto('/login')
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.submitButton.click()
  }
}

// In test:
test('login flow', async ({ page }) => {
  const loginPage = new LoginPage(page)
  await loginPage.navigate()
  await loginPage.login('user@example.com', 'password')
  await expect(page).toHaveURL('/dashboard')
})
```

## Screenshots & Visual Testing

```typescript
// Full page screenshot
await page.screenshot({ path: 'screenshot.png', fullPage: true })

// Element screenshot
await page.locator('.chart').screenshot({ path: 'chart.png' })

// Visual regression (snapshot)
await expect(page).toHaveScreenshot('homepage.png')
await expect(page.locator('.card')).toHaveScreenshot('card.png', {
  maxDiffPixelRatio: 0.02,  // allow 2% difference
})

// Update snapshots
npx playwright test --update-snapshots
```

## Running Tests

```bash
npx playwright test                    # run all
npx playwright test e2e/login.spec.ts  # specific file
npx playwright test --headed           # see browser
npx playwright test --ui               # interactive UI mode
npx playwright test --debug            # debug mode
npx playwright show-report             # view HTML report
npx playwright codegen localhost:3000  # record tests
```
