import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { invoiceTemplates, normalizePresentation, type InvoicePresentation } from './presentation'

export function InvoicePresentationControls({
  value,
  onChange,
}: {
  value?: InvoicePresentation
  onChange: (field: keyof InvoicePresentation, value: string) => void
}) {
  const presentation = normalizePresentation(value)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoice design</CardTitle>
        <CardDescription>Choose a layout and keep your brand consistent across preview and export.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-2 sm:grid-cols-2">
          {invoiceTemplates.map((template) => {
            return (
              <button key={template.id} type="button" onClick={() => onChange('template', template.id)} aria-pressed={presentation.template === template.id} className={`rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${presentation.template === template.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                <span className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">{template.name}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Included</span>
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">{template.description}</span>
              </button>
            )
          })}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <ColorField label="Primary color" value={presentation.primaryColor} onChange={(value) => onChange('primaryColor', value)} />
          <ColorField label="Accent color" value={presentation.accentColor} onChange={(value) => onChange('accentColor', value)} />
          <SelectField label="Font family" value={presentation.font} options={['Inter', 'Fraunces', 'DM Mono']} onChange={(value) => onChange('font', value)} />
          <SelectField label="Header layout" value={presentation.headerLayout} options={['Split', 'Centered', 'Band']} onChange={(value) => onChange('headerLayout', value)} />
          <SelectField label="Footer layout" value={presentation.footerLayout} options={['Simple', 'Detailed', 'Bar']} onChange={(value) => onChange('footerLayout', value)} />
          <SelectField label="Paper size" value={presentation.paperSize} options={['A4', 'Letter']} onChange={(value) => onChange('paperSize', value)} />
        </div>
        <p className="text-xs text-muted-foreground">Every template and branding control is included with unlimited invoicing.</p>
      </CardContent>
    </Card>
  )
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <div className="space-y-1.5"><Label>{label}</Label><div className="flex h-10 items-center gap-2 rounded-md border border-input px-2"><input type="color" value={value} onChange={(event) => onChange(event.target.value)} aria-label={label} className="h-7 w-8 cursor-pointer border-0 bg-transparent p-0" /><span className="font-mono text-xs text-muted-foreground">{value}</span></div></div>
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return <div className="space-y-1.5"><Label>{label}</Label><select value={value} onChange={(event) => onChange(event.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">{options.map((option) => <option key={option}>{option}</option>)}</select></div>
}