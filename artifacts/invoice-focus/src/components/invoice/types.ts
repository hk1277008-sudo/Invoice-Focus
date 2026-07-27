export type CurrencyCode =
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'PKR'
  | 'AED'
  | 'SAR'
  | 'INR'
  | 'CAD'
  | 'AUD'
  | 'SGD'
  | 'JPY'
  | 'CNY'

export interface Currency {
  code: CurrencyCode
  symbol: string
  name: string
}

export interface InvoiceBusiness {
  logo: string | null
  name: string
  contactPerson: string
  email: string
  phone: string
  website: string
  address: string
  taxId: string
}

export interface InvoiceClient {
  name: string
  companyName: string
  email: string
  phone: string
  billingAddress: string
}

export interface InvoiceDetails {
  number: string
  issueDate: string
  dueDate: string
  paymentTerms: string
  status: string
  poNumber: string
  currency: CurrencyCode
}

export interface InvoiceItem {
  id: string
  name: string
  description: string
  quantity: string
  unitPrice: string
  taxPercent: string
  discountPercent: string
}

export interface InvoiceAdditional {
  notes: string
  paymentInstructions: string
  terms: string
}

export interface InvoiceData {
  business: InvoiceBusiness
  client: InvoiceClient
  details: InvoiceDetails
  items: InvoiceItem[]
  additional: InvoiceAdditional
}

export interface InvoiceCalculations {
  subtotal: number
  tax: number
  discount: number
  grandTotal: number
}
