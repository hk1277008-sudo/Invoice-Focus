import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'wouter'
import { AlertTriangle, Check, Download, Eye, LockKeyhole, LogOut, Moon, RotateCcw, Shield, Sun, Upload, UserRound } from 'lucide-react'
import { DashboardLayout } from '../layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { applySettingsAppearance, deleteAccount, defaultSettings, deleteWorkspace, exportSettingsData, getSettings, saveSettings, type FontSize, type ThemeMode, type UserSettings } from '@/lib/settings'
import { useLocation as useNavigateLocation } from 'wouter'
import { saveOnboarding } from '@/lib/onboarding'

const tabs = [
  ['business', 'Business Profile'],
  ['invoice', 'Invoice Preferences'],
  ['account', 'Account & Security'],
  ['notifications', 'Notifications'],
  ['workspace', 'Workspace'],
  ['billing', 'Billing'],
  ['appearance', 'Appearance'],
  ['privacy', 'Data & Privacy'],
] as const
type Tab = typeof tabs[number][0]

function useTab(): [Tab, (tab: Tab) => void] {
  const [location, navigate] = useLocation()
  const value = (new URLSearchParams(location.split('?')[1] || '').get('tab') || 'business') as Tab
  return [tabs.some(([key]) => key === value) ? value : 'business', (tab) => navigate(`/dashboard/settings?tab=${tab}`)]
}

function Field({ label, value, onChange, type = 'text', placeholder, className = '', disabled = false }: { label: string; value: string | number; onChange: (value: string) => void; type?: string; placeholder?: string; className?: string; disabled?: boolean }) {
  return <div className={`space-y-1.5 ${className}`}><Label>{label}</Label><Input type={type} value={value} placeholder={placeholder} disabled={disabled} onChange={(event) => onChange(event.target.value)} /></div>
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return <div className="space-y-1.5"><Label>{label}</Label><select value={value} onChange={(event) => onChange(event.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="" disabled>Select {label.toLowerCase()}</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></div>
}

function ToggleRow({ title, description, checked, onCheckedChange }: { title: string; description: string; checked: boolean; onCheckedChange: (value: boolean) => void }) {
  return <div className="flex items-center justify-between gap-5 border-b border-border py-4 last:border-0"><div><p className="text-sm font-medium">{title}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p></div><Switch checked={checked} onCheckedChange={onCheckedChange} /></div>
}

function SavedStatus({ saving, saved, error }: { saving: boolean; saved: boolean; error: string }) {
  return <span className={`text-xs transition-opacity ${error ? 'text-destructive' : 'text-muted-foreground'}`} aria-live="polite">{error || (saving ? 'Saving changes…' : saved ? 'All changes saved' : '')}</span>
}

export default function SettingsPage() {
  const [tab, setTab] = useTab()
  const [settings, setSettings] = useState<UserSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [logoPreview, setLogoPreview] = useState('')
  const hydrated = useRef(false)
  const lastPersisted = useRef('')
  const savedStatusTimer = useRef<number | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    getSettings().then((value) => {
      setSettings(value)
      setLogoPreview(value.businessLogo)
      lastPersisted.current = JSON.stringify(value)
      hydrated.current = true
    }).catch((error) => {
      toast({ title: 'Could not load settings', description: error.message, variant: 'destructive' })
    }).finally(() => setLoading(false))
  }, [toast])

  useEffect(() => { applySettingsAppearance(settings) }, [settings])

  useEffect(() => {
    if (!hydrated.current) return
    const serialized = JSON.stringify(settings)
    if (serialized === lastPersisted.current) return
    const timer = window.setTimeout(async () => {
      setSaving(true)
      setSaved(false)
      setSaveError('')
      try {
        const saved = await saveSettings(settings)
        lastPersisted.current = JSON.stringify(saved)
        if (JSON.stringify(saved) !== serialized) setSettings(saved)
        setSaved(true)
        if (savedStatusTimer.current) window.clearTimeout(savedStatusTimer.current)
        savedStatusTimer.current = window.setTimeout(() => setSaved(false), 2400)
      } catch (error) {
        setSaveError(error instanceof Error ? error.message : 'Could not save changes')
      } finally {
        setSaving(false)
      }
    }, 650)
    return () => window.clearTimeout(timer)
  }, [settings])

  const update = (key: keyof UserSettings, value: string | number | boolean | UserSettings['invoicePresentation']) => setSettings((current) => ({ ...current, [key]: value }))
  const uploadLogo = (event: React.ChangeEvent<HTMLInputElement>, key: 'businessLogo' | 'workspaceLogo') => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/') || file.size > 2_000_000) {
      toast({ title: 'Logo not uploaded', description: 'Use an image smaller than 2MB.', variant: 'destructive' })
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const value = String(reader.result)
      if (key === 'businessLogo') setLogoPreview(value)
      update(key, value)
    }
    reader.readAsDataURL(file)
  }

  if (loading) return <DashboardLayout><div className="mx-auto max-w-6xl animate-pulse space-y-6"><div className="h-12 w-64 rounded bg-muted" /><div className="h-10 rounded bg-muted" /><div className="h-[560px] rounded-xl bg-muted" /></div></DashboardLayout>

  return <DashboardLayout>
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="label-caps">Workspace configuration</p><h1 className="mt-2 text-2xl font-semibold tracking-tight">Settings</h1><p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">Manage your business, invoice defaults, workspace, and account security.</p></div>
         <div className="flex items-center gap-2"><SavedStatus saving={saving} saved={saved} error={saveError} /></div>
      </div>
      <div role="tablist" aria-label="Settings sections" className="-mx-1 flex gap-1 overflow-x-auto border-b border-border px-1 pb-px">
        {tabs.map(([key, label]) => <button key={key} role="tab" aria-selected={tab === key} onClick={() => setTab(key)} className={`min-h-10 shrink-0 whitespace-nowrap rounded-t-lg border-b-2 px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${tab === key ? 'border-primary bg-primary/5 text-primary' : 'border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground'}`}>{label}</button>)}
      </div>
      {tab === 'business' && <BusinessTab settings={settings} update={update} logoPreview={logoPreview} uploadLogo={uploadLogo} />}
      {tab === 'invoice' && <InvoiceTab settings={settings} update={update} />}
      {tab === 'account' && <AccountTab settings={settings} update={update} />}
      {tab === 'notifications' && <NotificationsTab settings={settings} update={update} />}
      {tab === 'workspace' && <WorkspaceTab settings={settings} update={update} uploadLogo={uploadLogo} />}
      {tab === 'billing' && <BillingTab />}
      {tab === 'appearance' && <AppearanceTab settings={settings} update={update} />}
      {tab === 'privacy' && <PrivacyTab />}
    </div>
  </DashboardLayout>
}

function BusinessTab({ settings, update, logoPreview, uploadLogo }: { settings: UserSettings; update: (key: keyof UserSettings, value: string | number | boolean | UserSettings['invoicePresentation']) => void; logoPreview: string; uploadLogo: (event: React.ChangeEvent<HTMLInputElement>, key: 'businessLogo' | 'workspaceLogo') => void }) {
  return <Card><CardHeader><CardTitle>Business Profile</CardTitle><CardDescription>This information appears on new invoices and client-facing documents.</CardDescription></CardHeader><CardContent className="space-y-6">
    <div className="flex flex-wrap items-center gap-5"><div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-muted/40">{logoPreview ? <img src={logoPreview} alt="Business logo preview" className="h-full w-full object-contain" /> : <Upload className="h-7 w-7 text-muted-foreground" />}</div><div><input id="business-logo" type="file" accept="image/*" className="sr-only" onChange={(event) => uploadLogo(event, 'businessLogo')} /><Button asChild variant="outline"><label htmlFor="business-logo" className="cursor-pointer"><Upload className="mr-2 h-4 w-4" />Upload logo</label></Button><p className="mt-1 text-xs text-muted-foreground">PNG, JPG, or SVG. Max 2MB.</p></div></div>
    <div className="grid gap-5 sm:grid-cols-2"><Field label="Business name" value={settings.businessName} onChange={(value) => update('businessName', value)} className="sm:col-span-2" /><Field label="Business email" type="email" value={settings.businessEmail} onChange={(value) => update('businessEmail', value)} /><Field label="Business phone" type="tel" value={settings.businessPhone} onChange={(value) => update('businessPhone', value)} /><Field label="Website" type="url" value={settings.website} onChange={(value) => update('website', value)} placeholder="https://example.com" /><Field label="Tax ID / VAT number" value={settings.taxId} onChange={(value) => update('taxId', value)} /><Field label="Registration number" value={settings.registrationNumber} onChange={(value) => update('registrationNumber', value)} /><Field label="Address" value={settings.address} onChange={(value) => update('address', value)} className="sm:col-span-2" /><Field label="City" value={settings.city} onChange={(value) => update('city', value)} /><Field label="State / Province" value={settings.state} onChange={(value) => update('state', value)} /><Field label="Postal code" value={settings.postalCode} onChange={(value) => update('postalCode', value)} /><Field label="Country" value={settings.country} onChange={(value) => update('country', value)} /></div>
  </CardContent></Card>
}

function InvoiceTab({ settings, update }: { settings: UserSettings; update: (key: keyof UserSettings, value: string | number | boolean | UserSettings['invoicePresentation']) => void }) {
  return <div className="space-y-6"><Card><CardHeader><CardTitle>Invoice Preferences</CardTitle><CardDescription>These defaults are applied immediately to newly created invoices.</CardDescription></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2">
    <SelectField label="Default currency" value={settings.defaultCurrency} onChange={(value) => update('defaultCurrency', value)} options={['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'NZD', 'INR', 'ZAR']} />
    <SelectField label="Default language" value={settings.defaultLanguage} onChange={(value) => update('defaultLanguage', value)} options={['English', 'French', 'German', 'Spanish', 'Portuguese']} />
    <Field label="Invoice numbering format" value={settings.invoiceNumberFormat} onChange={(value) => update('invoiceNumberFormat', value)} placeholder="INV-{number}" />
    <Field label="Invoice prefix" value={settings.invoicePrefix} onChange={(value) => update('invoicePrefix', value)} placeholder="INV" />
    <SelectField label="Default payment terms" value={settings.defaultPaymentTerms} onChange={(value) => update('defaultPaymentTerms', value)} options={['Due on receipt', 'Net 7', 'Net 15', 'Net 30', 'Net 45', 'Net 60']} />
    <Field label="Due date default (days)" type="number" value={settings.defaultDueDays} onChange={(value) => update('defaultDueDays', Number(value) || 0)} />
    <Field label="Default tax percentage" type="number" value={settings.defaultTaxRate} onChange={(value) => update('defaultTaxRate', Number(value) || 0)} />
    <SelectField label="Default discount behaviour" value={settings.defaultDiscountBehavior} onChange={(value) => update('defaultDiscountBehavior', value)} options={['none', 'percentage']} />
    {settings.defaultDiscountBehavior === 'percentage' && <Field label="Default discount percentage" type="number" value={settings.defaultDiscountPercent} onChange={(value) => update('defaultDiscountPercent', Number(value) || 0)} />}
    <Field label="Starting invoice number" type="number" value={settings.startingInvoiceNumber} onChange={(value) => update('startingInvoiceNumber', Number(value) || 1)} />
    <div className="sm:col-span-2 space-y-1.5"><Label>Default notes</Label><Textarea value={settings.defaultNotes} onChange={(event) => update('defaultNotes', event.target.value)} rows={3} placeholder="Thank you for your business." /></div>
    <div className="sm:col-span-2 space-y-1.5"><Label>Default footer</Label><Textarea value={settings.defaultTerms} onChange={(event) => update('defaultTerms', event.target.value)} rows={3} placeholder="Payment is due according to the terms above." /></div>
  </CardContent></Card></div>
}

function AccountTab({ settings, update }: { settings: UserSettings; update: (key: keyof UserSettings, value: string | number | boolean | UserSettings['invoicePresentation']) => void }) {
  const { user, refreshSession, signOut } = useAuth()
  const { toast } = useToast()
  const [, navigate] = useNavigateLocation()
  const [name, setName] = useState((user?.user_metadata?.full_name as string) || '')
  const [email, setEmail] = useState(user?.email || '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [signingOutOthers, setSigningOutOthers] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [deleting, setDeleting] = useState(false)
  const avatarUrl = (user?.user_metadata?.avatar_url as string) || ''
  const initials = name ? name.split(' ').map((part) => part[0]).join('').toUpperCase().slice(0, 2) : user?.email?.slice(0, 2).toUpperCase() || 'IF'
  const inputRef = useRef<HTMLInputElement>(null)

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return
    if (!file.type.startsWith('image/') || file.size > 2_000_000) { toast({ title: 'Photo not uploaded', description: 'Use an image smaller than 2MB.', variant: 'destructive' }); return }
    try {
      const formData = new FormData(); formData.append('avatar', file)
      const { data } = await supabase.auth.getSession()
      const response = await fetch('/api/auth/avatar', { method: 'POST', headers: data.session?.access_token ? { Authorization: `Bearer ${data.session.access_token}` } : {}, body: formData })
      const body = await response.json().catch(() => null)
      if (!response.ok || !body?.url) throw new Error(body?.error || 'Could not upload photo')
      const { error } = await supabase.auth.updateUser({ data: { avatar_url: body.url } })
      if (error) throw error
      await refreshSession(); toast({ title: 'Profile photo updated' })
    } catch (error) { toast({ title: 'Photo update failed', description: error instanceof Error ? error.message : 'Please try again.', variant: 'destructive' }) }
  }

  const saveAccount = async () => {
    if (newPassword && newPassword !== confirmPassword) { toast({ title: 'Passwords do not match', variant: 'destructive' }); return }
    const sensitive = email !== user?.email || Boolean(newPassword)
    if (sensitive && !currentPassword) { toast({ title: 'Current password required', description: 'Confirm sensitive account changes with your current password.', variant: 'destructive' }); return }
    setBusy(true)
    try {
      if (sensitive) {
        if (!user?.email) throw new Error('Your account email is unavailable.')
        const { error } = await supabase.auth.signInWithPassword({ email: user.email, password: currentPassword })
        if (error) throw new Error('Current password is incorrect.')
      }
      const updates: { data: { full_name: string }; email?: string; password?: string } = { data: { full_name: name } }
      if (email !== user?.email) updates.email = email
      if (newPassword) updates.password = newPassword
      const { error } = await supabase.auth.updateUser(updates)
      if (error) throw error
      if (newPassword) update('passwordLastChangedAt', new Date().toISOString())
      await refreshSession(); setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
      toast({ title: 'Account updated', description: email !== user?.email ? 'Check your inbox to confirm your new email address.' : 'Your account details were saved.' })
    } catch (error) { toast({ title: 'Update failed', description: error instanceof Error ? error.message : 'Please try again.', variant: 'destructive' }) }
    finally { setBusy(false) }
  }

  const signOutOtherDevices = async () => {
    setSigningOutOthers(true)
    try { const { error } = await supabase.auth.signOut({ scope: 'others' }); if (error) throw error; toast({ title: 'Other devices signed out' }) }
    catch (error) { toast({ title: 'Could not sign out other devices', description: error instanceof Error ? error.message : 'Please try again.', variant: 'destructive' }) }
    finally { setSigningOutOthers(false) }
  }

  const confirmDelete = async () => {
    if (deleteConfirmation !== 'DELETE MY ACCOUNT' || !deletePassword || !user?.email) return
    setDeleting(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: user.email, password: deletePassword })
      if (error) throw new Error('Current password is incorrect.')
      await deleteAccount(); await supabase.auth.signOut(); window.location.assign('/sign-in')
    } catch (error) { toast({ title: 'Deletion failed', description: error instanceof Error ? error.message : 'Please try again.', variant: 'destructive' }); setDeleting(false) }
  }

  return <div className="space-y-6">
    <Card><CardHeader><CardTitle>Profile</CardTitle><CardDescription>Update the identity used across your InvoiceFocus workspace.</CardDescription></CardHeader><CardContent className="space-y-5"><div className="flex items-center gap-4 rounded-xl border border-border p-4"><Avatar className="h-14 w-14"><AvatarImage src={avatarUrl} alt={name || 'Profile'} /><AvatarFallback className="bg-primary/10 font-semibold text-primary">{initials}</AvatarFallback></Avatar><div className="flex-1"><p className="text-sm font-medium">Profile photo</p><p className="mt-1 text-xs text-muted-foreground">JPG, PNG, or GIF up to 2MB.</p></div><input ref={inputRef} type="file" accept="image/*" className="sr-only" onChange={uploadAvatar} /><Button variant="outline" onClick={() => inputRef.current?.click()}>Upload photo</Button></div><div className="grid gap-5 sm:grid-cols-2"><Field label="Name" value={name} onChange={setName} /><Field label="Email" type="email" value={email} onChange={setEmail} disabled={busy} /></div><div className="flex justify-end"><Button onClick={saveAccount} disabled={busy}>{busy ? 'Updating…' : 'Update profile'}</Button></div></CardContent></Card>
    <Card><CardHeader><CardTitle>Password</CardTitle><CardDescription>Change your password. Your current password is required for sensitive changes.</CardDescription></CardHeader><CardContent className="grid gap-5 sm:grid-cols-3"><Field label="Current password" type="password" value={currentPassword} onChange={setCurrentPassword} /><Field label="New password" type="password" value={newPassword} onChange={setNewPassword} /><Field label="Confirm new password" type="password" value={confirmPassword} onChange={setConfirmPassword} /><p className="text-xs text-muted-foreground sm:col-span-3">Password last changed: {settings.passwordLastChangedAt ? new Date(settings.passwordLastChangedAt).toLocaleDateString() : 'Not recorded'}</p><div className="flex justify-end sm:col-span-3"><Button onClick={saveAccount} disabled={busy}>{busy ? 'Saving…' : 'Save password'}</Button></div></CardContent></Card>
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary" />Security</CardTitle><CardDescription>Review and revoke sessions connected to this account.</CardDescription></CardHeader><CardContent><div className="flex items-center justify-between border-b border-border py-4"><div><p className="text-sm font-medium">Active session</p><p className="mt-1 text-xs text-muted-foreground">{user?.email} · This device</p></div><LockKeyhole className="h-4 w-4 text-muted-foreground" /></div><div className="flex flex-wrap gap-3 pt-4"><Button variant="outline" className="gap-2" onClick={signOutOtherDevices} disabled={signingOutOthers}><LogOut className="h-4 w-4" />{signingOutOthers ? 'Signing out…' : 'Sign out all other devices'}</Button><Button variant="ghost" onClick={() => { void signOut(); navigate('/sign-in') }}>Sign out</Button></div></CardContent></Card>
    <Card><CardHeader><CardTitle>Onboarding</CardTitle><CardDescription>Review your business setup and workspace configuration again.</CardDescription></CardHeader><CardContent><Button variant="outline" className="gap-2" onClick={async () => { await saveOnboarding({ completed: false, skipped: false, currentStep: 1 }); navigate('/onboarding') }}><RotateCcw className="h-4 w-4" />Restart onboarding</Button></CardContent></Card>
    <Card className="border-destructive/30"><CardHeader><CardTitle className="flex items-center gap-2 text-destructive"><AlertTriangle className="h-5 w-5" />Danger zone</CardTitle><CardDescription>Permanently delete this account and all invoices, clients, settings, and billing data.</CardDescription></CardHeader><CardContent><Button variant="destructive" onClick={() => setDeleteOpen(true)}>Delete account</Button></CardContent></Card>
    <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}><DialogContent><DialogHeader><DialogTitle>Delete account permanently?</DialogTitle><DialogDescription>This cannot be undone. Confirm with your current password and type DELETE MY ACCOUNT.</DialogDescription></DialogHeader><div className="space-y-4"><Field label="Current password" type="password" value={deletePassword} onChange={setDeletePassword} /><Field label="Confirmation" value={deleteConfirmation} onChange={setDeleteConfirmation} placeholder="DELETE MY ACCOUNT" /></div><DialogFooter><Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>Cancel</Button><Button variant="destructive" onClick={confirmDelete} disabled={deleting || deleteConfirmation !== 'DELETE MY ACCOUNT' || !deletePassword}>{deleting ? 'Deleting…' : 'Delete account'}</Button></DialogFooter></DialogContent></Dialog>
  </div>
}

function NotificationsTab({ settings, update }: { settings: UserSettings; update: (key: keyof UserSettings, value: string | number | boolean | UserSettings['invoicePresentation']) => void }) {
  return <Card><CardHeader><CardTitle>Notifications</CardTitle><CardDescription>Choose which account and invoice updates InvoiceFocus sends to your inbox.</CardDescription></CardHeader><CardContent>
    <ToggleRow title="Invoice sent" description="Receive a confirmation when an invoice is sent." checked={settings.invoiceSentEmails} onCheckedChange={(value) => update('invoiceSentEmails', value)} />
    <ToggleRow title="Invoice viewed" description="Know when a client opens a shared invoice." checked={settings.invoiceViewedEmails} onCheckedChange={(value) => update('invoiceViewedEmails', value)} />
    <ToggleRow title="Invoice paid" description="Receive a confirmation when an invoice is marked paid." checked={settings.invoicePaidEmails} onCheckedChange={(value) => update('invoicePaidEmails', value)} />
    <ToggleRow title="Invoice overdue" description="Get notified when an invoice passes its due date." checked={settings.invoiceOverdueEmails} onCheckedChange={(value) => update('invoiceOverdueEmails', value)} />
    <ToggleRow title="Weekly summary" description="Receive a weekly overview of invoice activity and workspace performance." checked={settings.weeklySummaryEmails} onCheckedChange={(value) => update('weeklySummaryEmails', value)} />
    <ToggleRow title="Payment reminders" description="Receive reminders about upcoming and overdue client payments." checked={settings.paymentReminderEmails} onCheckedChange={(value) => update('paymentReminderEmails', value)} />
    <ToggleRow title="Security alerts" description="Receive important sign-in and account security notifications." checked={settings.securityAlerts} onCheckedChange={(value) => update('securityAlerts', value)} />
    <ToggleRow title="Product updates" description="Hear about useful new InvoiceFocus features." checked={settings.productUpdates} onCheckedChange={(value) => update('productUpdates', value)} />
    <ToggleRow title="Beta announcements" description="Receive private-beta news and early access announcements." checked={settings.betaAnnouncements} onCheckedChange={(value) => update('betaAnnouncements', value)} />
    <ToggleRow title="Marketing emails" description="Receive occasional tips, offers, and product education." checked={settings.marketingEmails} onCheckedChange={(value) => update('marketingEmails', value)} />
  </CardContent></Card>
}

function WorkspaceTab({ settings, update, uploadLogo }: { settings: UserSettings; update: (key: keyof UserSettings, value: string | number | boolean | UserSettings['invoicePresentation']) => void; uploadLogo: (event: React.ChangeEvent<HTMLInputElement>, key: 'businessLogo' | 'workspaceLogo') => void }) {
  const { toast } = useToast()
  const [, navigate] = useLocation()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [confirmation, setConfirmation] = useState('')
  const [deleting, setDeleting] = useState(false)
  const deleteCurrentWorkspace = async () => {
    if (confirmation !== 'DELETE WORKSPACE') return
    setDeleting(true)
    try {
      await deleteWorkspace()
      toast({ title: 'Workspace deleted' })
      await supabase.auth.signOut()
      navigate('/sign-in')
    } catch (error) {
      toast({ title: 'Could not delete workspace', description: error instanceof Error ? error.message : 'Please try again.', variant: 'destructive' })
      setDeleting(false)
    }
  }
  return <div className="space-y-6">
    <Card>
      <CardHeader><CardTitle>Workspace</CardTitle><CardDescription>Control the shared identity and regional display defaults for this workspace.</CardDescription></CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Workspace name" value={settings.workspaceName || settings.businessName} onChange={(value) => update('workspaceName', value)} />
          <SelectField label="Timezone" value={settings.accountTimezone} onChange={(value) => update('accountTimezone', value)} options={['UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Asia/Kolkata', 'Australia/Sydney']} />
          <SelectField label="Country" value={settings.accountCountry} onChange={(value) => update('accountCountry', value)} options={['United States', 'Canada', 'United Kingdom', 'Australia', 'India', 'Germany', 'France', 'South Africa']} />
          <SelectField label="Date format" value={settings.dateFormat} onChange={(value) => update('dateFormat', value)} options={['MM/dd/yyyy', 'dd/MM/yyyy', 'yyyy-MM-dd']} />
          <SelectField label="Number format" value={settings.numberFormat} onChange={(value) => update('numberFormat', value)} options={['1,234.56', '1.234,56', '1 234,56']} />
        </div>
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border p-4">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg bg-muted">{settings.workspaceLogo ? <img src={settings.workspaceLogo} alt="Workspace logo" className="h-full w-full object-contain" /> : <UserRound className="h-6 w-6 text-muted-foreground" />}</div>
          <div><p className="text-sm font-medium">Workspace logo</p><p className="mt-1 text-xs text-muted-foreground">Shown in workspace navigation and shared context.</p></div>
          <input id="workspace-logo" type="file" accept="image/*" className="sr-only" onChange={(event) => uploadLogo(event, 'workspaceLogo')} />
          <Button asChild variant="outline"><label htmlFor="workspace-logo" className="cursor-pointer"><Upload className="mr-2 h-4 w-4" />Upload logo</label></Button>
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardHeader><CardTitle>Workspace ownership</CardTitle><CardDescription>Ownership and access are controlled by the signed-in workspace owner.</CardDescription></CardHeader>
      <CardContent><div className="flex items-center gap-3 rounded-lg border border-border p-4"><UserRound className="h-5 w-5 text-primary" /><div><p className="text-sm font-medium">You are the workspace owner</p><p className="mt-1 text-xs text-muted-foreground">Account security and workspace deletion are managed from this Settings area.</p></div></div></CardContent>
    </Card>
    <Card className="border-destructive/30">
      <CardHeader><CardTitle className="text-destructive">Delete workspace</CardTitle><CardDescription>Delete all invoices, clients, settings, and subscription records for this workspace.</CardDescription></CardHeader>
      <CardContent><Button variant="destructive" onClick={() => setDeleteOpen(true)}>Delete workspace</Button></CardContent>
    </Card>
    <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}><DialogContent><DialogHeader><DialogTitle>Delete workspace permanently?</DialogTitle><DialogDescription>Type DELETE WORKSPACE to confirm. This cannot be undone.</DialogDescription></DialogHeader><Field label="Confirmation" value={confirmation} onChange={setConfirmation} placeholder="DELETE WORKSPACE" /><DialogFooter><Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button><Button variant="destructive" onClick={deleteCurrentWorkspace} disabled={deleting || confirmation !== 'DELETE WORKSPACE'}>{deleting ? 'Deleting…' : 'Delete workspace'}</Button></DialogFooter></DialogContent></Dialog>
  </div>
}

function BillingTab() {
  return <Card className="border-primary/30"><CardHeader><CardTitle>Billing</CardTitle><CardDescription>Manage your plan, payment methods, and billing history from the dedicated billing workspace.</CardDescription></CardHeader><CardContent><Button asChild><Link href="/dashboard/billing">Open billing</Link></Button></CardContent></Card>
}

function AppearanceTab({ settings, update }: { settings: UserSettings; update: (key: keyof UserSettings, value: string | number | boolean | UserSettings['invoicePresentation']) => void }) {
  return <Card><CardHeader><CardTitle>Appearance</CardTitle><CardDescription>Choose how InvoiceFocus looks across your workspace.</CardDescription></CardHeader><CardContent className="space-y-6"><div className="grid gap-4 sm:grid-cols-3">{([['system', 'System theme', Eye], ['light', 'Light mode', Sun], ['dark', 'Dark mode', Moon]] as const).map(([value, label, Icon]) => <button key={value} onClick={() => update('theme', value as ThemeMode)} className={`rounded-xl border p-5 text-left transition-colors ${settings.theme === value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}><Icon className={`h-5 w-5 ${settings.theme === value ? 'text-primary' : 'text-muted-foreground'}`} /><p className="mt-4 font-medium">{label}</p><p className="mt-1 text-xs text-muted-foreground">{value === 'system' ? 'Follow your device preference' : `Use ${value} colors throughout the app`}</p></button>)}</div><div className="grid gap-5 border-t border-border pt-5 sm:grid-cols-3"><div className="space-y-1.5"><Label>Accent color</Label><div className="flex gap-2"><Input type="color" value={settings.workspaceAccentColor} onChange={(event) => update('workspaceAccentColor', event.target.value)} className="h-10 w-14 cursor-pointer p-1" /><Input aria-label="Accent color hex value" value={settings.workspaceAccentColor} onChange={(event) => update('workspaceAccentColor', event.target.value)} /></div></div><SelectField label="Font size" value={settings.fontSize} onChange={(value) => update('fontSize', value as FontSize)} options={['small', 'medium', 'large']} /><div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5"><div><Label>Compact mode</Label><p className="mt-1 text-xs text-muted-foreground">Use tighter workspace spacing.</p></div><Switch checked={settings.compactMode} onCheckedChange={(value) => update('compactMode', value)} /></div></div></CardContent></Card>
}

function PrivacyTab() {
  const { toast } = useToast()
  const [exporting, setExporting] = useState(false)
  const download = async () => {
    setExporting(true)
    try {
      const data = await exportSettingsData()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'invoicefocus-account-data.json'; anchor.click(); URL.revokeObjectURL(url)
      toast({ title: 'Account data exported' })
    } catch (error) { toast({ title: 'Export failed', description: error instanceof Error ? error.message : 'Please try again.', variant: 'destructive' }) }
    finally { setExporting(false) }
  }
  return <Card><CardHeader><CardTitle>Data & Privacy</CardTitle><CardDescription>Download a portable copy of your InvoiceFocus account data.</CardDescription></CardHeader><CardContent className="space-y-4"><p className="text-sm leading-6 text-muted-foreground">Your export includes workspace settings, clients, invoices, and account metadata in a portable JSON file.</p><Button variant="outline" className="gap-2" onClick={download} disabled={exporting}><Download className="h-4 w-4" />{exporting ? 'Preparing export…' : 'Export account data'}</Button></CardContent></Card>
}