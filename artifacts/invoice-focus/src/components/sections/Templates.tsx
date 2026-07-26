import { FileText, FileMinus, FileType, FileSpreadsheet, ArrowRight } from 'lucide-react'

const TEMPLATES = [
  {
    icon: FileText,
    title: 'Invoice Template',
    description: 'The standard professional invoice with itemized lines, totals, and payment details.',
    href: '/sign-up',
  },
  {
    icon: FileMinus,
    title: 'Credit Note Template',
    description: 'Issue refunds and credit memos with a clean, easy-to-read format.',
    href: '/sign-up',
  },
  {
    icon: FileType,
    title: 'Quote Template',
    description: 'Send estimates and quotes that convert into invoices with one click.',
    href: '/sign-up',
  },
  {
    icon: FileSpreadsheet,
    title: 'Purchase Order Template',
    description: 'Track orders and approvals before you bill with a structured PO layout.',
    href: '/sign-up',
  },
]

export function Templates() {
  return (
    <section id="templates" className="bg-muted/30">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <span className="label-caps">Templates</span>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Start with a ready-made template
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Pick the document you need, customize it in minutes, and send it to your client.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TEMPLATES.map(({ icon: Icon, title, description, href }) => (
            <a
              key={title}
              href={href}
              className="group flex flex-col rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-lg font-medium text-foreground">{title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                Use template
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
