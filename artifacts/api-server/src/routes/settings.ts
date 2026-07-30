import { Router, type IRouter, type Request, type Response } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabase';
import { hasSubscriptionFeature } from './subscriptions';
import { PLAN_CATALOG } from './subscriptions';

const router: IRouter = Router();
const settingsSchema = z.object({
  businessName: z.string().trim().max(200).default(''),
  businessLogo: z.string().max(2_000_000).default(''),
  businessEmail: z.string().trim().email().or(z.literal('')).default(''),
  businessPhone: z.string().trim().max(50).default(''),
  website: z.string().trim().url().or(z.literal('')).default(''),
  taxId: z.string().trim().max(100).default(''),
  registrationNumber: z.string().trim().max(100).default(''),
  address: z.string().trim().max(300).default(''),
  city: z.string().trim().max(100).default(''),
  state: z.string().trim().max(100).default(''),
  postalCode: z.string().trim().max(40).default(''),
  country: z.string().trim().max(100).default(''),
  defaultCurrency: z.string().trim().length(3).default('USD'),
  defaultLanguage: z.string().trim().max(40).default('English'),
  defaultTaxRate: z.coerce.number().finite().min(0).max(100).default(0),
  defaultPaymentTerms: z.string().trim().max(100).default('Net 30'),
  defaultDueDays: z.coerce.number().int().min(0).max(365).default(30),
  invoiceNumberFormat: z.string().trim().max(80).default('INV-{number}'),
  invoicePrefix: z.string().trim().max(20).default('INV'),
  startingInvoiceNumber: z.coerce.number().int().min(1).max(999999999).default(1),
  defaultNotes: z.string().max(4000).default(''),
  defaultTerms: z.string().max(4000).default(''),
  invoiceSentEmails: z.boolean().default(true),
  paymentReminderEmails: z.boolean().default(true),
  productUpdates: z.boolean().default(true),
  securityAlerts: z.boolean().default(true),
  marketingEmails: z.boolean().default(false),
  theme: z.enum(['system', 'light', 'dark']).default('system'),
  recurringDefaultTimezone: z.string().trim().min(1).max(100).default('UTC'),
  recurringDefaultFrequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom']).default('monthly'),
  recurringDefaultDueDateOffset: z.coerce.number().int().min(0).max(3650).default(14),
  recurringDefaultInvoiceStatus: z.enum(['Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled']).default('Draft'),
  recurringDefaultAutoGeneration: z.boolean().default(true),
  invoicePresentation: z.object({
    template: z.enum(['modern', 'minimal', 'corporate', 'executive', 'elegant', 'creative', 'clean', 'professional']).default('modern'),
    primaryColor: z.string().regex(/^#[0-9a-f]{6}$/i).default('#2e5bff'),
    accentColor: z.string().regex(/^#[0-9a-f]{6}$/i).default('#13a6a6'),
    font: z.enum(['Inter', 'Fraunces', 'DM Mono']).default('Inter'),
    headerLayout: z.enum(['Split', 'Centered', 'Band']).default('Split'),
    footerLayout: z.enum(['Simple', 'Detailed', 'Bar']).default('Simple'),
    paperSize: z.enum(['A4', 'Letter']).default('A4'),
    titleStyle: z.enum(['default', 'compact', 'editorial']).default('default'),
  }).default({}),
});

const columns: Record<keyof z.infer<typeof settingsSchema>, string> = {
  businessName: 'business_name', businessLogo: 'business_logo', businessEmail: 'business_email',
  businessPhone: 'business_phone', website: 'website', taxId: 'tax_id', registrationNumber: 'registration_number',
  address: 'address', city: 'city', state: 'state', postalCode: 'postal_code', country: 'country',
  defaultCurrency: 'default_currency', defaultLanguage: 'default_language', defaultTaxRate: 'default_tax_rate',
  defaultPaymentTerms: 'default_payment_terms', defaultDueDays: 'default_due_days', invoiceNumberFormat: 'invoice_number_format',
  invoicePrefix: 'invoice_prefix', startingInvoiceNumber: 'starting_invoice_number', defaultNotes: 'default_notes',
  defaultTerms: 'default_terms', invoiceSentEmails: 'invoice_sent_emails', paymentReminderEmails: 'payment_reminder_emails',
  productUpdates: 'product_updates', securityAlerts: 'security_alerts', marketingEmails: 'marketing_emails', theme: 'theme',
  recurringDefaultTimezone: 'recurring_default_timezone',
  recurringDefaultFrequency: 'recurring_default_frequency',
  recurringDefaultDueDateOffset: 'recurring_default_due_date_offset',
  recurringDefaultInvoiceStatus: 'recurring_default_invoice_status',
  recurringDefaultAutoGeneration: 'recurring_default_auto_generation',
  invoicePresentation: 'invoice_presentation',
};

function token(req: Request) {
  const value = req.get('authorization');
  return value?.startsWith('Bearer ') ? value.slice(7) : null;
}
async function requireUser(req: Request, res: Response) {
  const value = token(req);
  if (!value) { res.status(401).json({ error: 'Authentication required' }); return null; }
  const { data, error } = await supabaseAdmin.auth.getUser(value);
  if (error || !data.user) { res.status(401).json({ error: 'Invalid or expired session' }); return null; }
  return data.user;
}
function toClient(row: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(columns).map(([key, column]) => [key, row[column]]));
}

router.get('/settings', async (req, res) => {
  const user = await requireUser(req, res); if (!user) return;
  const { data, error } = await supabaseAdmin.from('user_settings').select('*').eq('user_id', user.id).maybeSingle();
  if (error) { res.status(500).json({ error: 'Failed to load settings', code: error.code, details: error.message }); return; }
  res.json({ settings: data ? toClient(data) : null });
});

router.put('/settings', async (req, res) => {
  const user = await requireUser(req, res); if (!user) return;
  const parsed = settingsSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Please check your settings', details: parsed.error.flatten() }); return; }
  const plan = await currentPlan(user.id);
  const presentation = parsed.data.invoicePresentation;
  const freeTemplates = ['modern', 'minimal'];
  const proTemplates = ['corporate', 'executive', 'elegant'];
  const premiumTemplates = ['creative', 'clean', 'professional'];
  const allowedTemplates = plan === 'free' ? freeTemplates : plan === 'pro' ? [...freeTemplates, ...proTemplates] : [...freeTemplates, ...proTemplates, ...premiumTemplates];
  if (!allowedTemplates.includes(presentation.template)) {
    res.status(403).json({ error: 'That invoice template is not included in your plan.', code: 'TEMPLATE_NOT_INCLUDED', requiredPlan: presentation.template === 'creative' || presentation.template === 'clean' || presentation.template === 'professional' ? 'premium' : 'pro' });
    return;
  }
  const customBranding = presentation.primaryColor !== '#2e5bff' || presentation.accentColor !== '#13a6a6' || presentation.font !== 'Inter' || presentation.headerLayout !== 'Split' || presentation.footerLayout !== 'Simple' || presentation.titleStyle !== 'default';
  if (customBranding && plan !== 'premium') {
    res.status(403).json({ error: 'Full branding customization is available on Premium.', code: 'BRANDING_NOT_INCLUDED', requiredPlan: 'premium' });
    return;
  }
  const values = Object.fromEntries(Object.entries(columns).map(([key, column]) => [column, parsed.data[key as keyof typeof parsed.data]]));
  const { data, error } = await supabaseAdmin.from('user_settings').upsert({ user_id: user.id, ...values }, { onConflict: 'user_id' }).select('*').single();
  if (error) { res.status(500).json({ error: 'Failed to save settings', code: error.code, details: error.message }); return; }
  res.json({ settings: toClient(data) });
});

async function currentPlan(userId: string): Promise<'free' | 'pro' | 'premium'> {
  const devPlan = process.env.NODE_ENV !== 'production' ? process.env.INVOICEFOCUS_DEV_PLAN : undefined;
  if (devPlan === 'pro' || devPlan === 'premium') return devPlan;
  const { data, error } = await supabaseAdmin.from('subscriptions').select('plan').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return data?.plan === 'pro' || data?.plan === 'premium' ? data.plan : 'free';
}

router.get('/settings/export', async (req, res) => {
  const user = await requireUser(req, res); if (!user) return;
  try {
    if (!(await hasSubscriptionFeature(user.id, 'dataExport'))) {
      res.status(403).json({ error: 'Data export is available on Pro and Premium plans.', code: 'FEATURE_NOT_INCLUDED' });
      return;
    }
  } catch {
    res.status(503).json({ error: 'Subscription service is temporarily unavailable. Please try again.' });
    return;
  }
  const [{ data: settings }, { data: clients }, { data: invoices }] = await Promise.all([
    supabaseAdmin.from('user_settings').select('*').eq('user_id', user.id).maybeSingle(),
    supabaseAdmin.from('clients').select('*').eq('user_id', user.id),
    supabaseAdmin.from('invoices').select('*').eq('user_id', user.id),
  ]);
  res.json({ exportedAt: new Date().toISOString(), user: { id: user.id, email: user.email, createdAt: user.created_at }, settings, clients: clients ?? [], invoices: invoices ?? [] });
});

router.post('/settings/delete-account', async (req, res) => {
  const user = await requireUser(req, res); if (!user) return;
  if (req.body?.confirmation !== 'DELETE MY ACCOUNT') { res.status(400).json({ error: 'Type DELETE MY ACCOUNT to confirm' }); return; }
  const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);
  if (error) { res.status(500).json({ error: 'Could not delete your account' }); return; }
  res.status(204).send();
});

export default router;