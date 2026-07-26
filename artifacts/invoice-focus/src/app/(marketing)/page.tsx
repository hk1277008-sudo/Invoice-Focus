import { MarketingLayout } from './layout'
import { Logo } from '@/components/shared/Logo'

export default function HomePage() {
  return (
    <MarketingLayout>
      <div className="flex flex-1 items-center justify-center px-6 py-24">
        <div className="flex flex-col items-center gap-6 text-center">
          <Logo size="lg" markOnly />
          <div className="space-y-2">
            <h1
              className="font-display text-4xl font-bold tracking-tight text-foreground"
            >
              Invoice Focus
            </h1>
            <p className="text-base text-muted-foreground">Coming Soon</p>
          </div>
        </div>
      </div>
    </MarketingLayout>
  )
}
