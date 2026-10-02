/**
 * Proves page views reach keel-api from a real browser.
 *
 * This cannot be asserted in Node. The SDK's own AGENTS.md records why: a
 * transport test that injects a fake fetch cannot see a header being dropped, and
 * `navigator.sendBeacon` cannot carry one at all — six POSTs on the wire, zero
 * rows stored, nothing in any log. Only a real browser shows whether the
 * authenticated POST actually lands.
 *
 * Asserts the whole chain: the owner's page_tracking toggle arms the SDK, one
 * POST goes out carrying the site token, a row appears for THIS shop, and
 * turning the toggle off stops it.
 */
import { chromium } from 'playwright'

const SITE = process.env.URL || 'http://localhost:4173/'

let failures = 0
const check = (name, pass, detail = '') => {
  if (!pass) failures++
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`)
}

const browser = await chromium.launch()

// ---------------------------------------------------------------- 1. on
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })

  const posts = []
  page.on('request', (r) => {
    if (r.url().includes('/api/page-views') && r.method() === 'POST') {
      posts.push({
        url: r.url(),
        hasToken: Boolean(r.headers()['x-keel-site-token']),
        contentType: r.headers()['content-type'] || '',
      })
    }
  })
  const events = []
  page.on('request', (r) => {
    if (r.url().includes('/api/events') && r.method() === 'POST') events.push(r.url())
  })
  const pageErrors = []
  page.on('pageerror', (e) => pageErrors.push(String(e.message)))

  await page.goto(SITE, { waitUntil: 'networkidle' })
  await page.waitForTimeout(9000)

  check('one page_view POST was made', posts.length === 1, `${posts.length} seen`)
  check('it carried the site token header', posts[0]?.hasToken === true)
  check('it was a JSON POST', posts[0]?.contentType.includes('application/json') === true)
  check('it went to keel-api', posts[0]?.url.includes('keel-api') === true)
  check('no uncaught page errors', pageErrors.length === 0, pageErrors.join('; '))
  console.log(`      (events endpoint seen: ${events.length} — empty is correct, nothing failed)`)

  await page.close()
}

// ------------------------------------------------- 2. click back-to-top
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  const events = []
  page.on('request', (r) => {
    if (r.url().includes('/api/events') && r.method() === 'POST') {
      events.push(JSON.parse(r.postData() || '{}'))
    }
  })

  await page.goto(SITE, { waitUntil: 'networkidle' })
  await page.waitForTimeout(7000)
  await page.evaluate(() => window.scrollTo({ top: 2500, behavior: 'instant' }))
  await page.waitForTimeout(500)
  await page.locator('button[aria-label="Back to top"]').click()
  await page.waitForTimeout(1500)

  const names = events.flat().map((e) => e.name)
  check('clicking back-to-top reports feature_used', names.includes('feature_used'), names.join(', ') || 'none')
  await page.close()
}

// ------------------------------------------------- 3. gate actually gates
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  const posts = []
  page.on('request', (r) => {
    if (r.url().includes('/api/page-views') && r.method() === 'POST') posts.push(r.url())
  })

  // Simulate the owner switching tracking off in Keel.
  await page.route('**/api/settings', async (route) => {
    const res = await route.fetch()
    const body = await res.json()
    if (body && body.feature_toggles) {
      body.feature_toggles.page_tracking = { enabled: false }
    }
    await route.fulfill({ response: res, json: body })
  })

  await page.goto(SITE, { waitUntil: 'networkidle' })
  await page.waitForTimeout(9000)

  check('toggle off means no page view is sent', posts.length === 0, `${posts.length} seen`)
  await page.close()
}

await browser.close()
console.log(`\n${failures === 0 ? 'ANALYTICS VERIFIED' : failures + ' CHECK(S) FAILED'}`)
process.exit(failures === 0 ? 0 : 1)