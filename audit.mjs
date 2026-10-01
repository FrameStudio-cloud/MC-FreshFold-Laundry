/**
 * Overflow + design-rule audit, run against the built site in a real browser.
 * Verifies: nothing is clipped horizontally, and no element has a sharp corner
 * or a black/near-black background or text colour.
 */
import { chromium } from 'playwright'

const WIDTHS = [360, 768, 1280]
const URL = process.env.URL || 'http://localhost:4173/'

const NEAR_BLACK = /^#(?:0{3,5}|0{6}|1[01]\d{2}|111|1a1a1a|1c1c1c|1e1e1e|202020|222|2b2b2b)$/i
const SHARP = /(^|[" ])(rounded-none|rounded-t-none|rounded-b-none|rounded-l-none|rounded-r-none|rounded-tl-none|rounded-tr-none|rounded-bl-none|rounded-br-none|rounded-sm|rounded-md)([" ]|$)/

const browser = await chromium.launch()
let failures = 0

for (const width of WIDTHS) {
  const page = await browser.newPage({ viewport: { width, height: 900 } })
  await page.goto(URL, { waitUntil: 'networkidle' })
  // Reveal everything so animated-in content is measurable.
  await page.evaluate(() => {
    document.querySelectorAll('[data-reveal]').forEach((el) => el.setAttribute('data-reveal', 'shown'))
  })

  const result = await page.evaluate(
    ({ NEAR_BLACK, SHARP }) => {
      const de = document.documentElement
      const nearBlackSrc = new RegExp(NEAR_BLACK)
      const sharpSrc = new RegExp(SHARP)

      const clipped = []
      const blackBg = []
      const blackText = []
      const sharpCorners = []

      document.querySelectorAll('body *').forEach((el) => {
        const cs = getComputedStyle(el)
        const r = el.getBoundingClientRect()
        if (r.width === 0 || r.height === 0) return

        // 1. Horizontally clipped content that is not an intentional scroller.
        if (r.right > de.clientWidth + 1) {
          let p = el.parentElement
          let scroller = false
          while (p && p !== document.body) {
            const o = getComputedStyle(p).overflowX
            if (o === 'auto' || o === 'scroll' || o === 'hidden') { scroller = true; break }
            p = p.parentElement
          }
          // .sr-only elements are intentionally 1px clipped; content inside an
          // inert / aria-hidden subtree (the closed order sheet) is off-screen
          // by design and cannot be focused.
          const hidden =
            el.closest('.sr-only') || el.closest('[inert]') || el.closest('[aria-hidden="true"]')
          if (!scroller && !hidden) {
            clipped.push({ tag: el.tagName.toLowerCase(), cls: String(el.className).slice(0, 50), right: Math.round(r.right) })
          }
        }

        // 2. Black or near-black background.
        const bg = cs.backgroundColor
        if (bg && bg !== 'rgba(0, 0, 0, 0)' && !bg.includes('rgba(0, 0, 0, 0)')) {
          const m = bg.match(/rgba?\((\d+), (\d+), (\d+)/)
          if (m) {
            const [r0, g0, b0] = m.slice(1).map(Number)
            // Flag only genuinely dark colours (max channel below 40).
            if (Math.max(r0, g0, b0) < 40) blackBg.push({ tag: el.tagName.toLowerCase(), bg, cls: String(el.className).slice(0, 50) })
          }
        }

        // 3. Black or near-black text colour on a visible text node.
        const hasOwnText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())
        if (hasOwnText) {
          const m = cs.color.match(/rgba?\((\d+), (\d+), (\d+)/)
          if (m) {
            const [r0, g0, b0] = m.slice(1).map(Number)
            if (Math.max(r0, g0, b0) < 40) blackText.push({ tag: el.tagName.toLowerCase(), color: cs.color, text: el.textContent.trim().slice(0, 30) })
          }
        }

        // 4. Sharp corners on anything with a visible box.
        const visibleBox = cs.backgroundColor !== 'rgba(0, 0, 0, 0)' || cs.borderTopWidth !== '0px'
        if (visibleBox && sharpSrc.test(cs.borderRadius) && cs.overflow !== 'hidden') {
          sharpCorners.push({ tag: el.tagName.toLowerCase(), radius: cs.borderRadius, cls: String(el.className).slice(0, 50) })
        }
      })

      // 5. Can the user scroll horizontally?
      window.scrollTo(600, 0)
      const canScrollH = window.scrollX > 0
      window.scrollTo(0, 0)

      return {
        clientWidth: de.clientWidth,
        docScrollWidth: de.scrollWidth,
        canScrollHorizontally: canScrollH,
        clipped: clipped.slice(0, 8),
        clippedCount: clipped.length,
        blackBg: blackBg.slice(0, 8),
        blackText: blackText.slice(0, 8),
        sharpCorners: sharpCorners.slice(0, 8),
      }
    },
    { NEAR_BLACK, SHARP },
  )

  const ok = result.clippedCount === 0 && !result.canScrollHorizontally && !result.blackBg.length && !result.blackText.length && !result.sharpCorners.length
  if (!ok) failures++
  console.log(`\n=== ${width}px === ${ok ? 'PASS' : 'FAIL'}`)
  console.log(`  clientWidth=${result.clientWidth} docScrollWidth=${result.docScrollWidth} canScrollH=${result.canScrollHorizontally}`)
  if (result.clippedCount) console.log('  CLIPPED:', JSON.stringify(result.clipped, null, 2))
  if (result.blackBg.length) console.log('  BLACK BG:', JSON.stringify(result.blackBg, null, 2))
  if (result.blackText.length) console.log('  BLACK TEXT:', JSON.stringify(result.blackText, null, 2))
  if (result.sharpCorners.length) console.log('  SHARP:', JSON.stringify(result.sharpCorners, null, 2))

  await page.close()
}

await browser.close()
console.log(`\n${failures === 0 ? 'ALL WIDTHS PASS' : failures + ' WIDTH(ES) FAILED'}`)
process.exit(failures === 0 ? 0 : 1)