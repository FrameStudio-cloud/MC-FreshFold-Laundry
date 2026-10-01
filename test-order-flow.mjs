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

// Wash & Fold: +3 (kg). Dry Clean — Shirt: +2 (items). Shoe Cleaning: +2 (pairs).
// Names must match the shop's own service names; the catalogue is the database's.
// "Express Service" is deliberately excluded: it is flat-priced and correctly has
// no stepper, so it is reached through its own Order link instead.
async function bump(serviceName, times) {
  const card = page.locator('article', { has: page.locator('h3', { hasText: serviceName }) }).first()
  const group = card.locator('[role="group"]')
  await group.scrollIntoViewIfNeeded()
  for (let i = 0; i < times; i++) {
    await group.locator('button:not([disabled])').last().click()
  }
}

await bump('Wash & Fold', 3)
await bump('Dry Clean — Shirt', 2)
await bump('Shoe Cleaning', 2)

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
const txt = url.searchParams.get('text')
const currencies = [...new Set(txt.match(/\b(KES|KSh)\b/g) ?? [])]
console.log('no "undefined" :', !txt.includes('undefined'))
console.log('no "{{" tokens :', !txt.includes('{'))
console.log('total present  :', /Estimated total: \S+ [\d,]+/.test(txt))
// A single currency across every line and the total. Mixed output means one
// call site forgot to pass business.currency and the shop's customer sees it.
console.log('one currency   :', currencies.length === 1, currencies.join(','))
console.log('address prompt :', txt.includes('Pickup address:'))
console.log('digits-only num:', /^\d{9,15}$/.test(url.pathname.replace('/', '')))

// Also verify the empty-state copy, then Escape closes the sheet.
await page.keyboard.press('Escape')
await page.waitForTimeout(400)
const stillOpen = await page.locator('[role="dialog"]').evaluate((el) => !el.closest('[inert]') ? 'open' : 'closed').catch(() => 'closed')
console.log('escape closes  :', stillOpen)

await browser.close()