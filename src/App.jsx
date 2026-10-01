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
import { useOrder } from './hooks/useOrder.js'

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
  const order = useOrder()

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
        <ServiceGrid order={order} onOpenOrder={openSheet} />
        <PriceList />
        <Steps />
        <Benefits />
        <Testimonials />
        <Faq />
        <Contact />
        <FinalCta />
      </main>

      <Footer />

      <WhatsAppFab />
      <OrderBar count={order.count} total={order.total} onOpen={openSheet} sheetOpen={sheetOpen} />
      <OrderDrawer open={sheetOpen} onClose={closeSheet} order={order} />
    </>
  )
}