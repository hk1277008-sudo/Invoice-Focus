import { LockKeyhole } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useSubscription } from '@/providers/SubscriptionProvider'
import { UpgradeDialog } from '@/components/subscription/UpgradeDialog'
import { invoiceTemplates, normalizePresentation, type InvoicePresentation, type InvoiceTemplate } from './presentation'
import { useState } from 'react'

export function InvoicePresentationControls({
  value,
  onChange,
}: {
  value?: InvoicePresentation
  onChange: (field: keyof InvoicePresentation, value: string) => void
}) {
  const presentation = normalizePresentation(value)
  const { subscription } = useSubscription()
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [upgradePlan, setUpgradePlan] = useState<'Pro' | 'Premium'>('Pro')
  const plan = subscription.plan
  const canUse = (template: InvoiceTemplate) => {
    if (template === 'modern' || template === 'minimal') return true
    if (template === 'corporate' || template === 'executive' || template === 'elegant') return plan !== 'free'
    return plan === 'premium'
  }
  const chooseTemplate = (template: InvoiceTemplate) => {
    if (!canUse(template)) {
      setUpgradePlan(template === 'creative' || template === 'clean' || template === 'professional' ? 'Premium' : 'Pro')
      setUpgradeOpen(true)
      return
    }
    onChange('template', template)
  }
  const customBrandingLocked = plan !== 'premium'
  const updateBrand = (field: keyof InvoicePresentation, next: string) => {
    if (customBrandingLocked && next !== (presentation[field] as string)) {
      setUpgradePlan('Premium')
      setUpgradeOpen(true)
      return
    }
    onChange(field, next)
  }

  return (
    <Card>
      <UpgradeDialog open={upgradeOpen} onOpenChange={setUpgradeOpen} feature={`${upgradePlan} templates and branding`} description={upgradePlan === 'Premium' ? 'Unlock the full library and complete branding customization with Premium.' : 'Upgrade to Pro to use advanced invoice templates.'} />
      <CardHeader>
        <CardTitle>Invoice design</CardTitle>
        <CardDescription>Choose a layout and keep your brand consistent across preview and export.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-2 sm:grid-cols-2">
          {invoiceTemplates.map((template) => {
            const locked = !canUse(template.id)
            return (
              <button key={template.id} type="button" onClick={() => chooseTemplate(template.id)} aria-pressed={presentation.template === template.id} className={`rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${presentation.template === template.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                <span className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">{template.name}</span>
                  <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{locked && <LockKeyhole className="h-3 w-3" />}{template.tier}</span>
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">{template.description}</span>
              </button>
            )
          })}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <ColorField label="Primary color" value={presentation.primaryColor} onChange={(value) => updateBrand('primaryColor', value)} disabled={customBrandingLocked} />
          <ColorField label="Accent color" value={presentation.accentColor} onChange={(value) => updateBrand('accentColor', value)} disabled={customBrandingLocked} />
          <SelectField label="Font family" value={presentation.font} options={['Inter', 'Fraunces', 'DM Mono']} onChange={(value) => updateBrand('font', value)} disabled={customBrandingLocked} />
          <SelectField label="Header layout" value={presentation.headerLayout} options={['Split', 'Centered', 'Band']} onChange={(value) => updateBrand('headerLayout', value)} disabled={customBrandingLocked} />
          <SelectField label="Footer layout" value={presentation.footerLayout} options={['Simple', 'Detailed', 'Bar']} onChange={(value) => updateBrand('footerLayout', value)} disabled={customBrandingLocked} />
          <SelectField label="Paper size" value={presentation.paperSize} options={['A4', 'Letter']} onChange={(value) => onChange('paperSize', value)} />
        </div>
        {customBrandingLocked && <p className="text-xs text-muted-foreground">Color, font, header, and footer customization is available on Premium.</p>}
      </CardContent>
    </Card>
  )
}

function ColorField({ label, value, onChange, disabled }: { label: string; value: string; onChange: (value: string) => void; disabled: boolean }) {
  return <div className="space-y-1.5"><Label>{label}</Label><div className="flex h-10 items-center gap-2 rounded-md border border-input px-2"><input type="color" value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} aria-label={label} className="h-7 w-8 cursor-pointer border-0 bg-transparent p-0 disabled:cursor-not-allowed disabled:opacity-50" /><span className="font-mono text-xs text-muted-foreground">{value}</span></div></div>
}

function SelectField({ label, value, options, onChange, disabled }: { label: string; value: string; options: string[]; onChange: (value: string) => void; disabled?: boolean }) {
  return <div className="space-y-1.5"><Label>{label}</Label><select value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60">{options.map((option) => <option key={option}>{option}</option>)}</select></div>
}