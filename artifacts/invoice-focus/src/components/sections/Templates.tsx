import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

function TemplateMiniPreview({ accent }: { accent: string }) {
  return (
    <div className="aspect-[4/3] w-full overflow-hidden rounded-xl border border-border/60 bg-white p-3 shadow-sm transition-shadow duration-300 group-hover:shadow-md">
      <div className="mb-2 flex items-center justify-between">
        <div className={`h-2.5 w-10 rounded ${accent}`} />
        <div className="h-2 w-8 rounded bg-gray-100" />
      </div>
      <div className="space-y-1.5">
        <div className="h-1.5 w-3/4 rounded bg-gray-100" />
        <div className="h-1.5 w-1/2 rounded bg-gray-100" />
      </div>
      <div className="mt-3 space-y-1">
        <div className="flex justify-between">
          <div className="h-1.5 w-16 rounded bg-gray-100" />
          <div className="h-1.5 w-10 rounded bg-gray-100" />
        </div>
        <div className="flex justify-between">
          <div className="h-1.5 w-14 rounded bg-gray-100" />
          <div className="h-1.5 w-10 rounded bg-gray-100" />
        </div>
      </div>
      <div className="mt-3 flex justify-between border-t border-gray-100 pt-2">
        <div className={`h-2 w-8 rounded ${accent}`} />
        <div className={`h-2 w-10 rounded ${accent}`} />
      </div>
    </div>
  )
}

const TEMPLATES = [
  {
    id: 'modern',
    title: 'Classic Invoice',
    description: 'Clean, timeless layout with detailed line items and totals.',
    accent: 'bg-blue-500',
  },
  {
    id: 'minimal',
    title: 'Minimal Invoice',
    description: 'Whitespace-forward design for a modern, boutique feel.',
    accent: 'bg-slate-700',
  },
  {
    id: 'corporate',
    title: 'Bold Invoice',
    description: 'Strong typography and high-contrast sections for impact.',
    accent: 'bg-indigo-600',
  },
  {
    id: 'executive',
    title: 'Professional Quote',
    description: 'Convert-ready quote format with approval summary.',
    accent: 'bg-emerald-500',
  },
  {
    id: 'elegant',
    title: 'Project Estimate',
    description: 'Phase-based estimate ideal for agencies and retainers.',
    accent: 'bg-amber-500',
  },
  {
    id: 'creative',
    title: 'Freelancer Invoice',
    description: 'Compact format perfect for solo professionals and consultants.',
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
            Choose a layout, add your branding, and send your first invoice in minutes.
          </p>
        </div>

        <motion.div
          className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
        >
          {TEMPLATES.map(({ id, title, description, accent }) => (
            <motion.a
              key={title}
              href={`/invoice?template=${id}`}
              variants={item}
              className="group flex h-full flex-col rounded-2xl bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg gradient-border"
            >
              <TemplateMiniPreview accent={accent} />
              <div className="mt-5">
                <h3 className="font-display text-lg font-semibold tracking-tight text-foreground">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
              </div>
              <span className="mt-auto pt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                Use Template
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </motion.a>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
