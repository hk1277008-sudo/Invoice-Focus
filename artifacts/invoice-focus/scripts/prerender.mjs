#!/usr/bin/env node
/**
 * scripts/prerender.mjs
 *
 * Generates per-route HTML files for all public sitemap routes after vite build.
 * Each file gets route-specific <head> metadata (title, description, canonical,
 * robots, OG, Twitter, JSON-LD) and a crawlable fallback content block that
 * React hides once it mounts.
 *
 * Output files use flat .html naming so Vercel's cleanUrls feature serves them
 * without the extension: invoice-generator.html → /invoice-generator.
 * Blog articles go in blog/<slug>.html → /blog/<slug>.
 * The homepage modifies dist/public/index.html in place.
 *
 * Mirrors the metadata and schema logic in src/components/seo/RouteSeo.tsx.
 * Keep both files in sync when public routes are added or changed.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DIST = join(__dirname, '..', 'dist', 'public')

const SITE_URL = 'https://invoicefocus.com'
const SITE_NAME = 'Invoice Focus'
const DEFAULT_IMAGE = `${SITE_URL}/logo-horizontal.png`

// ─── Route data ────────────────────────────────────────────────────────────────
// Each entry mirrors RouteSeo.tsx pageMetadata, faqByPath, and BLOG_ARTICLES.
// h1 + intro + bullets supply the crawlable fallback content block.

/** @type {Array<{
 *   path: string,
 *   title: string,
 *   description: string,
 *   indexable: boolean,
 *   type?: 'website'|'article',
 *   articleDate?: string,
 *   articleSection?: string,
 *   faq?: [string,string][],
 *   showSoftwareApp?: boolean,
 *   h1: string,
 *   intro: string,
 *   bullets?: string[],
 * }>} */
const ROUTES = [
  // ── Authentication pages ─────────────────────────────────────────────────────
  // These routes are intentionally prerendered for direct email-link access,
  // but remain noindex and are not included in the public sitemap.
  {
    path: '/sign-in',
    title: 'Sign In | Invoice Focus',
    description: 'Sign in to your Invoice Focus account.',
    indexable: false,
    h1: 'Welcome back',
    intro: 'Sign in to continue to Invoice Focus.',
  },
  {
    path: '/sign-up',
    title: 'Create Your Account | Invoice Focus',
    description: 'Create your free Invoice Focus account.',
    indexable: false,
    h1: 'Create your account',
    intro: 'Create professional documents in minutes.',
  },
  {
    path: '/forgot-password',
    title: 'Reset Your Password | Invoice Focus',
    description: 'Request a secure password reset link for your Invoice Focus account.',
    indexable: false,
    h1: 'Reset your password',
    intro: 'Enter your email and we’ll send you a reset link.',
  },
  {
    path: '/reset-password',
    title: 'Choose a New Password | Invoice Focus',
    description: 'Choose a new password for your Invoice Focus account.',
    indexable: false,
    h1: 'Choose a new password',
    intro: 'Enter your new password below.',
  },
  {
    path: '/verify-email',
    title: 'Verify Your Email | Invoice Focus',
    description: 'Verify your email address to finish setting up your Invoice Focus account.',
    indexable: false,
    h1: 'Email verification',
    intro: 'Verify your email address to finish setting up your account.',
  },

  // ── Homepage ─────────────────────────────────────────────────────────────────
  {
    path: '/',
    title: 'Free Invoice Generator | Invoice Focus',
    description:
      'Create professional invoices, quotes, estimates, receipts, and purchase orders with Invoice Focus, a free online document generator.',
    indexable: true,
    showSoftwareApp: true,
    faq: [
      [
        'Is Invoice Focus free to use?',
        'Invoice Focus is a free online document generator for creating invoices and related business documents.',
      ],
      [
        'Can I create documents besides invoices?',
        'Yes. Invoice Focus supports quotes, estimates, receipts, credit notes, and purchase orders.',
      ],
    ],
    h1: 'Free Invoice Generator for Freelancers and Small Businesses',
    intro:
      'Invoice Focus is a free online document generator for creating professional invoices, quotes, estimates, receipts, credit notes, and purchase orders.',
    bullets: [
      'Create invoices, quotes, estimates, receipts, credit notes, and purchase orders',
      'Choose from minimal, professional, and enterprise visual families',
      'Export every document as a polished, print-ready PDF',
      'Reuse business and client details across documents',
    ],
  },

  // ── Generator pages ───────────────────────────────────────────────────────────
  {
    path: '/invoice-generator',
    title: 'Invoice Generator | Create Free Professional Invoices',
    description:
      'Create a professional invoice online with clear line items, totals, client details, and a focused workflow for your next payment request.',
    indexable: true,
    faq: [
      [
        'What belongs on an invoice?',
        'Include business and client details, a clear description of the work or items, quantities and rates where relevant, totals, and payment terms.',
      ],
      [
        'Can I use an invoice template?',
        'Yes. Browse the Invoice Focus invoice templates to compare minimal, professional, and enterprise visual families before opening the generator.',
      ],
    ],
    h1: 'Invoice Generator',
    intro: 'Create an invoice that makes the work, amount due, and next step easy to understand.',
    bullets: ['Business and client details', 'Line items, quantities, and rates', 'Totals and payment terms'],
  },
  {
    path: '/receipt-generator',
    title: 'Receipt Generator | Create Clear Payment Receipts',
    description:
      'Create a clear receipt online to record payments, client details, items, and confirmation in a professional document.',
    indexable: true,
    faq: [
      [
        'When should I create a receipt?',
        'Create a receipt after payment has been received so the client has a clear record of the transaction.',
      ],
      [
        'What should a receipt show?',
        'A receipt should identify the parties, summarize the items or service, and show the amount paid and confirmation details.',
      ],
    ],
    h1: 'Receipt Generator',
    intro: 'Record a payment with a receipt that is easy to file, reference, and share.',
    bullets: ['Payment and client details', 'Items or service summary', 'Paid amount and confirmation'],
  },
  {
    path: '/estimate-generator',
    title: 'Estimate Generator | Create Project Cost Estimates',
    description:
      'Create a useful project estimate online with expected items, rates, notes, and totals before work begins.',
    indexable: true,
    faq: [
      [
        'What is an estimate used for?',
        'An estimate presents expected project work and cost while the final scope or amount is still being defined.',
      ],
      [
        'Can an estimate become an invoice?',
        'Use the estimate as a planning reference, then create an invoice for the completed work and final amount.',
      ],
    ],
    h1: 'Estimate Generator',
    intro: 'Give clients a useful view of expected costs while the details of a project are still taking shape.',
    bullets: ['Projected line items', 'Descriptive notes', 'A clear estimated total'],
  },
  {
    path: '/quote-generator',
    title: 'Quote Generator | Create Professional Client Quotes',
    description:
      'Create a client-ready quote online with scope, line items, rates, and projected totals before you begin the work.',
    indexable: true,
    faq: [
      [
        'What is the difference between a quote and an estimate?',
        'A quote presents proposed scope and pricing before work begins; an estimate communicates an expected cost that may still change as details develop.',
      ],
      [
        'What should a quote include?',
        'Include the proposed work, useful line items, rates or pricing, and the terms or notes the client needs before deciding.',
      ],
    ],
    h1: 'Quote Generator',
    intro: 'Set expectations early with a quote that keeps scope and pricing in one readable document.',
    bullets: ['Scope and line items', 'Rates and projected totals', 'Client-ready presentation'],
  },
  {
    path: '/credit-note-generator',
    title: 'Credit Note Generator | Document Billing Adjustments',
    description:
      'Create a clear credit note online to record an adjustment, credited amount, reference details, and reason.',
    indexable: true,
    faq: [
      [
        'When is a credit note useful?',
        'Use a credit note to document a billing adjustment, reduction, or correction connected to an earlier amount.',
      ],
      [
        'What should a credit note explain?',
        'Include reference details, the credited item or amount, and a concise reason for the adjustment.',
      ],
    ],
    h1: 'Credit Note Generator',
    intro: 'Explain a billing adjustment with a credit note that keeps the original context visible.',
    bullets: ['Reference details', 'Credited items or amount', 'Reason for the adjustment'],
  },
  {
    path: '/purchase-order-generator',
    title: 'Purchase Order Generator | Create Supplier Orders',
    description:
      'Create a structured purchase order online with supplier, delivery, item, quantity, and order details.',
    indexable: true,
    faq: [
      [
        'What is a purchase order used for?',
        'A purchase order records what a business intends to buy from a supplier, including requested items, quantities, and delivery details.',
      ],
      [
        'Who receives a purchase order?',
        'The supplier or vendor receives the purchase order so both sides have a shared record of the requested order.',
      ],
    ],
    h1: 'Purchase Order Generator',
    intro: 'Make supplier requests easier to review with a purchase order built around the details that matter.',
    bullets: ['Supplier and delivery details', 'Requested items and quantities', 'Order totals and notes'],
  },

  // ── Template hub ──────────────────────────────────────────────────────────────
  {
    path: '/templates',
    title: 'Invoice Templates | Free Professional Document Templates',
    description:
      'Browse free Invoice Focus templates for invoices, quotes, estimates, receipts, credit notes, and purchase orders in three visual families.',
    indexable: true,
    h1: 'Free Professional Document Templates',
    intro:
      'Browse Invoice Focus templates across three visual families — minimal, professional, and enterprise — for invoices, quotes, estimates, receipts, credit notes, and purchase orders.',
    bullets: [
      'Minimal — focused layout that highlights the essentials',
      'Professional — balanced hierarchy for client-ready documents',
      'Enterprise — structured sections with higher contrast',
      'Available for all six document types',
    ],
  },

  // ── Template pages ────────────────────────────────────────────────────────────
  {
    path: '/invoice-template',
    title: 'Invoice Templates | Choose a Professional Invoice Design',
    description:
      'Explore Invoice Focus invoice template families, compare their visual rhythm, and open the invoice generator with your choice.',
    indexable: true,
    h1: 'Invoice Templates',
    intro: 'Explore Invoice Focus invoice template families and choose a visual starting point for your next invoice.',
    bullets: ['Minimal invoice template', 'Professional invoice template', 'Enterprise invoice template'],
  },
  {
    path: '/receipt-template',
    title: 'Receipt Templates | Clear Payment Confirmation Designs',
    description:
      'Explore Invoice Focus receipt templates and choose a clear visual starting point for recording a completed payment.',
    indexable: true,
    h1: 'Receipt Templates',
    intro: 'Explore Invoice Focus receipt templates and choose a clear visual starting point for recording a completed payment.',
    bullets: ['Minimal receipt template', 'Professional receipt template', 'Enterprise receipt template'],
  },
  {
    path: '/estimate-template',
    title: 'Estimate Templates | Project Cost Estimate Designs',
    description:
      'Explore Invoice Focus estimate templates for presenting expected project work, costs, notes, and totals clearly.',
    indexable: true,
    h1: 'Estimate Templates',
    intro: 'Explore Invoice Focus estimate templates for presenting expected project work, costs, notes, and totals clearly.',
    bullets: ['Minimal estimate template', 'Professional estimate template', 'Enterprise estimate template'],
  },
  {
    path: '/quote-template',
    title: 'Quote Templates | Professional Client Quote Designs',
    description:
      'Explore Invoice Focus quote templates for presenting scope, pricing, and projected work before a client engagement begins.',
    indexable: true,
    h1: 'Quote Templates',
    intro:
      'Explore Invoice Focus quote templates for presenting scope, pricing, and projected work before a client engagement begins.',
    bullets: ['Minimal quote template', 'Professional quote template', 'Enterprise quote template'],
  },
  {
    path: '/credit-note-template',
    title: 'Credit Note Templates | Billing Adjustment Designs',
    description:
      'Explore Invoice Focus credit note templates for documenting billing adjustments with clear references and credited amounts.',
    indexable: true,
    h1: 'Credit Note Templates',
    intro:
      'Explore Invoice Focus credit note templates for documenting billing adjustments with clear references and credited amounts.',
    bullets: ['Minimal credit note template', 'Professional credit note template', 'Enterprise credit note template'],
  },
  {
    path: '/purchase-order-template',
    title: 'Purchase Order Templates | Supplier Order Designs',
    description:
      'Explore Invoice Focus purchase order templates for clear supplier requests, delivery details, and requested items.',
    indexable: true,
    h1: 'Purchase Order Templates',
    intro: 'Explore Invoice Focus purchase order templates for clear supplier requests, delivery details, and requested items.',
    bullets: [
      'Minimal purchase order template',
      'Professional purchase order template',
      'Enterprise purchase order template',
    ],
  },

  // ── Marketing pages ───────────────────────────────────────────────────────────
  {
    path: '/how-it-works',
    title: 'How Invoice Focus Works | From Details to PDF',
    description:
      'See how Invoice Focus takes you from document type and business details to a reviewed, professional PDF ready to share.',
    indexable: true,
    h1: 'How Invoice Focus Works',
    intro:
      'Invoice Focus takes you from choosing a document type and adding your details to a reviewed, professional PDF ready to share.',
    bullets: [
      'Choose the document type — invoice, quote, estimate, receipt, credit note, or purchase order',
      'Pick a visual template family — minimal, professional, or enterprise',
      'Add your business details, client information, and line items',
      'Preview the document, make adjustments, and export as a PDF',
    ],
  },
  {
    path: '/features',
    title: 'Invoice Focus Features | Documents and Templates',
    description:
      'See the real Invoice Focus features for creating invoices, quotes, estimates, receipts, credit notes, and purchase orders.',
    indexable: true,
    showSoftwareApp: true,
    faq: [
      [
        'Does Invoice Focus replace accounting advice?',
        'No. It is a document creation tool, not accounting, tax, or legal advice. Use your own professional guidance for obligations specific to your business.',
      ],
      [
        'Can I choose how a document looks?',
        'Yes. The available template families give you a starting visual direction while you prepare the document.',
      ],
    ],
    h1: 'Invoice Focus Features',
    intro:
      'Invoice Focus is a focused document creation tool for invoices, quotes, estimates, receipts, credit notes, and purchase orders.',
    bullets: [
      'Six document types: invoice, quote, estimate, receipt, credit note, and purchase order',
      'Three visual families: minimal, professional, and enterprise',
      'PDF export for every document',
      'Reusable business and client details',
    ],
  },
  {
    path: '/about',
    title: 'About Invoice Focus | Focused Invoicing Software',
    description:
      'Learn what Invoice Focus is, who it is built for, and how it makes everyday business document creation more focused.',
    indexable: true,
    h1: 'About Invoice Focus',
    intro:
      'Invoice Focus is a focused online workspace for creating professional business documents. Built for freelancers, agencies, consultants, and small businesses that need clean billing documents without complicated software.',
    bullets: [
      'Free invoice generator for professional use',
      'Supports invoices, quotes, estimates, receipts, credit notes, and purchase orders',
      'Three visual template families for every style',
      'Export to PDF in one step',
    ],
  },
  {
    path: '/contact',
    title: 'Contact Invoice Focus | Product and Support Questions',
    description:
      'Contact Invoice Focus for product questions, partnerships, and support with your invoicing and business document workflow.',
    indexable: true,
    h1: 'Contact Invoice Focus',
    intro:
      'Reach out with product questions, partnership inquiries, or support requests about your invoicing and business document workflow.',
    bullets: [],
  },
  {
    path: '/help',
    title: 'Invoice Focus Help Center | Invoicing and Account Guides',
    description:
      'Find practical help for creating invoices, using templates, exporting PDFs, and managing your Invoice Focus account.',
    indexable: true,
    h1: 'Invoice Focus Help Center',
    intro:
      'Find practical help for creating invoices, using templates, exporting PDFs, and managing your Invoice Focus account.',
    bullets: [
      'Getting started with the invoice generator',
      'Choosing and using templates',
      'Exporting documents as PDF',
      'Managing business and client details',
    ],
  },
  {
    path: '/blog',
    title: 'Invoice Focus Journal | Invoicing and Business Guides',
    description:
      'Read practical Invoice Focus articles about invoicing, freelancing, small business documents, and focused work.',
    indexable: true,
    h1: 'Invoice Focus Journal',
    intro: 'Practical articles about invoicing, freelancing, small business documents, and focused work.',
    bullets: [
      'What to Include on an Invoice: A Practical Checklist',
      'Invoice vs Receipt: What Is the Difference?',
      'Quote vs Estimate vs Invoice: When Should You Use Each?',
      'How to Follow Up on an Overdue Invoice Without Damaging the Relationship',
    ],
  },

  // ── Blog articles ─────────────────────────────────────────────────────────────
  // Mirrors BLOG_ARTICLES in src/app/(marketing)/blog-content.ts
  {
    path: '/blog/what-to-include-on-an-invoice',
    title: 'What to Include on an Invoice: A Practical Checklist | Invoice Focus Journal',
    description:
      'Use this practical invoice checklist to include the details clients need, explain the work clearly, and make payment easier to process.',
    indexable: true,
    type: 'article',
    articleDate: '2026-08-05',
    articleSection: 'Invoicing basics',
    h1: 'What to Include on an Invoice: A Practical Checklist',
    intro:
      'A useful invoice answers four questions quickly: who is charging, who is being charged, what was provided, and how much is due. The exact requirements can vary by country, tax registration, and business type, but a clear structure helps every client review and process the document.',
    bullets: [
      'Business name, address, and contact details',
      'Client name and billing details',
      'Unique invoice number and issue date',
      'Clear line items with descriptions and amounts',
      'Subtotal, tax where applicable, and total due',
      'Payment terms and instructions',
    ],
  },
  {
    path: '/blog/invoice-vs-receipt',
    title: 'Invoice vs Receipt: What Is the Difference? | Invoice Focus Journal',
    description:
      'Understand when to send an invoice, when to issue a receipt, and how the two documents fit together in a simple payment workflow.',
    indexable: true,
    type: 'article',
    articleDate: '2026-08-06',
    articleSection: 'Business documents',
    h1: 'Invoice vs Receipt: What Is the Difference?',
    intro:
      'An invoice asks for payment. A receipt confirms that payment was received. They can describe the same transaction at different moments, but they serve different jobs, so using the right document helps your client and your own records stay clear.',
    bullets: [
      'Invoice — sent before payment; requests an amount due',
      'Receipt — issued after payment; confirms what was received',
      'A receipt is not a replacement for an invoice when payment is still owed',
    ],
  },
  {
    path: '/blog/quote-vs-estimate-vs-invoice',
    title: 'Quote vs Estimate vs Invoice: When Should You Use Each? | Invoice Focus Journal',
    description:
      'A practical guide to choosing a quote, estimate, or invoice at each stage of a project, with examples for freelancers and small businesses.',
    indexable: true,
    type: 'article',
    articleDate: '2026-08-07',
    articleSection: 'Project workflow',
    h1: 'Quote vs Estimate vs Invoice: When Should You Use Each?',
    intro:
      'Quotes, estimates, and invoices are not interchangeable steps in a project. A quote or estimate helps a client understand expected work and cost before the engagement is underway. An invoice requests payment for work, items, or a milestone that is now due.',
    bullets: [
      'Quote — before the client decides; describes proposed work and pricing',
      'Estimate — before the final scope is certain; shows expected range or cost',
      'Invoice — when payment is due; requests an amount for completed work or a milestone',
    ],
  },
  {
    path: '/blog/how-to-follow-up-on-an-overdue-invoice',
    title:
      'How to Follow Up on an Overdue Invoice Without Damaging the Relationship | Invoice Focus Journal',
    description:
      'Use a calm, practical follow-up sequence for overdue invoices, including timing, message examples, and the details to check first.',
    indexable: true,
    type: 'article',
    articleDate: '2026-08-08',
    articleSection: 'Getting paid',
    h1: 'How to Follow Up on an Overdue Invoice Without Damaging the Relationship',
    intro:
      'An overdue invoice creates pressure, but the first follow-up does not need to sound like a confrontation. A clear sequence gives the client a chance to resolve a missed detail while giving you a consistent way to protect your cash flow and time.',
    bullets: [
      'Check the invoice details before following up',
      'Send a friendly reminder shortly after the due date',
      'Follow up with specific payment details if there is no response',
      'Separate a dispute from a delay and respond to each differently',
    ],
  },

  // ── Legal / status pages ──────────────────────────────────────────────────────
  {
    path: '/privacy',
    title: 'Privacy Policy | Invoice Focus',
    description:
      'Read the Invoice Focus privacy policy and learn how information used by the invoicing service is handled.',
    indexable: true,
    h1: 'Privacy Policy',
    intro:
      'Read the Invoice Focus privacy policy to understand how information used by the invoicing service is collected, stored, and handled.',
    bullets: [],
  },
  {
    path: '/terms',
    title: 'Terms of Service | Invoice Focus',
    description: 'Read the Invoice Focus terms of service for using the free online business document application.',
    indexable: true,
    h1: 'Terms of Service',
    intro: 'Read the Invoice Focus terms of service for using the free online business document application.',
    bullets: [],
  },
  {
    path: '/cookies',
    title: 'Cookie Notice | Invoice Focus',
    description:
      'Read the Invoice Focus cookie notice and learn how browser technologies may support account access and security.',
    indexable: true,
    h1: 'Cookie Notice',
    intro:
      'Read the Invoice Focus cookie notice to understand how browser technologies may support account access and security.',
    bullets: [],
  },
  {
    path: '/status',
    title: 'Invoice Focus Status | Service Availability',
    description:
      'Check the current operational status of the Invoice Focus application and services supporting your document workflow.',
    indexable: true,
    h1: 'Invoice Focus Status',
    intro:
      'Check the current operational status of the Invoice Focus application and services supporting your document workflow.',
    bullets: [],
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Escape special HTML characters for attribute values and text content. */
function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Build the schema.org JSON-LD graph for a route, mirroring RouteSeo.tsx. */
function buildJsonLd(route) {
  const canonicalUrl = `${SITE_URL}${route.path}`
  const breadcrumbLabels = route.path.split('/').filter(Boolean)
  const breadcrumbs = [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
    ...(breadcrumbLabels.length > 0
      ? [
          {
            '@type': 'ListItem',
            position: 2,
            name: route.title.split(' | ')[0],
            item: canonicalUrl,
          },
        ]
      : []),
  ]

  const graph = [
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
    ...(route.showSoftwareApp
      ? [
          {
            '@type': 'SoftwareApplication',
            name: 'Invoice Focus',
            applicationCategory: 'BusinessApplication',
            applicationSubCategory: 'Business Document Generator',
            operatingSystem: 'Web',
            url: canonicalUrl,
            description: route.description,
            publisher: { '@id': `${SITE_URL}/#organization` },
          },
        ]
      : []),
    ...(route.faq
      ? [
          {
            '@type': 'FAQPage',
            url: canonicalUrl,
            mainEntity: route.faq.map(([question, answer]) => ({
              '@type': 'Question',
              name: question,
              acceptedAnswer: { '@type': 'Answer', text: answer },
            })),
          },
        ]
      : []),
    ...(route.type === 'article'
      ? [
          {
            '@type': 'Article',
            headline: route.title.split(' | ')[0],
            description: route.description,
            datePublished: route.articleDate,
            articleSection: route.articleSection,
            mainEntityOfPage: canonicalUrl,
            author: { '@type': 'Organization', name: SITE_NAME },
            publisher: { '@id': `${SITE_URL}/#organization` },
          },
        ]
      : []),
    ...(route.indexable
      ? [
          {
            '@type': 'BreadcrumbList',
            itemListElement: breadcrumbs,
          },
        ]
      : []),
  ]

  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }, null, 2)
}

/** Build the crawlable fallback content block for a route. */
function buildFallbackContent(route) {
  const lines = []
  lines.push(`    <header>`)
  lines.push(`      <h1>${esc(route.h1)}</h1>`)
  lines.push(`      <p>${esc(route.intro)}</p>`)
  lines.push(`    </header>`)

  if (route.bullets && route.bullets.length > 0) {
    lines.push(`    <section>`)
    lines.push(`      <ul>`)
    for (const bullet of route.bullets) {
      lines.push(`        <li>${esc(bullet)}</li>`)
    }
    lines.push(`      </ul>`)
    lines.push(`    </section>`)
  }

  if (route.faq && route.faq.length > 0) {
    lines.push(`    <section>`)
    lines.push(`      <h2>Frequently asked questions</h2>`)
    for (const [q, a] of route.faq) {
      lines.push(`      <article>`)
      lines.push(`        <h3>${esc(q)}</h3>`)
      lines.push(`        <p>${esc(a)}</p>`)
      lines.push(`      </article>`)
    }
    lines.push(`    </section>`)
  }

  return lines.join('\n')
}

/**
 * Inject route-specific metadata and fallback content into the base HTML.
 * Uses attribute-based regex matching so it works on both minified and
 * unminified Vite build output (comments are stripped in production builds).
 */
function inject(templateHtml, route) {
  let html = templateHtml
  const canonicalUrl = `${SITE_URL}${route.path}`

  // 1. <title>
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(route.title)}</title>`)

  // 2. <meta name="description"> — handle both inline and multiline attribute order
  html = html.replace(
    /<meta\s[^>]*name="description"[^>]*>/,
    `<meta name="description" content="${esc(route.description)}" />`
  )

  // 3. <meta name="robots">
  html = html.replace(
    /<meta\s[^>]*name="robots"[^>]*>/,
    `<meta name="robots" content="${route.indexable ? 'index, follow' : 'noindex, nofollow'}" />`
  )

  // 4. <link rel="canonical"> — replace or remove for noindex routes
  if (route.indexable) {
    html = html.replace(
      /<link\s[^>]*rel="canonical"[^>]*>/,
      `<link rel="canonical" href="${canonicalUrl}" />`
    )
  } else {
    html = html.replace(/<link\s[^>]*rel="canonical"[^>]*>/, '')
  }

  // 5. Open Graph tags — replace each property individually
  for (const [prop, value] of [
    ['og:type', route.type ?? 'website'],
    ['og:site_name', SITE_NAME],
    ['og:url', canonicalUrl],
    ['og:title', route.title],
    ['og:description', route.description],
    ['og:image', DEFAULT_IMAGE],
    ['og:image:alt', 'Invoice Focus logo'],
  ]) {
    // Remove any og:image:width / og:image:height tags that don't vary per route
    if (prop === 'og:image') {
      html = html
        .replace(/<meta\s[^>]*property="og:image:width"[^>]*>/, '')
        .replace(/<meta\s[^>]*property="og:image:height"[^>]*>/, '')
    }
    html = html.replace(
      new RegExp(`<meta\\s[^>]*property="${prop}"[^>]*>`),
      `<meta property="${prop}" content="${esc(value)}" />`
    )
  }

  // 6. Twitter tags — replace each name individually
  for (const [name, value] of [
    ['twitter:card', 'summary_large_image'],
    ['twitter:title', route.title],
    ['twitter:description', route.description],
    ['twitter:image', DEFAULT_IMAGE],
    ['twitter:image:alt', 'Invoice Focus logo'],
  ]) {
    html = html.replace(
      new RegExp(`<meta\\s[^>]*name="${name}"[^>]*>`),
      `<meta name="${name}" content="${esc(value)}" />`
    )
  }

  // 7. JSON-LD — replace the entire <script type="application/ld+json"> block.
  //    There is exactly one such block in the template (homepage schema).
  const jsonLd = buildJsonLd(route)
  html = html.replace(
    /<script\s[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/,
    `<script id="invoicefocus-site-schema" type="application/ld+json">\n${jsonLd}\n</script>`
  )

  // 8. Crawlable fallback div — replace content between the opening tag and the
  //    closing </div> that immediately precedes <div id="root">.
  //    The \s* handles both minified (no whitespace) and formatted output.
  const fallbackContent = buildFallbackContent(route)
  html = html.replace(
    /(<div id="seo-fallback"[^>]*>)[\s\S]*?(<\/div>\s*<div id="root")/,
    `$1\n${fallbackContent}\n    $2`
  )

  return html
}

/** Return the output filesystem path for a route path. */
function getOutputPath(routePath) {
  if (routePath === '/') return join(DIST, 'index.html')
  // Strip leading slash; blog/slug → blog/slug.html; slug → slug.html
  const rel = routePath.slice(1)
  return join(DIST, rel + '.html')
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const templateHtml = readFileSync(join(DIST, 'index.html'), 'utf-8')
let count = 0

for (const route of ROUTES) {
  const outputPath = getOutputPath(route.path)
  mkdirSync(dirname(outputPath), { recursive: true })

  const html = inject(templateHtml, route)
  writeFileSync(outputPath, html, 'utf-8')

  const rel = outputPath.replace(DIST + '/', '')
  console.log(`  prerendered ${route.path.padEnd(50)} → ${rel}`)
  count++
}

console.log(`\nPrerender complete: ${count} routes written to ${DIST}`)
