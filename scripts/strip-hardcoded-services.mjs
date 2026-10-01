/**
 * One-off: strip the hardcoded `services` array and the hardcoded
 * `priceList.groups` from business.js.
 *
 * Both are replaced by data from /api/services. The services array becomes a
 * presentation lookup keyed by service name, and the price list is derived from
 * the same rows so the page has one source of prices instead of two.
 *
 * Line numbers are asserted before cutting, so a re-run on a changed file fails
 * loudly instead of deleting the wrong block.
 */
import { readFileSync, writeFileSync } from 'node:fs'

const FILE = 'src/data/business.js'
const lines = readFileSync(FILE, 'utf8').split(/\r?\n/)

/** 1-indexed inclusive ranges to remove. */
const CUTS = [
  { from: 224, to: 360, expectStart: '/**', expectEnd: '],' },
  // The whole `groups: [...]` block, leaving the priceList object holding only
  // its copy. Lines 369-372 are the doc comment that introduces it.
  { from: 369, to: 415, expectStart: '    /**', expectEnd: '    ],' },
]

const kept = [...lines]
for (const cut of CUTS.sort((a, b) => b.from - a.from)) {
  const start = kept[cut.from - 1] ?? ''
  const end = kept[cut.to - 1] ?? ''
  if (!start.includes(cut.expectStart)) {
    throw new Error(`line ${cut.from} is ${JSON.stringify(start)} — expected ${cut.expectStart}`)
  }
  if (end.trim() !== cut.expectEnd.trim()) {
    throw new Error(`line ${cut.to} is ${JSON.stringify(end)} — expected ${cut.expectEnd}`)
  }
  kept.splice(cut.from - 1, cut.to - cut.from + 1)
}

writeFileSync(FILE, kept.join('\n'))
console.log(`removed ${CUTS.length} blocks; ${lines.length} -> ${kept.length} lines`)
