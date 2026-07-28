import { motion } from 'framer-motion'
import {
  FileText,
  Quote,
  Calculator,
  Download,
  Palette,
  Globe,
} from 'lucide-react'

const FEATURES = [
  {
    icon: FileText,
    title: 'Professional Invoice Builder',
    description:
      'Build polished, itemized invoices with automatic totals, taxes, and discounts in a clean, modern editor.',
  },
  {
    icon: Quote,
    title: 'Quotes',
    description:
      'Send branded quotes that clients can approve online, then convert them into invoices with one click.',
  },
  {
    icon: Calculator,
    title: 'Estimates',
    description:
      'Create accurate project estimates, adjust line items, and turn approved estimates into payable invoices.',
  },
  {
    icon: Download,
    title: 'PDF Export',
    description:
      'Download print-ready PDFs instantly or share a secure link so clients can view invoices in any browser.',
  },
  {
    icon: Palette,
    title: 'Custom Branding',
    description:
      'Add your logo, colors, and business details so every invoice looks like it came from your studio.',
  },
  {
    icon: Globe,
    title: 'Multi-Currency',
    description:
      'Invoice clients around the world with support for major currencies and automatic formatting.',
  },
]

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
}

export function Features() {
  return (
    <section id="features" className="bg-background">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="label-caps">Features</span>
          <h2 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-tight text-foreground md:text-4xl">
            A complete toolkit for polished invoices, quotes, and estimates
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            A focused toolkit for creating, customizing, and sharing professional documents.
          </p>
        </div>

        <motion.div
          className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
        >
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <motion.div
              key={title}
              variants={item}
              className="group relative flex h-full flex-col rounded-2xl bg-card p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg gradient-border"
            >
               <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 text-primary shadow-sm transition-all duration-300 group-hover:-translate-y-0.5 group-hover:from-primary/15 group-hover:to-primary/10 group-hover:shadow-md">
                 <Icon className="h-6 w-6 transition-transform duration-300 group-hover:scale-105" />
              </div>
              <h3 className="font-display text-lg font-semibold tracking-tight text-foreground">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
