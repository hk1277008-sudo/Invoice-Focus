export type BlogArticle = {
  slug: string
  category: string
  title: string
  excerpt: string
  date: string
  readTime: string
  intro: string
  sections: Array<{ heading: string; paragraphs: string[] }>
  relatedSlugs: string[]
}

export const BLOG_ARTICLES: BlogArticle[] = [
  {
    slug: 'calm-way-to-close-out-a-project',
    category: 'Invoicing',
    title: 'The Calm Way to Close Out a Project',
    excerpt: 'How a simple end-of-project invoicing ritual helps independent teams get paid with confidence.',
    date: '2026-07-18',
    readTime: '5 min read',
    intro: 'The end of a project is a useful moment to make the commercial details as clear as the work itself. A short, repeatable invoicing ritual can reduce missed details and make the handoff easier for everyone.',
    sections: [
      { heading: 'Gather the final context', paragraphs: ['Before opening a document, collect the agreed scope, completed milestones, client details, and payment terms. This gives the invoice a reliable source of truth instead of relying on memory.'] },
      { heading: 'Describe the work plainly', paragraphs: ['Line items should help the recipient understand what the amount represents. Use the language your client already recognizes, and separate milestones or deliverables when that makes the total easier to review.'] },
      { heading: 'Review the next step', paragraphs: ['A final read should confirm the amount, dates, contact details, and payment instructions. Once the document is clear, export it and send it through the channel you already use with the client.'] },
    ],
    relatedSlugs: ['what-to-include-on-every-professional-invoice', 'better-weekly-money-check-in'],
  },
  {
    slug: 'what-to-include-on-every-professional-invoice',
    category: 'Small Business',
    title: 'What to Include on Every Professional Invoice',
    excerpt: 'The details that make an invoice useful to your client and easier to reconcile later.',
    date: '2026-07-09',
    readTime: '6 min read',
    intro: 'A professional invoice does not need to be complicated. It needs to identify the parties, explain the work, show the amount, and make the next step understandable.',
    sections: [
      { heading: 'Identify the document', paragraphs: ['Include a clear document title, invoice number or reference, issue date, and any relevant due date. These details help both sides find the document again.'] },
      { heading: 'Make the work legible', paragraphs: ['Use descriptive line items with quantities and rates where they apply. A client should not have to reconstruct the scope from a vague label or an unexplained total.'] },
      { heading: 'Keep totals and terms visible', paragraphs: ['Show subtotals, taxes, discounts, and the final amount in a consistent order. Add concise payment terms or notes when they help the recipient act.'] },
    ],
    relatedSlugs: ['calm-way-to-close-out-a-project', 'invoice-workflow-for-freelancers'],
  },
  {
    slug: 'better-weekly-money-check-in',
    category: 'Freelancing',
    title: 'A Better Weekly Money Check-In',
    excerpt: 'A lightweight routine for staying on top of outstanding work without turning finance into a full-time job.',
    date: '2026-06-27',
    readTime: '4 min read',
    intro: 'A weekly check-in is not about building a complicated finance system. It is a short opportunity to see what has been completed, what needs a document, and what needs a follow-up.',
    sections: [
      { heading: 'Look at completed work', paragraphs: ['Start with work that has reached a billable point. Decide whether it needs an invoice, receipt, or another document, and capture the relevant context while it is still fresh.'] },
      { heading: 'Separate action from observation', paragraphs: ['Some documents need to be created today; others only need a note for later. Keeping those two categories separate makes the routine easier to finish.'] },
      { heading: 'Use the same review order', paragraphs: ['A consistent order—completed work, open documents, client questions, and next actions—helps a small business stay current without adding unnecessary process.'] },
    ],
    relatedSlugs: ['calm-way-to-close-out-a-project', 'invoice-workflow-for-freelancers'],
  },
  {
    slug: 'invoice-workflow-for-freelancers',
    category: 'Freelancing',
    title: 'A Practical Invoice Workflow for Freelancers',
    excerpt: 'A focused process for choosing the right document, adding context, and reviewing the final handoff.',
    date: '2026-06-19',
    readTime: '5 min read',
    intro: 'Freelancers often move between proposals, project work, and payment follow-up in the same week. A repeatable document workflow keeps those transitions clear without requiring a large operations system.',
    sections: [
      { heading: 'Start with the business moment', paragraphs: ['Use a quote or estimate before work begins, an invoice when an amount is due, and a receipt when payment has been recorded. Choosing the document first keeps the rest of the work focused.'] },
      { heading: 'Reuse the details that stay stable', paragraphs: ['Business identity, client information, and visual preferences should not need to be rebuilt from scratch every time. Begin with a suitable template and then focus on the current engagement.'] },
      { heading: 'Make the handoff easy', paragraphs: ['Before exporting, check the recipient, amount, terms, and contact details. The goal is a document that answers the practical questions without making the client hunt for them.'] },
    ],
    relatedSlugs: ['what-to-include-on-every-professional-invoice', 'better-weekly-money-check-in'],
  },
]