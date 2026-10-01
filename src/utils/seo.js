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
    makesOffer: business.services.map((service) => ({
      '@type': 'Offer',
      itemOffered: {
        '@type': 'Service',
        name: service.name,
        description: service.description,
      },
      price: service.price,
      priceCurrency: 'KES',
    })),
  }

  if (business.email) data.email = business.email

  return data
}