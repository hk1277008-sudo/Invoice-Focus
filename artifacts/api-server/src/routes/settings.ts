import { Router, type IRouter, type Request, type Response } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabase';

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
  if (error) { res.status(500).json({ error: 'Failed to load settings' }); return; }
  res.json({ settings: data ? toClient(data) : null });
});

router.put('/settings', async (req, res) => {
  const user = await requireUser(req, res); if (!user) return;
  const parsed = settingsSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Please check your settings', details: parsed.error.flatten() }); return; }
  const values = Object.fromEntries(Object.entries(columns).map(([key, column]) => [column, parsed.data[key as keyof typeof parsed.data]]));
  const { data, error } = await supabaseAdmin.from('user_settings').upsert({ user_id: user.id, ...values }, { onConflict: 'user_id' }).select('*').single();
  if (error) { res.status(500).json({ error: 'Failed to save settings' }); return; }
  res.json({ settings: toClient(data) });
});

router.get('/settings/export', async (req, res) => {
  const user = await requireUser(req, res); if (!user) return;
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