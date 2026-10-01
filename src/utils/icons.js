import { createElement } from 'react'
import {
  BedDouble,
  Droplets,
  Flame,
  Footprints,
  Leaf,
  MessageCircle,
  Package,
  PanelsTopLeft,
  Search,
  ShieldCheck,
  Shirt,
  Sparkles,
  Sun,
  Timer,
  Truck,
  WashingMachine,
  Waves,
  Wind,
  Zap,
} from 'lucide-react'

/**
 * Config refers to icons BY NAME so business.js stays a plain data file with no
 * JSX and no imports — someone handed this template can change an icon by
 * typing a word, not by writing code.
 *
 * Adding one: import it above and add a line to ICON_MAP. Names come from the
 * lucide gallery. An unknown name renders <Dot/> rather than crashing the page,
 * so a typo in the config is visible but never fatal.
 *
 * This file uses createElement instead of JSX so it can be a .js module — a
 * component-only file keeps React Fast Refresh working for everything that
 * imports it.
 */
export const ICON_MAP = {
  bed: BedDouble,
  bolt: Zap,
  curtain: PanelsTopLeft,
  droplet: Droplets,
  flame: Flame,
  hanger: Shirt,
  leaf: Leaf,
  message: MessageCircle,
  package: Package,
  search: Search,
  shield: ShieldCheck,
  shirt: Shirt,
  shoe: Footprints,
  sparkles: Sparkles,
  sun: Sun,
  timer: Timer,
  truck: Truck,
  washing: WashingMachine,
  water: Waves,
  wind: Wind,
}

/** Neutral stand-in drawn with createElement so this stays a .js file. */
function Dot({ size = 24, ...props }) {
  return createElement(
    'svg',
    {
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      fill: 'currentColor',
      'aria-hidden': 'true',
      ...props,
    },
    createElement('circle', { cx: 12, cy: 12, r: 4 }),
  )
}

/** Resolves a config icon name to a component reference. */
export function getIcon(name) {
  return ICON_MAP[name] ?? Dot
}

/** True when the name is one we actually ship — lets a dev-time check catch a
 *  typo in business.js before the client sees it. */
export const isKnownIcon = (name) => Object.prototype.hasOwnProperty.call(ICON_MAP, name)

export const iconNames = Object.keys(ICON_MAP)