import { Link } from 'wouter'
import { ArrowRight, FileText } from 'lucide-react'
import { DashboardLayout } from '../layout'
import { TEMPLATES, TemplateMiniPreview } from '@/components/sections/Templates'

export default function TemplatesPage() {
  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-8">
        <div>
          <p className="label-caps">Invoice templates</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Start with a professional layout</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
            Choose a design and document type. Your selection opens directly in the invoice editor and remains available while you work.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {TEMPLATES.map(({ id, family, documentType, title, description, accent }) => (
            <Link
              key={title}
              href={`/invoice?template=${id}&documentType=${documentType}`}
              className="group flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <TemplateMiniPreview family={family} accent={accent} />
              <div className="mt-5">
                <h2 className="font-display text-lg font-semibold tracking-tight">{title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
              </div>
              <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-primary">
                Use template
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
          <FileText className="h-4 w-4 shrink-0 text-primary" />
          Every template selection is applied to the editor preview and printable output.
        </div>
      </div>
    </DashboardLayout>
  )
}