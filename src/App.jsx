import { useCallback, useState } from 'react'

import { Navbar } from './components/Navbar.jsx'
import { Hero } from './components/Hero.jsx'
import { ServiceGrid } from './components/ServiceGrid.jsx'
import { PriceList } from './components/PriceList.jsx'
import { Steps } from './components/Steps.jsx'
import { Benefits } from './components/Benefits.jsx'
import { Testimonials } from './components/Testimonials.jsx'
import { Faq } from './components/Faq.jsx'
import { Contact } from './components/Contact.jsx'
import { FinalCta } from './components/FinalCta.jsx'
import { Footer } from './components/Footer.jsx'
import { OrderBar, OrderDrawer } from './components/OrderDrawer.jsx'
import { WhatsAppFab } from './components/WhatsAppFab.jsx'
import { BackToTop } from './components/BackToTop.jsx'
import { useOrder } from './hooks/useOrder.js'
import { useShopSettings } from './hooks/useShopSettings.js'
import { useRemoteServices } from './hooks/useRemoteServices.js'

/**
 * One page, in the order a visitor actually needs it:
 * what it is -> what it costs -> how it works -> why trust it -> proof ->
 * questions -> where it is -> act.
 *
 * Sections are rendered in order but the filters inside them are local state,
 * so switching category never re-mounts the grid or loses scroll position.
 *
 * h1 lives in Hero. Every section below uses h2, and cards use h3, so the
 * heading outline is a clean single-rooted tree.
 */
export default function App() {
  const [sheetOpen, setSheetOpen] = useState(false)

  // Three independent reads, each with its own fallback:
  //   settings  overlays identity onto the config, which is already accurate
  //   services  IS the catalogue, so it is held in state and threaded through
  //   faq       overlays copy, config is the fallback
  // The catalogue is not mutated into business.services: useOrder memoises over
  // it, and a list replaced after that memo ran would leave the basket stale.
  const { toggles } = useShopSettings()
  const catalogue = useRemoteServices()
  const order = useOrder(catalogue.services)

  const openSheet = useCallback(() => setSheetOpen(true), [])
  const closeSheet = useCallback(() => setSheetOpen(false), [])

  return (
    <>
      <a
        href="#services"
        className="sr-only rounded-full focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:bg-primary-600 focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to services
      </a>

      <Navbar onOpenOrder={openSheet} />

      <main>
        <Hero onViewServices={() => document.getElementById('services')?.scrollIntoView({ block: 'start' })} />
        <ServiceGrid
          services={catalogue.services}
          status={catalogue.status}
          error={catalogue.error}
          order={order}
          onOpenOrder={openSheet}
        />
        <PriceList services={catalogue.services} status={catalogue.status} />
        <Steps />
        <Benefits />
        <Testimonials />
        <Faq />
        <Contact />
        <FinalCta />
      </main>

      <Footer />

      <WhatsAppFab enabled={toggles.chat_widget?.enabled !== false} />
      <BackToTop enabled={toggles.back_to_top?.enabled === true} chatEnabled={toggles.chat_widget?.enabled !== false} />
      <OrderBar count={order.count} total={order.total} onOpen={openSheet} sheetOpen={sheetOpen} />
      <OrderDrawer open={sheetOpen} onClose={closeSheet} order={order} />
    </>
  )
}