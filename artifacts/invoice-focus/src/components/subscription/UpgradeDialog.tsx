import { useState } from 'react'
import { Check, LockKeyhole } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Link } from 'wouter'

export function UpgradeDialog({ open, onOpenChange, feature, description }: { open: boolean; onOpenChange: (open: boolean) => void; feature?: string; description?: string }) {
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-w-lg">
    <DialogHeader><div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><LockKeyhole className="h-5 w-5" /></div><DialogTitle>{feature || 'Unlock more with InvoiceFocus'}</DialogTitle><DialogDescription>{description || 'This feature is available on a paid plan. Upgrade when you are ready to spend less time on admin and more time on your business.'}</DialogDescription></DialogHeader>
    <div className="rounded-xl border border-primary/20 bg-primary/[0.04] p-4"><p className="font-medium">Pro gives you room to grow</p><ul className="mt-3 space-y-2 text-sm text-muted-foreground"><li className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-primary" />Unlimited invoices and clients</li><li className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-primary" />Recurring invoices and payment reminders</li><li className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-primary" />Business insights and data export</li></ul></div>
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button variant="ghost" onClick={() => onOpenChange(false)}>Maybe Later</Button><Button asChild onClick={() => onOpenChange(false)}><Link href="/dashboard/upgrade">Continue with Pro</Link></Button><Button asChild variant="outline" onClick={() => onOpenChange(false)}><Link href="/dashboard/upgrade?highlight=premium">View Premium</Link></Button></div>
  </DialogContent></Dialog>
}

export function FeatureGate({ feature, description, children }: { feature: string; description?: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return <><button type="button" className="w-full text-left" onClick={() => setOpen(true)}>{children}</button><UpgradeDialog open={open} onOpenChange={setOpen} feature={feature} description={description} /></>
}