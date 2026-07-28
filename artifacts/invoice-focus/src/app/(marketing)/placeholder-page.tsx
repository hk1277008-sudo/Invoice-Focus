import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react'
import { Link } from 'wouter'
import { MarketingLayout } from './layout'
import { Button } from '@/components/ui/button'

interface PlaceholderPageProps {
  eyebrow: string
  title: string
  description: string
  message?: string
  actionLabel?: string
  actionHref?: string
}

export function PlaceholderPage({
  eyebrow,
  title,
  description,
  message = 'We’re putting the finishing touches on this experience.',
  actionLabel = 'Back to home',
  actionHref = '/',
}: PlaceholderPageProps) {
  return (
    <MarketingLayout>
      <div className="flex flex-1 items-center justify-center px-6 py-20 sm:py-28">
        <div className="w-full max-w-2xl text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </div>
          <p className="label-caps mt-7">{eyebrow}</p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            {title}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
            {description}
          </p>
          <div className="mx-auto mt-8 max-w-md rounded-2xl border border-border/80 bg-card px-6 py-5 shadow-sm">
            <p className="text-sm font-medium text-foreground">{message}</p>
          </div>
          <Button asChild variant="outline" className="mt-8 gap-2">
            <Link href={actionHref}>
              {actionHref === '/' && <ArrowLeft className="h-4 w-4" aria-hidden="true" />}
              {actionLabel}
              {actionHref !== '/' && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
            </Link>
          </Button>
        </div>
      </div>
    </MarketingLayout>
  )
}