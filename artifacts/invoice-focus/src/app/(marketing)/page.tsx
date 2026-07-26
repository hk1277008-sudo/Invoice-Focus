import { Logo } from '@/components/shared/Logo'

export default function HomePage() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <Logo size="lg" markOnly />
        <div className="space-y-1.5">
          <h1 className="font-display text-4xl font-bold tracking-tight text-foreground">
            Invoice Focus
          </h1>
          <p className="text-base text-muted-foreground">Coming Soon</p>
        </div>
      </div>
    </div>
  )
}
