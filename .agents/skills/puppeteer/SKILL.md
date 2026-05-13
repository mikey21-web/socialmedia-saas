---
name: puppeteer
description: Automate browsers with Puppeteer for scraping, screenshots, and testing. Use when scraping web data, taking screenshots/PDFs, automating form submissions, testing web pages with Puppeteer, or generating PDF reports from HTML.
---

# Puppeteer Browser Automation

## Setup

```bash
npm install puppeteer      # includes Chromium (~170MB)
npm install puppeteer-core # without Chromium (bring your own)
```

## Basic Pattern

```typescript
import puppeteer from 'puppeteer'

const browser = await puppeteer.launch({
  headless: 'new',       // 'new' = headless, false = visible
  args: ['--no-sandbox', '--disable-setuid-sandbox'],  // needed in Docker/CI
})

const page = await browser.newPage()

try {
  await page.goto('https://example.com', { waitUntil: 'networkidle2' })
  // ... do stuff
} finally {
  await browser.close()  // ALWAYS close in finally block
}
```

## Navigation & Waiting

```typescript
// waitUntil options:
// 'load'          → DOM load event (fast, may miss dynamic content)
// 'domcontentloaded' → DOMContentLoaded event
// 'networkidle0'  → 0 network connections for 500ms (safest for SPAs)
// 'networkidle2'  → ≤2 connections for 500ms (good balance)

await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 })

// Wait for element
await page.waitForSelector('.results-container', { timeout: 10000 })
await page.waitForSelector('.loading', { hidden: true })  // wait until hidden

// Wait for navigation after click
await Promise.all([
  page.waitForNavigation({ waitUntil: 'networkidle2' }),
  page.click('a[href="/next-page"]'),
])

// Wait for function to return true
await page.waitForFunction(() => document.querySelectorAll('.item').length > 5)
```

## Selectors & Interaction

```typescript
// Click
await page.click('button.submit')
await page.click('#login-btn')

// Type
await page.type('input[name="email"]', 'user@example.com', { delay: 50 })
await page.fill('input[name="email"]', 'user@example.com')  // faster

// Select dropdown
await page.select('select#country', 'US')

// Keyboard
await page.keyboard.press('Enter')
await page.keyboard.type('Hello World')

// Mouse
await page.mouse.click(100, 200)
await page.hover('.dropdown-trigger')

// Clear field then type
await page.evaluate(() => (document.querySelector('#input') as HTMLInputElement).value = '')
await page.type('#input', 'new value')
```

## Extracting Data

```typescript
// Single element
const title = await page.$eval('h1', el => el.textContent?.trim())

// Multiple elements
const links = await page.$$eval('a', els => els.map(el => ({
  text: el.textContent?.trim(),
  href: el.getAttribute('href'),
})))

// Complex extraction
const data = await page.evaluate(() => {
  const rows = document.querySelectorAll('table tr')
  return Array.from(rows).map(row => {
    const cells = row.querySelectorAll('td')
    return Array.from(cells).map(cell => cell.textContent?.trim())
  })
})

// Get attribute
const imgSrc = await page.$eval('img.hero', el => el.getAttribute('src'))

// Get input value
const inputValue = await page.$eval('#search', (el: HTMLInputElement) => el.value)
```

## Screenshots & PDF

```typescript
// Full page screenshot
await page.screenshot({
  path: 'screenshot.png',
  fullPage: true,
  type: 'png',            // 'jpeg', 'webp'
})

// Clip specific area
await page.screenshot({
  path: 'header.png',
  clip: { x: 0, y: 0, width: 1200, height: 200 },
})

// Element screenshot
const element = await page.$('.chart')
await element?.screenshot({ path: 'chart.png' })

// PDF (only in headless mode)
await page.pdf({
  path: 'report.pdf',
  format: 'A4',
  printBackground: true,
  margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
})
```

## Authentication & Cookies

```typescript
// Set cookies
await page.setCookie({
  name: 'auth_token',
  value: 'your-token',
  domain: 'example.com',
})

// Get cookies
const cookies = await page.cookies()

// HTTP Basic Auth
await page.authenticate({ username: 'user', password: 'pass' })

// Set headers
await page.setExtraHTTPHeaders({
  'Authorization': 'Bearer token123',
  'X-Custom-Header': 'value',
})
```

## Intercepting Requests

```typescript
await page.setRequestInterception(true)

page.on('request', (req) => {
  // Block images/fonts for faster loading
  if (['image', 'font', 'stylesheet'].includes(req.resourceType())) {
    req.abort()
  } else {
    req.continue()
  }
})

// Mock API response
page.on('request', (req) => {
  if (req.url().includes('/api/users')) {
    req.respond({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ id: 1, name: 'Alice' }]),
    })
  } else {
    req.continue()
  }
})
```

## Scraping Pattern with Pagination

```typescript
async function scrapeAllPages(startUrl: string) {
  const browser = await puppeteer.launch({ headless: 'new' })
  const page = await browser.newPage()
  const allData: any[] = []

  try {
    await page.goto(startUrl, { waitUntil: 'networkidle2' })

    while (true) {
      // Extract current page data
      const items = await page.$$eval('.item', els => els.map(el => ({
        title: el.querySelector('h3')?.textContent?.trim(),
        price: el.querySelector('.price')?.textContent?.trim(),
      })))
      allData.push(...items)

      // Check for next page
      const nextBtn = await page.$('.pagination .next:not(.disabled)')
      if (!nextBtn) break

      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2' }),
        nextBtn.click(),
      ])
    }
  } finally {
    await browser.close()
  }

  return allData
}
```

## Docker / CI Config

```typescript
const browser = await puppeteer.launch({
  headless: 'new',
  executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,  // use system Chrome in Docker
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',  // important in Docker
    '--disable-gpu',
  ],
})
```

## Puppeteer vs Playwright

| Feature | Puppeteer | Playwright |
|---------|-----------|-----------|
| Browsers | Chrome/Firefox | Chrome/Firefox/Safari |
| Auto-waiting | Manual | Built-in smart waits |
| Test runner | Bring your own | @playwright/test built-in |
| Network mocking | Manual | `page.route()` is easier |
| Multi-tab | Manual | Built-in |
| Best for | Scraping, PDFs | E2E testing |
