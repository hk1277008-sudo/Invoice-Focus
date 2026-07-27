import type { Currency, CurrencyCode } from './types'

export const CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$', name: 'United States Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'PKR', symbol: 'Rs', name: 'Pakistani Rupee' },
  { code: 'AED', symbol: 'د.إ', name: 'United Arab Emirates Dirham' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
]

export const DEFAULT_CURRENCY: CurrencyCode = 'USD'

export const CURRENCY_MAP: Record<CurrencyCode, Currency> = CURRENCIES.reduce(
  (acc, currency) => {
    acc[currency.code] = currency
    return acc
  },
  {} as Record<CurrencyCode, Currency>,
)

export function getCurrencyByCode(code: CurrencyCode): Currency {
  return CURRENCY_MAP[code] ?? CURRENCY_MAP[DEFAULT_CURRENCY]
}

export function formatCurrency(amount: number, currency: Currency): string {
  if (currency.code === 'AED' || currency.code === 'SAR') {
    return `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency.symbol}`
  }
  if (currency.code === 'PKR' || currency.code === 'INR') {
    return `${currency.symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  return `${currency.symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
