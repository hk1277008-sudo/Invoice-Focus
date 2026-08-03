import { useState, useEffect } from 'react'
import { useLocation } from 'wouter'
import { ArrowRight, ArrowLeft, Building2, Users, FileText, Check, Sparkles, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { getOnboarding, saveOnboarding, completeOnboarding, skipOnboarding, type OnboardingBusinessProfile, type OnboardingClientDraft } from '@/lib/onboarding'
import { getSettings, saveSettings } from '@/lib/settings'
import { createClient } from '@/lib/clients'
import { createInvoice, invoiceInput } from '@/lib/invoices'
import type { InvoiceData } from '@/components/invoice/types'
import { Logo } from '@/components/shared/Logo'

export default function OnboardingPage() {
  const [, navigate] = useLocation()
  const { user } = useAuth()
  const { toast } = useToast()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Business profile
  const [businessName, setBusinessName] = useState('')
  const [businessLogo, setBusinessLogo] = useState('')
  const [businessEmail, setBusinessEmail] = useState('')
  const [businessPhone, setBusinessPhone] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [country, setCountry] = useState('')

  // First client
  const [clientName, setClientName] = useState('')
  const [clientCompany, setClientCompany] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientId, setClientId] = useState<string | undefined>()

  // First invoice
  const [invoiceAmount, setInvoiceAmount] = useState('')
  const [invoiceDescription, setInvoiceDescription] = useState('')
  const [invoiceQuantity, setInvoiceQuantity] = useState('1')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    getOnboarding()
      .then(({ onboarding }) => {
        if (onboarding.completed || onboarding.skipped) {
          navigate('/dashboard')
          return
        }
        setStep(onboarding.currentStep || 1)
        if (onboarding.businessProfile) {
          setBusinessName(onboarding.businessProfile.businessName || '')
          setBusinessLogo(onboarding.businessProfile.businessLogo || '')
          setBusinessEmail(onboarding.businessProfile.businessEmail || '')
          setBusinessPhone(onboarding.businessProfile.businessPhone || '')
          setAddress(onboarding.businessProfile.address || '')
          setCity(onboarding.businessProfile.city || '')
          setState(onboarding.businessProfile.state || '')
          setPostalCode(onboarding.businessProfile.postalCode || '')
          setCountry(onboarding.businessProfile.country || '')
        }
        if (onboarding.firstClient) {
          setClientName(onboarding.firstClient.fullName || '')
          setClientCompany(onboarding.firstClient.companyName || '')
          setClientEmail(onboarding.firstClient.email || '')
          setClientPhone(onboarding.firstClient.phone || '')
          setClientId(onboarding.firstClient.id)
        }
        if (onboarding.firstInvoice) {
          setInvoiceDescription(onboarding.firstInvoice.description || '')
          setInvoiceQuantity(onboarding.firstInvoice.quantity || '1')
          setInvoiceAmount(onboarding.firstInvoice.price || '')
        }
      })
      .catch((error) => {
        toast({ title: 'Could not load onboarding', description: error.message, variant: 'destructive' })
      })
      .finally(() => { setLoading(false); setLoaded(true) })
  }, [navigate, toast])

  useEffect(() => {
    if (!loaded || step !== 2) return
    const timeout = window.setTimeout(() => {
      void saveOnboarding({
        currentStep: 2,
        businessProfile: {
          businessName, businessLogo, businessEmail, businessPhone, address, city, state, postalCode, country,
        },
      })
    }, 500)
    return () => window.clearTimeout(timeout)
  }, [address, businessEmail, businessLogo, businessName, businessPhone, city, country, loaded, postalCode, state, step])

  const handleSkip = async () => {
    try {
      await skipOnboarding()
      navigate('/dashboard')
    } catch (error) {
      toast({ title: 'Could not skip onboarding', description: error instanceof Error ? error.message : 'Please try again.', variant: 'destructive' })
    }
  }

  const handleNext = async () => {
    setSaving(true)
    try {
      if (step === 2) {
        if (!businessName.trim()) {
          toast({ title: 'Business name required', description: 'Please enter your business name to continue.', variant: 'destructive' })
          setSaving(false)
          return
        }
        const profile: OnboardingBusinessProfile = {
          businessName, businessLogo,
          businessEmail,
          businessPhone,
          address,
          city,
          state,
          postalCode,
          country,
        }
        await saveOnboarding({ currentStep: 3, businessProfile: profile })
        const settings = await getSettings()
        await saveSettings({
          ...settings,
          businessName,
          businessLogo,
          businessEmail,
          businessPhone,
          address,
          city,
          state,
          postalCode,
          country,
        })
      } else if (step === 3) {
        const client: OnboardingClientDraft = {
          id: clientId,
          fullName: clientName,
          companyName: clientCompany,
          email: clientEmail,
          phone: clientPhone,
        }
        if (!clientId && (clientName.trim() || clientCompany.trim() || clientEmail.trim())) {
          const { client: createdClient } = await createClient({
            fullName: clientName, companyName: clientCompany, email: clientEmail, phone: clientPhone,
            billingAddress: '', city: '', state: '', postalCode: '', country: '', taxId: '', notes: '',
          })
          setClientId(createdClient.id)
          client.id = createdClient.id
        }
        await saveOnboarding({ currentStep: 4, firstClient: client })
      }
      if (step === 4) {
        await saveOnboarding({
          currentStep: 5,
          firstInvoice: {
            description: invoiceDescription,
            quantity: invoiceQuantity,
            price: invoiceAmount,
          },
        })
      }
      setStep(step + 1)
    } catch (error) {
      toast({ title: 'Could not save progress', description: error instanceof Error ? error.message : 'Please try again.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleBack = () => {
    setStep(step - 1)
  }

  const handleCreateInvoice = async () => {
    setSaving(true)
    try {
       let invoiceClientId = clientId
       if (!invoiceClientId && (clientName.trim() || clientCompany.trim() || clientEmail.trim())) {
        const { client } = await createClient({
          fullName: clientName,
          companyName: clientCompany,
          email: clientEmail,
          phone: clientPhone,
          billingAddress: '',
          city: '',
          state: '',
          postalCode: '',
          country: '',
          taxId: '',
          notes: '',
        })
         invoiceClientId = client.id
      }

      const settings = await getSettings()
      const today = new Date().toISOString().slice(0, 10)
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + (settings.defaultDueDays || 30))
      const dueDateStr = dueDate.toISOString().slice(0, 10)

      const invoiceData: InvoiceData = {
        business: {
          logo: settings.businessLogo || null,
          name: businessName || settings.businessName || 'Your Business',
          contactPerson: user?.user_metadata?.full_name as string || '',
          email: businessEmail || settings.businessEmail || user?.email || '',
          phone: businessPhone || settings.businessPhone || '',
          website: settings.website || '',
          address: address || settings.address || '',
          taxId: settings.taxId || '',
        },
        client: {
           clientId: invoiceClientId,
          name: clientName || 'Client Name',
          companyName: clientCompany || '',
          email: clientEmail || '',
          phone: clientPhone || '',
          billingAddress: '',
          taxId: '',
        },
        details: {
          number: `${settings.invoicePrefix || 'INV'}-${String(settings.startingInvoiceNumber || 1).padStart(4, '0')}`,
          issueDate: today,
          dueDate: dueDateStr,
          paymentTerms: settings.defaultPaymentTerms || 'Net 30',
          status: 'Draft',
          poNumber: '',
          currency: settings.defaultCurrency as 'USD' || 'USD',
        },
        items: [
          {
            id: '1',
            name: invoiceDescription || 'Service',
            description: '',
             quantity: invoiceQuantity || '1',
            unitPrice: invoiceAmount || '0',
            taxPercent: String(settings.defaultTaxRate || 0),
            discountPercent: '0',
          },
        ],
        additional: {
          notes: settings.defaultNotes || '',
          paymentInstructions: '',
          terms: settings.defaultTerms || '',
        },
      }

       const total = Number(invoiceAmount || 0) * Number(invoiceQuantity || 1) * (1 + (settings.defaultTaxRate || 0) / 100)
      await createInvoice(invoiceInput(invoiceData, total))
      await completeOnboarding()
      setStep(5)
    } catch (error) {
      toast({ title: 'Could not create invoice', description: error instanceof Error ? error.message : 'Please try again.', variant: 'destructive' })
      setSaving(false)
    }
  }

  const handleFinish = async () => {
    setSaving(true)
    try {
      await completeOnboarding()
      navigate('/dashboard')
    } catch (error) {
      toast({ title: 'Could not finish setup', description: error instanceof Error ? error.message : 'Please try again.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4 sm:px-6">
        <Logo size="sm" />
        {step < 5 && (
          <Button variant="ghost" size="sm" onClick={handleSkip}>
            Skip setup
          </Button>
        )}
      </header>

      <main className="flex flex-1 items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-2xl">
          {step < 5 && (
            <div className="mb-8">
              <div className="mb-3 flex items-center justify-between text-sm text-muted-foreground">
                <span>Step {step} of 5</span>
                <span>{Math.round((step / 5) * 100)}% complete</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${(step / 5) * 100}%` }}
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                 <CardTitle className="text-2xl">Welcome to Invoice Focus 👋</CardTitle>
                <CardDescription className="mt-2 text-base">
                   Let's get you set up in just a few steps. We'll help you add your business details, add your first client, and generate your first invoice.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 rounded-lg border border-border p-4">
                    <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <div>
                       <p className="font-medium">Business Details</p>
                      <p className="mt-1 text-sm text-muted-foreground">Add your business information for invoices</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-lg border border-border p-4">
                    <Users className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <div>
                      <p className="font-medium">First Client</p>
                      <p className="mt-1 text-sm text-muted-foreground">Add a client to get started quickly</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-lg border border-border p-4">
                    <FileText className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <div>
                      <p className="font-medium">First Invoice</p>
                      <p className="mt-1 text-sm text-muted-foreground">Create your first invoice in seconds</p>
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <Button onClick={() => setStep(2)} className="gap-2">
                    Let’s get started
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card>
              <CardHeader>
                 <CardTitle>Business Details</CardTitle>
                 <CardDescription>This information will appear on your invoices.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                   <div className="flex flex-wrap items-center gap-4">
                     <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-muted/40">
                       {businessLogo ? <img src={businessLogo} alt="Business logo preview" className="h-full w-full object-contain" /> : <Upload className="h-5 w-5 text-muted-foreground" />}
                     </div>
                     <div>
                       <input id="onboarding-business-logo" type="file" accept="image/*" className="sr-only" onChange={(event) => {
                         const file = event.target.files?.[0]
                         if (!file) return
                         if (!file.type.startsWith('image/') || file.size > 2_000_000) {
                           toast({ title: 'Logo not uploaded', description: 'Use an image smaller than 2MB.', variant: 'destructive' })
                           return
                         }
                         const reader = new FileReader()
                         reader.onload = () => setBusinessLogo(String(reader.result))
                         reader.readAsDataURL(file)
                       }} />
                       <Button asChild variant="outline" size="sm"><label htmlFor="onboarding-business-logo" className="cursor-pointer"><Upload className="mr-2 h-4 w-4" />Upload logo</label></Button>
                       <p className="mt-1 text-xs text-muted-foreground">Optional · PNG, JPG, or SVG</p>
                     </div>
                   </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="business-name">
                      Business Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="business-name"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="Your Business Name"
                      data-testid="input-business-name"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="business-email">Email</Label>
                      <Input
                        id="business-email"
                        type="email"
                        value={businessEmail}
                        onChange={(e) => setBusinessEmail(e.target.value)}
                        placeholder="business@example.com"
                        data-testid="input-business-email"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="business-phone">Phone</Label>
                      <Input
                        id="business-phone"
                        type="tel"
                        value={businessPhone}
                        onChange={(e) => setBusinessPhone(e.target.value)}
                        placeholder="+1 (555) 000-0000"
                        data-testid="input-business-phone"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="123 Main Street"
                      data-testid="input-address"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="city">City</Label>
                      <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" data-testid="input-city" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="state">State</Label>
                      <Input id="state" value={state} onChange={(e) => setState(e.target.value)} placeholder="State" data-testid="input-state" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="postal-code">Postal Code</Label>
                      <Input
                        id="postal-code"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        placeholder="12345"
                        data-testid="input-postal-code"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="United States"
                      data-testid="input-country"
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-between">
                  <Button variant="ghost" onClick={handleBack} className="gap-2" data-testid="button-back">
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                  <Button onClick={handleNext} disabled={saving} className="gap-2" data-testid="button-continue">
                    {saving ? 'Saving...' : 'Continue'}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Add Your First Client</CardTitle>
                <CardDescription>Add a client now to speed up your first invoice. You can skip this and add clients later.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="client-name">Client Name</Label>
                      <Input
                        id="client-name"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="John Smith"
                        data-testid="input-client-name"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="client-company">Company</Label>
                      <Input
                        id="client-company"
                        value={clientCompany}
                        onChange={(e) => setClientCompany(e.target.value)}
                        placeholder="Acme Corporation"
                        data-testid="input-client-company"
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="client-email">Email</Label>
                      <Input
                        id="client-email"
                        type="email"
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        placeholder="client@example.com"
                        data-testid="input-client-email"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="client-phone">Phone</Label>
                      <Input
                        id="client-phone"
                        type="tel"
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        placeholder="+1 (555) 000-0000"
                        data-testid="input-client-phone"
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex justify-between">
                  <Button variant="ghost" onClick={handleBack} className="gap-2" data-testid="button-back">
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                  <Button onClick={handleNext} disabled={saving} className="gap-2" data-testid="button-continue">
                    {saving ? 'Saving...' : 'Continue'}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 4 && (
            <Card>
              <CardHeader>
                <CardTitle>Create Your First Invoice</CardTitle>
                <CardDescription>Let's create a simple invoice to get you started. You can add more details later.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="invoice-description">Description</Label>
                    <Input
                      id="invoice-description"
                      value={invoiceDescription}
                      onChange={(e) => setInvoiceDescription(e.target.value)}
                      placeholder="Consulting Services"
                      data-testid="input-invoice-description"
                    />
                  </div>
                   <div className="space-y-1.5">
                     <Label htmlFor="invoice-amount">Price</Label>
                    <Input
                      id="invoice-amount"
                      type="number"
                      step="0.01"
                      value={invoiceAmount}
                      onChange={(e) => setInvoiceAmount(e.target.value)}
                      placeholder="1000.00"
                      data-testid="input-invoice-amount"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="invoice-quantity">Quantity</Label>
                    <Input
                      id="invoice-quantity"
                      type="number"
                      min="1"
                      step="1"
                      value={invoiceQuantity}
                      onChange={(e) => setInvoiceQuantity(e.target.value)}
                      placeholder="1"
                      data-testid="input-invoice-quantity"
                    />
                  </div>
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <p className="text-sm text-muted-foreground">
                      This invoice will be saved as a draft. You can edit it, add more line items, and send it to your client from the dashboard.
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex justify-between">
                  <Button variant="ghost" onClick={handleBack} className="gap-2" data-testid="button-back">
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                   <Button onClick={handleNext} disabled={saving} className="gap-2" data-testid="button-continue">
                     Continue
                     <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 5 && (
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Check className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">You’re all set!</CardTitle>
                <CardDescription className="mt-2 text-base">
                  Your account is ready. You can now manage invoices, track payments, and grow your business.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <h3 className="font-medium">What's next?</h3>
                    <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>Review and customize your first invoice</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>Add more clients to your account</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>Explore recurring invoices and reports</span>
                      </li>
                    </ul>
                  </div>
                </div>
                 <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                   <Button onClick={handleCreateInvoice} disabled={saving} size="lg" className="gap-2" data-testid="button-create-invoice">
                     {saving ? 'Creating...' : 'Create Invoice'}
                     <FileText className="h-4 w-4" />
                   </Button>
                   <Button onClick={handleFinish} disabled={saving} size="lg" variant="outline" className="gap-2" data-testid="button-finish">
                     Go to Dashboard
                     <ArrowRight className="h-4 w-4" />
                   </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
