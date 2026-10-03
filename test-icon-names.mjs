/**
 * Every icon name in business.js must be one we actually ship.
 *
 * This is the guard icons.js describes having and nothing ever called:
 *
 *   "lets a dev-time check catch a typo in business.js before the client sees it"
 *
 * It was never wired up, and `clock` shipped — used twice (hero.badge.icon and
 * benefits.items[2].icon). getIcon falls back to a neutral Dot for an unknown
 * name, which is the right behaviour at runtime and exactly why the typo was
 * invisible: the page rendered, just without the icon. Nobody sees a missing dot
 * in a design review; they see a slightly wrong page.
 *
 * The cost of leaving this unwired is about to go up, because owners can now type
 * icon names into Keel. A typo typed by an owner has no code review at all.
 */
import { business } from './src/data/business.js'
import { isKnownIcon, iconNames, getIcon } from './src/utils/icons.js'

let failures = 0
const check = (name, pass, detail = '') => {
  if (!pass) failures++
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`)
}

/** Every {icon} in the config, with where it came from so a failure is findable. */
function collectIcons(node, where = 'business', out = []) {
  if (Array.isArray(node)) {
    node.forEach((item, i) => collectIcons(item, `${where}[${i}]`, out))
  } else if (node && typeof node === 'object') {
    for (const [key, value] of Object.entries(node)) {
      if (key === 'icon' && typeof value === 'string') out.push({ name: value, where: `${where}.${key}` })
      else collectIcons(value, `${where}.${key}`, out)
    }
  }
  return out
}

const used = collectIcons(business)

check('found icons to check', used.length > 0, `${used.length} references`)

const unknown = used.filter((u) => !isKnownIcon(u.name))
check(
  'every icon name in business.js is one we ship',
  unknown.length === 0,
  unknown.length
    ? unknown.map((u) => `${u.name} at ${u.where}`).join('; ')
    : `${used.length} checked against ${iconNames.length} shipped names`,
)

// The fallback must stay graceful, or fixing one typo would take the page down.
check('an unknown name still renders something', typeof getIcon('definitely_not_an_icon') !== 'undefined')

console.log(`\n${failures === 0 ? 'ICON NAMES VERIFIED' : failures + ' CHECK(S) FAILED'}`)
process.exit(failures === 0 ? 0 : 1)