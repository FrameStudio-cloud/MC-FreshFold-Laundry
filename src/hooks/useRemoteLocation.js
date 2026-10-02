import { useEffect, useState } from 'react'
import { business } from '../data/business.js'
import { fetchLocation, hasToken } from '../api/keelClient.js'

/**
 * Where the shop is, preferring whatever the owner has saved in Keel.
 *
 * Sibling of useRemoteFaq rather than a generalisation of it, and for the same
 * reason useRemoteDelivery is its own thing: two callers, two shapes, and a
 * shared abstraction here would have to be looser than either caller wants.
 *
 * Config is the floor, never the absence. The map card renders from business.js
 * on first paint and a remote payload only replaces it when it arrives, so a cold
 * host, a revoked token or a flat network cannot leave a visitor with a blank box.
 *
 * Returns nulls rather than rewriting business.* in place. Contact.jsx is the
 * only consumer, so unlike delivery - read by three components, which is why
 * that one mutates config - there is nothing to gain from a global write and a
 * component-level override reads better at the call site.
 *
 * Every value is individually overridable. An owner who pastes only the embed URL
 * should not have to retype the address to get it to save.
 */

/** Longest a pasted URL is kept. Not a limit anyone will notice reaching. */
const MAX_URL = 2000

const str = (v) => (typeof v === 'string' ? v.trim() : '')

/**
 * A Google Maps link, preferring the pasted one and building a search otherwise.
 *
 * Google Maps offers two very different links and an owner will paste whichever
 * they find. A place or directions link opens fine in a new tab; a maps.app.goo.gl
 * short link is a redirect and works too. What must NOT happen is building an
 * embed from them, which is why the embed is used for the iframe only when it is
 * already one.
 */
function mapsLink(pasted, address) {
  if (pasted) return pasted
  const place = str(address) || `${business.area}, ${business.city}`
  return `https://maps.google.com/?q=${encodeURIComponent(place)}`
}

/**
 * True only for something that is safe to put in an iframe src.
 *
 * Deliberately strict: an embed URL is the one owner-supplied string this site
 * loads as a document, so a javascript: or data: value must not reach the
 * iframe. Anything unrecognised is treated as "no embed", which degrades to the
 * designed placeholder plus a directions link rather than loading something.
 */
function isEmbeddable(url) {
  if (!url) return false
  if (url.length > MAX_URL) return false
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:') return false
    const host = parsed.hostname.replace(/^www\./, '')
    // Google hosts the embed iframe; openstreetmap and friends do not, and a
    // third-party frame would be a silent change of data processor.
    return host === 'google.com' || host.endsWith('.google.com') || host === 'maps.google.com'
  } catch {
    return false
  }
}

function normalise(rows) {
  const out = {}
  for (const row of rows) {
    const content = row?.content
    if (!content || typeof content !== 'object') continue
    for (const key of ['address_line', 'landmark_note', 'map_link_url', 'map_embed_url']) {
      const value = str(content[key])
      if (value) out[key] = value
    }
  }
  return out
}

export function useRemoteLocation() {
  const [remote, setRemote] = useState(null)

  useEffect(() => {
    if (!hasToken) return undefined

    const controller = new AbortController()

    fetchLocation({ signal: controller.signal })
      .then((rows) => {
        setRemote(normalise(rows))
      })
      .catch(() => {
        // Silent to the visitor by design - the card is already on screen from
        // config. Reported as `location` health by the transport layer, so it is
        // not silent to us.
      })

    return () => controller.abort()
  }, [])

  const saved = remote || {}
  const addressLine = saved.address_line || business.addressLine
  const embed = isEmbeddable(saved.map_embed_url) ? saved.map_embed_url : ''

  return {
    addressLine,
    landmarkNote: saved.landmark_note || '',
    // Empty when the owner pasted something we refuse to frame, which is what
    // puts the designed placeholder and the directions link back on screen.
    mapEmbedUrl: embed,
    mapLinkUrl: mapsLink(saved.map_link_url, addressLine),
    isRemote: Boolean(remote && Object.keys(remote).length),
    isConfigured: hasToken,
  }
}