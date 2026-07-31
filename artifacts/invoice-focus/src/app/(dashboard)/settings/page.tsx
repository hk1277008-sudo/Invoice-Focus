import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'wouter'
import { AlertTriangle, Check, Download, Eye, KeyRound, LockKeyhole, LogOut, Moon, Save, Shield, Sun, Upload, UserRound, RotateCcw } from 'lucide-react'
import { DashboardLayout } from '../layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { applySettingsAppearance, deleteAccount, defaultSettings, exportSettingsData, getSettings, saveSettings, type FontSize, type ThemeMode, type UserSettings } from '@/lib/settings'
import { SubscriptionPlans } from '@/components/subscription/SubscriptionPlans'
import { UsageIndicator } from '@/components/subscription/UsageIndicator'
import { useSubscription } from '@/providers/SubscriptionProvider'
import { UpgradeDialog } from '@/components/subscription/UpgradeDialog'
import { InvoicePresentationControls } from '@/components/invoice/InvoicePresentationControls'
import type { InvoicePresentation } from '@/components/invoice/presentation'
import { saveOnboarding } from '@/lib/onboarding'

const tabs = [
  ['business', 'Business Profile'], ['invoice', 'Invoice Preferences'], ['account', 'Account & Security'],
  ['notifications', 'Notifications'], ['billing', 'Billing & Plans'], ['appearance', 'Appearance'], ['privacy', 'Data & Privacy'],
] as const
type Tab = typeof tabs[number][0]

function useTab(): [Tab, (tab: Tab) => void] {
  const [location, navigate] = useLocation()
  const value = (new URLSearchParams(location.split('?')[1] || '').get('tab') || 'business') as Tab
  return [tabs.some(([key]) => key === value) ? value : 'business', (tab) => navigate(`/dashboard/settings?tab=${tab}`)]
}

function Field({ label, value, onChange, type = 'text', placeholder, error, className = '' }: { label: string; value: string | number; onChange: (value: string) => void; type?: string; placeholder?: string; error?: string; className?: string }) {
  return <div className={`space-y-1.5 ${className}`}><Label>{label}</Label><Input type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} aria-invalid={Boolean(error)} />{error && <p className="text-xs text-destructive">{error}</p>}</div>
}
function ToggleRow({ title, description, checked, onCheckedChange }: { title: string; description: string; checked: boolean; onCheckedChange: (value: boolean) => void }) {
  return <div className="flex items-center justify-between gap-4 border-b border-border py-4 last:border-0"><div><p className="text-sm font-medium">{title}</p><p className="mt-1 text-xs text-muted-foreground">{description}</p></div><Switch checked={checked} onCheckedChange={onCheckedChange} /></div>
}

export default function SettingsPage() {
  const [tab, setTab] = useTab()
  const [settings, setSettings] = useState<UserSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [logoPreview, setLogoPreview] = useState('')
  const { toast } = useToast()

  useEffect(() => { getSettings().then((value) => { setSettings(value); setLogoPreview(value.businessLogo) }).catch((error) => toast({ title: 'Could not load settings', description: error.message, variant: 'destructive' })).finally(() => setLoading(false)) }, [toast])
  useEffect(() => {
    applySettingsAppearance(settings)
  }, [settings.theme, settings.fontSize, settings.compactMode, settings.workspaceAccentColor])

  const update = (key: keyof UserSettings, value: string | number | boolean | InvoicePresentation) => setSettings((current) => ({ ...current, [key]: value }))
  const save = async () => {
    if (!settings.businessName.trim() && tab === 'business') { toast({ title: 'Business name required', description: 'Add a business name before saving.', variant: 'destructive' }); return }
    setSaving(true)
    try {
      const saved = await saveSettings(settings)
      setSettings(saved)
      setLogoPreview(saved.businessLogo)
      toast({ title: 'Settings saved', description: 'Your changes are now applied.' })
    }
    catch (error) { toast({ title: 'Save failed', description: error instanceof Error ? error.message : 'Please try again.', variant: 'destructive' }) }
    finally { setSaving(false) }
  }
  const uploadLogo = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/') || file.size > 2_000_000) { toast({ title: 'Logo not uploaded', description: 'Use an image smaller than 2MB.', variant: 'destructive' }); return }
    const reader = new FileReader()
    reader.onload = () => { const value = String(reader.result); setLogoPreview(value); update('businessLogo', value) }
    reader.readAsDataURL(file)
  }

  if (loading) return <DashboardLayout><div className="mx-auto max-w-6xl animate-pulse space-y-6"><div className="h-10 w-56 rounded bg-muted" /><div className="h-[520px] rounded-xl bg-muted" /></div></DashboardLayout>

  return <DashboardLayout><div className="mx-auto max-w-6xl space-y-8">
     <div><p className="label-caps">Workspace configuration</p><h1 className="mt-2 text-2xl font-semibold tracking-tight">Settings</h1><p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">Manage your business, workspace preferences, and account security.</p></div>
      <div role="tablist" aria-label="Settings sections" className="-mx-1 flex gap-1 overflow-x-auto border-b border-border px-1 pb-px">{tabs.map(([key, label]) => <button key={key} role="tab" aria-selected={tab === key} onClick={() => setTab(key)} className={`min-h-10 shrink-0 whitespace-nowrap rounded-t-lg border-b-2 px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${tab === key ? 'border-primary bg-primary/5 text-primary' : 'border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground'}`}>{label}</button>)}</div>
    <div className="min-w-0">
      {tab === 'business' && <BusinessTab settings={settings} update={update} logoPreview={logoPreview} uploadLogo={uploadLogo} />}
      {tab === 'invoice' && <InvoiceTab settings={settings} update={update} />}
       {tab === 'account' && <AccountTab settings={settings} update={update} />}
      {tab === 'notifications' && <NotificationsTab settings={settings} update={update} />}
      {tab === 'billing' && <BillingTab />}
      {tab === 'appearance' && <AppearanceTab settings={settings} update={update} />}
      {tab === 'privacy' && <PrivacyTab toast={toast} />}
    </div>
     {(tab === 'business' || tab === 'invoice' || tab === 'account' || tab === 'notifications' || tab === 'appearance') && <div className="sticky bottom-4 z-10 flex justify-end rounded-lg border border-border bg-background/95 p-3 shadow-md backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none sm:backdrop-blur-none"><Button onClick={save} disabled={saving} className="w-full gap-2 sm:w-auto"><Save className="h-4 w-4" />{saving ? 'Applying...' : 'Apply Changes'}</Button></div>}
  </div></DashboardLayout>
}

function BusinessTab({ settings, update, logoPreview, uploadLogo }: { settings: UserSettings; update: (key: keyof UserSettings, value: string | number | boolean) => void; logoPreview: string; uploadLogo: (event: React.ChangeEvent<HTMLInputElement>) => void }) {
  return <Card><CardHeader><CardTitle>Business Profile</CardTitle><CardDescription>This information is used as the default business information on new invoices.</CardDescription></CardHeader><CardContent className="space-y-6">
    <div className="flex flex-wrap items-center gap-5"><div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-muted/40">{logoPreview ? <img src={logoPreview} alt="Business logo preview" className="h-full w-full object-contain" /> : <Upload className="h-7 w-7 text-muted-foreground" />}</div><div><input id="business-logo" type="file" accept="image/*" className="sr-only" onChange={uploadLogo} /><Button asChild variant="outline"><label htmlFor="business-logo" className="cursor-pointer"><Upload className="mr-2 h-4 w-4" />Upload Logo</label></Button><p className="mt-1 text-xs text-muted-foreground">PNG, JPG, or SVG. Max 2MB.</p></div></div>
    <div className="grid gap-5 sm:grid-cols-2"><Field label="Business Name" value={settings.businessName} onChange={(value) => update('businessName', value)} placeholder="Your business name" className="sm:col-span-2" /><Field label="Business Email" type="email" value={settings.businessEmail} onChange={(value) => update('businessEmail', value)} /><Field label="Business Phone" type="tel" value={settings.businessPhone} onChange={(value) => update('businessPhone', value)} /><Field label="Website" type="url" value={settings.website} onChange={(value) => update('website', value)} placeholder="https://example.com" /><Field label="Tax ID / VAT Number" value={settings.taxId} onChange={(value) => update('taxId', value)} /><Field label="Business Registration Number" value={settings.registrationNumber} onChange={(value) => update('registrationNumber', value)} /><Field label="Address" value={settings.address} onChange={(value) => update('address', value)} className="sm:col-span-2" /><Field label="City" value={settings.city} onChange={(value) => update('city', value)} /><Field label="State / Province" value={settings.state} onChange={(value) => update('state', value)} /><Field label="Postal Code" value={settings.postalCode} onChange={(value) => update('postalCode', value)} /><Field label="Country" value={settings.country} onChange={(value) => update('country', value)} /></div>
  </CardContent></Card>
}

function InvoiceTab({ settings, update }: { settings: UserSettings; update: (key: keyof UserSettings, value: string | number | boolean | InvoicePresentation) => void }) {
  return <div className="space-y-6"><Card><CardHeader><CardTitle>Invoice Preferences</CardTitle><CardDescription>Set defaults for invoices and recurring schedules.</CardDescription></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2"><Field label="Default Currency" value={settings.defaultCurrency} onChange={(value) => update('defaultCurrency', value.toUpperCase())} placeholder="USD" /><Field label="Default Language" value={settings.defaultLanguage} onChange={(value) => update('defaultLanguage', value)} /><Field label="Default Tax Rate (%)" type="number" value={settings.defaultTaxRate} onChange={(value) => update('defaultTaxRate', Number(value) || 0)} /><Field label="Default Payment Terms" value={settings.defaultPaymentTerms} onChange={(value) => update('defaultPaymentTerms', value)} /><Field label="Default Due Date (days)" type="number" value={settings.defaultDueDays} onChange={(value) => update('defaultDueDays', Number(value) || 0)} /><Field label="Invoice Number Format" value={settings.invoiceNumberFormat} onChange={(value) => update('invoiceNumberFormat', value)} placeholder="INV-{number}" /><Field label="Invoice Prefix" value={settings.invoicePrefix} onChange={(value) => update('invoicePrefix', value)} /><Field label="Starting Invoice Number" type="number" value={settings.startingInvoiceNumber} onChange={(value) => update('startingInvoiceNumber', Number(value) || 1)} /><div className="sm:col-span-2 rounded-xl border border-border p-4"><p className="font-medium">Recurring Invoice Defaults</p><div className="mt-4 grid gap-5 sm:grid-cols-2"><div><Label>Default Time Zone</Label><select value={settings.recurringDefaultTimezone} onChange={(e) => update('recurringDefaultTimezone', e.target.value)} className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm">{Intl.supportedValuesOf('timeZone').map((tz) => <option key={tz}>{tz}</option>)}</select></div><div><Label>Default Frequency</Label><select value={settings.recurringDefaultFrequency} onChange={(e) => update('recurringDefaultFrequency', e.target.value)} className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm">{['daily','weekly','monthly','quarterly','yearly','custom'].map((value) => <option key={value}>{value}</option>)}</select></div><Field label="Default Due Date Offset (days)" type="number" value={settings.recurringDefaultDueDateOffset} onChange={(value) => update('recurringDefaultDueDateOffset', Number(value) || 0)} /><div><Label>Default Generated Status</Label><select value={settings.recurringDefaultInvoiceStatus} onChange={(e) => update('recurringDefaultInvoiceStatus', e.target.value)} className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm">{['Draft','Sent','Paid','Overdue','Cancelled'].map((value) => <option key={value}>{value}</option>)}</select></div><div className="sm:col-span-2 flex items-center gap-2"><Switch checked={settings.recurringDefaultAutoGeneration} onCheckedChange={(value) => update('recurringDefaultAutoGeneration', value)} /><Label>Enable automatic generation by default</Label></div></div></div><div className="sm:col-span-2 space-y-1.5"><Label>Default Notes</Label><Textarea value={settings.defaultNotes} onChange={(event) => update('defaultNotes', event.target.value)} rows={3} /></div><div className="sm:col-span-2 space-y-1.5"><Label>Default Terms & Conditions</Label><Textarea value={settings.defaultTerms} onChange={(event) => update('defaultTerms', event.target.value)} rows={4} /></div></CardContent></Card><InvoicePresentationControls value={settings.invoicePresentation} onChange={(field, value) => update('invoicePresentation', { ...settings.invoicePresentation, [field]: value } as InvoicePresentation)} /></div>
}

 function AccountTab({ settings, update }: { settings: UserSettings; update: (key: keyof UserSettings, value: string | number | boolean | InvoicePresentation) => void }) {
  const { user, refreshSession, signOut } = useAuth()
  const { toast } = useToast()
  const [, navigate] = useLocation()
  const [name, setName] = useState((user?.user_metadata?.full_name as string) || '')
  const [email, setEmail] = useState(user?.email || '')
  const [password, setPassword] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [busy, setBusy] = useState(false)
   const [signingOutOthers, setSigningOutOthers] = useState(false)
   const [avatarUrl, setAvatarUrl] = useState((user?.user_metadata?.avatar_url as string) || '')
   const [uploadingAvatar, setUploadingAvatar] = useState(false)
   const avatarInputRef = useRef<HTMLInputElement>(null)
   const [restartingOnboarding, setRestartingOnboarding] = useState(false)
  const saveAccount = async () => {
    setBusy(true)
    try {
      const sensitiveChange = email !== user?.email || Boolean(password)
      if (sensitiveChange) {
        if (!currentPassword) throw new Error('Enter your current password to confirm this change.')
        if (!user?.email) throw new Error('Your account email is unavailable.')
        const { error: reauthError } = await supabase.auth.signInWithPassword({ email: user.email, password: currentPassword })
        if (reauthError) throw new Error('Current password is incorrect.')
      }
      const updates: { data?: { full_name: string }; email?: string; password?: string } = { data: { full_name: name } }
      if (email !== user?.email) updates.email = email
      if (password) updates.password = password
      const { error } = await supabase.auth.updateUser(updates)
      if (error) throw error
      await refreshSession()
      setPassword('')
      setCurrentPassword('')
      toast({ title: 'Account updated', description: email !== user?.email ? 'Check your inbox to confirm your new email address.' : 'Your account details were saved.' })
    } catch (error) {
      toast({ title: 'Update failed', description: error instanceof Error ? error.message : 'Please try again.', variant: 'destructive' })
    } finally { setBusy(false) }
  }
  const signOutOtherDevices = async () => {
    setSigningOutOthers(true)
    try {
      const { error } = await supabase.auth.signOut({ scope: 'others' })
      if (error) throw error
      toast({ title: 'Other devices signed out', description: 'All other active sessions have been revoked.' })
    } catch (error) {
      toast({ title: 'Could not sign out other devices', description: error instanceof Error ? error.message : 'Please try again.', variant: 'destructive' })
    } finally {
      setSigningOutOthers(false)
    }
  }
   const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
     const file = event.target.files?.[0]
     if (!file || !user) return
     if (!file.type.startsWith('image/') || file.size > 2_000_000) {
       toast({ title: 'Photo not uploaded', description: 'Use an image smaller than 2MB.', variant: 'destructive' })
       return
     }
     setUploadingAvatar(true)
     try {
       const formData = new FormData()
       formData.append('avatar', file)
       const { data: sessionData } = await supabase.auth.getSession()
       const response = await fetch('/api/auth/avatar', {
         method: 'POST',
         headers: sessionData.session?.access_token ? { Authorization: `Bearer ${sessionData.session.access_token}` } : {},
         body: formData,
       })
       const data = await response.json().catch(() => null)
       if (!response.ok || !data?.url) throw new Error(data?.error || 'Could not upload photo')
       const { error } = await supabase.auth.updateUser({ data: { avatar_url: data.url } })
       if (error) throw error
       setAvatarUrl(data.url)
       await refreshSession()
       toast({ title: 'Photo updated', description: 'Your profile photo is now visible across your account.' })
     } catch (error) {
       toast({ title: 'Photo update failed', description: error instanceof Error ? error.message : 'Please try again.', variant: 'destructive' })
     } finally {
       setUploadingAvatar(false)
       if (avatarInputRef.current) avatarInputRef.current.value = ''
     }
   }
   const handleRestartOnboarding = async () => {
     setRestartingOnboarding(true)
     try {
       await saveOnboarding({ completed: false, skipped: false, currentStep: 1 })
       navigate('/onboarding')
     } catch (error) {
       toast({ title: 'Could not restart onboarding', description: error instanceof Error ? error.message : 'Please try again.', variant: 'destructive' })
       setRestartingOnboarding(false)
     }
   }
   const initials = name ? name.split(' ').map((part) => part[0]).join('').toUpperCase().slice(0, 2) : user?.email?.slice(0, 2).toUpperCase() || 'IF'
   return <div className="space-y-6"><Card><CardHeader><CardTitle>Account & Security</CardTitle><CardDescription>Update your identity and sign-in credentials. Sensitive changes require your current password.</CardDescription></CardHeader><CardContent className="space-y-5"><div className="flex items-center gap-4 rounded-xl border border-border p-4"><Avatar className="h-14 w-14"><AvatarImage src={avatarUrl} alt={name || 'Profile'} /><AvatarFallback className="bg-primary/10 font-semibold text-primary">{initials}</AvatarFallback></Avatar><div className="flex-1"><p className="text-sm font-medium">Profile picture</p><p className="mt-1 text-xs text-muted-foreground">JPG, PNG, or GIF up to 2MB.</p></div><input ref={avatarInputRef} type="file" accept="image/*" className="sr-only" onChange={uploadAvatar} /><Button type="button" variant="outline" onClick={() => avatarInputRef.current?.click()} disabled={uploadingAvatar}>{uploadingAvatar ? 'Uploading...' : 'Upload photo'}</Button></div><div className="grid gap-5 sm:grid-cols-2"><Field label="Full Name" value={name} onChange={setName} /><Field label="Email Address" type="email" value={email} onChange={setEmail} /><Field label="Timezone" value={settings.accountTimezone} onChange={(value) => update('accountTimezone', value)} /><Field label="Country" value={settings.accountCountry} onChange={(value) => update('accountCountry', value)} /><Field label="New Password" type="password" value={password} onChange={setPassword} placeholder="Leave blank to keep current password" /><Field label="Current Password (for email/password changes)" type="password" value={currentPassword} onChange={setCurrentPassword} /></div><div className="flex justify-end"><Button onClick={saveAccount} disabled={busy}>{busy ? 'Updating...' : 'Update Account'}</Button></div></CardContent></Card><Card><CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary" />Security Controls</CardTitle><CardDescription>Use your profile and session controls to keep the account current.</CardDescription></CardHeader><CardContent><div className="flex items-center justify-between border-b border-border py-4"><div><p className="text-sm font-medium">Last Login</p><p className="mt-1 text-xs text-muted-foreground">Current session · {user?.email}</p></div><LockKeyhole className="h-4 w-4 text-muted-foreground" /></div><div className="flex flex-wrap gap-3 pt-4"><Button variant="outline" className="gap-2" onClick={signOutOtherDevices} disabled={signingOutOthers}><LogOut className="h-4 w-4" />{signingOutOthers ? 'Signing Out...' : 'Sign Out Other Devices'}</Button><Button variant="outline" className="gap-2" onClick={() => signOut()}><LogOut className="h-4 w-4" />Sign Out</Button></div></CardContent></Card><Card><CardHeader><CardTitle>Onboarding</CardTitle><CardDescription>Restart the setup wizard to review your business profile and workspace configuration.</CardDescription></CardHeader><CardContent><Button variant="outline" className="gap-2" onClick={handleRestartOnboarding} disabled={restartingOnboarding}><RotateCcw className="h-4 w-4" />{restartingOnboarding ? 'Restarting...' : 'Restart Onboarding'}</Button></CardContent></Card></div>
}

function NotificationsTab({ settings, update }: { settings: UserSettings; update: (key: keyof UserSettings, value: string | number | boolean) => void }) {
  return <Card><CardHeader><CardTitle>Notifications</CardTitle><CardDescription>Choose which updates InvoiceFocus sends to your inbox.</CardDescription></CardHeader><CardContent><ToggleRow title="Invoice Sent" description="Receive a confirmation when an invoice is sent." checked={settings.invoiceSentEmails} onCheckedChange={(value) => update('invoiceSentEmails', value)} /><ToggleRow title="Invoice Viewed" description="Know when a client opens a shared invoice." checked={settings.invoiceViewedEmails} onCheckedChange={(value) => update('invoiceViewedEmails', value)} /><ToggleRow title="Invoice Paid" description="Receive a confirmation when an invoice is marked paid." checked={settings.invoicePaidEmails} onCheckedChange={(value) => update('invoicePaidEmails', value)} /><ToggleRow title="Weekly Summary" description="Get a weekly overview of invoice activity and outstanding balances." checked={settings.weeklySummaryEmails} onCheckedChange={(value) => update('weeklySummaryEmails', value)} /><ToggleRow title="Product Updates" description="Hear about useful new InvoiceFocus features." checked={settings.productUpdates} onCheckedChange={(value) => update('productUpdates', value)} /><ToggleRow title="Payment Reminders" description="Get reminders about invoices that are approaching or past due." checked={settings.paymentReminderEmails} onCheckedChange={(value) => update('paymentReminderEmails', value)} /><ToggleRow title="Security Alerts" description="Always receive important security and account notices." checked={settings.securityAlerts} onCheckedChange={(value) => update('securityAlerts', value)} /><ToggleRow title="Marketing Emails" description="Occasional tips and offers from InvoiceFocus." checked={settings.marketingEmails} onCheckedChange={(value) => update('marketingEmails', value)} /></CardContent></Card>
}

function BillingTab() {
  const { subscription } = useSubscription()
  return <div className="space-y-6">
    <Card className="border-primary/30"><CardHeader><div className="flex flex-wrap items-center justify-between gap-3"><div><CardTitle>Billing & Subscription</CardTitle><CardDescription>Manage your plan, invoices, and payment methods.</CardDescription></div><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">Current Plan: {subscription.planName}</span></div></CardHeader><CardContent className="grid gap-6"><div><p className="text-sm text-muted-foreground">Your billing details, payment methods, and plan configuration have moved to a dedicated portal.</p></div><div className="flex"><Button asChild><Link href="/dashboard/billing">Open Billing Portal</Link></Button></div></CardContent></Card>
     <div><div className="mb-5"><h3 className="font-display text-xl font-semibold">Compare plans</h3><p className="mt-1 text-sm text-muted-foreground">Plan changes are applied directly to this workspace during the private beta.</p></div><SubscriptionPlans /></div>
  </div>
}

function AppearanceTab({ settings, update }: { settings: UserSettings; update: (key: keyof UserSettings, value: string | number | boolean) => void }) {
  return <Card><CardHeader><CardTitle>Appearance</CardTitle><CardDescription>Choose how InvoiceFocus looks across your workspace.</CardDescription></CardHeader><CardContent className="space-y-6"><div className="grid gap-4 sm:grid-cols-3">{([['system', 'System Theme', Eye], ['light', 'Light Mode', Sun], ['dark', 'Dark Mode', Moon]] as const).map(([value, label, Icon]) => <button key={value} onClick={() => update('theme', value as ThemeMode)} className={`rounded-xl border p-5 text-left transition-colors ${settings.theme === value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}><Icon className={`h-5 w-5 ${settings.theme === value ? 'text-primary' : 'text-muted-foreground'}`} /><p className="mt-4 font-medium">{label}</p><p className="mt-1 text-xs text-muted-foreground">{value === 'system' ? 'Follow your device preference' : `Use ${value} colors throughout the app`}</p></button>)}</div><div className="grid gap-5 border-t border-border pt-5 sm:grid-cols-3"><div className="space-y-1.5"><Label htmlFor="accent-color">Accent color</Label><div className="flex gap-2"><Input id="accent-color" type="color" value={settings.workspaceAccentColor} onChange={(event) => update('workspaceAccentColor', event.target.value)} className="h-10 w-14 cursor-pointer p-1" /><Input aria-label="Accent color hex value" value={settings.workspaceAccentColor} onChange={(event) => update('workspaceAccentColor', event.target.value)} /></div></div><div className="space-y-1.5"><Label htmlFor="font-size">Font size</Label><select id="font-size" value={settings.fontSize} onChange={(event) => update('fontSize', event.target.value as FontSize)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="small">Small</option><option value="medium">Medium</option><option value="large">Large</option></select></div><div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5"><div><Label htmlFor="compact-mode">Compact mode</Label><p className="mt-1 text-xs text-muted-foreground">Use tighter workspace spacing.</p></div><Switch id="compact-mode" checked={settings.compactMode} onCheckedChange={(value) => update('compactMode', value)} /></div></div></CardContent></Card>
}

function PrivacyTab({ toast }: { toast: ReturnType<typeof useToast>['toast'] }) {
  const { hasFeature } = useSubscription()
  const [deleting, setDeleting] = useState(false)
  const [confirm, setConfirm] = useState('')
  const [exportGateOpen, setExportGateOpen] = useState(false)
  const download = async (filename: string, data: unknown) => { const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.click(); URL.revokeObjectURL(url) }
  const exportData = async (filename: string, key?: 'clients' | 'invoices') => { try { const data = await exportSettingsData(); await download(filename, key ? data[key] : data); toast({ title: 'Account data exported' }) } catch (error) { toast({ title: 'Export failed', description: error instanceof Error ? error.message : 'Please try again.', variant: 'destructive' }) } }
  const requestExport = (filename: string, key?: 'clients' | 'invoices') => { if (!hasFeature('dataExport')) { setExportGateOpen(true); return } void exportData(filename, key) }
  const deleteUser = async () => { if (confirm !== 'DELETE MY ACCOUNT') return; setDeleting(true); try { await deleteAccount(); await supabase.auth.signOut(); window.location.assign('/sign-in') } catch (error) { toast({ title: 'Deletion failed', description: error instanceof Error ? error.message : 'Please try again.', variant: 'destructive' }); setDeleting(false) } }
  return <div className="space-y-6"><UpgradeDialog open={exportGateOpen} onOpenChange={setExportGateOpen} feature="Data export is a Pro feature" description="Take your clients, invoices, and workspace data with you on Pro. Upgrade for data export and other business tools." /><Card><CardHeader><CardTitle>Export Your Data</CardTitle><CardDescription>Download a portable copy of your InvoiceFocus workspace data. Available on Pro and Premium.</CardDescription></CardHeader><CardContent className="flex flex-col gap-3 sm:flex-row"><Button variant="outline" className="gap-2" onClick={() => requestExport('invoicefocus-account-data.json')}><Download className="h-4 w-4" />Export Account Data</Button><Button variant="outline" className="gap-2" onClick={() => requestExport('invoicefocus-clients.json', 'clients')}>Download Client Data</Button><Button variant="outline" className="gap-2" onClick={() => requestExport('invoicefocus-invoices.json', 'invoices')}>Download Invoice Data</Button></CardContent></Card><Card className="border-destructive/30"><CardHeader><CardTitle className="flex items-center gap-2 text-destructive"><AlertTriangle className="h-5 w-5" />Delete Account</CardTitle><CardDescription>Deleting your account permanently removes all invoices, clients, settings, and business data. This cannot be undone.</CardDescription></CardHeader><CardContent className="space-y-4"><Field label="Type DELETE MY ACCOUNT to confirm" value={confirm} onChange={setConfirm} placeholder="DELETE MY ACCOUNT" /><Button variant="destructive" disabled={confirm !== 'DELETE MY ACCOUNT' || deleting} onClick={deleteUser}>{deleting ? 'Deleting Account...' : 'Request Account Deletion'}</Button></CardContent></Card></div>
}