export type ArticleLink = {
  label: string
  href: string
}

export type ArticleSource = ArticleLink

export type ArticleSection = {
  heading: string
  paragraphs?: string[]
  bullets?: string[]
  steps?: string[]
  table?: {
    headers: string[]
    rows: string[][]
  }
  callout?: string
}

export type BlogArticle = {
  slug: string
  category: string
  title: string
  excerpt: string
  date: string
  readTime: string
  byline: string
  primaryKeyword: string
  intro: string
  sections: ArticleSection[]
  relatedSlugs: string[]
  internalLinks: ArticleLink[]
  sources?: ArticleSource[]
  cta: {
    title: string
    description: string
    label: string
    href: string
  }
}

export const BLOG_ARTICLES: BlogArticle[] = [
  {
    slug: 'what-to-include-on-an-invoice',
    category: 'Invoicing basics',
    title: 'What to Include on an Invoice: A Practical Checklist',
    excerpt: 'Use this practical invoice checklist to include the details clients need, explain the work clearly, and make payment easier to process.',
    date: '2026-08-05',
    readTime: '8 min read',
    byline: 'InvoiceFocus Editorial',
    primaryKeyword: 'what to include on an invoice',
    intro: 'A useful invoice answers four questions quickly: who is charging, who is being charged, what was provided, and how much is due. The exact requirements can vary by country, tax registration, and business type, but a clear structure helps every client review and process the document.',
    sections: [
      {
        heading: 'Start with the identity and reference details',
        paragraphs: [
          'Put your business name, contact details, and the client’s legal or trading name near the top. If you use a business name as a sole trader or operate through a company, check the naming and address requirements that apply where you are registered.',
          'Give the document a unique invoice number and include the issue date. A supply date or service period is also useful when it differs from the date you send the invoice. These references make it easier for both sides to find the right document later.',
        ],
        bullets: [
          'Your business name, address, and contact method',
          'The client’s name and billing details',
          'A unique invoice number or reference',
          'Invoice date and, where relevant, the service or supply date',
        ],
      },
      {
        heading: 'Describe the work so the client can recognize it',
        paragraphs: [
          'A line item should do more than say “services.” Name the deliverable, milestone, time period, or product in language the client already uses. If the work was agreed in a proposal or statement of work, keep the wording consistent enough that the client can connect the invoice to that agreement.',
          'For hourly or quantity-based work, show the quantity and rate. For a fixed project, describe the milestone or deliverable and show the agreed amount. More context is not always better; the goal is enough detail to answer a reasonable question without making the client decode your internal notes.',
        ],
        bullets: [
          'A specific description for each service, product, or milestone',
          'Quantity, hours, units, or dates when they affect the calculation',
          'The rate or unit price where relevant',
          'A reference to a project, purchase order, or approved milestone when useful',
        ],
      },
      {
        heading: 'Show the calculation and the amount due',
        paragraphs: [
          'Keep the math in a predictable order: line-item amounts, subtotal, discounts or adjustments, tax when applicable, and the final amount due. Use one currency and make it obvious which figure the client should pay.',
          'Payment terms should be visible rather than buried in a long note. State the due date or agreed term, the accepted payment method, and the information needed to complete payment. Only add late fees, discounts, or other consequences when they were agreed and are permitted for your situation.',
        ],
        bullets: [
          'Subtotal and any itemized discounts or adjustments',
          'Tax or VAT details when applicable to your business',
          'Total amount due and currency',
          'Due date or payment term',
          'Payment instructions and a useful contact for questions',
        ],
        callout: 'InvoiceFocus is a document creation tool, not tax or legal advice. Confirm country-, state-, and industry-specific requirements with an accountant or other qualified adviser.',
      },
      {
        heading: 'A five-minute invoice review',
        steps: [
          'Compare the client name, project reference, and amount with the agreement or approved scope.',
          'Check every line item for a clear description, quantity, rate, and date where relevant.',
          'Recalculate the subtotal, adjustments, tax, and final amount.',
          'Confirm the due date, currency, payment instructions, and contact details.',
          'Open the exported document once before sending it and make sure the recipient can read it on a normal screen.',
        ],
      },
      {
        heading: 'Common invoice mistakes to avoid',
        bullets: [
          'Sending an invoice with no unique reference, which makes it harder to reconcile.',
          'Using vague descriptions that force the client to guess what the amount covers.',
          'Mixing currencies or displaying a total without saying which currency applies.',
          'Adding a payment deadline that was never discussed.',
          'Changing the amount after sending without clearly referencing the original document.',
        ],
        paragraphs: [
          'A polished visual style helps, but accuracy and context do more of the practical work. Start from a consistent template, then review the details for this specific client and project.',
        ],
      },
    ],
    relatedSlugs: ['invoice-vs-receipt', 'quote-vs-estimate-vs-invoice'],
    internalLinks: [
      { label: 'Create a free invoice', href: '/invoice-generator' },
      { label: 'Browse invoice templates', href: '/invoice-template' },
      { label: 'Compare all document templates', href: '/templates' },
    ],
    sources: [
      { label: 'GOV.UK: What invoices must include', href: 'https://www.gov.uk/invoicing-and-taking-payment-from-customers/invoices-what-they-must-include' },
      { label: 'Stripe: How to invoice as a freelancer', href: 'https://stripe.com/resources/more/how-to-invoice-as-a-freelancer' },
    ],
    cta: {
      title: 'Ready to turn the checklist into an invoice?',
      description: 'Start with the essentials, add the details for this project, and review the finished document before you send it.',
      label: 'Create an invoice',
      href: '/invoice-generator',
    },
  },
  {
    slug: 'invoice-vs-receipt',
    category: 'Business documents',
    title: 'Invoice vs Receipt: What Is the Difference?',
    excerpt: 'Understand when to send an invoice, when to issue a receipt, and how the two documents fit together in a simple payment workflow.',
    date: '2026-08-06',
    readTime: '7 min read',
    byline: 'InvoiceFocus Editorial',
    primaryKeyword: 'invoice vs receipt',
    intro: 'An invoice asks for payment. A receipt confirms that payment was received. They can describe the same transaction at different moments, but they serve different jobs, so using the right document helps your client and your own records stay clear.',
    sections: [
      {
        heading: 'The short answer',
        table: {
          headers: ['Document', 'When it is used', 'What it communicates'],
          rows: [
            ['Invoice', 'Before payment is received', 'This amount is due for the listed work or items.'],
            ['Receipt', 'After payment is received', 'This payment was received for the listed work or items.'],
          ],
        },
        paragraphs: [
          'The timing is the key distinction. An invoice creates a payment request; a receipt records the completed payment. A receipt is not a replacement for an invoice when a client still needs to pay.',
        ],
      },
      {
        heading: 'When to send an invoice',
        paragraphs: [
          'Send an invoice when an amount has become due under your agreement. That might be after delivery, at the end of a billing period, at a project milestone, or according to a recurring schedule. Include the work, amount, currency, due date, and payment instructions the client needs.',
          'For a new project, the invoice usually follows a quote or estimate. Those documents help set expectations before work begins; the invoice records the amount you are actually requesting.',
        ],
        bullets: [
          'A project milestone has been completed',
          'A monthly or recurring billing period has ended',
          'A product or service has been delivered',
          'An agreed deposit, balance, or installment is due',
        ],
      },
      {
        heading: 'When to issue a receipt',
        paragraphs: [
          'Issue a receipt once payment has been received and you can identify what it covers. Show the payer, the paid amount, the date received, the related invoice or reference, and the payment method when that detail is useful.',
          'If a client pays an invoice in installments, you may need a receipt for each payment and a clear record of the remaining balance. Keep the receipt wording accurate: it should confirm only what has actually been paid.',
        ],
        bullets: [
          'The payment date and amount received',
          'The client or payer details',
          'The related invoice or transaction reference',
          'The items or service the payment covers',
          'Any remaining balance when the payment is partial',
        ],
      },
      {
        heading: 'A simple invoice-to-receipt workflow',
        steps: [
          'Agree the scope, price, and payment timing in a quote, estimate, or contract.',
          'Create and send an invoice when the agreed amount is due.',
          'Track whether the payment is full, partial, or still outstanding.',
          'Issue a receipt for the amount actually received.',
          'Keep the invoice and receipt references connected in your records.',
        ],
        callout: 'Document names and tax record requirements vary by location. If you are unsure whether a specific transaction needs additional information, ask a qualified local adviser.',
      },
      {
        heading: 'Avoid these common mix-ups',
        bullets: [
          'Sending a receipt before the payment has cleared or been confirmed.',
          'Calling an unpaid invoice a receipt because the client requested “proof.”',
          'Issuing a receipt for the full amount when only a deposit was paid.',
          'Creating a new invoice instead of referencing the original when a payment is partial.',
        ],
      },
    ],
    relatedSlugs: ['what-to-include-on-an-invoice', 'quote-vs-estimate-vs-invoice'],
    internalLinks: [
      { label: 'Create an invoice', href: '/invoice-generator' },
      { label: 'Create a receipt', href: '/receipt-generator' },
      { label: 'Browse receipt templates', href: '/receipt-template' },
    ],
    cta: {
      title: 'Choose the document that matches the moment.',
      description: 'Create the payment request first, then return to the right document when payment is confirmed.',
      label: 'Explore invoice and receipt tools',
      href: '/templates',
    },
  },
  {
    slug: 'quote-vs-estimate-vs-invoice',
    category: 'Project workflow',
    title: 'Quote vs Estimate vs Invoice: When Should You Use Each?',
    excerpt: 'A practical guide to choosing a quote, estimate, or invoice at each stage of a project, with examples for freelancers and small businesses.',
    date: '2026-08-07',
    readTime: '8 min read',
    byline: 'InvoiceFocus Editorial',
    primaryKeyword: 'quote vs estimate vs invoice',
    intro: 'Quotes, estimates, and invoices are not interchangeable steps in a project. A quote or estimate helps a client understand expected work and cost before the engagement is underway. An invoice requests payment for work, items, or a milestone that is now due.',
    sections: [
      {
        heading: 'The practical difference',
        table: {
          headers: ['Document', 'Best moment to use it', 'Useful question it answers'],
          rows: [
            ['Quote', 'Before the client decides', 'What work and price are you prepared to offer?'],
            ['Estimate', 'Before the final scope or cost is certain', 'What is the expected range or project cost?'],
            ['Invoice', 'When payment is due', 'What amount should the client pay now?'],
          ],
        },
        paragraphs: [
          'Businesses use these terms differently, so the document label alone does not settle the commercial or legal effect. The important habit is to state the scope, assumptions, validity or review date, and next step clearly.',
        ],
      },
      {
        heading: 'Use a quote when the offer is defined',
        paragraphs: [
          'A quote works well when you can describe the proposed work and pricing with reasonable confidence. Include the deliverables, exclusions, price, validity period, expected timing, payment terms, and how the client accepts or approves the offer.',
          'For example, a designer might quote a brand package with a defined number of concepts, revision rounds, and a fixed project price. The client can decide whether that offer fits before work starts.',
        ],
        bullets: [
          'The proposed scope and deliverables',
          'A price or pricing method',
          'Assumptions, exclusions, and expected timing',
          'How long the proposal remains current',
          'The approval or acceptance step',
        ],
      },
      {
        heading: 'Use an estimate when the details may change',
        paragraphs: [
          'An estimate is useful when the project is understood well enough to plan but not precise enough for a final commitment. Explain what the number assumes and what could make the eventual amount higher or lower.',
          'A contractor might estimate materials and labor before opening a wall, or a developer might estimate a feature before the technical requirements are fully tested. The value is honest planning, not false precision.',
        ],
        bullets: [
          'Label the amount as an estimate',
          'List the assumptions behind the projection',
          'Separate known costs from allowances or uncertain work',
          'Explain when the estimate will be reviewed',
          'Confirm how changes will be approved',
        ],
      },
      {
        heading: 'Use an invoice when an amount is due',
        paragraphs: [
          'An invoice should reflect the work, goods, or milestone that has reached a payment point. It can reference the accepted quote or estimate, but it should show the actual amount now requested and the terms for paying it.',
          'If the final scope changes, explain the change rather than quietly carrying an old estimate into the invoice. A short reference to the approval, change order, or revised scope can prevent avoidable questions.',
        ],
      },
      {
        heading: 'A simple three-stage workflow',
        steps: [
          'Clarify the proposed scope with a quote or the expected range with an estimate.',
          'Record approvals, assumptions, exclusions, and changes as the work progresses.',
          'Create an invoice for the completed work or agreed milestone, with the final amount and payment terms.',
        ],
        callout: 'Whether a quote or estimate is binding depends on the wording, agreement, and applicable law. Treat this guide as workflow guidance, not legal advice.',
      },
    ],
    relatedSlugs: ['what-to-include-on-an-invoice', 'invoice-vs-receipt'],
    internalLinks: [
      { label: 'Create a quote', href: '/quote-generator' },
      { label: 'Create an estimate', href: '/estimate-generator' },
      { label: 'Open the invoice generator', href: '/invoice-generator' },
      { label: 'Compare quote and estimate templates', href: '/templates' },
    ],
    cta: {
      title: 'Keep the project stage visible.',
      description: 'Start with the document that matches the conversation today, then move to the next stage when the work and payment moment change.',
      label: 'Browse document templates',
      href: '/templates',
    },
  },
  {
    slug: 'how-to-follow-up-on-an-overdue-invoice',
    category: 'Getting paid',
    title: 'How to Follow Up on an Overdue Invoice Without Damaging the Relationship',
    excerpt: 'Use a calm, practical follow-up sequence for overdue invoices, including timing, message examples, and the details to check first.',
    date: '2026-08-08',
    readTime: '8 min read',
    byline: 'InvoiceFocus Editorial',
    primaryKeyword: 'how to follow up on an overdue invoice',
    intro: 'An overdue invoice creates pressure, but the first follow-up does not need to sound like a confrontation. A clear sequence gives the client a chance to resolve a missed detail while giving you a consistent way to protect your cash flow and time.',
    sections: [
      {
        heading: 'Check the facts before you write',
        paragraphs: [
          'Open the original invoice and confirm the recipient, amount, currency, due date, payment instructions, and delivery channel. Check whether the client has already paid, replied, or asked for a correction. Many awkward follow-ups begin with an avoidable mismatch.',
          'If the due date was based on approval, delivery, or another condition, confirm that condition was met. If the client disputes the work or amount, move from a payment reminder to a focused conversation about the disputed detail.',
        ],
        bullets: [
          'The invoice reached the right person or accounts-payable address',
          'The due date and amount match the agreed terms',
          'Your payment instructions are still correct',
          'No payment, credit, correction request, or reply is waiting in another channel',
        ],
      },
      {
        heading: 'Use a short, respectful sequence',
        steps: [
          'Send a friendly reminder shortly after the due date, attaching the invoice again and asking whether anything is needed to process it.',
          'If there is no response, follow up with the invoice number, amount, original due date, and a specific requested payment date.',
          'For a larger or important account, try a direct call or a second contact while keeping the written record clear.',
          'If the invoice remains unresolved, state the next step you will take under the agreement and ask for a reply by a reasonable date.',
        ],
        callout: 'The exact timing depends on your agreement, client relationship, amount, and local rules. Late fees or collection steps should only be used when properly agreed and appropriate for your situation.',
      },
      {
        heading: 'Message examples you can adapt',
        paragraphs: [
          'Friendly reminder: “Hi [name], I’m checking on invoice [number] for [amount], which was due on [date]. I’ve attached it again for convenience. Could you let me know when it is scheduled for payment, or if anything needs correcting?”',
          'Clear second follow-up: “Hi [name], I’m following up on invoice [number], now overdue from [date]. The outstanding amount is [amount]. Please confirm the expected payment date by [date], or tell me if there is a question about the work or invoice.”',
          'The wording works because it is specific without assuming bad intent. Give the client one easy way to respond and keep the conversation about the document and next action.',
        ],
      },
      {
        heading: 'Separate a dispute from a delay',
        paragraphs: [
          'A delayed payment may be an administrative miss, an approval bottleneck, a cash-flow problem, or a genuine disagreement. Ask a direct question that distinguishes these cases: “Is the invoice approved for payment, or is there a detail you would like us to review?”',
          'If the client identifies an error, correct it transparently and keep a reference to the original. If the work or amount is disputed, document what was agreed and decide whether a revision, credit note, or conversation is the right next step. Do not send repeated automated reminders while a real dispute is unresolved.',
        ],
      },
      {
        heading: 'Make the next invoice easier to collect',
        bullets: [
          'Agree the payment term and billing contact before work begins.',
          'Use a clear invoice reference and consistent subject line.',
          'Invoice at the agreed milestone instead of waiting until project memory fades.',
          'Keep proof of delivery, approval, and changes close to the invoice.',
          'Schedule a weekly review of open invoices so follow-up is a routine, not a crisis.',
        ],
      },
    ],
    relatedSlugs: ['what-to-include-on-an-invoice', 'quote-vs-estimate-vs-invoice'],
    internalLinks: [
      { label: 'Create a clear invoice', href: '/invoice-generator' },
      { label: 'Choose an invoice template', href: '/invoice-template' },
      { label: 'See the full template directory', href: '/templates' },
    ],
    cta: {
      title: 'Make the next payment request easier to act on.',
      description: 'Use a clear invoice reference, visible terms, and a polished document that gives the client fewer reasons to pause.',
      label: 'Create an invoice',
      href: '/invoice-generator',
    },
  },
]