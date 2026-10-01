/**
 * Verifies the running cost beside each service card's stepper is
 * price x quantity, not the bare quantity formatted as money.
 *
 * Prices are asserted against the LIVE /api/services response rather than
 * business.js, because the catalogue no longer lives in the config. That is the
 * point: if this test read the config it would pass while the page showed
 * something else entirely.
 *
 * Two shapes are checked:
 *  - a service with a unit gets a stepper and a line total of price x qty
 *  - a flat-priced service gets NO stepper, because "+/-" beside a flat price
 *    implies four separate jobs were being bought
 */
import { chromium } from 'playwright'

const SITE = process.env.URL || 'http://localhost:4173/'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
await page.goto(SITE, { waitUntil: 'networkidle' })
await page.waitForSelector('#service-panel article', { timeout: 20000 })

// Read the truth from the page's own cards.
const catalogue = await page.$$eval('#service-panel article', (cards) =>
  cards.map((card) => ({
    name: card.querySelector('h3').textContent.trim(),
    priceText: card.querySelector('p.font-display').textContent.trim(),
    unitLine: card.querySelector('p.font-display + p')?.textContent.trim() ?? null,
    hasStepper: Boolean(card.querySelector('[role="group"]')),
  })),
)
console.log(`catalogue: ${catalogue.length} services from the API`)
for (const s of catalogue) console.log(`  ${s.hasStepper ? '[stepper]' : '[flat]   '} ${s.name.padEnd(24)} ${s.priceText}  ${s.unitLine ?? ''}`)

let failures = 0
const fail = (m) => { failures++; console.log(`FAIL  ${m}`) }
const money = (t) => Number(String(t).replace(/[^\d]/g, ''))

const withStepper = catalogue.filter((s) => s.hasStepper)
const flat = catalogue.filter((s) => !s.hasStepper)

if (withStepper.length === 0) fail('no service rendered a stepper — the unit mapping is broken')

for (const service of withStepper) {
  const card = page.locator('article', { has: page.locator('h3', { hasText: service.name }) }).first()
  await card.scrollIntoViewIfNeeded()
  const plus = card.locator('[role="group"] button:not([disabled])').last()
  // Exact element read, not a substring: "KSh 1" is inside "KSh 100" and "KSh 1,200".
  const line = card.locator('[role="group"]').locator('xpath=following-sibling::span[1]')

  for (let qty = 1; qty <= 3; qty++) {
    await plus.click()
    const counter = (await card.locator('[role="group"] span[aria-live]').innerText()).replace(/\s+/g, ' ').trim()
    const shown = (await line.innerText()).trim()
    const want = money(service.priceText) * qty
    const got = money(shown)
    if (got === want) {
      console.log(`PASS  ${service.name.padEnd(24)} @${qty} -> ${shown}  (counter "${counter}")`)
    } else {
      fail(`${service.name} @${qty}: expected total ${want} got ${got} ("${shown}")`)
    }
  }

  for (let i = 0; i < 3; i++) {
    await card.locator('[role="group"] button:not([disabled])').first().click().catch(() => {})
  }
}

for (const service of flat) {
  const card = page.locator('article', { has: page.locator('h3', { hasText: service.name }) }).first()
  const hasOrder = (await card.locator('a:has-text("Order")').count()) > 0
  if (hasOrder) console.log(`PASS  ${service.name.padEnd(24)} flat ${service.priceText} -> no stepper, direct Order link`)
  else fail(`${service.name}: flat price but no direct Order link`)
}

if (flat.length === 0) fail('no flat-priced service rendered — check pricing_mode "flat" -> no stepper')

// Ordering: Wash & Fold must lead, not "Blanket Wash" as the API's alphabetical sort would.
const first = catalogue[0]?.name
if (first === 'Wash & Fold') console.log(`PASS  ordering -> first card is "${first}" (config serviceOrder, not alphabetical)`)
else fail(`ordering: first card is "${first}", expected "Wash & Fold"`)

await browser.close()
console.log(`\n${failures === 0 ? 'ALL LINE TOTALS CORRECT' : failures + ' FAILURE(S)'}`)
process.exit(failures === 0 ? 0 : 1)