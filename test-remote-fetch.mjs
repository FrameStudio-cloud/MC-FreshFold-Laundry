/**
 * Proves whether the site is actually talking to keel-api.
 *
 * Sniffing the rendered text for "KSh" cannot answer that any more: business.js
 * was brought in line with the database, so remote and config render nearly the
 * same words. The only honest signal is whether the request was made, so this
 * watches the network.
 *
 * Run twice - once against a build with a token, once without - to prove both
 * halves of the contract: a token enables the loop, and no token silently
 * leaves a working static site.
 */
import { chromium } from 'playwright'

const SITE = process.env.URL || 'http://localhost:4192/'
const expectRemote = process.env.EXPECT_REMOTE === '1'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })

const calls = []
page.on('request', (r) => {
  if (r.url().includes('keel-api')) calls.push(new URL(r.url()).pathname + new URL(r.url()).search)
})
const tokenHeaders = []
page.on('request', (r) => {
  if (r.url().includes('keel-api')) tokenHeaders.push(Boolean(r.headers()['x-keel-site-token']))
})

await page.goto(SITE, { waitUntil: 'networkidle' })
await page.waitForTimeout(8000)

const settings = calls.filter((c) => c.startsWith('/api/settings'))
const services = calls.filter((c) => c.startsWith('/api/services'))
const faq = calls.filter((c) => c.includes('page-content'))
const anyToken = tokenHeaders.some(Boolean)

console.log(`EXPECT_REMOTE = ${expectRemote}`)
console.log('keel-api calls made :', calls.length ? calls.join('\n                       ') : '(none)')
console.log('site token sent     :', anyToken)
console.log('settings fetched    :', settings.length)
console.log('services fetched    :', services.length)
console.log('faq fetched         :', faq.length)

const title = await page.title()
const shopName = await page.locator('header span.font-display').first().innerText()
const hours = await page.locator('#contact dt').first().innerText()
const fabNumber = await page.locator('a.fab-pulse').getAttribute('href')
const btt = await page
  .locator('button[aria-label="Back to top"]')
  .count()
  .catch(() => 0)

console.log('\n--- rendered regardless of the API ---')
console.log('title       :', title)
console.log('shop        :', shopName.trim())
console.log('hours       :', hours.trim(), '/', (await page.locator('#contact dd').first().innerText()).trim())
console.log('whatsapp    :', fabNumber?.match(/wa\.me\/(\d+)/)?.[1])
console.log('back to top :', btt ? 'rendered' : 'not rendered')
console.log('faq items   :', await page.locator('#faq button[aria-expanded]').count())

let failures = 0
const check = (name, pass) => {
  if (!pass) failures++
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}`)
}

if (expectRemote) {
  check('called /api/settings', settings.length === 1)
  check('called /api/services', services.length === 1)
  check('called the faq page-content route', faq.length === 1)
  check('sent the site token header', anyToken)
  check('back-to-top rendered from feature_toggles', btt === 1)
  check('total keel-api calls is 3', calls.length === 3)
} else {
  check('made no keel-api calls', calls.length === 0)
  check('sent no token', !anyToken)
  check('still renders the shop name', shopName.trim().length > 0)
  check('still renders hours', hours.trim().length > 0)
  check('back-to-top correctly hidden with no toggle data', btt === 0)
}

await browser.close()
console.log(`\n${failures === 0 ? 'PASS' : failures + ' FAILURE(S)'}`)
process.exit(failures === 0 ? 0 : 1)