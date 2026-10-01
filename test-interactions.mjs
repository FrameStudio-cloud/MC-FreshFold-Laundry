/**
 * Interaction + keyboard test.
 * Verifies filtering, the roving tabindex on both tablists, accordion
 * operability, the focus trap in the order sheet, and that Escape restores
 * focus to the trigger.
 */
import { chromium } from 'playwright'

const SITE = process.env.URL || 'http://localhost:4173/'
const browser = await chromium.launch()
const results = []
const check = (name, pass, detail = '') => {
  results.push({ name, pass, detail })
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`)
}

const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
await page.goto(SITE, { waitUntil: 'networkidle' })

// ---- category filter -------------------------------------------------------
const titles = () => page.locator('#service-panel article h3').allTextContents()

check('all services shown initially', (await titles()).length === 8, `${(await titles()).length} cards`)

await page.locator('#cat-home').click()
const homeItems = await titles()
check('filter "Home items" narrows the grid', homeItems.length === 2, homeItems.join(', '))

await page.locator('#cat-shoes').click()
check('filter switches categories', (await titles()).length === 1, (await titles()).join(', '))

// ---- roving tabindex / arrow keys on the service tabs ----------------------
await page.locator('#cat-all').click()
await page.keyboard.press('ArrowRight')
const focusedAfterArrow = await page.evaluate(() => document.activeElement?.id)
const allSelected = await page.locator('#cat-all').getAttribute('aria-selected')
check('ArrowRight moves to next tab', focusedAfterArrow === 'cat-wash', `focus=${focusedAfterArrow}`)
check('ArrowRight also selects it', allSelected === 'false', `all aria-selected=${allSelected}`)

// ---- price list tabs are keyboard reachable --------------------------------
await page.locator('#price-tab-everyday').focus()
await page.keyboard.press('ArrowRight')
const priceFocus = await page.evaluate(() => document.activeElement?.id)
const priceSelected = await page.locator('#price-tab-specialist-care, [id="price-tab-special"]').count()
check('price list tabs respond to ArrowRight', priceFocus === 'price-tab-special', `focus=${priceFocus} (unselected tabs found: ${priceSelected})`)

// ---- FAQ accordion ---------------------------------------------------------
const firstQ = page.locator('#faq button[aria-expanded]').first()
check('first FAQ panel starts open', (await firstQ.getAttribute('aria-expanded')) === 'true')
await firstQ.focus()
await page.keyboard.press('Enter')
check('Enter collapses the FAQ panel', (await firstQ.getAttribute('aria-expanded')) === 'false')
await page.keyboard.press('Enter')
check('Enter reopens the FAQ panel', (await firstQ.getAttribute('aria-expanded')) === 'true')

// ---- order sheet focus trap ------------------------------------------------
await page.locator('#cat-wash').click()
const stepper = page.locator('#service-panel [role="group"]').first()
await stepper.scrollIntoViewIfNeeded()
await stepper.locator('button:not([disabled])').last().click()

await page.locator('#services button:has-text("Open order summary")').click()
await page.waitForTimeout(300)

const focusedInSheet = await page.evaluate(() => Boolean(document.activeElement?.closest('[role="dialog"]')))
check('focus moves into the sheet', focusedInSheet)

// Tab all the way round; focus must never escape the dialog.
let escaped = false
for (let i = 0; i < 14; i++) {
  await page.keyboard.press('Tab')
  const inside = await page.evaluate(() => Boolean(document.activeElement?.closest('[role="dialog"]')))
  if (!inside) { escaped = true; break }
}
check('focus is trapped in the sheet', !escaped)

await page.keyboard.press('Escape')
await page.waitForTimeout(400)
const refocused = await page.evaluate(() => document.activeElement?.textContent?.trim().slice(0, 40) || document.activeElement?.tagName)
check('Escape closes and returns focus', /Open order summary/.test(refocused || ''), `focus on: "${refocused}"`)

// ---- background scroll is locked while open -------------------------------
await page.locator('#services button:has-text("Open order summary")').click()
await page.waitForTimeout(200)
const locked = await page.evaluate(() => getComputedStyle(document.body).overflow)
await page.keyboard.press('Escape')
await page.waitForTimeout(300)
const unlocked = await page.evaluate(() => getComputedStyle(document.body).overflow)
check('scroll locks while open', locked === 'hidden', locked)
check('scroll unlocks on close', unlocked !== 'hidden', unlocked)

// ---- mobile menu keyboard --------------------------------------------------
const m = await browser.newPage({ viewport: { width: 360, height: 800 } })
await m.goto(SITE, { waitUntil: 'networkidle' })
const toggle = m.locator('button[aria-controls="mobile-menu"]')
await toggle.focus()
await m.keyboard.press('Enter')
await m.waitForTimeout(200)
check('mobile menu opens with Enter', (await toggle.getAttribute('aria-expanded')) === 'true')
await m.keyboard.press('Escape')
await m.waitForTimeout(200)
check('Escape closes the mobile menu', (await toggle.getAttribute('aria-expanded')) === 'false')
const focusAfterEscape = await m.evaluate(() => document.activeElement?.getAttribute('aria-controls'))
check('focus returns to the toggle', focusAfterEscape === 'mobile-menu', `focus=${focusAfterEscape}`)

await browser.close()
const failed = results.filter((r) => !r.pass)
console.log(`\n${failed.length === 0 ? 'ALL INTERACTION CHECKS PASS' : failed.length + ' CHECK(S) FAILED'}`)
process.exit(failed.length === 0 ? 0 : 1)