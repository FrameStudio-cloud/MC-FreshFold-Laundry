import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { buildSeoTags } from './src/utils/seo.js'

/**
 * Fills index.html's <head> with title, description, Open Graph tags and
 * LocalBusiness JSON-LD, generated from src/data/business.js.
 *
 * Uses Vite's structured `tags` API rather than string placeholders on purpose:
 * Vite strips HTML comments when it minifies the HTML at build time, so a
 * `<!-- placeholder -->` would vanish before it could be replaced. Tags are
 * appended after minification and work identically in dev and build.
 */
function seoFromConfig() {
  return {
    name: 'seo-from-config',
    transformIndexHtml: {
      order: 'post',
      handler() {
        const { title, description, url, ogTags, jsonLd } = buildSeoTags()

        return {
          tags: [
            { tag: 'title', children: title, injectTo: 'head' },
            { tag: 'meta', attrs: { name: 'description', content: description }, injectTo: 'head' },
            // Absolute URL on purpose: Vite's html pass tries to resolve every
            // <link href> as a project asset, and a bare href="/" makes it read
            // the project directory and fail the build.
            { tag: 'link', attrs: { rel: 'canonical', href: url }, injectTo: 'head' },
            ...ogTags.map(({ prop, name, content }) => ({
              tag: 'meta',
              attrs: prop ? { property: prop, content } : { name, content },
              injectTo: 'head',
            })),
            {
              tag: 'script',
              attrs: { type: 'application/ld+json' },
              // Escaping "<" stops a stray "<" in a config string from closing
              // the script element and dumping the schema into the page.
              children: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
              injectTo: 'head',
            },
          ],
        }
      },
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), seoFromConfig()],
})