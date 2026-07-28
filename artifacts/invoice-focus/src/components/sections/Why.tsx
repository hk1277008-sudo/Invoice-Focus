import { motion } from 'framer-motion'
import {
  Zap,
  Shield,
  Clock,
  Wallet,
  Smartphone,
  HeartHandshake,
} from 'lucide-react'

const BENEFITS = [
  {
    icon: Zap,
    title: 'Fast & Intuitive',
    description: 'A distraction-free interface that lets you build invoices without clicking through dozens of menus.',
  },
  {
    icon: Shield,
    title: 'Private & Secure',
    description: 'Your client data and invoices stay protected with modern security practices and encryption.',
  },
  {
    icon: Clock,
    title: 'Saves Hours Every Week',
    description: 'Reusable client details, saved line items, and automatic calculations speed up your billing workflow.',
  },
  {
    icon: Wallet,
    title: 'Get Paid Faster',
    description: 'Clear, professional invoices and easy sharing options help clients pay on time, every time.',
  },
  {
    icon: Smartphone,
    title: 'Works Everywhere',
    description: 'Create and send invoices from your laptop, tablet, or phone with a fully responsive experience.',
  },
  {
    icon: HeartHandshake,
    title: 'Designed for Service Businesses',
    description: 'Built for the way freelancers, agencies, and consultants actually work, not generic accounting tools.',
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

export function Why() {
  return (
    <section id="why" className="bg-muted/30">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="label-caps">Why InvoiceFocus</span>
          <h2 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-tight text-foreground md:text-4xl">
            The Workspace That Helps You Look Professional
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Focus on your work, not your billing. InvoiceFocus handles the details so you can get paid.
          </p>
        </div>

        <motion.div
          className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
        >
          {BENEFITS.map(({ icon: Icon, title, description }) => (
            <motion.div
              key={title}
              variants={item}
              className="group relative flex h-full flex-col rounded-2xl bg-card p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg gradient-border"
            >
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 text-primary shadow-sm transition-all duration-300 group-hover:from-primary/15 group-hover:to-primary/10 group-hover:shadow-md">
                <Icon className="h-6 w-6" />
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
