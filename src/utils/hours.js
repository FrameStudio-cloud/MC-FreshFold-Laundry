import { business } from '../data/business.js'

/**
 * Opening hours, derived.
 *
 * business.hours is one array of { days: [...], opens: 'HH:MM', closes: 'HH:MM' }.
 * It is rendered as a table, tested against the current time for the
 * "Open now" badge, and transformed into openingHoursSpecification for the
 * JSON-LD. Three surfaces, one source, so they cannot disagree.
 */

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

/** '07:00' -> '7:00 AM'. Avoids toLocaleTimeString, whose output differs by
 *  machine locale and made the design unpredictable. */
export function formatClock(time) {
  const [h, m] = String(time).split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 === 0 ? 12 : h % 12
  return m === 0 ? `${hour} ${suffix}` : `${hour}:${String(m).padStart(2, '0')} ${suffix}`
}

export function formatHoursRow(row) {
  const label =
    row.days.length === 7
      ? 'Every day'
      : row.days.length === 5 && row.days[0] === 'Monday' && row.days[4] === 'Friday'
        ? 'Monday – Friday'
        : row.days.join(', ')
  return { label, value: `${formatClock(row.opens)} – ${formatClock(row.closes)}` }
}

/**
 * Is the shop open right now? Naive local-time comparison, which is correct
 * for a single-shop site in one timezone. Overnight hours (closes before opens)
 * are handled because the test is `now >= opens || now < closes` when the row
 * spans midnight.
 */
export function isOpenNow(date = new Date()) {
  const today = DAY_NAMES[date.getDay()]
  const now = date.getHours() * 60 + date.getMinutes()

  for (const row of business.hours) {
    if (!row.days.includes(today)) continue
    const opens = toMinutes(row.opens)
    const closes = toMinutes(row.closes)
    if (closes > opens) {
      if (now >= opens && now < closes) return { open: true, row, today }
    } else if (now >= opens || now < closes) {
      // Spans midnight.
      return { open: true, row, today }
    }
  }

  const todaysRow = business.hours.find((r) => r.days.includes(today))
  return { open: false, row: todaysRow, today }
}

function toMinutes(time) {
  const [h, m] = String(time).split(':').map(Number)
  return h * 60 + m
}

/** "Open now · closes 7:00 PM" / "Closed · opens Monday 7:00 AM" */
export function openNowLabel(date = new Date()) {
  const { open, row } = isOpenNow(date)
  if (open && row) return { open, text: `Open now · closes ${formatClock(row.closes)}` }
  if (row) return { open, text: `Closed now · opens ${formatClock(row.opens)}` }
  return { open, text: 'Closed now' }
}