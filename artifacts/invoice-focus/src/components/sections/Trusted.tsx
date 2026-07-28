import { motion } from 'framer-motion'

const TRUST_ITEMS = [
  'For freelancers',
  'For agencies',
  'For startups',
  'For growing businesses',
]

export function Trusted() {
  return (
    <section className="border-y border-border bg-background">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <motion.div
          className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          {TRUST_ITEMS.map((text) => (
            <span
              key={text}
              className="text-sm font-medium leading-relaxed text-muted-foreground"
            >
              {text}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
