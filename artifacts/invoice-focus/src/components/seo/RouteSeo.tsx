import { useEffect } from 'react'
import { useLocation } from 'wouter'
import { BLOG_ARTICLES } from '@/app/(marketing)/blog-content'

const SITE_URL = 'https://invoicefocus.com'
const SITE_NAME = 'Invoice Focus'
const DEFAULT_IMAGE = `${SITE_URL}/logo-horizontal.png`

type PageMetadata = {
  title: string
  description: string
  indexable: boolean
  type?: 'website' | 'article'
  article?: {
    publishedTime: string
    section: string
  }
  faq?: Array<[string, string]>
  breadcrumbs?: string[]
}

const pageMetadata: Record<string, PageMetadata> = {
  '/': {
    title: 'Free Invoice Generator',
    description: 'Create professional invoices, quotes, estimates, receipts, and purchase orders with Invoice Focus, a free online document generator.',
    indexable: true,
    faq: [
      ['Is Invoice Focus free to use?', 'Invoice Focus is a free online document generator for creating invoices and related business documents.'],
      ['Can I create documents besides invoices?', 'Yes. Invoice Focus supports quotes, estimates, receipts, credit notes, and purchase orders.'],
    ],
  },
  '/templates': {
    title: 'Invoice Templates - Free Professional Document Templates',
    description: 'Browse free Invoice Focus templates for invoices, quotes, estimates, receipts, credit notes, and purchase orders in three visual families.',
    indexable: true,
  },
  '/invoice-generator': {
    title: 'Invoice Generator - Create Free Professional Invoices',
    description: 'Create a professional invoice online with clear line items, totals, client details, and a focused workflow for your next payment request.',
    indexable: true,
  },
  '/receipt-generator': {
    title: 'Receipt Generator - Create Clear Payment Receipts',
    description: 'Create a clear receipt online to record payments, client details, items, and confirmation in a professional document.',
    indexable: true,
  },
  '/estimate-generator': {
    title: 'Estimate Generator - Create Project Cost Estimates',
    description: 'Create a useful project estimate online with expected items, rates, notes, and totals before work begins.',
    indexable: true,
  },
  '/quote-generator': {
    title: 'Quote Generator - Create Professional Client Quotes',
    description: 'Create a client-ready quote online with scope, line items, rates, and projected totals before you begin the work.',
    indexable: true,
  },
  '/credit-note-generator': {
    title: 'Credit Note Generator - Document Billing Adjustments',
    description: 'Create a clear credit note online to record an adjustment, credited amount, reference details, and reason.',
    indexable: true,
  },
  '/purchase-order-generator': {
    title: 'Purchase Order Generator - Create Supplier Orders',
    description: 'Create a structured purchase order online with supplier, delivery, item, quantity, and order details.',
    indexable: true,
  },
  '/invoice-template': {
    title: 'Invoice Templates - Choose a Professional Invoice Design',
    description: 'Explore Invoice Focus invoice template families, compare their visual rhythm, and open the invoice generator with your choice.',
    indexable: true,
  },
  '/receipt-template': {
    title: 'Receipt Templates - Clear Payment Confirmation Designs',
    description: 'Explore Invoice Focus receipt templates and choose a clear visual starting point for recording a completed payment.',
    indexable: true,
  },
  '/estimate-template': {
    title: 'Estimate Templates - Project Cost Estimate Designs',
    description: 'Explore Invoice Focus estimate templates for presenting expected project work, costs, notes, and totals clearly.',
    indexable: true,
  },
  '/quote-template': {
    title: 'Quote Templates - Professional Client Quote Designs',
    description: 'Explore Invoice Focus quote templates for presenting scope, pricing, and projected work before a client engagement begins.',
    indexable: true,
  },
  '/credit-note-template': {
    title: 'Credit Note Templates - Billing Adjustment Designs',
    description: 'Explore Invoice Focus credit note templates for documenting billing adjustments with clear references and credited amounts.',
    indexable: true,
  },
  '/purchase-order-template': {
    title: 'Purchase Order Templates - Supplier Order Designs',
    description: 'Explore Invoice Focus purchase order templates for clear supplier requests, delivery details, and requested items.',
    indexable: true,
  },
  '/how-it-works': {
    title: 'How Invoice Focus Works - From Details to PDF',
    description: 'See how Invoice Focus takes you from document type and business details to a reviewed, professional PDF ready to share.',
    indexable: true,
  },
  '/features': {
    title: 'Invoice Focus Features - Documents and Templates',
    description: 'See the real Invoice Focus features for creating invoices, quotes, estimates, receipts, credit notes, and purchase orders.',
    indexable: true,
  },
  '/about': {
    title: 'About Invoice Focus - Focused Invoicing Software',
    description: 'Learn what Invoice Focus is, who it is built for, and how it makes everyday business document creation more focused.',
    indexable: true,
  },
  '/contact': {
    title: 'Contact Invoice Focus - Product and Support Questions',
    description: 'Contact Invoice Focus for product questions, partnerships, and support with your invoicing and business document workflow.',
    indexable: true,
  },
  '/help': {
    title: 'Invoice Focus Help Center - Invoicing and Account Guides',
    description: 'Find practical help for creating invoices, using templates, exporting PDFs, and managing your Invoice Focus account.',
    indexable: true,
  },
  '/blog': {
    title: 'Invoice Focus Journal - Invoicing and Business Guides',
    description: 'Read practical Invoice Focus articles about invoicing, freelancing, small business documents, and focused work.',
    indexable: true,
  },
  '/privacy': {
    title: 'Privacy Policy - Invoice Focus',
    description: 'Read the Invoice Focus privacy policy and learn how information used by the invoicing service is handled.',
    indexable: true,
  },
  '/terms': {
    title: 'Terms of Service - Invoice Focus',
    description: 'Read the Invoice Focus terms of service for using the free online business document application.',
    indexable: true,
  },
  '/cookies': {
    title: 'Cookie Notice - Invoice Focus',
    description: 'Read the Invoice Focus cookie notice and learn how browser technologies may support account access and security.',
    indexable: true,
  },
}

const faqByPath: Record<string, Array<[string, string]>> = {
  '/invoice-generator': [
    ['What belongs on an invoice?', 'Include business and client details, a clear description of the work or items, quantities and rates where relevant, totals, and payment terms.'],
    ['Can I use an invoice template?', 'Yes. Browse the Invoice Focus invoice templates to compare minimal, professional, and enterprise visual families before opening the generator.'],
  ],
  '/receipt-generator': [
    ['When should I create a receipt?', 'Create a receipt after payment has been received so the client has a clear record of the transaction.'],
    ['What should a receipt show?', 'A receipt should identify the parties, summarize the items or service, and show the amount paid and confirmation details.'],
  ],
  '/estimate-generator': [
    ['What is an estimate used for?', 'An estimate presents expected project work and cost while the final scope or amount is still being defined.'],
    ['Can an estimate become an invoice?', 'Use the estimate as a planning reference, then create an invoice for the completed work and final amount.'],
  ],
  '/quote-generator': [
    ['What is the difference between a quote and an estimate?', 'A quote presents proposed scope and pricing before work begins; an estimate communicates an expected cost that may still change as details develop.'],
    ['What should a quote include?', 'Include the proposed work, useful line items, rates or pricing, and the terms or notes the client needs before deciding.'],
  ],
  '/credit-note-generator': [
    ['When is a credit note useful?', 'Use a credit note to document a billing adjustment, reduction, or correction connected to an earlier amount.'],
    ['What should a credit note explain?', 'Include reference details, the credited item or amount, and a concise reason for the adjustment.'],
  ],
  '/purchase-order-generator': [
    ['What is a purchase order used for?', 'A purchase order records what a business intends to buy from a supplier, including requested items, quantities, and delivery details.'],
    ['Who receives a purchase order?', 'The supplier or vendor receives the purchase order so both sides have a shared record of the requested order.'],
  ],
}

function getArticleMetadata(pathname: string): PageMetadata | undefined {
  const slug = pathname.match(/^\/blog\/([^/]+)$/)?.[1]
  if (!slug) return undefined
  const article = BLOG_ARTICLES.find((item) => item.slug === decodeURIComponent(slug))
  if (!article) return undefined
  return {
    title: `${article.title} | Invoice Focus Journal`,
    description: article.excerpt,
    indexable: true,
    type: 'article',
    article: { publishedTime: article.date, section: article.category },
  }
}

function getMetadata(pathname: string): PageMetadata {
  const articleMetadata = getArticleMetadata(pathname)
  const metadata = articleMetadata ?? pageMetadata[pathname]
  if (metadata) return { ...metadata, faq: metadata.faq ?? faqByPath[pathname] }
  return {
    title: 'Invoice Focus',
    description: 'Invoice Focus is a focused online workspace for creating professional business documents.',
    indexable: false,
  }
}

function upsertMeta(attribute: 'name' | 'property', value: string, content: string) {
  const selector = `meta[${attribute}="${value}"]`
  const tags = Array.from(document.head.querySelectorAll(selector))
  const tag = tags[0] ?? document.createElement('meta')
  tag.setAttribute(attribute, value)
  tag.setAttribute('content', content)
  if (!tag.parentNode) document.head.appendChild(tag)
  tags.slice(1).forEach((duplicate) => duplicate.remove())
}

function upsertJsonLd(id: string, value: unknown) {
  let script = document.head.querySelector<HTMLScriptElement>(`script#${id}`)
  if (!script) {
    script = document.createElement('script')
    script.id = id
    script.type = 'application/ld+json'
    document.head.appendChild(script)
  }
  script.textContent = JSON.stringify(value)
}

export function RouteSeo() {
  const [location] = useLocation()

  useEffect(() => {
    const pathname = location.split('?')[0] || '/'
    const metadata = getMetadata(pathname)
    const canonicalUrl = `${SITE_URL}${pathname === '/' ? '/' : pathname}`

    document.title = metadata.title
    upsertMeta('name', 'description', metadata.description)
    upsertMeta('name', 'robots', metadata.indexable ? 'index, follow' : 'noindex, nofollow')
    upsertMeta('name', 'twitter:card', 'summary_large_image')
    upsertMeta('name', 'twitter:title', metadata.title)
    upsertMeta('name', 'twitter:description', metadata.description)
    upsertMeta('name', 'twitter:image', DEFAULT_IMAGE)
    upsertMeta('name', 'twitter:image:alt', 'Invoice Focus logo')
    upsertMeta('property', 'og:type', metadata.type ?? 'website')
    upsertMeta('property', 'og:site_name', SITE_NAME)
    upsertMeta('property', 'og:url', canonicalUrl)
    upsertMeta('property', 'og:title', metadata.title)
    upsertMeta('property', 'og:description', metadata.description)
    upsertMeta('property', 'og:image', DEFAULT_IMAGE)
    upsertMeta('property', 'og:image:alt', 'Invoice Focus logo')

    const canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]') ?? document.createElement('link')
    if (metadata.indexable) {
      canonical.setAttribute('rel', 'canonical')
      canonical.setAttribute('href', canonicalUrl)
      if (!canonical.parentNode) document.head.appendChild(canonical)
    } else if (canonical.parentNode) {
      canonical.remove()
    }

    const breadcrumbLabels = pathname.split('/').filter(Boolean)
    const breadcrumbs = [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
      ...(breadcrumbLabels.length > 0 ? [{ '@type': 'ListItem', position: 2, name: metadata.title.split(' | ')[0], item: canonicalUrl }] : []),
    ]

    upsertJsonLd('invoicefocus-site-schema', {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': `${SITE_URL}/#organization`,
          name: SITE_NAME,
          alternateName: 'InvoiceFocus',
          url: `${SITE_URL}/`,
          logo: DEFAULT_IMAGE,
        },
        {
          '@type': 'WebSite',
          '@id': `${SITE_URL}/#website`,
          url: `${SITE_URL}/`,
          name: SITE_NAME,
          publisher: { '@id': `${SITE_URL}/#organization` },
        },
        ...(pathname === '/' || pathname === '/features' ? [{
          '@type': 'SoftwareApplication',
          name: 'Invoice Focus',
          applicationCategory: 'BusinessApplication',
          applicationSubCategory: 'Business Document Generator',
          operatingSystem: 'Web',
          url: canonicalUrl,
          description: metadata.description,
          publisher: { '@id': `${SITE_URL}/#organization` },
        }] : []),
        ...(metadata.faq ? [{
          '@type': 'FAQPage',
          url: canonicalUrl,
          mainEntity: metadata.faq.map(([question, answer]) => ({
            '@type': 'Question',
            name: question,
            acceptedAnswer: { '@type': 'Answer', text: answer },
          })),
        }] : []),
        ...(metadata.type === 'article' && metadata.article ? [{
          '@type': 'Article',
          headline: metadata.title.split(' | ')[0],
          description: metadata.description,
          datePublished: metadata.article.publishedTime,
          articleSection: metadata.article.section,
          mainEntityOfPage: canonicalUrl,
          author: { '@type': 'Organization', name: SITE_NAME },
          publisher: { '@id': `${SITE_URL}/#organization` },
        }] : []),
        ...(metadata.indexable ? [{
          '@type': 'BreadcrumbList',
          itemListElement: breadcrumbs,
        }] : []),
      ],
    })
  }, [location])

  return null
}
