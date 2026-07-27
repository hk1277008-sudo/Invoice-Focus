import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { FileText, SlidersHorizontal, Send, Wallet } from 'lucide-react'

const STEPS = [
  {
    icon: FileText,
    step: '01',
    title: 'Create Invoice',
    description:
      'Add your business details, client information, and line items. InvoiceFocus calculates totals, taxes, and discounts automatically.',
  },
  {
    icon: SlidersHorizontal,
    step: '02',
    title: 'Customize',
    description:
      'Apply your logo, choose a template, and adjust colors and currency to match your brand and your client.',
  },
  {
    icon: Send,
    step: '03',
    title: 'Send',
    description:
      'Email the invoice directly, share a secure link, or download a polished PDF ready for delivery.',
  },
  {
    icon: Wallet,
    step: '04',
    title: 'Get Paid',
    description:
      'Track payment status, send reminders, and keep a clear record of every transaction in one place.',
  },
]

function StepCard({
  step,
  icon: Icon,
  title,
  description,
  index,
}: {
  step: string
  icon: React.ElementType
  title: string
  description: string
  index: number
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.5, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] }}
      className="group relative flex flex-col items-center text-center"
    >
      <div className="relative mb-5">
        <div className="relative z-10 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 text-primary shadow-sm transition-all duration-300 group-hover:from-primary/15 group-hover:to-primary/10 group-hover:shadow-md">
          <Icon className="h-7 w-7" />
        </div>
      </div>
      <span className="text-xs font-semibold uppercase tracking-wider text-primary">
        Step {step}
      </span>
      <h3 className="mt-2 font-display text-xl font-semibold tracking-tight text-foreground">
        {title}
      </h3>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </motion.div>
  )
}

export function HowItWorks() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="how-it-works" className="bg-background">
      <div className="mx-auto max-w-7xl px-6 py-24 lg:py-32">
        <motion.div
          ref={ref}
          className="mx-auto max-w-2xl text-center"
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="label-caps">How It Works</span>
          <h2 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-tight text-foreground md:text-4xl">
            From draft to delivery in four steps
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            No complicated setup. Create, customize, and send in moments.
          </p>
        </motion.div>

        <div className="relative mt-16">
          {/* Connecting line - desktop */}
          <div
            className="absolute left-0 right-0 top-8 hidden h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent lg:block"
            aria-hidden="true"
          />

          {/* Connecting line - mobile */}
          <div
            className="absolute left-8 top-0 bottom-0 hidden h-full w-px bg-gradient-to-b from-transparent via-primary/20 to-transparent md:block lg:hidden"
            aria-hidden="true"
          />

          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(({ icon, step, title, description }, index) => (
              <StepCard
                key={title}
                step={step}
                icon={icon}
                title={title}
                description={description}
                index={index}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
