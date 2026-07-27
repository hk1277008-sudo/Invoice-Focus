import { Header } from '@/components/sections/Header'
import { Hero } from '@/components/sections/Hero'
import { Trusted } from '@/components/sections/Trusted'
import { Features } from '@/components/sections/Features'
import { Templates } from '@/components/sections/Templates'
import { HowItWorks } from '@/components/sections/HowItWorks'
import { ProductPreview } from '@/components/sections/ProductPreview'
import { Why } from '@/components/sections/Why'
import { FAQ } from '@/components/sections/FAQ'
import { CTA } from '@/components/sections/CTA'
import { Footer } from '@/components/sections/Footer'

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Trusted />
        <Features />
        <Templates />
        <HowItWorks />
        <ProductPreview />
        <Why />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </>
  )
}
