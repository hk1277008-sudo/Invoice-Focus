import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Link } from 'wouter'

export function TemplateMiniPreview({ family, accent }: { family: 'minimal' | 'professional' | 'enterprise'; accent: string }) {
  return (
    <div className={`relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-border/60 p-3 shadow-sm transition-shadow duration-300 group-hover:shadow-md ${family === 'enterprise' ? 'bg-[#182337]' : 'bg-white'}`}>
      {family === 'enterprise' && <div className={`absolute inset-x-0 top-0 h-2 ${accent}`} />}
      {family === 'professional' && <div className={`absolute inset-y-0 left-0 w-1 ${accent}`} />}
      {family === 'minimal' && <div className={`absolute right-5 top-5 h-12 w-12 rounded-full opacity-10 ${accent}`} />}
      <div className="mb-2 flex items-center justify-between">
        <div className={`h-2.5 w-10 rounded ${accent}`} />
        <div className={`h-2 w-8 rounded ${family === 'enterprise' ? 'bg-white/20' : 'bg-gray-100'}`} />
      </div>
      <div className="space-y-1.5">
        <div className={`h-1.5 w-3/4 rounded ${family === 'enterprise' ? 'bg-white/40' : 'bg-gray-100'}`} />
        <div className={`h-1.5 w-1/2 rounded ${family === 'enterprise' ? 'bg-white/25' : 'bg-gray-100'}`} />
      </div>
      <div className="mt-3 space-y-1">
        <div className="flex justify-between">
          <div className={`h-1.5 w-16 rounded ${family === 'enterprise' ? 'bg-white/20' : 'bg-gray-100'}`} />
          <div className={`h-1.5 w-10 rounded ${family === 'enterprise' ? 'bg-white/25' : 'bg-gray-100'}`} />
        </div>
        <div className="flex justify-between">
          <div className={`h-1.5 w-14 rounded ${family === 'enterprise' ? 'bg-white/20' : 'bg-gray-100'}`} />
          <div className={`h-1.5 w-10 rounded ${family === 'enterprise' ? 'bg-white/25' : 'bg-gray-100'}`} />
        </div>
      </div>
      <div className={`mt-3 flex justify-between border-t pt-2 ${family === 'enterprise' ? 'border-white/15' : 'border-gray-100'}`}>
        <div className={`h-2 w-8 rounded ${accent}`} />
        <div className={`h-2 w-10 rounded ${accent}`} />
      </div>
    </div>
  )
}

export const TEMPLATES = [
  {
    id: 'professional',
    family: 'professional' as const,
    documentType: 'invoice',
    title: 'Professional',
    description: 'Balanced hierarchy and polished tables for everyday client work.',
    accent: 'bg-blue-500',
  },
  {
    id: 'minimal',
    family: 'minimal' as const,
    documentType: 'invoice',
    title: 'Minimal Invoice',
    description: 'Whitespace-forward design for a modern, boutique feel.',
    accent: 'bg-slate-700',
  },
  {
    id: 'enterprise',
    family: 'enterprise' as const,
    documentType: 'invoice',
    title: 'Enterprise',
    description: 'Structured sections and high-contrast metadata for larger teams.',
    accent: 'bg-indigo-600',
  },
  {
    id: 'professional',
    family: 'professional' as const,
    documentType: 'quote',
    title: 'Professional Quote',
    description: 'Use the professional visual system with a quote document type.',
    accent: 'bg-emerald-500',
  },
  {
    id: 'minimal',
    family: 'minimal' as const,
    documentType: 'estimate',
    title: 'Minimal Estimate',
    description: 'Whitespace-forward estimate layout for projects and retainers.',
    accent: 'bg-amber-500',
  },
  {
    id: 'enterprise',
    family: 'enterprise' as const,
    documentType: 'receipt',
    title: 'Enterprise Receipt',
    description: 'A clear payment confirmation with a structured enterprise layout.',
    accent: 'bg-rose-500',
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

export function Templates() {
  return (
    <section id="templates" className="bg-muted/30">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="label-caps">Templates</span>
          <h2 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-tight text-foreground md:text-4xl">
            Start With a Professionally Designed Template
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Start with a polished invoice template for invoices, quotes, estimates, or receipts, then add your branding and send it in minutes.
          </p>
        </div>

        <motion.div
          className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
        >
          {TEMPLATES.map(({ id, family, documentType, title, description, accent }) => (
            <motion.div
              key={title}
              variants={item}
              className="group flex h-full flex-col rounded-2xl bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg gradient-border"
            >
              <Link
                href={`/invoice?template=${id}&documentType=${documentType}`}
                className="group flex h-full flex-col"
              >
                <TemplateMiniPreview family={family} accent={accent} />
                <div className="mt-5">
                  <h3 className="font-display text-lg font-semibold tracking-tight text-foreground">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
                </div>
                <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-primary">
                  Use Template
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
