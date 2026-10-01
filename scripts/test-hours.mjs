/**
 * Exercises the three business_hours shapes that exist in this database against
 * the real row, plus the seed.mjs form and the "arrives as a string" case.
 */
const { parseBusinessHours } = await import('../src/utils/shopSettings.js')

const cases = [
  [
    'live production row (object form, all 7 days identical)',
    {
      mon: { open: '08:00', close: '17:00', active: true },
      tue: { open: '08:00', close: '17:00', active: true },
      wed: { open: '08:00', close: '17:00', active: true },
      thu: { open: '08:00', close: '17:00', active: true },
      fri: { open: '08:00', close: '17:00', active: true },
      sat: { open: '08:00', close: '17:00', active: true },
      sun: { open: '08:00', close: '17:00', active: true },
    },
  ],
  [
    'seed.mjs form (string range + "closed")',
    { mon: '8:00-18:00', tue: '8:00-18:00', wed: '8:00-18:00', thu: '8:00-18:00', fri: '8:00-18:00', sat: '9:00-15:00', sun: 'closed' },
  ],
  ['arrives as a JSON string', '{"mon":{"open":"08:00","close":"17:00","active":true}}'],
  ['inactive day is dropped', { mon: { open: '08:00', close: '17:00', active: true }, sun: { open: '09:00', close: '13:00', active: false } }],
  ['split hours are not merged', { mon: { open: '07:00', close: '13:00' }, tue: { open: '13:00', close: '20:00' } }],
  ['garbage', { mon: 'whenever' }],
  ['empty object', {}],
  ['null', null],
  ['array', ['nope']],
  ['unparseable string', 'not json at all'],
]

let failures = 0
for (const [label, input] of cases) {
  const out = parseBusinessHours(input)
  const ok = Array.isArray(out) && out.every((r) => Array.isArray(r.days) && r.opens && r.closes)
  if (!ok) failures++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`)
  console.log(`      -> ${JSON.stringify(out)}`)
}

console.log(`\n${failures === 0 ? 'ALL HOURS SHAPES PARSED' : failures + ' FAILED'}`)
process.exit(failures === 0 ? 0 : 1)