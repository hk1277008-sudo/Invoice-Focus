import { BookOpen, HelpCircle, Code2, Newspaper, ArrowRight } from 'lucide-react'

const RESOURCES = [
  {
    icon: BookOpen,
    title: 'Guides',
    description: 'Step-by-step articles on invoicing, taxes, and getting paid faster.',
    href: '/guides',
  },
  {
    icon: HelpCircle,
    title: 'Help Center',
    description: 'Answers to common questions about templates, payments, and accounts.',
    href: '/help',
  },
  {
    icon: Code2,
    title: 'Developer API',
    description: 'Generate invoices and fetch records programmatically with our REST API.',
    href: '/developers',
  },
  {
    icon: Newspaper,
    title: 'Release Notes',
    description: 'See what is new, what is improved, and what is coming next to Invoice Focus.',
    href: '/release-notes',
  },
]

export function Resources() {
  return (
    <section id="resources" className="bg-background">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <span className="label-caps">Resources</span>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Learn, integrate, and get help
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Everything you need to make the most of Invoice Focus, from guides to API docs.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {RESOURCES.map(({ icon: Icon, title, description, href }) => (
            <a
              key={title}
              href={href}
              className="group flex flex-col rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent-foreground">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-lg font-medium text-foreground">{title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                Explore
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
