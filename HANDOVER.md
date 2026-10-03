# HANDOVER — OLFATTA mini-catalogue

A bespoke Keel storefront for OLFATTA, a laundry in Kariani, Muranga.
Live at <https://mc-fresh-fold-laundry.vercel.app/>.

Read this before changing anything. It records what transfers to the next client,
what the owner can change without you, and the three ways this project has
surprised us.

---

## 1. What this is

System A: a site hand-built per client. It talks to `keel-api` at runtime using a
per-shop **site token**, so it never ships a Supabase key.

It is not the storefront template system. Do not read, research or propose
changes to the provisioner or the section library — that system is parked on
purpose. See `AGENTS.md` at the repo root.

```
browser ──x-keel-site-token──▶ keel-api ──service role──▶ Supabase
```

The token identifies the shop. `keel-api` derives `shop_id` from it and ignores
any the client sends, so a token can only ever reach its own shop.

---

## 2. The two files that define the business

| File | What it decides |
|---|---|
| `src/data/business.js` | Every piece of copy, price, link, icon name and opening hour |
| `public/keel-manifest.json` | Which pages the owner can edit, and what fields each has |

Start a new client's site by rewriting these two, then adjust `src/App.jsx` for
which sections the site actually has.

### business.js

A plain mutable object. Components `import { business }` and read straight off it,
so it is **overlaid at runtime** when the database answers:

```
config paints instantly  →  database overwrites it, but only where it has a usable value
```

That "only where usable" rule is the point. The live settings row for this shop
has null description, null tagline and empty socials, so a naive
`business.name = row.store_name` applied everywhere would blank the hero subtitle
and delete the Instagram link. Every field is guarded.

Search the file for `[REPLACE]` (must change before going live) and `[OPTIONAL]`
(safe to leave). The icons are **names**, not imports — `src/utils/icons.js` maps
them and renders a neutral dot for anything unknown.

### keel-manifest.json

Declarative. Keel reads it from the **deployed** URL and builds the editors.

**Two rules that will bite you:**

- **Keys must be lowercase.** Keel drops any key containing an uppercase letter.
  `headlineAccent` was silently removed from the editor; an owner could have
  filled it in and watched it vanish. Use `headline_accent`.
- **Field types are limited** to `text`, `textarea`, `image`, `array`. An unknown
  type is dropped with a visible warning, not a field that saves nothing.

**Always validate a manifest change against Keel's own resolver before deploying:**

```bash
cd <keel-repo>
node --input-type=module -e "
import { resolveSitePages } from './src/lib/sitePages.js';
const m = JSON.parse(await (await fetch('https://YOUR-SITE/keel-manifest.json')).text());
const { pages, report } = resolveSitePages(m.pages);
console.log(pages.map(p => p.key).join(', '));
console.log('dropped:', JSON.stringify(report.droppedFields));
if (pages.length !== Object.keys(m.pages).length || report.droppedFields.length) process.exit(1);
"
```

A dropped page is invisible until an owner tells you a field went nowhere.

---

## 3. What the owner changes themselves — no deploy

In **Keel → Website → Features**:

| Page | What they can change |
|---|---|
| Homepage banner | eyebrow, headline, both button labels, trust chips |
| How it works | heading and the steps |
| Why choose us | heading and the benefits |
| Services & pricing | the whole catalogue, including publish/unpublish |
| FAQ | questions and answers |
| Delivery & pickup | promise, same-day note, areas covered |
| Location | address, "how to find you", map links |
| Testimonials | their real quotes, with the placeholder banner clearing itself |

In **Keel → Website → Features** (switches): the WhatsApp button, back-to-top, page
tracking.

In **Keel → Settings**: shop name, phone, address, hours, logo, Instagram, currency.

`{area}`, `{city}` and `{name}` are substituted at render time, so an owner can
write "Why {name}" and get the real name.

## 4. What still needs a developer

| Block | Why |
|---|---|
| `hero.image`, `hero.badge` | Designed asset and a turnaround promise — deliberate |
| `servicePresentation` | Icon, grouping and "popular" flag per service |
| `priceList`, `categories`, `steps` layout | Section structure |
| `finalCta`, `footer`, `contact`, `nav`, `order` | Labels and layout |

`finalCta` and `footer` are the cheapest to convert if a client asks — they follow
exactly the pattern in section 3.

---

## 5. Provisioning a new client

Do **not** do this by hand in the SQL editor. Use the script:

```bash
cd <keel-repo>
node supabase/provision/provision-mc.mjs \
  --shop "BUSINESS NAME" \
  --slug "existing-shop-slug" \
  --url https://their-site.vercel.app/ \
  --signals settings,services,delivery,faq \
  --env ../keel-api/.env \
  --dry-run
```

It creates the shop, site, **read + write** token pair and health declarations;
is safe to re-run; never rotates tokens; and **proves the write token can write**
before reporting success.

Two things about the data model:

- `shops.name` is the **account** name, not the business name. Signup-created shops
  also have a generated slug with a random suffix (`lewisirungu489-hlky`). The
  script matches on either.
- The business name the site displays is `store_settings.store_name`.

---

## 6. Deploy checklist

```
[ ] npm run lint && npm run build
[ ] npm test                    # 9 suites, see section 7
[ ] git push                    # Vercel deploys on push to main
[ ] Vercel: VITE_KEEL_SITE_TOKEN = the WRITE token
[ ] ...for EVERY environment, not just Production
[ ] Redeploy.  <-- env vars are baked at build time
[ ] Keel -> Website -> Features -> page_tracking ON
[ ] Load the live site, confirm POST /api/events returns 201
```

**The single step that goes wrong is the token.** A read token makes every GET
succeed and every POST return 403. The site looks perfect and records nothing.
Check it by extracting the token from the deployed bundle and comparing it against
`site_tokens.write_token` — or just run the provisioning script, which verifies it.

---

## 7. Tests

```bash
npm test              # everything, in order
npm run test:ui       # interactions, order flow, delivery, hours
npm run test:remote   # the real API: reads, page view, health
npm run test:health   # health signals, both directions
npm run test:icons    # every icon name in business.js is real
```

The remote suites need the preview server:

```powershell
Start-Process npx.cmd -ArgumentList "vite","preview","--port","4173","--strictPort" -WindowStyle Hidden
# ...run the test...
Get-CimInstance Win32_Process -Filter "Name='node.exe'" |
  Where-Object { $_.CommandLine -match 'vite\.js"?\s+preview' } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
```

**Kill the preview server by process name, not by `$p.Id`.** When `Start-Process`
fails, `$p` is null and cleanup silently does nothing — that left 78 orphaned
servers in one session. Also note `vite preview` binds IPv6, so `netstat` checks
miss it; poll the URL with `Invoke-WebRequest` instead of trusting a port check.

Two hosts are involved and only one is under our control: `keel-api` is on a free
Render plan that sleeps. Cold starts and **429s under repeated local testing** both
look like site failures. `test-health` retries once when *every* signal fails,
which distinguishes a sleeping host from a broken site.

---

## 8. Three ways this project has surprised us

Worth reading before you trust anything here.

1. **A silently dropped manifest field.** Three hero fields were removed from the
   editor because their keys had uppercase letters. The page still resolved, so
   nothing looked wrong. Section 2's resolver check exists because of this.

2. **An icon typo shipping to production.** `clock` was never a shipped icon name,
   and it was used twice — both rendered as a neutral dot on the live site.
   `icons.js` had an `isKnownIcon` helper written to catch exactly this and nothing
   called it. `test:icons` and the read path both call it now.

3. **A read-only token looking like a working site.** See section 6. This is the
   one that costs a client real data rather than a cosmetic bug.

---

## 9. Where the rest of it lives

| Concern | Repo |
|---|---|
| This site | `FrameStudio-cloud/MC-FreshFold-Laundry` |
| API, site tokens, collector | `keel-ecosystem/keel-api` |
| Analytics + health SDK | `keel-ecosystem/keel-analytics` |
| Database schema and migrations | `keel-ecosystem/keel` → `supabase/migrations` |
| Operator provisioning | `keel-ecosystem/keel` → `supabase/provision` |
| Health console | `framestudio/framestudio-dashboard` → SiteHealth |

The site's health vocabulary is declared **per site**, not globally, so a new site
gets exactly the bars it reports and no dead lamps. See
`20261002_site_health_resources.sql`.