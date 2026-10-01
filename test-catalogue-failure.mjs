/**
 * Proves the catalogue degrades honestly when /api/services fails.
 *
 * There is deliberately NO hardcoded fallback list. A second copy of the prices
 * is the thing that goes stale and disagrees with what the shop charges, and a
 * stale price is worse than no price. So this asserts that the section says so
 * and points at WhatsApp, rather than quietly rendering yesterday's numbers.
 *
 * It also asserts the rest of the page is untouched, because the failure is
 * scoped to the catalogue.
 */
import { chromium } from 'playwright'

const SITE = process.env.URL || 'http://localhost:4173/'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })

let failures = 0
const check = (name, pass, detail = '') => {
  if (!pass) failures++
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`)
}

// Kill only the services call; settings and the FAQ must still work.
await page.route('**/api/services', (route) => route.abort('failed'))

await page.goto(SITE, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(9000)

const services = page.locator('#services')
const text = (await services.innerText()).replace(/\s+/g, ' ')

check('catalogue shows a message, not cards', (await services.locator('article').count()) === 0)
check('message explains why', text.includes('didn'), text.slice(0, 90))
check('does not claim prices are current', !/KSh\s?\d/.test(text), 'no price rendered')
const waHref = await services.locator('a[href*="wa.me"]').first().getAttribute('href').catch(() => null)
check('offers WhatsApp instead', Boolean(waHref && waHref.includes('254793302518')), waHref ? 'wa.me/254793302518' : 'no link')

// The price list is derived from the same call, so it must degrade too.
const priceText = (await page.locator('#pricing').innerText()).replace(/\s+/g, ' ')
check('price list also degrades, no stale rows', (await page.locator('#price-panel li').count()) === 0, priceText.slice(0, 70))

// The rest of the page is independent of the catalogue.
check('header still names the shop', (await page.locator('header').innerText()).includes('OLFATTA'))
check('hours still render from /api/settings', (await page.locator('#contact dt').first().innerText()).includes('Every day'))
check('FAQ still renders from the page-content call', (await page.locator('#faq button[aria-expanded]').count()) === 6)
check('WhatsApp float still present', (await page.locator('a.fab-pulse').count()) === 1)
check('page has no horizontal overflow', await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1))

await page.screenshot({ path: 'catalogue-error.png' })
await browser.close()
console.log(`\n${failures === 0 ? 'PASS - degrades honestly' : failures + ' FAILURE(S)'}`)
process.exit(failures === 0 ? 0 : 1)