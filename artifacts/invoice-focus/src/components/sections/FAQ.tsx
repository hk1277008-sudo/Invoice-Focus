import { motion } from 'framer-motion'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const FAQS = [
  {
    question: 'What plans does InvoiceFocus offer?',
    answer:
      'InvoiceFocus offers a straightforward plan structure designed for freelancers, agencies, and businesses. Start with core invoicing tools, then upgrade for advanced features like saved clients, recurring invoices, and team collaboration.',
  },
  {
    question: 'Do I need to install anything?',
    answer:
      'InvoiceFocus runs entirely in your browser. Sign up and start creating invoices from any device with an internet connection.',
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
      <div className="mx-auto max-w-3xl px-6 py-24 lg:py-32">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="label-caps">FAQ</span>
          <h2 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-tight text-foreground md:text-4xl">
            Frequently asked questions
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Common questions about InvoiceFocus.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <Accordion type="single" collapsible className="mt-16">
            {FAQS.map(({ question, answer }, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-border/60">
                <AccordionTrigger className="py-5 text-left text-base font-semibold text-foreground hover:no-underline">
                  {question}
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-sm leading-relaxed text-muted-foreground">
                  {answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  )
}
