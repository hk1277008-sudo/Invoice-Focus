# Invoice Focus public SEO route audit

This is a point-in-time audit of the public route metadata and crawl
configuration. It covers the generated production HTML from
`artifacts/invoice-focus/scripts/prerender.mjs`, the runtime metadata in
`src/components/seo/RouteSeo.tsx`, and the live canonical domain.

## Summary

- **Indexable public pages:** 28
- **Unique titles:** 28
- **Unique meta descriptions:** 28
- **Direct generated route documents:** 33
- **Intentionally noindexed routes:** 5 authentication routes
- **Sitemap URLs:** 28
- **Sitemap XML:** Valid
- **Sitemap duplicates or private routes:** None
- **Robots blocking important public pages:** None
- **Duplicate-title warning reproduced:** No
- **Duplicate-description warning reproduced:** No
- **Pages intentionally removed:** None

All 28 sitemap URLs returned HTTP 200 from `https://invoicefocus.com` during
the audit. Each generated route document has exactly one H1 and each
indexable route has a self-referencing canonical using the canonical domain.

## Indexable public routes

| URL | Title | Meta description | H1 | Canonical | Unique content / search intent |
|---|---|---|---|---|---|
| `/` | Free Invoice Generator \| Invoice Focus | Create professional invoices, quotes, estimates, receipts, and purchase orders with Invoice Focus, a free online document generator. | Free Invoice Generator for Freelancers and Small Businesses | `https://invoicefocus.com/` | Yes — primary free business-document generator intent; not a duplicate of the individual generators. |
| `/templates` | Invoice Templates \| Free Professional Document Templates | Browse free Invoice Focus templates for invoices, quotes, estimates, receipts, credit notes, and purchase orders in three visual families. | Free Professional Document Templates | `https://invoicefocus.com/templates` | Yes — multi-document template directory intent. |
| `/features` | Invoice Focus Features \| Documents and Templates | See the real Invoice Focus features for creating invoices, quotes, estimates, receipts, credit notes, and purchase orders. | Invoice Focus Features | `https://invoicefocus.com/features` | Yes — product capability overview, distinct from generator and template pages. |
| `/how-it-works` | How Invoice Focus Works \| From Details to PDF | See how Invoice Focus takes you from document type and business details to a reviewed, professional PDF ready to share. | How Invoice Focus Works | `https://invoicefocus.com/how-it-works` | Yes — workflow education intent. |
| `/invoice-generator` | Invoice Generator \| Create Free Professional Invoices | Create a professional invoice online with clear line items, totals, client details, and a focused workflow for your next payment request. | Invoice Generator | `https://invoicefocus.com/invoice-generator` | Yes — invoice creation intent. |
| `/receipt-generator` | Receipt Generator \| Create Clear Payment Receipts | Create a clear receipt online to record payments, client details, items, and confirmation in a professional document. | Receipt Generator | `https://invoicefocus.com/receipt-generator` | Yes — receipt creation intent. |
| `/estimate-generator` | Estimate Generator \| Create Project Cost Estimates | Create a useful project estimate online with expected items, rates, notes, and totals before work begins. | Estimate Generator | `https://invoicefocus.com/estimate-generator` | Yes — estimate creation intent. |
| `/quote-generator` | Quote Generator \| Create Professional Client Quotes | Create a client-ready quote online with scope, line items, rates, and projected totals before you begin the work. | Quote Generator | `https://invoicefocus.com/quote-generator` | Yes — quote creation intent. |
| `/credit-note-generator` | Credit Note Generator \| Document Billing Adjustments | Create a clear credit note online to record an adjustment, credited amount, reference details, and reason. | Credit Note Generator | `https://invoicefocus.com/credit-note-generator` | Yes — credit-note creation and billing-adjustment intent. |
| `/purchase-order-generator` | Purchase Order Generator \| Create Supplier Orders | Create a structured purchase order online with supplier, delivery, item, quantity, and order details. | Purchase Order Generator | `https://invoicefocus.com/purchase-order-generator` | Yes — supplier purchase-order creation intent. |
| `/invoice-template` | Invoice Templates \| Choose a Professional Invoice Design | Explore Invoice Focus invoice template families, compare their visual rhythm, and open the invoice generator with your choice. | Invoice Templates | `https://invoicefocus.com/invoice-template` | Yes — invoice template selection intent; distinct from `/invoice-generator`. |
| `/receipt-template` | Receipt Templates \| Clear Payment Confirmation Designs | Explore Invoice Focus receipt templates and choose a clear visual starting point for recording a completed payment. | Receipt Templates | `https://invoicefocus.com/receipt-template` | Yes — receipt template selection intent. |
| `/estimate-template` | Estimate Templates \| Project Cost Estimate Designs | Explore Invoice Focus estimate templates for presenting expected project work, costs, notes, and totals clearly. | Estimate Templates | `https://invoicefocus.com/estimate-template` | Yes — estimate template selection intent. |
| `/quote-template` | Quote Templates \| Professional Client Quote Designs | Explore Invoice Focus quote templates for presenting scope, pricing, and projected work before a client engagement begins. | Quote Templates | `https://invoicefocus.com/quote-template` | Yes — quote template selection intent. |
| `/credit-note-template` | Credit Note Templates \| Billing Adjustment Designs | Explore Invoice Focus credit note templates for documenting billing adjustments with clear references and credited amounts. | Credit Note Templates | `https://invoicefocus.com/credit-note-template` | Yes — credit-note template selection intent. |
| `/purchase-order-template` | Purchase Order Templates \| Supplier Order Designs | Explore Invoice Focus purchase order templates for clear supplier requests, delivery details, and requested items. | Purchase Order Templates | `https://invoicefocus.com/purchase-order-template` | Yes — purchase-order template selection intent. |
| `/about` | About Invoice Focus \| Focused Invoicing Software | Learn what Invoice Focus is, who it is built for, and how it makes everyday business document creation more focused. | About Invoice Focus | `https://invoicefocus.com/about` | Yes — company/product context intent. |
| `/contact` | Contact Invoice Focus \| Product and Support Questions | Contact Invoice Focus for product questions, partnerships, and support with your invoicing and business document workflow. | Contact Invoice Focus | `https://invoicefocus.com/contact` | Yes — support and contact intent. |
| `/help` | Invoice Focus Help Center \| Invoicing and Account Guides | Find practical help for creating invoices, using templates, exporting PDFs, and managing your Invoice Focus account. | Invoice Focus Help Center | `https://invoicefocus.com/help` | Yes — help and product guidance intent. |
| `/blog` | Invoice Focus Journal \| Invoicing and Business Guides | Read practical Invoice Focus articles about invoicing, freelancing, small business documents, and focused work. | Invoice Focus Journal | `https://invoicefocus.com/blog` | Yes — editorial index intent. |
| `/blog/what-to-include-on-an-invoice` | What to Include on an Invoice: A Practical Checklist \| Invoice Focus Journal | Use this practical invoice checklist to include the details clients need, explain the work clearly, and make payment easier to process. | What to Include on an Invoice: A Practical Checklist | `https://invoicefocus.com/blog/what-to-include-on-an-invoice` | Yes — invoice-content checklist intent; links to invoice and template pages. |
| `/blog/invoice-vs-receipt` | Invoice vs Receipt: What Is the Difference? \| Invoice Focus Journal | Understand when to send an invoice, when to issue a receipt, and how the two documents fit together in a simple payment workflow. | Invoice vs Receipt: What Is the Difference? | `https://invoicefocus.com/blog/invoice-vs-receipt` | Yes — comparison intent; links to invoice, receipt, and receipt-template pages. |
| `/blog/quote-vs-estimate-vs-invoice` | Quote vs Estimate vs Invoice: When Should You Use Each? \| Invoice Focus Journal | A practical guide to choosing a quote, estimate, or invoice at each stage of a project, with examples for freelancers and small businesses. | Quote vs Estimate vs Invoice: When Should You Use Each? | `https://invoicefocus.com/blog/quote-vs-estimate-vs-invoice` | Yes — document-stage comparison intent; links to quote, estimate, invoice, and template pages. |
| `/blog/how-to-follow-up-on-an-overdue-invoice` | How to Follow Up on an Overdue Invoice Without Damaging the Relationship \| Invoice Focus Journal | Use a calm, practical follow-up sequence for overdue invoices, including timing, message examples, and the details to check first. | How to Follow Up on an Overdue Invoice Without Damaging the Relationship | `https://invoicefocus.com/blog/how-to-follow-up-on-an-overdue-invoice` | Yes — overdue-payment workflow intent; links to invoice and template pages. |
| `/privacy` | Privacy Policy \| Invoice Focus | Read the Invoice Focus privacy policy and learn how information used by the invoicing service is handled. | Privacy Policy | `https://invoicefocus.com/privacy` | Yes — legal/privacy information; not a commercial-document page. |
| `/terms` | Terms of Service \| Invoice Focus | Read the Invoice Focus terms of service for using the free online business document application. | Terms of Service | `https://invoicefocus.com/terms` | Yes — service terms; not a commercial-document page. |
| `/cookies` | Cookie Notice \| Invoice Focus | Read the Invoice Focus cookie notice and learn how browser technologies may support account access and security. | Cookie Notice | `https://invoicefocus.com/cookies` | Yes — cookie notice; not a commercial-document page. |
| `/status` | Invoice Focus Status \| Service Availability | Check the current operational status of the Invoice Focus application and services supporting your document workflow. | Invoice Focus Status | `https://invoicefocus.com/status` | Yes — service availability intent; not a commercial-document page. |

## Intentionally noindexed routes

These routes are useful for product access or authentication but are not
organic search landing pages. They are not included in `sitemap.xml` or
`links.txt`.

| URL | Title | H1 | Reason |
|---|---|---|---|
| `/sign-in` | Sign In \| Invoice Focus | Welcome back | Authentication entry point. |
| `/sign-up` | Create Your Account \| Invoice Focus | Create your account | Account creation flow. |
| `/forgot-password` | Reset Your Password \| Invoice Focus | Reset your password | Password recovery request flow. |
| `/reset-password` | Choose a New Password \| Invoice Focus | Choose a new password | Password recovery completion flow. |
| `/verify-email` | Verify Your Email \| Invoice Focus | Email verification | Account verification flow. |

Private dashboard, onboarding, invoice-detail, shared-invoice, and query-driven
generator routes are also excluded from the sitemap. The runtime SEO fallback
marks unknown/private routes `noindex, nofollow`.

## Validation evidence

The audit checks performed against the current build and canonical domain were:

1. Parsed all 33 generated HTML route documents.
2. Confirmed 33 unique titles and 33 unique descriptions across indexable and
   noindex generated routes.
3. Confirmed exactly one H1 per generated route.
4. Confirmed self-referencing canonicals on all 28 indexable routes.
5. Validated `sitemap.xml` as XML with 28 unique URLs.
6. Confirmed no dashboard, onboarding, authentication, invoice-detail, or
   shared-invoice URL is in the sitemap.
7. Requested every sitemap URL from `https://invoicefocus.com`; all returned
   HTTP 200.
8. Confirmed the live canonical domain currently exposes 28 unique titles,
   28 unique descriptions, and correct canonicals.

No metadata or route removals were necessary because the reported duplicate
title and description conditions are not present in the current repository or
live canonical-domain response. The existing route prerendering and auth
noindex configuration should be preserved on the next frontend deployment.