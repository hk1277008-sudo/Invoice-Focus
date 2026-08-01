import { Router, type IRouter, type Request, type Response } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabase';
import { needsOnboarding as shouldStartOnboarding } from '../lib/onboarding-state';

const router: IRouter = Router();

const businessProfileSchema = z.object({
  businessName: z.string().trim().max(200).default(''),
  businessLogo: z.string().max(2_000_000).default(''),
  businessEmail: z.string().trim().email().or(z.literal('')).default(''),
  businessPhone: z.string().trim().max(80).default(''),
  address: z.string().trim().max(300).default(''),
  city: z.string().trim().max(100).default(''),
  state: z.string().trim().max(100).default(''),
  postalCode: z.string().trim().max(40).default(''),
  country: z.string().trim().max(100).default(''),
});

const clientSchema = z.object({
  id: z.string().uuid().optional(),
  fullName: z.string().trim().max(160).default(''),
  companyName: z.string().trim().max(240).default(''),
  email: z.string().trim().email().or(z.literal('')).default(''),
  phone: z.string().trim().max(80).default(''),
});

const saveSchema = z.object({
  completed: z.boolean().optional(),
  skipped: z.boolean().optional(),
  currentStep: z.coerce.number().int().min(1).max(5).optional(),
  businessProfile: businessProfileSchema.nullable().optional(),
  firstClient: clientSchema.nullable().optional(),
  firstInvoice: z.object({
    description: z.string().trim().max(300).default(''),
    quantity: z.string().trim().max(30).default('1'),
    price: z.string().trim().max(30).default(''),
  }).nullable().optional(),
});

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

function toClient(row: Record<string, unknown> | null) {
  return {
    completed: Boolean(row?.onboarding_completed),
    skipped: Boolean(row?.onboarding_skipped),
    currentStep: Number(row?.onboarding_current_step || 1),
    businessProfile: (row?.onboarding_business_profile as Record<string, unknown> | null) || null,
    firstClient: (row?.onboarding_first_client as Record<string, unknown> | null) || null,
    firstInvoice: (row?.onboarding_first_invoice as Record<string, unknown> | null) || null,
  };
}

async function getRow(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('user_settings')
    .select('business_name, onboarding_completed, onboarding_skipped, onboarding_current_step, onboarding_business_profile, onboarding_first_client, onboarding_first_invoice')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

router.get('/onboarding', async (req, res) => {
  const user = await requireUser(req, res); if (!user) return;
  try {
    const row = await getRow(user.id);
    const [{ count: invoiceCount }, { count: clientCount }] = await Promise.all([
      supabaseAdmin.from('invoices').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabaseAdmin.from('clients').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    ]);
    const onboarding = toClient(row);
    const needsOnboarding = shouldStartOnboarding(
      onboarding,
      row?.business_name,
      invoiceCount || 0,
      clientCount || 0,
    );
    res.json({ onboarding: { ...onboarding, needsOnboarding } });
  } catch {
    res.status(500).json({ error: 'Failed to load onboarding' });
  }
});

router.put('/onboarding', async (req, res) => {
  const user = await requireUser(req, res); if (!user) return;
  const parsed = saveSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Please check your onboarding details', details: parsed.error.flatten() }); return; }
  const input = parsed.data;
  const values: Record<string, unknown> = { user_id: user.id };
  if (input.completed !== undefined) values.onboarding_completed = input.completed;
  if (input.skipped !== undefined) values.onboarding_skipped = input.skipped;
  if (input.currentStep !== undefined) values.onboarding_current_step = input.currentStep;
  if (input.businessProfile !== undefined) values.onboarding_business_profile = input.businessProfile || {};
  if (input.firstClient !== undefined) values.onboarding_first_client = input.firstClient || {};
  if (input.firstInvoice !== undefined) values.onboarding_first_invoice = input.firstInvoice || {};
  try {
    const { data, error } = await supabaseAdmin
      .from('user_settings')
      .upsert(values, { onConflict: 'user_id' })
      .select('onboarding_completed, onboarding_skipped, onboarding_current_step, onboarding_business_profile, onboarding_first_client, onboarding_first_invoice')
      .single();
    if (error) throw error;
    res.json({ onboarding: toClient(data) });
  } catch {
    res.status(500).json({ error: 'Failed to save onboarding' });
  }
});

router.post('/onboarding/skip', async (req, res) => {
  const user = await requireUser(req, res); if (!user) return;
  try {
    const { data, error } = await supabaseAdmin
      .from('user_settings')
      .upsert({ user_id: user.id, onboarding_skipped: true, onboarding_completed: false }, { onConflict: 'user_id' })
      .select('onboarding_completed, onboarding_skipped, onboarding_current_step, onboarding_business_profile, onboarding_first_client, onboarding_first_invoice')
      .single();
    if (error) throw error;
    res.json({ onboarding: toClient(data) });
  } catch (error) {
    res.status(500).json({ error: 'Could not skip onboarding' });
  }
});

router.post('/onboarding/complete', async (req, res) => {
  const user = await requireUser(req, res); if (!user) return;
  try {
    const { data, error } = await supabaseAdmin
      .from('user_settings')
      .upsert({ user_id: user.id, onboarding_completed: true, onboarding_skipped: false, onboarding_current_step: 5 }, { onConflict: 'user_id' })
      .select('onboarding_completed, onboarding_skipped, onboarding_current_step, onboarding_business_profile, onboarding_first_client, onboarding_first_invoice')
      .single();
    if (error) throw error;
    res.json({ onboarding: toClient(data) });
  } catch (error) {
    res.status(500).json({ error: 'Could not complete onboarding' });
  }
});

export default router;