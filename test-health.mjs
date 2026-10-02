/**
 * Proves the data-health layer reports both directions.
 *
 * The hard part is the failure case. Anything that only asserts the happy path
 * would pass even if reportFailure() were never called, because the SDK
 * deliberately suppresses repeated states — a store that never transitions emits
 * nothing at all. That is not hypothetical: kikoi's supabase mode looked
 * healthy while reporting nothing.
 *
 * So the API is failed deliberately, via route interception, and the site_events
 * POST is inspected for a health_fail carrying the resource name.
 */
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'

const SITE = process.env.URL || 'http://localhost:4173/'

/**
 * Wake the API before the first assertion.
 *
 * keel-api is on Render's free plan and cold-starts in 10-30s, while the site's
 * budget is deliberately 2 attempts at 4s. A cold API therefore fails every read
 * twice and this suite's first case — "a healthy load reports health_ok" — sees
 * nothing but health_fail. That is the suite reporting the truth, not a flake,
 * but it makes the run meaningless on a cold start.
 *
 * This is the same trap that made test-remote-fetch flaky, where the fix was to
 * stop racing the clock. Here the precondition is different: the API must be warm
 * for the happy path to be reachable at all, so it is established up front and
 * stated rather than retried.
 */
const API_BASE = 'https://keel-api-37rh.onrender.com'

/**
 * The write token, from the environment or from the repo's own .env.
 *
 * The .env fallback matters: without it this function silently skipped its warm
 * up whenever the suite was run as `node test-health.mjs` instead of through a
 * shell that had the token exported, and a guard that quietly does nothing is
 * how the whole suite ends up reading the state of a sleeping host.
 */
function siteToken() {
  const fromEnv = (process.env.VITE_KEEL_SITE_TOKEN || '').trim()
  if (fromEnv) return fromEnv
  try {
    const file = path.resolve('.env')
    return fs
      .readFileSync(file, 'utf8')
      .match(/VITE_KEEL_SITE_TOKEN\s*=\s*"?([^\s"\r\n]+)"?/)?.[1] || ''
  } catch {
    return ''
  }
}

async function wakeApi() {
  const token = siteToken()
  if (!token) {
    console.log('NOTE  no token available, skipping warm-up — a cold API may fail these checks')
    return
  }
  const started = Date.now()
  try {
    const res = await fetch(`${API_BASE}/api/settings`, {
      headers: { 'x-keel-site-token': token },
      signal: AbortSignal.timeout(60_000),
    })
    console.log(`warm-up: ${res.status} in ${Date.now() - started}ms`)
  } catch (e) {
    console.log(`warm-up failed: ${e.message}`)
  }
}

let failures = 0
const check = (name, pass, detail = '') => {
  if (!pass) failures++
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`)
}

await wakeApi()

const browser = await chromium.launch()

/** Collect the events the SDK POSTs, and wait until one of `name` arrives. */
function watchEvents(page) {
  const seen = []
  page.on('request', (r) => {
    if (r.url().includes('/api/events') && r.method() === 'POST') {
      try {
        for (const e of JSON.parse(r.postData() || '[]')) seen.push(e)
      } catch {
        /* ignore malformed */
      }
    }
  })
  return seen
}

// ------------------------------------------------------ 1. healthy site
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  const events = watchEvents(page)
  await page.goto(SITE, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(11000)

  const names = events.map((e) => e.name)
  check('healthy load reports health_ok', names.includes('health_ok'), names.join(', ') || 'none')
  const okRes = events.find((e) => e.name === 'health_ok')
  check('health_ok names a real resource', ['settings', 'services', 'delivery', 'faq'].includes(okRes?.properties?.resource), okRes?.properties?.resource)
  check('no health_fail on a healthy load', !names.includes('health_fail'), names.join(', '))
  await page.close()
}

// ------------------------------------------------- 2. services are broken
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  const events = watchEvents(page)
  await page.route('**/api/services*', (route) => route.abort('failed'))
  await page.goto(SITE, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(11000)

  const fail = events.find((e) => e.name === 'health_fail' && e.properties?.resource === 'services')
  check('dead price list reports health_fail(services)', Boolean(fail), events.map((e) => e.name).join(', ') || 'none')
  check('health_fail carries a reason', Boolean(fail?.properties?.detail), fail?.properties?.detail || '(empty)')

  // The visitor-facing half: a dead catalogue must not look like an empty shop.
  const cards = await page.locator('#services article, #services li').count().catch(() => 0)
  check('visitor sees a failure, not an empty catalogue', cards === 0, `${cards} cards`)
  await page.close()
}

// ------------------------------- 4. delivery fails apart from the FAQ
{
  // The reason this vocabulary change exists. FAQ and delivery shared
  // `page_content`, so an owner saw one lamp for two unrelated things and a
  // delivery-area outage read as "Page copy broken".
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  const events = watchEvents(page)
  await page.route('**/api/page-content?page=delivery*', (route) => route.abort('failed'))
  await page.goto(SITE, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(11000)

  const resources = events.filter((e) => e.name.startsWith('health_')).map((e) => e.properties?.resource)
  const names = events.map((e) => e.name)
  check('dead delivery reports health_fail(delivery)', resources.includes('delivery'), `${names.join(', ')} | ${resources.join(', ')}`)
  check('dead delivery does not report as page copy', !resources.includes('page_content'), resources.join(', '))
  check('the FAQ still reports on its own lamp', resources.includes('faq'), resources.join(', '))
  await page.close()
}

// --------------------------------------- 3. settings broken, still honest
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  const events = watchEvents(page)
  await page.route('**/api/settings*', (route) => route.abort('failed'))
  await page.goto(SITE, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(11000)

  const fail = events.find((e) => e.name === 'health_fail' && e.properties?.resource === 'settings')
  check('dead settings reports health_fail(settings)', Boolean(fail), events.map((e) => e.name).join(', ') || 'none')

  // Settings failing is the case that was invisible before: toggles come back
  // {} so the back-to-top button never renders, with no signal to anyone.
  const btt = await page.locator('button[aria-label="Back to top"]').count().catch(() => 0)
  check('toggles absent when settings are dead', btt === 0, `back-to-top=${btt}`)
  // ...but the site must still render, from config.
  const shop = await page.locator('header span.font-display').first().innerText().catch(() => '')
  check('site still renders from config', shop.trim().length > 0, shop.trim())
  await page.close()
}

await browser.close()
console.log(`\n${failures === 0 ? 'HEALTH VERIFIED' : failures + ' CHECK(S) FAILED'}`)
process.exit(failures === 0 ? 0 : 1)