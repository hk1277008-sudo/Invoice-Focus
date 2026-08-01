import { useState } from 'react'
import { Link } from 'wouter'
import { CheckCircle2, Clock3, Mail, ArrowRight, BookOpen, ShieldCheck } from 'lucide-react'
import { MarketingLayout } from './layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const guides = [
  ['Creating Your First Invoice', 'A practical walkthrough for turning your work into a polished, accurate invoice.', '6 min read'],
  ['Sending Professional Invoices', 'Make every invoice easier to understand, review, and pay with a consistent workflow.', '5 min read'],
  ['Understanding Invoice Status', 'Learn how to use clear statuses to keep your records and client conversations organized.', '4 min read'],
  ['Managing Clients', 'Keep client details close at hand so each new invoice starts with less busywork.', '7 min read'],
  ['Invoice Best Practices', 'A concise checklist for better descriptions, dates, terms, and follow-up habits.', '8 min read'],
]

const posts = [
  ['Invoicing', 'The Calm Way to Close Out a Project', 'How a simple end-of-project invoicing ritual helps independent teams get paid with confidence.', 'Jul 18, 2026'],
  ['Small Business', 'What to Include on Every Professional Invoice', 'The details that make an invoice useful to your client and easier to reconcile later.', 'Jul 9, 2026'],
  ['Freelancing', 'A Better Weekly Money Check-In', 'A lightweight routine for staying on top of outstanding work without turning finance into a full-time job.', 'Jun 27, 2026'],
  ['Productivity', 'Less Admin, More Focused Work', 'Why thoughtful defaults and reusable templates make the business side of creative work feel lighter.', 'Jun 12, 2026'],
]

function PageShell({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: React.ReactNode }) {
  return (
    <MarketingLayout>
      <section className="mx-auto w-full max-w-7xl px-6 py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="label-caps">{eyebrow}</p>
          <h1 className="mt-4 text-balance font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">{title}</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">{description}</p>
        </div>
        <div className="mt-12">{children}</div>
      </section>
    </MarketingLayout>
  )
}

export function AboutPage() {
  return (
    <PageShell eyebrow="About InvoiceFocus" title="Invoicing That Keeps the Focus on Your Work." description="InvoiceFocus helps freelancers, independent professionals, and growing teams create clear invoices without adding another complicated system to their day.">
      <div className="grid gap-6 lg:grid-cols-3">
        {[
          ['Our Mission', 'Make the business side of meaningful work feel straightforward, professional, and calm.'],
          ['Why People Choose Us', 'InvoiceFocus brings the essential invoice workflow into one focused workspace, with thoughtful defaults that save time.'],
          ['Our Philosophy', 'Good software should make the right action obvious, keep information legible, and stay out of the way when the work matters most.'],
        ].map(([title, copy]) => (
          <Card key={title} className="h-full">
            <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
            <CardContent><p className="leading-relaxed text-muted-foreground">{copy}</p></CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-6 grid gap-6 rounded-2xl border border-border/80 bg-card p-8 shadow-sm md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <p className="label-caps">Our Values</p>
          <h2 className="mt-3 font-display text-2xl font-semibold">Clarity, Care, and Momentum.</h2>
          <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">We build for real working days: busy, collaborative, and full of details. Every part of InvoiceFocus is designed to help you communicate clearly and move work forward.</p>
        </div>
        <div className="grid w-full max-w-sm grid-cols-2 gap-2 md:max-w-xs md:justify-self-end">
          {['Clear by Default', 'Respectful Design', 'Useful Simplicity'].map((value, index) => <span key={value} className={`rounded-full bg-primary/10 px-3 py-1.5 text-center text-sm font-medium text-primary ${index === 2 ? 'col-span-2 justify-self-center' : ''}`}>{value}</span>)}
        </div>
      </div>
    </PageShell>
  )
}

export function GuidesPage() {
  return (
    <PageShell eyebrow="Guides" title="Practical Help for Better Invoicing." description="Short, useful guidance for creating polished invoices, keeping client details organized, and building a calmer billing workflow.">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {guides.map(([title, copy, meta], index) => (
          <article key={title} className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
            <BookOpen className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 className="mt-5 font-display text-xl font-semibold tracking-tight">{title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{copy}</p>
            <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary">{meta}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
          </article>
        ))}
      </div>
    </PageShell>
  )
}

const services = ['Application', 'Authentication', 'Email Delivery', 'API', 'Database']
export function StatusPage() {
  return (
    <PageShell eyebrow="System Status" title="InvoiceFocus Is Running Smoothly." description="A clear view of the services that support your invoicing workflow.">
      <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
         <div className="flex items-center justify-between border-b border-border/80 px-6 py-5"><div><h2 className="font-display text-xl font-semibold">Current Status</h2><p className="mt-1 text-sm text-muted-foreground">Last checked just now</p></div><span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700"><CheckCircle2 className="h-4 w-4" /> All Systems Operational</span></div>
        <ul className="divide-y divide-border/80">
          {services.map((service) => <li key={service} className="flex items-center justify-between gap-4 px-6 py-4"><span className="font-medium">{service}</span><span className="inline-flex items-center gap-2 text-sm text-emerald-700"><span className="h-2 w-2 rounded-full bg-emerald-500" />Operational</span></li>)}
        </ul>
      </div>
    </PageShell>
  )
}

export function BlogPage() {
  return (
    <PageShell eyebrow="The InvoiceFocus Journal" title="Ideas for Better Business Operations." description="Practical advice and thoughtful perspectives on invoicing, freelancing, small business finance, and focused work.">
      <div className="grid gap-5 md:grid-cols-2">
        {posts.map(([category, title, copy, date]) => <article key={title} className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm transition-shadow hover:shadow-lg"><div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-wider text-primary"><span>{category}</span><time>{date}</time></div><h2 className="mt-5 font-display text-2xl font-semibold tracking-tight">{title}</h2><p className="mt-3 leading-relaxed text-muted-foreground">{copy}</p><Link href="/guides" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">Read article <ArrowRight className="h-4 w-4" /></Link></article>)}
      </div>
    </PageShell>
  )
}

export function ContactPage() {
  const [submitted, setSubmitted] = useState(false)
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const subject = encodeURIComponent(`InvoiceFocus inquiry from ${data.get('name') || 'a visitor'}`)
    const body = encodeURIComponent(`Name: ${data.get('name') || ''}\nEmail: ${data.get('email') || ''}\n\n${data.get('message') || ''}`)
    window.location.href = `mailto:hello@invoicefocus.com?subject=${subject}&body=${body}`
    setSubmitted(true)
  }

  return (
   <PageShell eyebrow="Contact InvoiceFocus" title="Questions? We’re Here to Help." description="Tell us what you’re working on or what would make invoicing easier. We typically respond within 12–24 hours during business days.">
      <div className="grid gap-6 lg:grid-cols-[1fr_1.35fr]">
        <div className="space-y-4">
          <Card><CardHeader><Mail className="h-5 w-5 text-primary" aria-hidden="true" /><CardTitle className="mt-3">Business Email</CardTitle></CardHeader><CardContent><a className="font-medium text-primary hover:underline" href="mailto:hello@invoicefocus.com">hello@invoicefocus.com</a><p className="mt-2 text-sm leading-relaxed text-muted-foreground">For product questions, partnerships, and general support.</p></CardContent></Card>
          <Card><CardHeader><Clock3 className="h-5 w-5 text-primary" aria-hidden="true" /><CardTitle className="mt-3">Support Response Time</CardTitle></CardHeader><CardContent><p className="font-display text-2xl font-semibold tracking-tight text-foreground">12–24 Hours</p><p className="mt-2 text-sm leading-relaxed text-muted-foreground">We typically respond within 12–24 hours during business days.</p></CardContent></Card>
          <Card><CardHeader><ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" /><CardTitle className="mt-3">Common Questions</CardTitle></CardHeader><CardContent><p className="text-sm leading-relaxed text-muted-foreground">Looking for product guidance? Start with the <Link className="font-medium text-primary hover:underline" href="/guides">Guides</Link> or visit <Link className="font-medium text-primary hover:underline" href="/help">Help</Link>.</p></CardContent></Card>
        </div>
        <Card><CardHeader><CardTitle>Send a Message</CardTitle><p className="text-sm text-muted-foreground">We’ll get back to you at the email address you provide.</p></CardHeader><CardContent>{submitted ? <div className="rounded-xl bg-emerald-50 p-6 text-center text-sm text-emerald-800"><CheckCircle2 className="mx-auto h-6 w-6" /><p className="mt-3 font-semibold">Your email draft is ready.</p><p className="mt-1">Complete the send action in your email app, and we’ll be in touch within one business day.</p></div> : <form className="space-y-4" onSubmit={handleSubmit}><div className="grid gap-4 sm:grid-cols-2"><label className="space-y-1.5 text-sm font-medium">Name<Input required name="name" placeholder="Your name" /></label><label className="space-y-1.5 text-sm font-medium">Email<Input required type="email" name="email" placeholder="you@company.com" /></label></div><label className="block space-y-1.5 text-sm font-medium">Message<Textarea required name="message" rows={6} placeholder="How can we help?" /></label><Button type="submit">Send Message <ArrowRight className="ml-2 h-4 w-4" /></Button></form>}</CardContent></Card>
      </div>
    </PageShell>
  )
}