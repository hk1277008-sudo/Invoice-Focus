import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Link } from 'wouter'
import { Button } from '@/components/ui/button'
import { InvoicePreview } from '@/components/invoice/InvoicePreview'
import { calculateInvoiceTotals } from '@/components/invoice/utils'
import { getCurrencyByCode } from '@/components/invoice/currencies'
import { normalizePresentation, type InvoiceTemplate } from '@/components/invoice/presentation'
import type { InvoiceData } from '@/components/invoice/types'
import type { InvoiceDocumentType } from '@/components/invoice/document-types'

const TEMPLATE_PREVIEWS: Array<{
  id: string
  label: string
  template: InvoiceTemplate
  documentType: InvoiceDocumentType
  description: string
}> = [
  {
    id: 'professional-invoice',
    label: 'Professional Invoice',
    template: 'professional',
    documentType: 'invoice',
    description: 'Balanced hierarchy with polished tables and clear totals.',
  },
  {
    id: 'minimal-invoice',
    label: 'Minimal Invoice',
    template: 'minimal',
    documentType: 'invoice',
    description: 'Quiet whitespace and editorial precision for a clean finish.',
  },
  {
    id: 'enterprise-invoice',
    label: 'Enterprise Invoice',
    template: 'enterprise',
    documentType: 'invoice',
    description: 'Structured sections and detailed metadata for larger teams.',
  },
  {
    id: 'professional-quote',
    label: 'Professional Quote',
    template: 'professional',
    documentType: 'quote',
    description: 'A confident proposal layout for presenting project pricing.',
  },
  {
    id: 'minimal-estimate',
    label: 'Minimal Estimate',
    template: 'minimal',
    documentType: 'estimate',
    description: 'A focused estimate that keeps scope and cost easy to scan.',
  },
  {
    id: 'enterprise-receipt',
    label: 'Enterprise Receipt',
    template: 'enterprise',
    documentType: 'receipt',
    description: 'A formal payment record with a structured business layout.',
  },
]

function buildPreviewInvoice(preview: (typeof TEMPLATE_PREVIEWS)[number]): InvoiceData {
  const documentNumber = preview.documentType === 'quote'
    ? 'QTE-2026-004'
    : preview.documentType === 'estimate'
      ? 'EST-2026-002'
      : preview.documentType === 'receipt'
        ? 'RCP-2026-009'
        : 'INV-2026-001'

  return {
    documentType: preview.documentType,
    business: {
      logo: '/logo-horizontal.png',
      name: 'Northstar Studio',
      contactPerson: 'Alex Morgan',
      email: 'hello@northstar.studio',
      phone: '(212) 555-0148',
      website: 'northstar.studio',
      address: '123 Business Street\nNew York, NY 10001',
      taxId: 'US-458219',
    },
    client: {
      name: 'Acme Agency',
      companyName: 'Acme Agency LLC',
      email: 'contact@acme.co',
      phone: '(212) 555-0199',
      billingAddress: '45 Madison Avenue\nNew York, NY 10010',
      taxId: '',
    },
    details: {
      number: documentNumber,
      issueDate: 'Jul 26, 2026',
      dueDate: preview.documentType === 'receipt' ? 'INV-2026-001' : 'Aug 9, 2026',
      paymentTerms: preview.documentType === 'receipt' ? 'Bank transfer' : 'Net 14',
      status: preview.documentType === 'receipt' ? 'Paid' : 'Draft',
      poNumber: 'PO-1048',
      currency: 'USD',
    },
    items: [
      {
        id: 'preview-item-1',
        name: 'Brand strategy & positioning',
        description: 'Research, workshops, and strategic direction',
        quantity: '1',
        unitPrice: '1500',
        taxPercent: '8',
        discountPercent: '',
      },
      {
        id: 'preview-item-2',
        name: 'Website design & development',
        description: 'Responsive marketing site and launch support',
        quantity: '1',
        unitPrice: '4000',
        taxPercent: '8',
        discountPercent: '',
      },
    ],
    additional: {
      notes: 'Thank you for your business.',
      paymentInstructions: 'Payment is due according to the terms above.',
      terms: '',
    },
    presentation: normalizePresentation({
      template: preview.template,
      primaryColor: '#2e5bff',
      accentColor: '#13a6a6',
      font: preview.template === 'minimal' ? 'Fraunces' : 'Inter',
      headerLayout: preview.template === 'enterprise' ? 'Band' : 'Split',
      footerLayout: preview.template === 'enterprise' ? 'Detailed' : 'Simple',
      paperSize: 'A4',
      titleStyle: preview.template === 'minimal' ? 'editorial' : 'default',
    }),
  }
}

export function ProductPreview() {
  const [activeId, setActiveId] = useState(TEMPLATE_PREVIEWS[0].id)
  const activePreview = TEMPLATE_PREVIEWS.find((preview) => preview.id === activeId) ?? TEMPLATE_PREVIEWS[0]
  const invoice = buildPreviewInvoice(activePreview)
  const currency = getCurrencyByCode(invoice.details.currency)
  const calculations = calculateInvoiceTotals(invoice.items)
  const templateHref = `/invoice?template=${activePreview.template}&documentType=${activePreview.documentType}`

  return (
    <section id="preview" className="bg-muted/30">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:py-20">
        <motion.div
          className="mx-auto max-w-3xl text-center"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="label-caps">LIVE TEMPLATE PREVIEWS</span>
          <h2 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-tight text-foreground md:text-4xl">
            Choose a Professional Invoice Template in Seconds
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Preview professionally designed invoice, quote, estimate, and receipt templates before creating your document. Every template is fully customizable and ready to download as a high-quality PDF.
          </p>
        </motion.div>

        <motion.div
          className="mt-10"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="mx-auto flex max-w-5xl flex-wrap justify-center gap-2" role="tablist" aria-label="InvoiceFocus template previews">
            {TEMPLATE_PREVIEWS.map((preview) => {
              const isActive = preview.id === activePreview.id
              return (
                <button
                  key={preview.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`template-preview-${preview.id}`}
                  onClick={() => setActiveId(preview.id)}
                  className={`rounded-lg border px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                    isActive
                      ? 'border-primary bg-primary text-primary-foreground shadow-md'
                      : 'border-border/70 bg-white text-foreground shadow-sm hover:border-primary/40 hover:bg-muted/50'
                  }`}
                >
                  {preview.label}
                </button>
              )
            })}
          </div>

          <div className="mx-auto mt-7 max-w-5xl overflow-hidden rounded-2xl border border-border/60 bg-card shadow-2xl shadow-foreground/8">
            <div className="flex items-center justify-between gap-4 border-b border-border/60 bg-foreground px-4 py-3 text-primary-foreground">
              <div className="flex items-center gap-1.5" aria-hidden="true">
                <span className="h-3 w-3 rounded-full bg-red-400/80" />
                <span className="h-3 w-3 rounded-full bg-amber-400/80" />
                <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
              </div>
              <span className="min-w-0 truncate text-xs text-primary-foreground/70">
                InvoiceFocus / {activePreview.label}
              </span>
              <span className="w-[54px]" aria-hidden="true" />
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activePreview.id}
                id={`template-preview-${activePreview.id}`}
                role="tabpanel"
                aria-label={`${activePreview.label} preview`}
                initial={{ opacity: 0, x: 14 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -14 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="bg-muted/20 p-3 sm:p-6 lg:p-8"
              >
                <InvoicePreview
                  invoice={invoice}
                  currency={currency}
                  calculations={calculations}
                  hasAnyData
                />
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mx-auto mt-6 flex max-w-5xl flex-col items-center justify-between gap-4 rounded-xl border border-border/60 bg-card px-5 py-4 sm:flex-row">
            <div className="text-center sm:text-left">
              <p className="text-sm font-semibold text-foreground">{activePreview.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">{activePreview.description}</p>
            </div>
            <Button size="lg" asChild className="shrink-0">
              <Link href={templateHref}>
                Use This Template
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}