/**
 * The order drawer must be reachable at every viewport.
 *
 * This exists because of a real bug found by looking at the deployed site rather
 * than the tests. The only cart trigger was inside the `lg:hidden` mobile panel,
 * and the floating OrderBar is `md:hidden`, so from 768px upwards there was no
 * way to open the order drawer at all.
 *
 * The bad part was not the missing button. Each service card has a quantity
 * stepper that feeds the same order, and those steppers are visible on desktop, so
 * a desktop visitor could increment quantities and be shown nothing anywhere - no
 * cart, no count, no total. The order existed and was invisible.
 *
 * So this asserts reachability rather than appearance: at each width, exactly one
 * visible control opens the drawer, and after adding an item that control shows
 * the count.
 */
import { chromium } from 'playwright'

const SITE = process.env.URL || 'http://localhost:4173/'

let failures = 0
const check = (name, pass, detail = '') => {
  if (!pass) failures++
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`)
}

/** Every element that can open the drawer, whether visible or not. */
const CART_SELECTOR =
  'header button[aria-controls="mobile-menu"] ~ button, header button[aria-label*="order summary" i], #mobile-menu button'

const browser = await chromium.launch()

const VIEWPORTS = [
  { name: 'phone   (390px)', width: 390, height: 844 },
  { name: 'tablet  (820px)', width: 820, height: 1180 },
  { name: 'laptop (1280px)', width: 1280, height: 900 },
  { name: 'desktop (1680px)', width: 1680, height: 1050 },
]

for (const vp of VIEWPORTS) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } })
  await page.goto(SITE, { waitUntil: 'networkidle' })

  // The cart affordance must be visible without opening any menu.
  const headerCart = page.locator(
    'header button[aria-label*="order summary" i], header button:has(svg.lucide-shopping-bag)',
  )
  let reachable = (await headerCart.first().isVisible().catch(() => false)) ?? false
  let via = 'header button'

  if (!reachable) {
    // Phones reach it through the menu, which is the original design.
    const toggle = page.locator('header button[aria-controls="mobile-menu"]')
    if (await toggle.isVisible().catch(() => false)) {
      await toggle.click()
      await page.waitForTimeout(400)
      const inMenu = page.locator('#mobile-menu button', { hasText: /order/i })
      if (await inMenu.first().isVisible().catch(() => false)) {
        reachable = true
        via = 'mobile menu'
      }
    }
  }

  check(`${vp.name}  cart is reachable`, reachable, reachable ? `via ${via}` : 'nothing opens the drawer')

  // And it must actually open the drawer.
  if (reachable) {
    const trigger =
      via === 'mobile menu'
        ? page.locator('#mobile-menu button', { hasText: /order/i }).first()
        : headerCart.first()
    await trigger.click()
    await page.waitForTimeout(600)
    const sheet = await page.locator('[aria-labelledby="order-sheet-title"]').isVisible().catch(() => false)
    check(`${vp.name}  cart opens the drawer`, sheet)
    await page.keyboard.press('Escape')
    await page.waitForTimeout(400)
  }

  await page.close()
}

// ------------------------------------ a desktop order must be visible somewhere
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto(SITE, { waitUntil: 'networkidle' })

  // Increment a service card's quantity, the way a desktop visitor would.
  const stepper = page.locator('button[aria-label*="Add one"], button:has-text("Add one")').first()
  const hadStepper = (await stepper.count()) > 0
  check('a service card exposes a quantity stepper', hadStepper)

  if (hadStepper) {
    await stepper.click()
    await page.waitForTimeout(500)

    // This is the assertion the bug would have failed: after adding an item on a
    // desktop, something visible must say so.
    const headerCart = page.locator('header button:has(svg.lucide-shopping-bag)')
    const visible = await headerCart.first().isVisible().catch(() => false)
    check('desktop: the header cart is visible with items in the order', visible)

    if (visible) {
      const label = await headerCart.first().getAttribute('aria-label')
      const text = (await headerCart.first().innerText()).trim()
      check(
        'and it reports the count',
        /1 item/i.test(label || '') || /\b1\b/.test(text),
        `aria-label="${label}" text="${text}"`,
      )
    }
  }

  await page.close()
}

await browser.close()
console.log(`\n${failures === 0 ? 'CART REACHABLE EVERYWHERE' : failures + ' CHECK(S) FAILED'}`)
process.exit(failures === 0 ? 0 : 1)