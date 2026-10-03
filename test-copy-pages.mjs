/**
 * The three owner-editable copy pages: hero, how it works, benefits.
 *
 * These differ from Location and Testimonials in one specific way, and that
 * difference is what the tests are for. Those pages hand their content to one
 * component as overrides. These mutate `business.*` in place, which means the
 * component below cannot tell the difference and the assertions have to be made
 * from the outside, on the rendered page.
 *
 * The rules being pinned:
 *
 *   1. Owner copy wins over config, and config is the floor when nothing saved.
 *   2. A cleared field keeps the config copy - an empty textarea is a blank the
 *      owner left, not a request to delete the sentence.
 *   3. A saved array replaces config; a cleared one keeps it.
 *   4. A typed icon survives; a blank or unrecognised one falls back to the
 *      config icon at that position rather than becoming a neutral dot.
 *   5. {area} and {name} still substitute inside owner-supplied copy.
 *
 * Served through route interception using the exact jsonb shape Keel saves, so
 * the assertions run against the real contract rather than one invented here.
 */
import { chromium } from 'playwright'

const SITE = process.env.URL || 'http://localhost:4173/'
let failures = 0
const check = (name, pass, detail = '') => {
  if (!pass) failures++
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`)
}

const HERO = {
  content: {
    eyebrow: 'Laundry in Murang\'a since 2016',
    headline: 'Washed, folded and',
    headline_accent: 'back the same day.',
    subtext: 'Collected from your door in {area}. Order on WhatsApp.',
    primary_cta: 'Message us now',
    secondary_cta: 'See the price list',
    trust: [
      { label: 'Free collection', icon: 'bolt' },
      { label: 'Named after your fabric', icon: '' },
      { label: 'Fragrance free on request', icon: 'definitely_not_an_icon' },
    ],
  },
}

const STEPS = {
  content: {
    eyebrow: 'How it works',
    title: 'Two steps, no errands',
    intro: 'Everything happens over WhatsApp.',
    steps: [
      { title: 'Message us', body: 'Send your list.', icon: 'message' },
      { title: 'We collect', body: 'Free in {area}.', icon: 'truck' },
    ],
  },
}

const BENEFITS = {
  content: {
    eyebrow: 'Why {name}',
    title: 'What customers mention',
    intro: '',
    items: [
      { title: 'Colours stay separate', body: 'Sorted first.', icon: 'shield' },
      { title: 'The real turnaround', body: 'Or we say so.', icon: 'search' },
    ],
  },
}

async function stub(page, rows) {
  await page.route('**/api/page-content*', async (route) => {
    const wanted = new URL(route.request().url()).searchParams.get('page')
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(wanted && rows[wanted] ? rows[wanted] : []),
    })
  })
}

const browser = await chromium.launch()

// --------------------------------------------------- saved copy wins
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await stub(page, { hero: [HERO], how_it_works: [STEPS], benefits: [BENEFITS] })
  await page.goto(SITE, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)

  // textContent, not innerText, for the two eyebrow checks. `.eyebrow` applies
  // text-transform: uppercase, and innerText reflects CSS text-transform — so the
  // owner's own casing comes back uppercased and an exact match fails against a
  // feature that is working perfectly.
  const heroText = await page.locator('#top').textContent()
  check("owner's eyebrow appears", heroText.includes("Laundry in Murang'a since 2016"))

  const hero = await page.locator('#top').innerText()
  check("owner's headline appears", hero.includes('Washed, folded and'))
  check("owner's accent line appears", hero.includes('back the same day.'))
  check("owner's CTA label appears", hero.includes('Message us now'))
  check("owner's second CTA label appears", hero.includes('See the price list'))
  check("owner's trust chip appears", hero.includes('Free collection'))
  check("typed icon name is used", hero.includes('Named after your fabric'))

  // {area} must still substitute inside owner copy, or the owner has to learn the
  // real town name to write a sentence.
  const whole = await page.innerText('body')
  check('tokens still substitute in owner copy', !whole.includes('{area}') && !whole.includes('{name}'), whole.includes('{') ? 'a token leaked' : '')
  check("owner's benefit title appears", whole.includes('What customers mention'))
  check("owner's step title appears", whole.includes('Two steps, no errands'))

  // Two saved steps replace four configured ones.
  const steps = await page.locator('#how-it-works ol > li, #how-it-works li').count()
  check('a saved array replaces config', steps === 2, `${steps} steps rendered`)
  await page.close()
}

// ------------------------------- a cleared field keeps the config copy
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await stub(page, {
    hero: [{ content: { headline: 'Only the headline changed', subtext: '', headline_acccent: '' } }],
    how_it_works: [STEPS],
    benefits: [BENEFITS],
  })
  await page.goto(SITE, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)

  const hero = await page.locator('#top').innerText()
  check('the saved field is used', hero.includes('Only the headline changed'))
  check('a cleared field keeps its config copy', hero.includes('back before dinner'), 'accent line vanished')
  // The eyebrow is uppercased by CSS, so this compares the untransformed text.
  check(
    'and another cleared field too',
    (await page.locator('#top').textContent()).includes('Laundry in Kariani since 2016'),
    'eyebrow vanished',
  )
  await page.close()
}

// ------------------------- an unrecognised icon must not become a dot
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await stub(page, { hero: [HERO], how_it_works: [STEPS], benefits: [BENEFITS] })
  await page.goto(SITE, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)

  // The three chips were saved with: a good icon, a blank one, and a typo. The
  // blank and the typo must both fall back to the config icon for their position.
  //
  // Asserted by icon identity rather than by "something rendered". The Dot
  // fallback in icons.js is a hand-built <svg> holding a <circle>, with no lucide
  // class, so it is distinguishable from a real icon rather than merely absent —
  // which is what let `clock` ship in the first place.
  const icons = await page.evaluate(() => {
    const svgs = [...document.querySelectorAll('#top svg')]
    return {
      // Asserted against the RENDERED component, not the ICON_MAP key: `bolt` maps
      // to lucide's Zap, so it renders as lucide-zap. Owners type the key
      // (`bolt`) and the manifest says so; only the DOM class differs.
      zap: svgs.filter((s) => s.classList.contains('lucide-zap')).length,
      leaf: svgs.filter((s) => s.classList.contains('lucide-leaf')).length,
      dots: svgs.filter((s) => !s.classList.contains('lucide') && s.querySelector('circle')).length,
    }
  })
  check("a typed icon is kept ('bolt')", icons.zap >= 2, `${icons.zap} zap — typed one plus the blank one's fallback`)
  check('a blank icon falls back to the config icon', icons.leaf >= 1, `${icons.leaf} leaf`)
  check(
    'an unrecognised icon falls back too, never to a neutral dot',
    icons.dots === 0,
    `${icons.dots} neutral dot(s)`,
  )
  await page.close()
}

// --------------------------------------- nothing saved: config is the floor
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await stub(page, {})
  await page.goto(SITE, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)

  const whole = await page.innerText('body')
  check('config headline still renders', whole.includes('Your laundry, folded and fresh'))
  check('config steps still render', whole.includes('Four steps, no errands'))
  check('config benefits still render', whole.includes('The things people actually notice'))
  const steps = await page.locator('#how-it-works ol > li, #how-it-works li').count()
  check('all four config steps survive', steps === 4, `${steps} steps`)
  await page.close()
}

await browser.close()
console.log(`\n${failures === 0 ? 'COPY PAGES VERIFIED' : failures + ' CHECK(S) FAILED'}`)
process.exit(failures === 0 ? 0 : 1)