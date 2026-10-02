import { useSyncExternalStore } from 'react'
import { reportHealth } from './analytics.js'

/**
 * Tracks whether the data layer is actually reaching keel-api.
 *
 * Copy of the module in clients/kikoi/src/lib/dataHealth.js, adapted: kikoi has a
 * MODE constant for supabase-vs-keel and this site has only one source, so
 * `mode` is dropped and reportOk() takes just a name.
 *
 * The problem it exists to solve is present here verbatim. Three of the four
 * reads in this app end in a bare catch that returns a plausible-looking
 * default, so a dead API is indistinguishable from a healthy one:
 *
 *   useShopSettings   -> toggles: {}   -> back-to-top and chat silently vanish
 *   useRemoteFaq      -> items: []     -> FAQ section silently disappears
 *   useRemoteServices -> status:'error'-> the one honest failure in the app
 *
 * Two of those three fail invisibly. A visitor sees a complete, believable site
 * with pieces missing and no indication anything is wrong, and so do we.
 *
 * A module-level store with useSyncExternalStore rather than context, so any
 * component can read it without provider nesting or threaded props.
 *
 * Every transition also goes to the Keel Analytics SDK, which writes
 * health_ok/health_fail into site_events. The two consumers need different
 * shapes — this store answers "what should the visitor see right now", the SDK
 * answers "what happened, and when did it change" — so they share the report
 * functions rather than sharing state.
 *
 * Known limit: no console UI reads site_events yet, so these rows are currently
 * only visible by querying the table. That is deliberate groundwork, not a
 * finished dashboard.
 *
 * State shape:
 *   { resources: { [name]: { ok, at, error, failures } } }
 */

const EMPTY = { resources: Object.freeze({}) }

let state = EMPTY
const listeners = new Set()

function emit(next) {
  state = next
  for (const l of listeners) l()
}

const subscribe = (listener) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

const getSnapshot = () => state
const getServerSnapshot = () => EMPTY

export function reportOk(name) {
  emit({
    resources: {
      ...state.resources,
      [name]: {
        ok: true,
        at: Date.now(),
        error: null,
        // One good read clears the streak, so a blip does not persist.
        failures: 0,
      },
    },
  })
  // The SDK only emits on a state change, so a healthy read on every page load
  // does not become a stream of events.
  reportHealth(name, true)
}

/**
 * True when an error means "the visitor navigated away", not "the site is broken".
 *
 * Every hook here aborts its in-flight controller on unmount, so navigating or
 * re-rendering mid-request throws an abort. That is ordinary behaviour, and
 * counting it as a failure made a healthy site flash red on every navigation.
 * A health bar that cries wolf is worse than no health bar, because it gets
 * ignored.
 */
function isAbort(error) {
  if (!error) return false
  if (error.name === 'AbortError') return true
  const message = String(error.message || error).toLowerCase()
  return message.includes('abort') || message.includes('signal is aborted')
}

export function reportFailure(name, error) {
  // An aborted request says nothing about whether the data layer works, so it
  // must not move the health state — here or in the SDK.
  if (isAbort(error)) return

  const prev = state.resources[name] || {}
  const message = error ? String(error.message || error) : 'unreachable'
  emit({
    ...state,
    resources: {
      ...state.resources,
      [name]: {
        ok: false,
        at: Date.now(),
        error: message,
        failures: (prev.failures || 0) + 1,
      },
    },
  })
  reportHealth(name, false, message)
}

export function useDataHealth() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

/** True when this resource has failed and not yet recovered. */
export function isResourceDown(health, name) {
  const r = health?.resources?.[name]
  return Boolean(r && r.ok === false)
}

export function resetDataHealth() {
  emit(EMPTY)
}

/**
 * Read the store directly. Not part of the app.
 *
 * A health store you cannot read from a test is a health store you cannot
 * verify. Asserting on the analytics events instead cannot work here: the SDK
 * deliberately suppresses repeated states, so a resource that never changes
 * state emits nothing at all — which was exactly how the supabase mode in kikoi
 * ended up reporting nothing while looking fine.
 */
export function __testState() {
  return state
}