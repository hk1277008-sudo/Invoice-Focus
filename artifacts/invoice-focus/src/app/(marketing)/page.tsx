import { Header } from '@/components/sections/Header'
import { Hero } from '@/components/sections/Hero'
import { Features } from '@/components/sections/Features'
import { Templates } from '@/components/sections/Templates'
import { HowItWorks } from '@/components/sections/HowItWorks'
import { ProductPreview } from '@/components/sections/ProductPreview'
import { Why } from '@/components/sections/Why'
import { Pricing } from '@/components/sections/Pricing'
import { Services } from '@/components/sections/Services'
import { FAQ } from '@/components/sections/FAQ'
import { CTA } from '@/components/sections/CTA'
import { Footer } from '@/components/sections/Footer'

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Features />
        <Templates />
        <HowItWorks />
        <ProductPreview />
        <Why />
        <Pricing />
        <Services />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </>
  )
}
