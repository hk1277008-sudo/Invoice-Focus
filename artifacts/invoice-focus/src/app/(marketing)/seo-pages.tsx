import type { ReactNode } from 'react'
import { ArrowRight, Check, ChevronDown, FileCheck2, FileText, Layers3, ShieldCheck, Sparkles, Wand2 } from 'lucide-react'
import { Link } from 'wouter'
import { MarketingLayout } from './layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TemplateMiniPreview, TEMPLATES } from '@/components/sections/Templates'
import { BLOG_ARTICLES, type BlogArticle } from './blog-content'

export type DocumentType = 'invoice' | 'quote' | 'estimate' | 'receipt' | 'credit-note' | 'purchase-order'
export type TemplateFamily = 'minimal' | 'professional' | 'enterprise'

type SupportedDocumentInput = DocumentType | string
type IndustryKey = 'freelancers' | 'consultants' | 'agencies' | 'designers' | 'developers' | 'photographers' | 'contractors' | 'small-businesses'

const documentDetails: Record<DocumentType, {
  label: string
  description: string
  use: string
  intro: string
  details: string[]
}> = {
  invoice: {
    label: 'Invoice',
    description: 'A clear request for payment with the essentials your client needs to review and process it.',
    use: 'bill for completed work, products, or an agreed milestone',
    intro: 'Create an invoice that makes the work, amount due, and next step easy to understand.',
    details: ['Business and client details', 'Line items, quantities, and rates', 'Totals and payment terms'],
  },
  quote: {
    label: 'Quote',
    description: 'A concise proposal for the work and pricing you are prepared to provide.',
    use: 'share pricing before work begins',
    intro: 'Set expectations early with a quote that keeps scope and pricing in one readable document.',
    details: ['Scope and line items', 'Rates and projected totals', 'Client-ready presentation'],
  },
  estimate: {
    label: 'Estimate',
    description: 'A practical projection of expected work and cost for a project or engagement.',
    use: 'outline expected project costs before the final invoice',
    intro: 'Give clients a useful view of expected costs while the details of a project are still taking shape.',
    details: ['Projected line items', 'Descriptive notes', 'A clear estimated total'],
  },
  receipt: {
    label: 'Receipt',
    description: 'A straightforward record of payment for your client and your own records.',
    use: 'confirm that a payment has been received',
    intro: 'Record a payment with a receipt that is easy to file, reference, and share.',
    details: ['Payment and client details', 'Items or service summary', 'Paid amount and confirmation'],
  },
  'credit-note': {
    label: 'Credit Note',
    description: 'A clear adjustment document for reducing or correcting a previously billed amount.',
    use: 'document a credit or billing adjustment',
    intro: 'Explain a billing adjustment with a credit note that keeps the original context visible.',
    details: ['Reference details', 'Credited items or amount', 'Reason for the adjustment'],
  },
  'purchase-order': {
    label: 'Purchase Order',
    description: 'A structured request that records what you intend to buy and from whom.',
    use: 'send a defined order request to a supplier',
    intro: 'Make supplier requests easier to review with a purchase order built around the details that matter.',
    details: ['Supplier and delivery details', 'Requested items and quantities', 'Order totals and notes'],
  },
}

const industryDetails: Record<IndustryKey, {
  label: string
  title: string
  description: string
  copy: string
  documents: DocumentType[]
  workflow: string[]
}> = {
  freelancers: {
    label: 'Freelancers',
    title: 'Invoicing that leaves more room for the work.',
    description: 'Create polished client documents without turning your solo workflow into an admin project.',
    copy: 'When you move between projects, your invoicing should be easy to pick up and finish. InvoiceFocus gives independent professionals a focused place to create the document they need, add clear line items, and keep client-facing details consistent.',
    documents: ['invoice', 'quote', 'receipt'],
    workflow: ['Choose the document type for the moment', 'Add your work, rates, and client details', 'Review the finished document before sending'],
  },
  consultants: {
    label: 'Consultants',
    title: 'Clear documents for considered advice.',
    description: 'Keep project scope, recommendations, and billing details easy for clients to follow.',
    copy: 'Consulting work often begins with a considered quote or estimate and ends with an invoice. A consistent document workflow helps you communicate each stage without adding another heavy system to your day.',
    documents: ['quote', 'estimate', 'invoice'],
    workflow: ['Start with a quote or estimate', 'Describe the engagement in useful line items', 'Turn completed work into a clear invoice'],
  },
  agencies: {
    label: 'Agencies',
    title: 'A more consistent client document workflow.',
    description: 'Give every engagement a clear paper trail across proposals, project billing, and adjustments.',
    copy: 'Agencies balance multiple clients, contributors, and project stages. Reusable document patterns help your team present the right information at each handoff while keeping the client experience composed.',
    documents: ['quote', 'invoice', 'credit-note'],
    workflow: ['Set a clear commercial starting point', 'Keep project billing legible', 'Document changes when the scope or amount shifts'],
  },
  designers: {
    label: 'Designers',
    title: 'Invoices that give creative work a clear finish.',
    description: 'Present design engagements, milestones, and final balances in documents that are easy for clients to review.',
    copy: 'Design projects often move through proposals, rounds of work, and handoff. A focused document workflow helps you describe the work clearly without letting administration compete with the creative process.',
    documents: ['quote', 'estimate', 'invoice'],
    workflow: ['Set the scope and expected investment', 'Describe deliverables or milestones', 'Invoice the completed work with useful context'],
  },
  developers: {
    label: 'Developers',
    title: 'Straightforward billing for technical work.',
    description: 'Keep retainers, milestones, and implementation work organized in clear client documents.',
    copy: 'Development work can include a fixed project, a monthly retainer, or a series of milestones. Use the document that matches the engagement and keep the line items precise enough to make the work understandable.',
    documents: ['quote', 'invoice', 'receipt'],
    workflow: ['Choose a document for the engagement stage', 'Separate work, milestones, or retainers into useful items', 'Review totals and terms before sharing'],
  },
  photographers: {
    label: 'Photographers',
    title: 'A polished document workflow for every shoot.',
    description: 'Explain services, packages, deposits, and final balances with client-ready documents.',
    copy: 'Photography work may involve a planned package, a project estimate, and a final balance. Keep the commercial details close to the creative brief so clients know what is included and what happens next.',
    documents: ['quote', 'estimate', 'invoice'],
    workflow: ['Outline the session or package', 'Add services, usage, and other agreed items', 'Send a clear invoice or receipt at the right stage'],
  },
  'small-businesses': {
    label: 'Small businesses',
    title: 'Professional documents for everyday operations.',
    description: 'Handle the documents around buying, selling, and getting paid with less friction.',
    copy: 'Small businesses need tools that are useful on an ordinary Tuesday. InvoiceFocus keeps common document types close at hand, so an order request, customer invoice, or payment receipt can each have a clear starting point.',
    documents: ['purchase-order', 'invoice', 'receipt'],
    workflow: ['Pick the document that matches the transaction', 'Fill in the details your customer or supplier needs', 'Keep the final document clear and ready to share'],
  },
  contractors: {
    label: 'Contractors',
    title: 'Make project billing easier to explain.',
    description: 'Turn milestones, materials, and adjustments into documents clients can review with confidence.',
    copy: 'For project-based work, context matters. A useful estimate sets the expectation, an invoice records the work, and a credit note can explain an adjustment. Build each document with the same attention to detail as the project itself.',
    documents: ['estimate', 'invoice', 'credit-note'],
    workflow: ['Outline the expected project cost', 'Record completed work and materials', 'Explain any adjustment with the right document'],
  },
}

const faqs = {
  generator: [
    ['What can I create with the generator?', 'InvoiceFocus supports invoices, quotes, estimates, receipts, credit notes, and purchase orders. Choose the document type that matches the transaction you are recording.'],
    ['Can I start from a visual template?', 'Yes. The generator accepts a template family, including minimal, professional, and enterprise, so you can begin with a visual direction that fits the document.'],
    ['What should I prepare before I start?', 'Have your business details, client or supplier information, line items, rates, and any relevant terms nearby. The right details depend on the document type.'],
  ],
  template: [
    ['Which template family should I choose?', 'Minimal keeps attention on the essentials, professional balances hierarchy and detail, and enterprise uses structured sections with higher contrast.'],
    ['Can the same family be used for different documents?', 'Yes. A visual family can be paired with the document type you need, from an invoice to a purchase order.'],
    ['Can I preview a template before using it?', 'Each template page includes a compact visual preview and a direct link to open the generator with that document type and family selected.'],
  ],
  industry: [
    ['Is InvoiceFocus only for one kind of business?', 'No. The document workflow is useful anywhere clear invoices, quotes, estimates, receipts, credit notes, or purchase orders are part of the work.'],
    ['How do I choose the right document?', 'Start with the business moment: quote or estimate before work, invoice for an amount due, receipt after payment, credit note for an adjustment, and purchase order for a supplier request.'],
  ],
  features: [
    ['Does InvoiceFocus replace accounting advice?', 'No. It is a document creation tool, not accounting, tax, or legal advice. Use your own professional guidance for obligations specific to your business.'],
    ['Can I choose how a document looks?', 'Yes. The available template families give you a starting visual direction while you prepare the document.'],
  ],
}

function normalizeDocumentType(value?: SupportedDocumentInput): DocumentType {
  return value && value in documentDetails ? value as DocumentType : 'invoice'
}

function normalizeIndustry(value?: string): IndustryKey {
  return value && value in industryDetails ? value as IndustryKey : 'small-businesses'
}

function generatorHref(documentType: DocumentType, family: TemplateFamily = 'professional') {
  return `/invoice?documentType=${documentType}&template=${family}`
}

function templateLandingHref(documentType: DocumentType) {
  return `/${documentType === 'invoice' ? 'invoice' : documentType}-template`
}

function FaqSection({ items }: { items: string[][] }) {
  return (
    <section className="mt-16 border-t border-border/70 pt-12" aria-labelledby="faq-heading">
      <div className="max-w-2xl">
        <p className="label-caps">Questions, answered</p>
        <h2 id="faq-heading" className="mt-3 font-display text-2xl font-semibold tracking-tight sm:text-3xl">A few useful details before you begin.</h2>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {items.map(([question, answer]) => (
          <details key={question} className="group rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display font-semibold [&::-webkit-details-marker]:hidden">
              {question}
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <p className="mt-3 pr-5 text-sm leading-relaxed text-muted-foreground">{answer}</p>
          </details>
        ))}
      </div>
    </section>
  )
}

function SeoShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <MarketingLayout>
      <section className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-20 lg:py-24">
        <div className="max-w-3xl">
          <p className="label-caps">{eyebrow}</p>
          <h1 className="mt-4 text-balance font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">{title}</h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">{description}</p>
        </div>
        <div className="mt-12">{children}</div>
      </section>
    </MarketingLayout>
  )
}

function DocumentLinkList({ types }: { types: DocumentType[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {types.map((type) => (
        <Link key={type} href={`/invoice?documentType=${type}&template=professional`} className="rounded-full border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary">
          {documentDetails[type].label}
        </Link>
      ))}
    </div>
  )
}

export function TemplatesHubPage() {
  return (
    <SeoShell
      eyebrow="Invoice templates"
      title="A clear starting point for every document."
      description="Browse InvoiceFocus templates for invoices, quotes, estimates, receipts, credit notes, and purchase orders. Choose a visual family, then open the generator with the right document type selected."
    >
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {TEMPLATES.map(({ id, family, documentType, title, description, accent }) => (
          <Card key={`${documentType}-${title}`} className="group overflow-hidden border-border/70 shadow-sm transition-transform duration-200 hover:-translate-y-1">
            <Link href={generatorHref(documentType as DocumentType, family)} className="block">
              <CardContent className="p-4">
                <TemplateMiniPreview family={family} accent={accent} />
                <h2 className="mt-5 font-display text-xl font-semibold tracking-tight">{title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">Use this template <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>
      <div className="mt-10 rounded-2xl border border-border/70 bg-muted/30 p-6 sm:p-8">
        <p className="label-caps">Browse by document</p>
        <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight">Start with the job to be done.</h2>
        <p className="mt-2 max-w-2xl leading-relaxed text-muted-foreground">The same visual direction can support different business documents. Choose the document first if that is how you think about your workflow.</p>
        <div className="mt-5"><DocumentLinkList types={Object.keys(documentDetails) as DocumentType[]} /></div>
      </div>
    </SeoShell>
  )
}

export function DocumentGeneratorPage({ documentType = 'invoice' }: { documentType?: SupportedDocumentInput }) {
  const type = normalizeDocumentType(documentType)
  const detail = documentDetails[type]
  return (
    <SeoShell eyebrow={`${detail.label} generator`} title={`${detail.label} generator for clear, professional documents.`} description={`${detail.intro} Start with a focused ${detail.label.toLowerCase()} workflow and a visual family that fits your business.`}>
      <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr] lg:items-stretch">
        <Card className="overflow-hidden border-border/70 shadow-sm">
          <CardHeader className="border-b border-border/70 bg-muted/20">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><FileText className="h-5 w-5" aria-hidden="true" /></span>
              <div><CardTitle>Create a {detail.label.toLowerCase()}</CardTitle><p className="mt-1 text-sm text-muted-foreground">A practical place to start.</p></div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <ul className="space-y-4">
              {detail.details.map((item) => <li key={item} className="flex gap-3 text-sm leading-relaxed text-muted-foreground"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" /><span>{item}</span></li>)}
            </ul>
            <Button asChild size="lg" className="mt-8 w-full sm:w-auto"><Link href={generatorHref(type)}>Open the {detail.label.toLowerCase()} generator <ArrowRight className="h-4 w-4" /></Link></Button>
          </CardContent>
        </Card>
        <div className="rounded-2xl border border-border/70 bg-[linear-gradient(145deg,hsl(var(--primary)/.10),hsl(var(--muted)/.35))] p-6 sm:p-8">
          <p className="label-caps">A simple rhythm</p>
          <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight">Details first. Polish second.</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">Use the generator to assemble the information your client, customer, or supplier needs. Then choose the presentation that feels right for the moment.</p>
          <div className="mt-8 space-y-5">
            {['Choose the document type', 'Add the details and line items', 'Review the finished document'].map((step, index) => <div key={step} className="flex gap-4"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-background text-sm font-semibold text-primary shadow-sm">{index + 1}</span><p className="pt-1 text-sm font-medium">{step}</p></div>)}
          </div>
        </div>
      </div>
      <div className="mt-10">
        <h2 className="font-display text-2xl font-semibold tracking-tight">Explore related document types.</h2>
        <p className="mt-2 text-muted-foreground">Move from the business moment to the document that explains it best.</p>
        <div className="mt-4"><DocumentLinkList types={Object.keys(documentDetails).filter((item) => item !== type) as DocumentType[]} /></div>
      </div>
      <div className="mt-10 rounded-2xl border border-border/70 bg-muted/25 p-6 sm:p-8">
        <p className="label-caps">Choose your presentation</p>
        <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight">Browse {detail.label.toLowerCase()} templates before you begin.</h2>
        <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">Compare the available visual families, then open the generator with the document type and presentation you want already selected.</p>
        <Button asChild variant="outline" className="mt-6"><Link href={templateLandingHref(type)}>Explore {detail.label.toLowerCase()} templates <ArrowRight className="h-4 w-4" /></Link></Button>
      </div>
      <FaqSection items={faqs.generator} />
    </SeoShell>
  )
}

export function DocumentTemplatePage({ documentType = 'invoice', family = 'professional' }: { documentType?: SupportedDocumentInput; family?: TemplateFamily }) {
  const type = normalizeDocumentType(documentType)
  const selectedFamily = family in { minimal: true, professional: true, enterprise: true } ? family : 'professional'
  const detail = documentDetails[type]
  const familyLabel = selectedFamily.charAt(0).toUpperCase() + selectedFamily.slice(1)
  const familyDescriptions: Record<TemplateFamily, string> = {
    minimal: 'Whitespace-forward and quiet, so the document stays focused on its essential information.',
    professional: 'Balanced hierarchy for everyday client work, with room for detail without visual noise.',
    enterprise: 'Structured sections and higher contrast for documents with more metadata or review steps.',
  }
  return (
    <SeoShell eyebrow={`${familyLabel} ${detail.label.toLowerCase()} template`} title={`${familyLabel} ${detail.label} template.`} description={`${familyDescriptions[selectedFamily]} Use this ${selectedFamily} visual family as a starting point for a ${detail.label.toLowerCase()} in InvoiceFocus.`}>
      <div className="grid gap-8 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
        <div className="rounded-2xl border border-border/70 bg-muted/20 p-5 sm:p-7">
          <TemplateMiniPreview family={selectedFamily} accent={selectedFamily === 'minimal' ? 'bg-slate-700' : selectedFamily === 'professional' ? 'bg-blue-500' : 'bg-indigo-600'} />
          <p className="mt-4 text-sm text-muted-foreground">Visual preview: {familyLabel} family</p>
        </div>
        <div>
          <p className="label-caps">Designed for readability</p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight">A {detail.label.toLowerCase()} with a steady visual rhythm.</h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">{detail.description} The {selectedFamily} family gives you a considered starting point without making the document harder to scan.</p>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground"><span className="font-semibold text-foreground">A useful fit for:</span> {type === 'invoice' ? 'freelancers, agencies, consultants, and businesses sending payment requests.' : type === 'purchase-order' ? 'businesses preparing clear supplier requests and order records.' : type === 'receipt' ? 'businesses confirming payments for clients and customers.' : type === 'credit-note' ? 'teams documenting billing adjustments with a visible reference.' : 'professionals presenting a clear scope or expected cost before work begins.'}</p>
          <Button asChild size="lg" className="mt-7"><Link href={generatorHref(type, selectedFamily)}>Use this {detail.label.toLowerCase()} template <ArrowRight className="h-4 w-4" /></Link></Button>
        </div>
      </div>
      <div className="mt-12">
        <p className="label-caps">Compare the visual families</p>
        <div className="mt-5 grid gap-5 md:grid-cols-3">
          {(['minimal', 'professional', 'enterprise'] as TemplateFamily[]).map((familyName) => (
            <Link key={familyName} href={generatorHref(type, familyName)} className={`group rounded-2xl border bg-card p-4 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md ${familyName === selectedFamily ? 'border-primary ring-1 ring-primary/20' : 'border-border/70'}`}>
              <TemplateMiniPreview family={familyName} accent={familyName === 'minimal' ? 'bg-slate-700' : familyName === 'professional' ? 'bg-blue-500' : 'bg-indigo-600'} />
              <h3 className="mt-4 font-display text-lg font-semibold capitalize">{familyName}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{familyDescriptions[familyName]}</p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">Use {familyName} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
            </Link>
          ))}
        </div>
      </div>
      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {[
          ['Clear hierarchy', 'Keep names, dates, items, and totals in an order that is easy to follow.'],
          ['Useful restraint', 'Choose a visual family that supports the information instead of competing with it.'],
          ['Ready to adapt', 'Begin with a document type and adjust the details to match the work.'],
        ].map(([title, copy]) => <Card key={title}><CardHeader><CardTitle>{title}</CardTitle></CardHeader><CardContent><p className="text-sm leading-relaxed text-muted-foreground">{copy}</p></CardContent></Card>)}
      </div>
      <FaqSection items={faqs.template} />
    </SeoShell>
  )
}

export function IndustryPage({ industry = 'small-businesses' }: { industry?: string }) {
  const key = normalizeIndustry(industry)
  const detail = industryDetails[key]
  return (
    <SeoShell eyebrow={`InvoiceFocus for ${detail.label.toLowerCase()}`} title={detail.title} description={detail.description}>
      <div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
        <Card className="border-border/70 shadow-sm">
          <CardContent className="p-6 sm:p-8">
            <p className="text-lg leading-relaxed text-foreground">{detail.copy}</p>
            <div className="mt-8"><p className="label-caps">Useful document types</p><div className="mt-4"><DocumentLinkList types={detail.documents} /></div></div>
          </CardContent>
        </Card>
        <div className="rounded-2xl border border-border/70 bg-muted/25 p-6 sm:p-8">
          <p className="label-caps">A focused workflow</p>
          <div className="mt-5 space-y-5">
            {detail.workflow.map((step, index) => <div key={step} className="flex gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{index + 1}</span><p className="pt-1 text-sm leading-relaxed">{step}</p></div>)}
          </div>
          <Button asChild variant="outline" className="mt-8"><Link href="/invoice?documentType=invoice&template=professional">Create an invoice <ArrowRight className="h-4 w-4" /></Link></Button>
        </div>
      </div>
      <div className="mt-12 grid gap-4 sm:grid-cols-3">
        {[
          [Sparkles, 'A polished first draft', 'Start with a document that already has a considered structure.'],
          [Layers3, 'The right level of detail', 'Add the context your customer, client, or supplier actually needs.'],
          [ShieldCheck, 'A calmer handoff', 'Review the final document before it leaves your workspace.'],
        ].map(([Icon, title, copy]) => {
          const IconComponent = Icon as typeof Sparkles
          return <Card key={title as string}><CardContent className="p-6"><IconComponent className="h-5 w-5 text-primary" aria-hidden="true" /><h2 className="mt-4 font-display font-semibold">{title as string}</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{copy as string}</p></CardContent></Card>
        })}
      </div>
      <FaqSection items={faqs.industry} />
    </SeoShell>
  )
}

export function HowItWorksPage() {
  return (
    <SeoShell eyebrow="How InvoiceFocus works" title="A focused path from details to document." description="InvoiceFocus keeps document creation understandable: choose what you are making, add the details, select a visual direction, and review the result.">
      <div className="grid gap-5 lg:grid-cols-4">
        {[
          [FileCheck2, 'Choose a document', 'Start with an invoice, quote, estimate, receipt, credit note, or purchase order.'],
          [FileText, 'Add the essentials', 'Bring together the names, dates, line items, rates, totals, and terms relevant to the document.'],
          [Wand2, 'Pick a visual family', 'Use minimal, professional, or enterprise as the starting point for presentation.'],
          [Check, 'Review before sharing', 'Give the final document a careful read so the next step is clear to the recipient.'],
        ].map(([Icon, title, copy], index) => {
          const IconComponent = Icon as typeof FileCheck2
          return <Card key={title as string} className="relative border-border/70"><CardContent className="p-6"><span className="text-sm font-semibold text-primary">0{index + 1}</span><IconComponent className="mt-7 h-5 w-5 text-primary" aria-hidden="true" /><h2 className="mt-4 font-display text-lg font-semibold">{title as string}</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{copy as string}</p></CardContent></Card>
        })}
      </div>
      <div className="mt-10 flex flex-col justify-between gap-6 rounded-2xl border border-border/70 bg-primary p-6 text-primary-foreground sm:flex-row sm:items-center sm:p-8">
        <div><p className="label-caps text-primary-foreground/70">Begin with the common case</p><h2 className="mt-2 font-display text-2xl font-semibold">Create a professional invoice.</h2></div>
        <Button asChild variant="secondary"><Link href="/invoice?documentType=invoice&template=professional">Open the generator <ArrowRight className="h-4 w-4" /></Link></Button>
      </div>
      <FaqSection items={faqs.generator} />
    </SeoShell>
  )
}

export function FeaturesPage() {
  return (
    <SeoShell eyebrow="InvoiceFocus features" title="The essentials for better business documents." description="A focused document workflow for creating invoices and related business documents with clear structure and a professional presentation.">
      <div className="grid gap-6 md:grid-cols-2">
        {[
          [FileText, 'Six useful document types', 'Create invoices, quotes, estimates, receipts, credit notes, and purchase orders from one familiar starting point.'],
          [Layers3, 'Three visual families', 'Choose a minimal, professional, or enterprise direction based on the tone and amount of detail your document needs.'],
          [Wand2, 'A practical generator', 'Keep the process close to the information: document type first, then the details and presentation.'],
          [ShieldCheck, 'Reviewable by design', 'Clear hierarchy and measured spacing make it easier to check the document before sharing it.'],
        ].map(([Icon, title, copy]) => {
          const IconComponent = Icon as typeof FileText
          return <Card key={title as string} className="border-border/70"><CardContent className="flex gap-4 p-6 sm:p-7"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><IconComponent className="h-5 w-5" aria-hidden="true" /></span><div><h2 className="font-display text-lg font-semibold">{title as string}</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{copy as string}</p></div></CardContent></Card>
        })}
      </div>
      <div className="mt-10 rounded-2xl border border-border/70 bg-muted/25 p-6 sm:p-8">
        <p className="label-caps">Explore the workflow</p>
        <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight">Useful tools, without a crowded control panel.</h2>
        <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">See how these pieces fit together in the <Link href="/how-it-works" className="font-semibold text-primary hover:underline">step-by-step workflow</Link>, or go directly to <Link href="/templates" className="font-semibold text-primary hover:underline">templates</Link> to choose a starting point.</p>
      </div>
      <FaqSection items={faqs.features} />
    </SeoShell>
  )
}

export function CookiesPage() {
  return (
    <SeoShell eyebrow="Legal notice" title="Cookie notice." description="This page explains, in plain language, how cookies and similar browser technologies may relate to your use of InvoiceFocus.">
      <div className="max-w-3xl space-y-8 text-sm leading-7 text-muted-foreground">
        <section>
          <h2 className="font-display text-xl font-semibold text-foreground">What cookies are</h2>
          <p className="mt-3">Cookies are small pieces of information stored by a website in your browser. Similar technologies can perform related functions. They may help a service remember a session, protect an account, or understand how a page is being used.</p>
        </section>
        <section>
          <h2 className="font-display text-xl font-semibold text-foreground">How this notice applies</h2>
          <p className="mt-3">InvoiceFocus may use cookies or similar technologies that are necessary for the service to work, including account access and security. If optional technologies are used, they should be described at the point of collection or in an updated notice.</p>
        </section>
        <section>
          <h2 className="font-display text-xl font-semibold text-foreground">Your browser choices</h2>
          <p className="mt-3">Most browsers let you review, block, or delete cookies through their settings. Blocking necessary cookies can affect sign-in or other parts of the service. Browser controls vary, so consult the documentation for the browser you use.</p>
        </section>
        <section>
          <h2 className="font-display text-xl font-semibold text-foreground">Questions</h2>
          <p className="mt-3">For questions about this notice or information handled by InvoiceFocus, visit the <Link href="/privacy" className="font-medium text-primary hover:underline">Privacy Policy</Link> or <Link href="/contact" className="font-medium text-primary hover:underline">contact us</Link>.</p>
        </section>
      </div>
    </SeoShell>
  )
}

function BlogCard({ article }: { article: BlogArticle }) {
  return (
    <article className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-wider text-primary">
        <span>{article.category}</span>
        <time dateTime={article.date}>{new Date(`${article.date}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</time>
      </div>
      <h2 className="mt-5 font-display text-2xl font-semibold tracking-tight">{article.title}</h2>
      <p className="mt-3 leading-relaxed text-muted-foreground">{article.excerpt}</p>
      <div className="mt-6 flex items-center justify-between gap-4">
        <span className="text-sm text-muted-foreground">{article.readTime}</span>
        <Link href={`/blog/${article.slug}`} className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
          Read article <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  )
}

export function BlogIndexPage() {
  return (
    <SeoShell
      eyebrow="The InvoiceFocus Journal"
      title="Practical ideas for better business operations."
      description="Useful guidance on invoicing, freelancing, small business documents, and the focused routines that support good work."
    >
      <div className="grid gap-5 md:grid-cols-2">
        {BLOG_ARTICLES.map((article) => <BlogCard key={article.slug} article={article} />)}
      </div>
      <div className="mt-10 rounded-2xl border border-border/70 bg-muted/25 p-6 sm:p-8">
        <p className="label-caps">Start with a practical workflow</p>
        <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight">Turn the next step into a clear document.</h2>
        <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">
          When you are ready to put the ideas into practice, browse the <Link href="/templates" className="font-semibold text-primary hover:underline">template directory</Link> or open the <Link href="/invoice-generator" className="font-semibold text-primary hover:underline">invoice generator guide</Link>.
        </p>
      </div>
    </SeoShell>
  )
}

export function BlogArticlePage({ slug }: { slug?: string }) {
  const article = BLOG_ARTICLES.find((item) => item.slug === slug) ?? BLOG_ARTICLES[0]
  const related = article.relatedSlugs
    .map((relatedSlug) => BLOG_ARTICLES.find((item) => item.slug === relatedSlug))
    .filter((item): item is BlogArticle => Boolean(item))

  return (
    <SeoShell eyebrow={`${article.category} · ${article.readTime}`} title={article.title} description={article.excerpt}>
      <article className="mx-auto max-w-3xl">
        <p className="text-lg leading-relaxed text-foreground">{article.intro}</p>
        <div className="mt-10 space-y-10">
          {article.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="font-display text-2xl font-semibold tracking-tight">{section.heading}</h2>
              <div className="mt-4 space-y-4 text-base leading-8 text-muted-foreground">
                {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </div>
            </section>
          ))}
        </div>
        <div className="mt-12 rounded-2xl border border-border/70 bg-primary p-6 text-primary-foreground sm:p-8">
          <p className="label-caps text-primary-foreground/70">Put it into practice</p>
          <h2 className="mt-2 font-display text-2xl font-semibold">Create a document with a clear starting point.</h2>
          <p className="mt-3 max-w-xl text-primary-foreground/80">Choose the document that matches your business moment, then review the result before sharing it.</p>
          <Button asChild variant="secondary" className="mt-6"><Link href="/templates">Browse templates <ArrowRight className="h-4 w-4" /></Link></Button>
        </div>
        {related.length > 0 && (
          <section className="mt-12 border-t border-border/70 pt-10" aria-labelledby="related-articles">
            <h2 id="related-articles" className="font-display text-2xl font-semibold tracking-tight">Related articles</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {related.map((item) => (
                <Link key={item.slug} href={`/blog/${item.slug}`} className="rounded-2xl border border-border/70 bg-card p-5 transition-shadow hover:shadow-md">
                  <span className="text-xs font-semibold uppercase tracking-wider text-primary">{item.category}</span>
                  <h3 className="mt-3 font-display text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.excerpt}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </SeoShell>
  )
}