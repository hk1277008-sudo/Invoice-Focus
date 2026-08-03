export type InvoiceTemplate =
  | 'modern'
  | 'minimal'
  | 'corporate'
  | 'executive'
  | 'elegant'
  | 'creative'
  | 'clean'
  | 'professional'
  | 'enterprise'

export type InvoiceFont = 'Inter' | 'Fraunces' | 'DM Mono'
export type InvoiceHeaderLayout = 'Split' | 'Centered' | 'Band'
export type InvoiceFooterLayout = 'Simple' | 'Detailed' | 'Bar'
export type InvoicePaperSize = 'A4' | 'Letter'
export type InvoiceTemplateFamily = 'minimal' | 'professional' | 'enterprise'

export interface InvoicePresentation {
  template: InvoiceTemplate
  primaryColor: string
  accentColor: string
  font: InvoiceFont
  headerLayout: InvoiceHeaderLayout
  footerLayout: InvoiceFooterLayout
  paperSize: InvoicePaperSize
  titleStyle: 'default' | 'compact' | 'editorial'
}

export const invoiceTemplates: Array<{
  id: InvoiceTemplate
  name: string
  description: string
}> = [
  { id: 'minimal', name: 'Minimal', description: 'Quiet whitespace, light rules, and editorial precision.' },
  { id: 'professional', name: 'Professional', description: 'Balanced hierarchy, polished tables, and clear totals.' },
  { id: 'enterprise', name: 'Enterprise', description: 'Structured corporate sections with detailed metadata.' },
]

const allTemplateIds: InvoiceTemplate[] = ['modern', 'minimal', 'corporate', 'executive', 'elegant', 'creative', 'clean', 'professional', 'enterprise']

export const defaultPresentation: InvoicePresentation = {
  template: 'modern',
  primaryColor: '#2e5bff',
  accentColor: '#13a6a6',
  font: 'Inter',
  headerLayout: 'Split',
  footerLayout: 'Simple',
  paperSize: 'A4',
  titleStyle: 'default',
}

const hexColor = /^#[0-9a-f]{6}$/i

export function normalizePresentation(value: unknown): InvoicePresentation {
  const candidate = (value && typeof value === 'object' ? value : {}) as Partial<InvoicePresentation>
  const template = allTemplateIds.includes(candidate.template as InvoiceTemplate) ? candidate.template! : defaultPresentation.template
  return {
    ...defaultPresentation,
    ...candidate,
    template,
    primaryColor: typeof candidate.primaryColor === 'string' && hexColor.test(candidate.primaryColor) ? candidate.primaryColor : defaultPresentation.primaryColor,
    accentColor: typeof candidate.accentColor === 'string' && hexColor.test(candidate.accentColor) ? candidate.accentColor : defaultPresentation.accentColor,
    font: ['Inter', 'Fraunces', 'DM Mono'].includes(candidate.font || '') ? candidate.font! : defaultPresentation.font,
    headerLayout: ['Split', 'Centered', 'Band'].includes(candidate.headerLayout || '') ? candidate.headerLayout! : defaultPresentation.headerLayout,
    footerLayout: ['Simple', 'Detailed', 'Bar'].includes(candidate.footerLayout || '') ? candidate.footerLayout! : defaultPresentation.footerLayout,
    paperSize: candidate.paperSize === 'Letter' ? 'Letter' : 'A4',
    titleStyle: ['default', 'compact', 'editorial'].includes(candidate.titleStyle || '') ? candidate.titleStyle! : defaultPresentation.titleStyle,
  }
}

export function normalizeTemplate(value: unknown): InvoiceTemplate {
  return normalizePresentation({ template: value }).template
}

export function presentationFontFamily(font: InvoiceFont): string {
  return font === 'Fraunces' ? "'Fraunces', Georgia, serif" : font === 'DM Mono' ? "'DM Mono', monospace" : "'Inter', system-ui, sans-serif"
}

export function templateFamily(template: InvoiceTemplate): InvoiceTemplateFamily {
  if (template === 'minimal' || template === 'clean' || template === 'elegant') return 'minimal'
  if (template === 'corporate' || template === 'executive' || template === 'enterprise') return 'enterprise'
  return 'professional'
}