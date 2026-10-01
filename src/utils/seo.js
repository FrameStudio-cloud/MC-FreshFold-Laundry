import { business, siteUrl } from '../data/business.js'
import { fillTokens } from './format.js'

/**
 * Build-time SEO. Consumed by the plugin in vite.config.js, which injects the
 * results into index.html during both dev and build.
 *
 * Doing this here rather than with document.head writes in React matters: a
 * crawler that does not run JavaScript still sees a real title, description and
 * JSON-LD. It also means the shipped HTML is already correct before hydration.
 */

export function buildSeoTags() {
  const tokens = { name: business.name, area: business.area, city: business.city }
  const title = `${business.name} · Laundry in ${business.area}, ${business.city}`.trim()
  const description = fillTokens(business.description, tokens)
  const url = siteUrl.replace(/\/$/, '')

  const ogTags = [
    { prop: 'og:type', content: 'website' },
    { prop: 'og:site_name', content: business.name },
    { prop: 'og:title', content: title },
    { prop: 'og:description', content: description },
    { prop: 'og:url', content: url },
    { prop: 'og:locale', content: 'en_KE' },
    { prop: 'og:image', content: `${url}${business.hero.image}` },
    { prop: 'og:image:alt', content: business.hero.imageAlt },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: `${url}${business.hero.image}` },
    { name: 'geo.region', content: 'KE-30' },
    { name: 'geo.placename', content: `${business.area}, ${business.city}` },
  ]

  return { title, description, url, ogTags, jsonLd: buildJsonLd(url) }
}

/**
 * LocalBusiness JSON-LD, filled from the same config the page renders from.
 *
 * `DryCleaningOrLaundry` is the schema.org type for this business (there is no
 * "LaundryService" type — an easy mistake to make here).
 *
 * openingHoursSpecification and areaServed are derived from business.hours and
 * business.delivery.areas rather than typed again here, which is the point of
 * keeping hours as structured data in the config.
 */
export function buildJsonLd(url) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'DryCleaningOrLaundry',
    '@id': `${url}/#business`,
    name: business.name,
    description: fillTokens(business.description, {
      name: business.name,
      area: business.area,
      city: business.city,
    }),
    url,
    image: `${url}${business.hero.image}`,
    telephone: business.phoneDial,
    priceRange: 'KES',
    currenciesAccepted: 'KES',
    address: {
      '@type': 'PostalAddress',
      streetAddress: business.addressLine,
      addressLocality: business.area,
      addressRegion: business.city,
      addressCountry: 'KE',
    },
    openingHoursSpecification: business.hours.map((row) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: row.days.map((d) => `https://schema.org/${d}`),
      opens: row.opens,
      closes: row.closes,
    })),
    sameAs: [business.instagramUrl].filter(Boolean),
    areaServed: (business.delivery.areas ?? []).map((area) => ({
      '@type': 'City',
      name: area,
    })),
    // NOTE: no makesOffer here. The catalogue now comes from /api/services at
    // runtime, so at build time there is no price to publish and inventing one
    // would be a lie in the structured data. The offer list is merged in once the
    // services have loaded - see applyServiceSchema().
  }

  if (business.email) data.email = business.email

  return data
}

/** Id of the JSON-LD script the build injects, so runtime can find it again. */
export const SCHEMA_ID = 'keel-localbusiness'

/**
 * Merge the live service list into the page's JSON-LD.
 *
 * The build emits the LocalBusiness node without `makesOffer` because prices are
 * not known until /api/services answers. This adds them once they are, so a
 * crawler that executes JavaScript sees the real catalogue with real prices
 * rather than whatever was true when the site was built.
 *
 * It UPDATES the existing script rather than adding a second one: two
 * LocalBusiness nodes on a page is ambiguous, and some validators treat the
 * duplicate as an error.
 */
export function applyServiceSchema(services) {
  if (typeof document === 'undefined' || !services?.length) return

  const script = document.getElementById(SCHEMA_ID)
  if (!script) return

  try {
    const data = JSON.parse(script.textContent)
    data.makesOffer = services.map((service) => ({
      '@type': 'Offer',
      itemOffered: { '@type': 'Service', name: service.name, description: service.description },
      price: service.price,
      priceCurrency: 'KSh',
    }))
    script.textContent = JSON.stringify(data)
  } catch {
    // A malformed script is not worth breaking the page over; the core
    // LocalBusiness data is already in the HTML for a non-JS crawler.
  }
}