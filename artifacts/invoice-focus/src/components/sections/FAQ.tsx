import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const FAQS = [
  {
    question: 'Is Invoice Focus free to use?',
    answer:
      'Yes. You can create and download unlimited invoices without an account. Advanced features like client management, recurring invoices, and online payments require a free account.',
  },
  {
    question: 'Can I send invoices directly to my clients?',
    answer:
      'Yes. Every invoice can be emailed to your client directly from Invoice Focus, or you can copy a secure link and share it however you prefer.',
  },
  {
    question: 'What file formats can I download?',
    answer:
      'Invoices download as polished, print-ready PDFs. You can also preview them in your browser before downloading.',
  },
  {
    question: 'Does Invoice Focus support taxes and discounts?',
    answer:
      'Yes. Add line-item and invoice-level taxes, discounts, and shipping costs. Totals are calculated automatically.',
  },
  {
    question: 'Can my clients pay online?',
    answer:
      'Yes. Connect a payment provider and your clients can pay by card or bank transfer directly from the invoice.',
  },
  {
    question: 'Is my data secure?',
    answer:
      'We use industry-standard encryption, secure hosting, and never sell your data. Invoices are private to your account.',
  },
]

export function FAQ() {
  return (
    <section id="faq" className="bg-muted/30">
      <div className="mx-auto max-w-3xl px-6 py-20 lg:py-28">
        <div className="text-center">
          <span className="label-caps">FAQ</span>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Frequently asked questions
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Quick answers to the most common questions about Invoice Focus.
          </p>
        </div>

        <Accordion type="single" collapsible className="mt-12">
          {FAQS.map(({ question, answer }, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-base font-medium text-foreground">
                {question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
