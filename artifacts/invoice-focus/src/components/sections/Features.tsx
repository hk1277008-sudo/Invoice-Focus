import { motion } from 'framer-motion'
import {
  FileText,
  Quote,
  ReceiptText,
  ClipboardList,
  LayoutTemplate,
  Palette,
  Globe2,
  Download,
} from 'lucide-react'

const FEATURES = [
  {
    icon: FileText,
    title: 'Professional Invoices',
    description:
      'Create itemized invoices with automatic totals, tax, discount, and professional document layouts.',
  },
  {
    icon: Quote,
    title: 'Quotes & Estimates',
    description:
      'Prepare clear pricing proposals and project estimates before work begins with a focused line-item workflow.',
  },
  {
    icon: ReceiptText,
    title: 'Receipts & Credit Notes',
    description:
      'Confirm completed payments and document billing adjustments with clear, professional business documents.',
  },
  {
    icon: ClipboardList,
    title: 'Purchase Orders',
    description:
      'Create structured supplier orders with clear items, quantities, pricing, and business details.',
  },
  {
    icon: LayoutTemplate,
    title: 'Professional Document Templates',
    description:
      'Choose Minimal, Professional, or Enterprise designs for different business styles and document needs.',
  },
  {
    icon: Palette,
    title: 'Custom Business Branding',
    description:
      'Add your logo, colors, company details, and presentation preferences to each document.',
  },
  {
    icon: Globe2,
    title: 'Multi-Currency Documents',
    description:
      'Create documents in your business currency and keep amounts consistent throughout the invoice workflow.',
  },
  {
    icon: Download,
    title: 'Print-Ready PDF Documents',
    description:
      'Download or print polished business documents ready to share with clients, customers, and suppliers.',
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
      <div className="mx-auto max-w-7xl px-6 pb-16 pt-8 lg:pb-20 lg:pt-10">
        <div className="mx-auto max-w-2xl text-center">
          <span className="label-caps">Features</span>
          <h2 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-tight text-foreground md:text-4xl">
            Everything You Need to Create Professional Business Documents
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Create, customize, and download invoices, quotes, estimates, receipts, credit notes, and purchase orders from one simple workspace.
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
              className="group relative flex h-full min-h-[16rem] flex-col rounded-2xl border border-border/70 bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
            >
               <div className="mb-5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary/15">
                 <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="font-display text-lg font-semibold leading-snug tracking-tight text-foreground">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
