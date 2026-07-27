import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const FAQS = [
  {
    question: 'Is InvoiceFocus free to use?',
    answer:
      'Yes. You can create, customize, and download invoices without paying anything. Advanced features like saved clients, recurring invoices, and team collaboration are available on paid plans.',
  },
  {
    question: 'Do I need to install anything?',
    answer:
      'No. InvoiceFocus runs entirely in your browser. Just sign up and start creating invoices from any device with an internet connection.',
  },
  {
    question: 'Can I export invoices as PDFs?',
    answer:
      'Yes. Every invoice, quote, and estimate can be exported as a polished, print-ready PDF with one click.',
  },
  {
    question: 'Does InvoiceFocus support multiple currencies?',
    answer:
      'Yes. You can choose from a wide range of currencies and formats, making it easy to bill clients anywhere in the world.',
  },
  {
    question: 'Can I add my own logo and branding?',
    answer:
      'Yes. Upload your logo, set your brand colors, and customize the business details that appear on every invoice.',
  },
  {
    question: 'Is my data secure?',
    answer:
      'We use industry-standard security practices, including encryption and secure hosting, to keep your invoices and client data safe.',
  },
  {
    question: 'Can I send invoices directly to clients?',
    answer:
      'Yes. You can email invoices directly from InvoiceFocus, copy a secure share link, or download the PDF and send it yourself.',
  },
  {
    question: 'What happens if I cancel my account?',
    answer:
      'You can export your data at any time. If you cancel, your account and data will be removed according to our privacy policy.',
  },
]

export function FAQ() {
  return (
    <section id="faq" className="bg-background">
      <div className="mx-auto max-w-3xl px-6 py-20 lg:py-28">
        <div className="text-center">
          <span className="label-caps">FAQ</span>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Frequently asked questions
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Everything you need to know before getting started.
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
