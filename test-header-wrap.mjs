/**
 * The header is the one place a two-line wrap reads as a broken layout rather
 * than a tight one. The audit checks overflow and colours, not line breaking, so
 * this walks the widths between the two nav breakpoints and asserts the nav links
 * and the Order button each stay on a single line.
 */
import { chromium } from 'playwright'

const SITE = process.env.URL || 'http://localhost:4173/'
const WIDTHS = [1024, 1100, 1180, 1280, 1440]

const browser = await chromium.launch()
let failures = 0

for (const width of WIDTHS) {
  const page = await browser.newPage({ viewport: { width, height: 900 } })
  await page.goto(SITE, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)

  const result = await page.evaluate(() => {
    const header = document.querySelector('header')
    const links = [...header.querySelectorAll('nav[aria-label="Sections"] a')].filter((a) => a.offsetParent !== null)
    const orderBtn = [...header.querySelectorAll('a')].find(
      (a) => a.textContent.trim() === 'Order now' && a.offsetParent !== null,
    )
    const wrapped = (el) => el.getBoundingClientRect().height > 56
    return {
      visibleLinks: links.length,
      wrappedLinks: links.filter(wrapped).map((a) => a.textContent.trim()),
      orderWrapped: orderBtn ? wrapped(orderBtn) : null,
      headerHeight: Math.round(header.getBoundingClientRect().height),
      // Does the nav push the button past the viewport?
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }
  })

  const ok = result.wrappedLinks.length === 0 && result.orderWrapped === false && result.overflow <= 1
  if (!ok) failures++
  console.log(
    `${ok ? 'PASS' : 'FAIL'}  ${width}px  links=${result.visibleLinks}  headerH=${result.headerHeight}px  ` +
      `orderWrapped=${result.orderWrapped}  overflow=${result.overflow}` +
      (result.wrappedLinks.length ? `  WRAPPED: ${result.wrappedLinks.join(', ')}` : ''),
  )

  await page.close()
}

await browser.close()
console.log(`\n${failures === 0 ? 'HEADER OK AT ALL WIDTHS' : failures + ' WIDTH(S) FAILED'}`)
process.exit(failures === 0 ? 0 : 1)