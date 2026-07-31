export type InvoiceTemplate =
  | 'modern'
  | 'minimal'
  | 'corporate'
  | 'executive'
  | 'elegant'
  | 'creative'
  | 'clean'
  | 'professional'

export type InvoiceFont = 'Inter' | 'Fraunces' | 'DM Mono'
export type InvoiceHeaderLayout = 'Split' | 'Centered' | 'Band'
export type InvoiceFooterLayout = 'Simple' | 'Detailed' | 'Bar'
export type InvoicePaperSize = 'A4' | 'Letter'

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
  { id: 'modern', name: 'Modern', description: 'Confident color rail with crisp metrics.' },
  { id: 'minimal', name: 'Minimal', description: 'Quiet whitespace and editorial precision.' },
  { id: 'corporate', name: 'Corporate', description: 'Structured sections for larger teams.' },
  { id: 'executive', name: 'Executive', description: 'High-trust dark header and premium hierarchy.' },
  { id: 'elegant', name: 'Elegant', description: 'Serif-led details with refined contrast.' },
  { id: 'creative', name: 'Creative', description: 'Expressive blocks for studios and makers.' },
  { id: 'clean', name: 'Clean', description: 'Airy utility with an efficient table.' },
  { id: 'professional', name: 'Professional', description: 'Balanced all-rounder for every client.' },
]

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
  const template = invoiceTemplates.some((item) => item.id === candidate.template) ? candidate.template! : defaultPresentation.template
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

export function presentationFontFamily(font: InvoiceFont): string {
  return font === 'Fraunces' ? "'Fraunces', Georgia, serif" : font === 'DM Mono' ? "'DM Mono', monospace" : "'Inter', system-ui, sans-serif"
}