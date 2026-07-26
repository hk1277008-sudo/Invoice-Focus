import { Header } from '@/components/sections/Header'
import { Hero } from '@/components/sections/Hero'
import { Features } from '@/components/sections/Features'
import { Templates } from '@/components/sections/Templates'
import { Resources } from '@/components/sections/Resources'
import { FAQ } from '@/components/sections/FAQ'
import { CTA } from '@/components/sections/CTA'
import { Footer } from '@/components/sections/Footer'

export default function HomePage() {
  return (
    <>
      <Header />
      <Hero />
      <Features />
      <Templates />
      <Resources />
      <FAQ />
      <CTA />
      <Footer />
    </>
  )
}
