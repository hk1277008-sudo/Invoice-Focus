import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Quote, Calculator, Receipt, ShoppingCart, Search, Bell, Plus } from 'lucide-react'

const TABS = [
  { id: 'invoice', label: 'Invoice', icon: FileText },
  { id: 'quote', label: 'Quote', icon: Quote },
  { id: 'estimate', label: 'Estimate', icon: Calculator },
  { id: 'receipt', label: 'Receipt', icon: Receipt },
  { id: 'purchase-order', label: 'Purchase Order', icon: ShoppingCart },
]

const DOCUMENTS: Record<
  string,
  { title: string; number: string; items: { desc: string; qty: string; rate: string; amount: string }[]; total: string }
> = {
  invoice: {
    title: 'Invoice',
    number: '#INV-2026-001',
    items: [
      { desc: 'Brand strategy & positioning', qty: '1', rate: '$1,500', amount: '$1,500.00' },
      { desc: 'Website design & development', qty: '1', rate: '$4,000', amount: '$4,000.00' },
    ],
    total: '$5,940.00',
  },
  quote: {
    title: 'Quote',
    number: '#QTE-2026-004',
    items: [
      { desc: 'UI/UX design system', qty: '1', rate: '$2,400', amount: '$2,400.00' },
      { desc: 'Frontend implementation', qty: '1', rate: '$3,600', amount: '$3,600.00' },
    ],
    total: '$6,480.00',
  },
  estimate: {
    title: 'Estimate',
    number: '#EST-2026-002',
    items: [
      { desc: 'Discovery & planning', qty: '2', rate: '$950', amount: '$1,900.00' },
      { desc: 'Development phase 1', qty: '1', rate: '$5,500', amount: '$5,500.00' },
    ],
    total: '$7,768.00',
  },
  receipt: {
    title: 'Receipt',
    number: '#RCP-2026-009',
    items: [
      { desc: 'Monthly retainer', qty: '1', rate: '$1,200', amount: '$1,200.00' },
    ],
    total: '$1,296.00',
  },
  'purchase-order': {
    title: 'Purchase Order',
    number: '#PO-2026-015',
    items: [
      { desc: 'Design subscriptions', qty: '3', rate: '$500', amount: '$1,500.00' },
      { desc: 'Hosting & infrastructure', qty: '1', rate: '$800', amount: '$800.00' },
    ],
    total: '$2,484.00',
  },
}

function DocumentPreview({ type }: { type: string }) {
  const doc = DOCUMENTS[type]

  return (
    <div className="h-full overflow-y-auto bg-white p-6 sm:p-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-start justify-between border-b border-border/50 pb-6">
          <div>
            <div className="font-display text-xl font-semibold text-foreground">InvoiceFocus</div>
            <div className="text-xs text-muted-foreground">123 Business Street, New York, NY 10001</div>
          </div>
          <div className="text-right">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{doc.title}</div>
            <div className="text-sm font-semibold tabular text-foreground">{doc.number}</div>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-6">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Billed To</div>
            <div className="mt-1 text-sm font-semibold text-foreground">Acme Agency</div>
            <div className="text-xs text-muted-foreground">contact@acme.co</div>
          </div>
          <div className="text-right">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</div>
            <div className="mt-1 text-sm font-semibold tabular text-foreground">Jul 26, 2026</div>
            <div className="text-xs text-muted-foreground">Due: Aug 9, 2026</div>
          </div>
        </div>

        <div className="mb-8">
          <div className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto] gap-x-4 border-b border-border/50 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <div>Description</div>
            <div className="text-right">Qty</div>
            <div className="text-right">Rate</div>
            <div className="text-right">Amount</div>
          </div>
          {doc.items.map((item, i) => (
            <div
              key={i}
              className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto] gap-x-4 border-b border-border/50 py-3 text-sm text-foreground"
            >
              <div className="min-w-0 break-words">{item.desc}</div>
              <div className="text-right tabular">{item.qty}</div>
              <div className="text-right tabular">{item.rate}</div>
              <div className="text-right tabular">{item.amount}</div>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <div className="w-full max-w-[16rem] space-y-1.5 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span className="tabular">$5,500.00</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Tax (8%)</span>
              <span className="tabular">$440.00</span>
            </div>
            <div className="flex justify-between border-t border-border/50 pt-1.5 font-semibold text-foreground">
              <span>Total</span>
              <span className="tabular">{doc.total}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ProductPreview() {
  const [activeTab, setActiveTab] = useState('invoice')

  return (
    <section id="preview" className="bg-muted/30">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:py-24">
        <motion.div
          className="mx-auto max-w-2xl text-center"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="label-caps">Live Preview</span>
          <h2 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-tight text-foreground md:text-4xl">
            See your documents before you send them
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Switch between invoices, quotes, estimates, receipts, and purchase orders to preview every detail.
          </p>
        </motion.div>

        <motion.div
          className="mt-16"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Tab buttons */}
          <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  activeTab === id
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-white text-foreground shadow-sm hover:bg-muted/50'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Browser mockup */}
          <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-2xl shadow-foreground/8">
            {/* Browser chrome */}
            <div className="flex items-center gap-4 border-b border-border/60 bg-foreground px-4 py-3">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-red-400/80" />
                <span className="h-3 w-3 rounded-full bg-amber-400/80" />
                <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
              </div>
              <div className="flex flex-1 items-center justify-center">
                <div className="flex w-full max-w-md items-center gap-2 rounded-md bg-background/10 px-3 py-1.5 text-xs text-primary-foreground/70">
                  <Search className="h-3.5 w-3.5 opacity-70" />
                  <span>app.invoicefocus.com/documents/{activeTab}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-primary-foreground/80">
                <Bell className="h-4 w-4" />
                <div className="h-6 w-6 rounded-full bg-primary-foreground/20" />
              </div>
            </div>

            {/* App layout */}
            <div className="flex h-[420px] sm:h-[480px] md:h-[520px]">
              {/* Sidebar */}
              <div className="hidden w-14 flex-col items-center gap-4 border-r border-border/60 bg-card py-4 sm:flex lg:w-16">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/50">
                  <Quote className="h-4 w-4" />
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/50">
                  <Calculator className="h-4 w-4" />
                </div>
                <div className="mt-auto flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Plus className="h-4 w-4" />
                </div>
              </div>

              {/* Document preview */}
              <div className="relative flex-1 overflow-hidden bg-muted/20">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="h-full"
                  >
                    <DocumentPreview type={activeTab} />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
