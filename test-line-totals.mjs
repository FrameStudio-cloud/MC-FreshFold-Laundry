/**
 * Verifies the running cost shown beside each service card's stepper is
 * price x quantity, not the bare quantity formatted as money.
 */
import { chromium } from 'playwright'

const SITE = process.env.URL || 'http://localhost:4173/'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
await page.goto(SITE, { waitUntil: 'networkidle' })

// service name -> expected unit price from business.js
const prices = {
  'Wash & fold': 150,
  'Dry cleaning': 900,
  'Ironing only': 100,
  'Duvets & beddings': 1200,
  'Shoe cleaning': 800,
  'Curtains & linens': 350,
  'Same-day express': 300,
}

let failures = 0

for (const [name, price] of Object.entries(prices)) {
  const card = page.locator('article', { has: page.locator('h3', { hasText: name }) }).first()
  const plus = card.locator('[role="group"] button:not([disabled])').last()

  // Read the money span exactly rather than substring-matching the whole card:
  // "KES 1" is a substring of "KES 100" and of "KES 1,200".
  const money = card.locator('[role="group"]').locator('xpath=following-sibling::span[1]')

  await card.scrollIntoViewIfNeeded()

  for (let qty = 1; qty <= 3; qty++) {
    await plus.click()
    const counter = (await card.locator('[role="group"] span[aria-live]').innerText()).replace(/\s+/g, ' ').trim()
    const shown = (await money.innerText()).trim()
    const want = `KES ${(price * qty).toLocaleString('en-KE')}`
    const ok = shown === want
    if (!ok) failures++
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name.padEnd(18)} @${qty} -> expect ${want.padEnd(10)} got "${shown}"  (counter "${counter}")`)
  }

  // Reset this card so the next one starts clean.
  for (let i = 0; i < 3; i++) {
    await card.locator('[role="group"] button:not([disabled])').first().click().catch(() => {})
  }
}

await browser.close()
console.log(`\n${failures === 0 ? 'ALL LINE TOTALS CORRECT' : failures + ' FAILURE(S)'}`)
process.exit(failures === 0 ? 0 : 1)