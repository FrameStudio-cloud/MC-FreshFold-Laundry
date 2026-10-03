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

/**
 * Calls are counted from RESPONSES, not requests.
 *
 * This is the whole fix for a ~30% flake. keel-api is on Render's free plan
 * and cold-starts in 10-30s, while the client's budget is deliberately 2
 * attempts at 4s (keelClient.js). On a cold API the first attempt is aborted at
 * 4s and the second at 8s, so a raw request counter sees 8 calls where a
 * visitor's browser made one logical request. Counting responses means the test
 * asserts what the API actually served.
 *
 * Aborted attempts are still tracked, separately: they are not noise, they are
 * the signal that the site had to retry, which is worth seeing rather than
 * hiding.
 */
const calls = []
const aborted = []
page.on('response', (r) => {
  if (r.url().includes('keel-api')) calls.push(new URL(r.url()).pathname + new URL(r.url()).search)
})
page.on('requestfailed', (r) => {
  if (r.url().includes('keel-api')) aborted.push(new URL(r.url()).pathname)
})
const tokenHeaders = []
page.on('request', (r) => {
  if (r.url().includes('keel-api')) tokenHeaders.push(Boolean(r.headers()['x-keel-site-token']))
})

/** How many keel-api requests are in flight right now. */
let inFlight = 0
const bump = (d) => (inFlight += d)
page.on('request', (r) => { if (r.url().includes('keel-api')) bump(1) })
page.on('requestfinished', (r) => { if (r.url().includes('keel-api')) bump(-1) })
page.on('requestfailed', (r) => { if (r.url().includes('keel-api')) bump(-1) })

await page.goto(SITE, { waitUntil: 'domcontentloaded' })

/**
 * Wait until the client has stopped trying, rather than for a fixed number of
 * milliseconds.
 *
 * A fixed sleep races the retry budget: the old 8000ms sat exactly on the
 * client's worst case (4s + 500ms backoff + 4s), so a cold API could still be
 * mid-second-attempt when the assertions ran. That is the flake.
 *
 * Quiescence states the real precondition — the browser is done talking — and
 * the 45s ceiling is generous enough to cover a full cold start, so the test
 * still fails loudly if the site genuinely never loads rather than hanging.
 */
const SETTLE_MS = 2500
const CEILING_MS = 45000
const started = Date.now()
let quietSince = Date.now()
for (;;) {
  if (Date.now() - started > CEILING_MS) break
  if (inFlight === 0) {
    if (!quietSince) quietSince = Date.now()
    if (Date.now() - quietSince >= SETTLE_MS) break
  } else {
    quietSince = 0
  }
  await page.waitForTimeout(250)
}

const settings = calls.filter((c) => c.startsWith('/api/settings'))
const services = calls.filter((c) => c.startsWith('/api/services'))
const faq = calls.filter((c) => c.includes('page=faq'))
const delivery = calls.filter((c) => c.includes('page=delivery'))
const pageViews = calls.filter((c) => c.startsWith('/api/page-views'))
const events = calls.filter((c) => c.startsWith('/api/events'))
const location = calls.filter((c) => c.includes('page=location'))
const testimonials = calls.filter((c) => c.includes('page=testimonials'))
const hero = calls.filter((c) => c.includes('page=hero'))
const howItWorks = calls.filter((c) => c.includes('page=how_it_works'))
const benefits = calls.filter((c) => c.includes('page=benefits'))
const anyToken = tokenHeaders.some(Boolean)

console.log(`EXPECT_REMOTE = ${expectRemote}`)
console.log('keel-api calls made :', calls.length ? calls.join('\n                       ') : '(none)')
console.log('aborted attempts    :', aborted.length ? aborted.join(', ') : '(none)')
console.log('site token sent     :', anyToken)
console.log('settings fetched    :', settings.length)
console.log('services fetched    :', services.length)
console.log('faq fetched         :', faq.length)
console.log('delivery fetched    :', delivery.length)

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
  check('called the delivery page-content route', delivery.length === 1)
  check('called the location page-content route', location.length === 1)
  check('called the testimonials page-content route', testimonials.length === 1)
  check('called the hero page-content route', hero.length === 1)
  check('called the how_it_works page-content route', howItWorks.length === 1)
  check('called the benefits page-content route', benefits.length === 1)
  check('sent the site token header', anyToken)
  check('back-to-top rendered from feature_toggles', btt === 1)
  // One page view, and only ever one.
  check('posted one page view', pageViews.length === 1)

  // Asserted by name, not by a hardcoded total. A magic number went stale twice
  // here: once when health reporting added its own event batches, and again when
  // Location and Testimonials added two more reads. The totals are summed from
  // the named counts instead, so this still catches an *unexpected extra* call
  // without needing editing every time a page is added.
  const nonEvents = calls.filter((c) => !c.startsWith('/api/events'))
  const expected =
    settings.length +
    services.length +
    faq.length +
    delivery.length +
    location.length +
    testimonials.length +
    hero.length +
    howItWorks.length +
    benefits.length +
    pageViews.length
  check(
    'only the named reads and one page view',
    nonEvents.length === expected,
    `${nonEvents.length} seen, ${expected} expected`,
  )
  // Not a failure: the API is on Render's free plan and a cold start can
  // exceed the client's 4s budget, which is why this test waits for quiescence
  // instead of a timer. Surfaced so a cold-start storm is visible rather than
  // silent.
  console.log(`\nNOTE  ${aborted.length} aborted attempt(s), ${events.length} event batch(es)`)
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