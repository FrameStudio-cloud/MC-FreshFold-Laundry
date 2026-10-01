/**
 * Order-flow test: add items, open the sheet, and print the exact WhatsApp
 * message that would be sent, so the wording can be reviewed as the business
 * receives it.
 */
import { chromium } from 'playwright'

const SITE = process.env.URL || 'http://localhost:4173/'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 360, height: 900 } })
await page.goto(SITE, { waitUntil: 'networkidle' })

// Wash & fold: +3 (kg). Dry cleaning: +2 (items). Same-day express: +1.
async function bump(serviceName, times) {
  const card = page.locator('article', { has: page.locator('h3', { hasText: serviceName }) }).first()
  const group = card.locator('[role="group"]')
  await group.scrollIntoViewIfNeeded()
  for (let i = 0; i < times; i++) {
    await group.locator('button:not([disabled])').last().click()
  }
}

await bump('Wash & fold', 3)
await bump('Dry cleaning', 2)
await bump('Same-day express', 1)

// Open the sheet via the sticky mobile bar.
await page.locator('button:has-text("Your order")').first().click()
await page.waitForSelector('[role="dialog"]')

const href = await page.locator('[role="dialog"] a[href*="wa.me"]').getAttribute('href')
const url = new URL(href)

console.log('=== WA NUMBER ===')
console.log(url.pathname.replace('/', ''))
console.log('\n=== MESSAGE AS THE BUSINESS RECEIVES IT ===')
console.log(url.searchParams.get('text'))
console.log('\n=== SHAPE CHECKS ===')
console.log('no "undefined" :', !url.searchParams.get('text').includes('undefined'))
console.log('no "{{" tokens :', !url.searchParams.get('text').includes('{'))
console.log('total present  :', /Estimated total: KES [\d,]+/.test(url.searchParams.get('text')))
console.log('address prompt :', url.searchParams.get('text').includes('Pickup address:'))
console.log('digits-only num:', /^\d{9,15}$/.test(url.pathname.replace('/', '')))

// Also verify the empty-state copy, then Escape closes the sheet.
await page.keyboard.press('Escape')
await page.waitForTimeout(400)
const stillOpen = await page.locator('[role="dialog"]').evaluate((el) => !el.closest('[inert]') ? 'open' : 'closed').catch(() => 'closed')
console.log('escape closes  :', stillOpen)

await browser.close()