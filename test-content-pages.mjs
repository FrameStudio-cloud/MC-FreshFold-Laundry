/**
 * Location and Testimonials as Keel-editable pages.
 *
 * These two are different from faq and delivery in the ways that matter:
 *
 *   location      the owner pastes a URL that this site then loads as an iframe
 *                 src, so it is the one owner-supplied string that becomes a
 *                 document. A hostile or merely wrong value must degrade to the
 *                 designed placeholder, not render a blank frame.
 *   testimonials  the config ships with an honesty banner saying the reviews are
 *                 placeholders. Saving real reviews has to clear that banner, and
 *                 failing to clear it is its own lie about the owner's quotes.
 *
 * Both are checked with the API intercepted, so the assertions run against the
 * exact jsonb shape the console saves rather than against a shape invented here.
 */
import { chromium } from 'playwright'

const SITE = process.env.URL || 'http://localhost:4173/'
let failures = 0
const check = (name, pass, detail = '') => {
  if (!pass) failures++
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`)
}

const LOCATION_ROW = {
  content: {
    address_line: 'Kariani Main Road, beside the pharmacy',
    landmark_note: 'Look for the blue gate. Knock if the gate is shut.',
    map_embed_url: 'https://www.google.com/maps/embed?pb=!1m18!1m12',
    map_link_url: 'https://maps.app.goo.gl/saved',
  },
}

const TESTIMONIAL_ROW = {
  content: {
    title: 'What Kariani says',
    items: [
      {
        quote: 'Called before nine and it was back the same afternoon, folded and sorted.',
        name: 'Wanjiku',
        area: 'Kariani',
        service: 'Wash & fold',
        rating: '5',
      },
      {
        // Deliberately unusable values, to prove they cannot reach the page.
        quote: '   ',
        name: '',
        area: 'Muranga',
        service: null,
        rating: 'nonsense',
      },
    ],
  },
}

/** Serve the given page-content rows for one page, and 404 the other. */
async function stub(page, rows) {
  await page.route('**/api/page-content*', async (route) => {
    const wanted = new URL(route.request().url()).searchParams.get('page')
    const body = wanted && rows[wanted] ? rows[wanted] : []
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    })
  })
}

const browser = await chromium.launch()

// ------------------------------------------------------- saved content wins
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await stub(page, { location: [LOCATION_ROW], testimonials: [TESTIMONIAL_ROW] })
  await page.goto(SITE, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)

  const body = await page.innerText('body')

  check("owner's address appears", body.includes('Kariani Main Road, beside the pharmacy'))
  check("owner's landmark note appears", body.includes('Look for the blue gate'))
  check("owner's testimonial title appears", body.includes('What Kariani says'))
  check("owner's quote appears", body.includes('back the same afternoon'))
  check("owner's reviewer name appears", body.includes('Wanjiku'))
  check("service used appears", body.includes('Wash & fold'))

  const iframe = page.locator('iframe[src*="google.com/maps/embed"]')
  check('embed URL becomes the map iframe', (await iframe.count()) === 1)

  const link = page.locator('a[href="https://maps.app.goo.gl/saved"]')
  check('pasted maps link is used', (await link.count()) >= 1)

  // The blank quote must not have produced a second card.
  const cards = await page.locator('#reviews figure').count()
  check('a review with no quote is dropped, not rendered', cards === 1, `${cards} cards`)

  // The point of clearing it: the config's placeholder reviews are gone, so the
  // banner must be gone too.
  check(
    'placeholder banner clears once real reviews exist',
    !body.includes('Placeholder reviews for layout preview'),
  )

  await page.close()
}

// ------------------------------- a URL that must never become an iframe src
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await stub(page, {
    location: [
      {
        content: {
          address_line: 'Kariani',
          // A short link, not an embed. Google redirects these; framing one
          // shows a blank frame and is the most likely owner mistake.
          map_embed_url: 'https://maps.app.goo.gl/notanembed',
          map_link_url: 'https://maps.app.goo.gl/notanembed',
        },
      },
    ],
  })
  await page.goto(SITE, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)

  const frames = await page.locator('iframe').count()
  check('a non-embed URL is refused as an iframe src', frames === 0, `${frames} iframes`)

  const body = await page.innerText('body')
  check('it falls back to the designed placeholder', body.includes('Open in Google Maps'))
  await page.close()
}

// ----------------------------------------- nothing saved: config is the floor
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await stub(page, {})
  await page.goto(SITE, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)

  const body = await page.innerText('body')
  check('config reviews still render when nothing is saved', body.includes('Placeholder Name'))
  check(
    'and the honesty banner is still shown',
    body.includes('Placeholder reviews for layout preview'),
  )
  const frames = await page.locator('iframe').count()
  check('no iframe without a saved embed', frames === 0, `${frames} iframes`)
  await page.close()
}

await browser.close()
console.log(`\n${failures === 0 ? 'LOCATION + TESTIMONIALS VERIFIED' : failures + ' CHECK(S) FAILED'}`)
process.exit(failures === 0 ? 0 : 1)