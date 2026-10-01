/**
 * Delivery areas and the pickup promise, as the owner saves them.
 *
 * Runs the real page through every state the untyped jsonb can produce, by
 * intercepting the page-content response and substituting the payload. That
 * matters: the alternative is unit-testing the normaliser, which says nothing
 * about whether the cards render, whether an empty field falls back to config,
 * or whether the JSON-LD picks the areas up.
 */
import { chromium } from 'playwright'

const SITE = process.env.URL || 'http://localhost:4173/'

const CASES = [
  {
    name: 'owner saved areas, note and same-day copy',
    body: {
      note: 'We collect free anywhere in Muranga. Outside that we confirm on WhatsApp first.',
      same_day: 'Order before 10:00 AM and we will prioritise it for same-day collection.',
      areas: [{ name: 'Kariani' }, { name: 'Muranga Town' }, { name: 'Kangema' }],
    },
    expect: {
      areas: ['Kariani', 'Muranga Town', 'Kangema'],
      noteHas: 'Muranga',
      jsonLd: ['Kariani', 'Muranga Town', 'Kangema'],
    },
  },
  {
    name: 'half-filled areas: one row the owner added but did not finish',
    body: { areas: [{ name: 'Kariani' }, { name: '' }, { name: '   ' }, {}] },
    expect: { areas: ['Kariani'], noteHas: 'collect from your door', jsonLd: ['Kariani'] },
  },
  {
    name: 'areas is the wrong type entirely',
    body: { areas: 'Kariani, Muranga', note: 'We collect from your door in {area} and around Muranga.' },
    expect: { areas: ['Kariani', 'Muranga Town', 'Kangema'], noteHas: 'around Muranga', jsonLd: null },
  },
  {
    name: 'empty strings everywhere: the card must not blank',
    body: { note: '', same_day: '', areas: [] },
    expect: { areas: ['Kariani', 'Muranga Town', 'Kangema'], noteHas: 'collect from your door', jsonLd: null },
  },
  {
    name: 'nothing saved at all: config shows through untouched',
    body: null,
    expect: { areas: ['Kariani', 'Muranga Town', 'Kangema'], noteHas: 'collect from your door', jsonLd: null },
  },
]

let failures = 0

for (const testCase of CASES) {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })

  await page.route('**/api/page-content?page=delivery*', async (route) => {
    if (testCase.body === null) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
      return
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 'test', shop_id: 'test', page_key: 'delivery', section_key: 'details', content: testCase.body },
      ]),
    })
  })

  await page.goto(SITE, { waitUntil: 'networkidle' })
  await page.waitForTimeout(7000)

  const seen = await page.evaluate(() => {
    const card = [...document.querySelectorAll('#contact h3')].find((h) => /pickup|delivery/i.test(h.textContent))
    const cardEl = card?.closest('div.rounded-4xl')
    const pills = cardEl
      ? [...cardEl.querySelectorAll('li')].map((li) => li.textContent.trim()).filter((t) => t && !t.includes('@'))
      : []
    const note = cardEl?.querySelector('p.text-\\[0\\.9375rem\\]')?.textContent?.trim() ?? ''
    const ld = JSON.parse(document.getElementById('keel-localbusiness')?.textContent || '{}')
    return {
      pills,
      note,
      cardPresent: Boolean(cardEl),
      areaServed: ld.areaServed?.map((a) => a.name) ?? null,
    }
  })

  const problems = []
  if (JSON.stringify(seen.pills) !== JSON.stringify(testCase.expect.areas)) {
    problems.push(`areas: got ${JSON.stringify(seen.pills)} want ${JSON.stringify(testCase.expect.areas)}`)
  }
  if (!seen.note.includes(testCase.expect.noteHas)) {
    problems.push(`note: "${seen.note.slice(0, 60)}" missing "${testCase.expect.noteHas}"`)
  }
  if (testCase.expect.jsonLd === null) {
    // The build-time node must NOT carry the config's placeholder areas, and a
    // run that adds none must not invent an areaServed list.
    if (seen.areaServed !== null) problems.push(`areaServed should be absent, got ${JSON.stringify(seen.areaServed)}`)
  } else if (JSON.stringify(seen.areaServed) !== JSON.stringify(testCase.expect.jsonLd)) {
    problems.push(`areaServed: got ${JSON.stringify(seen.areaServed)} want ${JSON.stringify(testCase.expect.jsonLd)}`)
  }

  if (problems.length) failures++
  console.log(`${problems.length ? 'FAIL' : 'PASS'}  ${testCase.name}`)
  for (const p of problems) console.log(`        ${p}`)

  await browser.close()
}

console.log(`\n${failures === 0 ? 'ALL DELIVERY CASES PASS' : failures + ' CASE(S) FAILED'}`)
process.exit(failures === 0 ? 0 : 1)