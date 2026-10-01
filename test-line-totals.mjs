/**
 * Verifies the running cost beside each service card's stepper is
 * price x quantity, not the bare quantity formatted as money.
 *
 * Prices here are asserted against business.js, which mirrors the shop's live
 * `services` rows. If a price is changed in one place and not the other this
 * test fails, which is the point: the FAQ quotes these same numbers in prose.
 *
 * Flat-priced services carry no stepper by design (a "+/-" next to a flat
 * "KSh 500" implies four separate jobs), so they are asserted to have none.
 */
import { chromium } from 'playwright'

const SITE = process.env.URL || 'http://localhost:4173/'

const STEPPER_SERVICES = {
  'Wash & fold': 200,
  'Wash & iron': 300,
  'Pressing only': 150,
  'Dry cleaning': 350,
  'Duvet cleaning': 600,
  'Curtain cleaning': 500,
  'Shoe cleaning': 250,
}
const FLAT_SERVICES = ['Same-day express']

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
await page.goto(SITE, { waitUntil: 'networkidle' })

let failures = 0
const fail = (msg) => { failures++; console.log(`FAIL  ${msg}`) }

for (const [name, price] of Object.entries(STEPPER_SERVICES)) {
  const card = page.locator('article', { has: page.locator('h3', { hasText: name }) }).first()
  await card.scrollIntoViewIfNeeded()

  const plus = card.locator('[role="group"] button:not([disabled])').last()
  // Read the money span exactly rather than substring-matching the card text:
  // "KES 1" is a substring of "KES 100" and of "KSh 1,200".
  const money = card.locator('[role="group"]').locator('xpath=following-sibling::span[1]')

  for (let qty = 1; qty <= 3; qty++) {
    await plus.click()
    const counter = (await card.locator('[role="group"] span[aria-live]').innerText()).replace(/\s+/g, ' ').trim()
    const shown = (await money.innerText()).trim()
    const want = `KSh ${(price * qty).toLocaleString('en-KE')}`
    if (shown === want) {
      console.log(`PASS  ${name.padEnd(16)} @${qty} -> ${shown}  (counter "${counter}")`)
    } else {
      fail(`${name} @${qty}: expected "${want}" got "${shown}"`)
    }
  }

  for (let i = 0; i < 3; i++) {
    await card.locator('[role="group"] button:not([disabled])').first().click().catch(() => {})
  }
}

for (const name of FLAT_SERVICES) {
  const card = page.locator('article', { has: page.locator('h3', { hasText: name }) }).first()
  await card.scrollIntoViewIfNeeded()
  const hasStepper = (await card.locator('[role="group"]').count()) > 0
  const hasOrderButton = (await card.locator('a:has-text("Order")').count()) > 0
  if (!hasStepper && hasOrderButton) {
    console.log(`PASS  ${name.padEnd(16)} flat price -> no stepper, direct Order link`)
  } else {
    fail(`${name}: expected no stepper and a direct Order link (stepper=${hasStepper}, orderButton=${hasOrderButton})`)
  }
}

await browser.close()
console.log(`\n${failures === 0 ? 'ALL LINE TOTALS CORRECT' : failures + ' FAILURE(S)'}`)
process.exit(failures === 0 ? 0 : 1)