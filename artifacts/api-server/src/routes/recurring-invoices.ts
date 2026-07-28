import { Router, type IRouter, type Request, type Response } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabase';
import { hasSubscriptionFeature } from './subscriptions';
import { generateDueRecurringInvoices } from '../services/recurring-generator';

const router: IRouter = Router();
const frequencies = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'] as const;
const statuses = ['active', 'paused', 'completed', 'cancelled'] as const;
const frequencySchema = z.enum(frequencies);
const statusSchema = z.enum(statuses);
const templateSchema = z.object({
  business: z.record(z.string(), z.unknown()).optional(),
  client: z.record(z.string(), z.unknown()).optional(),
  details: z.record(z.string(), z.unknown()).optional(),
  items: z.array(z.record(z.string(), z.unknown())).min(1),
  additional: z.record(z.string(), z.unknown()).optional(),
});
const inputBaseSchema = z.object({
  client_id: z.string().uuid().nullable().optional(),
  client_name: z.string().trim().min(1).max(240),
  frequency: frequencySchema,
  interval_count: z.coerce.number().int().min(1).max(365),
  start_date: z.string().date(),
  end_date: z.string().date().nullable().optional(),
  next_run_date: z.string().date().optional(),
  timezone: z.string().trim().min(1).max(100),
  due_date_offset: z.coerce.number().int().min(0).max(3650),
  auto_invoice_number: z.boolean(),
  template_data: templateSchema,
});
const inputSchema = inputBaseSchema.superRefine((value, ctx) => {
  if (value.end_date && value.end_date < value.start_date) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['end_date'], message: 'End date must be on or after the start date' });
  }
  const next = value.next_run_date ?? value.start_date;
  if (next < value.start_date || (value.end_date && next > value.end_date)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['next_run_date'], message: 'Next run date must be within the schedule range' });
  }
});
const patchSchema = inputBaseSchema.partial().superRefine((value, ctx) => {
  if (value.end_date && value.start_date && value.end_date < value.start_date) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['end_date'], message: 'End date must be on or after the start date' });
  }
  if (value.next_run_date && value.start_date && value.next_run_date < value.start_date) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['next_run_date'], message: 'Next run date must be on or after the start date' });
  }
  if (value.next_run_date && value.end_date && value.next_run_date > value.end_date) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['next_run_date'], message: 'Next run date must be on or before the end date' });
  }
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
async function requireFeature(userId: string, res: Response) {
  try {
    if (!(await hasSubscriptionFeature(userId, 'recurringInvoices'))) {
      res.status(403).json({ error: 'Recurring invoices are available on Pro and Premium plans.', code: 'FEATURE_NOT_INCLUDED' });
      return false;
    }
    return true;
  } catch {
    res.status(503).json({ error: 'Subscription service is temporarily unavailable. Please try again.' });
    return false;
  }
}
function idValid(id: string) { return z.string().uuid().safeParse(id).success; }
function shape(input: z.infer<typeof inputSchema>, userId: string) {
  return {
    user_id: userId, client_id: input.client_id ?? null, client_name: input.client_name,
    frequency: input.frequency, interval_count: input.interval_count, start_date: input.start_date,
    end_date: input.end_date ?? null, next_run_date: input.next_run_date ?? input.start_date,
    timezone: input.timezone, due_date_offset: input.due_date_offset, auto_invoice_number: input.auto_invoice_number,
    template_data: input.template_data,
  };
}

router.get('/recurring-invoices', async (req, res) => {
  const user = await requireUser(req, res); if (!user) return;
  const parsed = z.object({
    search: z.string().trim().max(120).optional(),
    status: statusSchema.optional(),
    frequency: frequencySchema.optional(),
    sort: z.enum(['created_at', 'next_run_date', 'client_name', 'last_generated_at']).default('created_at'),
    direction: z.enum(['asc', 'desc']).default('desc'),
  }).safeParse(req.query);
  if (!parsed.success) { res.status(400).json({ error: 'Invalid recurring invoice filters' }); return; }
  const { search, status, frequency, sort, direction } = parsed.data;
  let query = supabaseAdmin.from('recurring_invoices').select('*').eq('user_id', user.id)
    .order(sort, { ascending: direction === 'asc', nullsFirst: false });
  if (search) query = query.ilike('client_name', `%${search.replace(/[%_,]/g, '\\$&')}%`);
  if (status) query = query.eq('status', status);
  if (frequency) query = query.eq('frequency', frequency);
  const { data, error } = await query;
  if (error) { res.status(500).json({ error: 'Failed to load recurring invoices' }); return; }
  res.json({ recurringInvoices: data ?? [] });
});

router.get('/recurring-invoices/:id', async (req, res) => {
  const user = await requireUser(req, res); if (!user) return;
  if (!idValid(req.params.id)) { res.status(400).json({ error: 'Invalid recurring invoice ID' }); return; }
  const { data, error } = await supabaseAdmin.from('recurring_invoices').select('*').eq('id', req.params.id).eq('user_id', user.id).maybeSingle();
  if (error) { res.status(500).json({ error: 'Failed to load recurring invoice' }); return; }
  if (!data) { res.status(404).json({ error: 'Recurring invoice not found' }); return; }
  res.json({ recurringInvoice: data });
});

router.post('/recurring-invoices', async (req, res) => {
  const user = await requireUser(req, res); if (!user) return;
  if (!(await requireFeature(user.id, res))) return;
  const parsed = inputSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Invalid recurring invoice data', details: parsed.error.flatten() }); return; }
  const { data, error } = await supabaseAdmin.from('recurring_invoices').insert(shape(parsed.data, user.id)).select('*').single();
  if (error) { res.status(500).json({ error: 'Failed to create recurring invoice' }); return; }
  res.status(201).json({ recurringInvoice: data });
});

router.patch('/recurring-invoices/:id', async (req, res) => {
  const user = await requireUser(req, res); if (!user) return;
  if (!(await requireFeature(user.id, res))) return;
  const id = String(req.params.id);
  if (!idValid(id)) { res.status(400).json({ error: 'Invalid recurring invoice ID' }); return; }
  const parsed = patchSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Invalid recurring invoice data', details: parsed.error.flatten() }); return; }
  const input = parsed.data as Partial<z.infer<typeof inputSchema>>;
  const existing = await supabaseAdmin
    .from('recurring_invoices')
    .select('start_date,end_date,next_run_date')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();
  if (existing.error) { res.status(500).json({ error: 'Failed to load recurring invoice' }); return; }
  if (!existing.data) { res.status(404).json({ error: 'Recurring invoice not found' }); return; }
  const mergedDates = {
    start_date: input.start_date ?? existing.data.start_date,
    end_date: input.end_date !== undefined ? input.end_date : existing.data.end_date,
    next_run_date: input.next_run_date ?? existing.data.next_run_date,
  };
  const dateValidation = inputSchema.safeParse({
    ...mergedDates,
    client_name: 'placeholder',
    frequency: 'monthly',
    interval_count: 1,
    timezone: 'UTC',
    due_date_offset: 0,
    auto_invoice_number: true,
    template_data: { items: [{}] },
  });
  if (!dateValidation.success) {
    const dateIssues = dateValidation.error.issues.filter((issue) =>
      ['start_date', 'end_date', 'next_run_date'].includes(String(issue.path[0])),
    );
    if (dateIssues.length) {
      res.status(400).json({ error: 'Invalid recurring invoice dates', details: { fieldErrors: dateIssues } });
      return;
    }
  }
  const updates: Record<string, unknown> = {};
  for (const key of ['client_id', 'client_name', 'frequency', 'interval_count', 'start_date', 'end_date', 'next_run_date', 'timezone', 'due_date_offset', 'auto_invoice_number', 'template_data']) {
    if (input[key as keyof typeof input] !== undefined) updates[key] = input[key as keyof typeof input];
  }
  const { data, error } = await supabaseAdmin.from('recurring_invoices').update(updates).eq('id', id).eq('user_id', user.id).select('*').maybeSingle();
  if (error) { res.status(500).json({ error: 'Failed to update recurring invoice' }); return; }
  if (!data) { res.status(404).json({ error: 'Recurring invoice not found' }); return; }
  res.json({ recurringInvoice: data });
});

async function updateStatus(req: Request, res: Response, status: 'paused' | 'active' | 'cancelled') {
  const user = await requireUser(req, res); if (!user) return;
  if (!(await requireFeature(user.id, res))) return;
  const id = String(req.params.id);
  if (!idValid(id)) { res.status(400).json({ error: 'Invalid recurring invoice ID' }); return; }
  const { data, error } = await supabaseAdmin.from('recurring_invoices').update({ status }).eq('id', id).eq('user_id', user.id).select('*').maybeSingle();
  if (error) { res.status(500).json({ error: 'Failed to update recurring invoice status' }); return; }
  if (!data) { res.status(404).json({ error: 'Recurring invoice not found' }); return; }
  res.json({ recurringInvoice: data });
}
router.post('/recurring-invoices/:id/pause', (req, res) => updateStatus(req, res, 'paused'));
router.post('/recurring-invoices/:id/resume', (req, res) => updateStatus(req, res, 'active'));
router.post('/recurring-invoices/:id/cancel', (req, res) => updateStatus(req, res, 'cancelled'));

router.post('/recurring-invoices/:id/duplicate', async (req, res) => {
  const user = await requireUser(req, res); if (!user) return;
  if (!(await requireFeature(user.id, res))) return;
  if (!idValid(req.params.id)) { res.status(400).json({ error: 'Invalid recurring invoice ID' }); return; }
  const source = await supabaseAdmin.from('recurring_invoices').select('*').eq('id', req.params.id).eq('user_id', user.id).maybeSingle();
  if (source.error) { res.status(500).json({ error: 'Failed to load recurring invoice' }); return; }
  if (!source.data) { res.status(404).json({ error: 'Recurring invoice not found' }); return; }
  const copy = { ...source.data, id: undefined, status: 'active', generated_invoice_count: 0, last_generated_at: null };
  delete copy.id;
  const { data, error } = await supabaseAdmin.from('recurring_invoices').insert({ ...copy, user_id: user.id }).select('*').single();
  if (error) { res.status(500).json({ error: 'Failed to duplicate recurring invoice' }); return; }
  res.status(201).json({ recurringInvoice: data });
});

router.delete('/recurring-invoices/:id', async (req, res) => {
  const user = await requireUser(req, res); if (!user) return;
  if (!(await requireFeature(user.id, res))) return;
  if (!idValid(req.params.id)) { res.status(400).json({ error: 'Invalid recurring invoice ID' }); return; }
  const { count, error } = await supabaseAdmin.from('recurring_invoices').delete({ count: 'exact' }).eq('id', req.params.id).eq('user_id', user.id);
  if (error) { res.status(500).json({ error: 'Failed to delete recurring invoice' }); return; }
  if (!count) { res.status(404).json({ error: 'Recurring invoice not found' }); return; }
  res.status(204).send();
});

// Scheduler hook: invoke this from a Supabase Edge Function or a trusted cron runner.
router.post('/internal/recurring-invoices/generate', async (req, res) => {
  const configuredSecret = process.env.RECURRING_CRON_SECRET;
  if (!configuredSecret || req.get('x-recurring-cron-secret') !== configuredSecret) {
    res.status(401).json({ error: 'Invalid scheduler credentials' }); return;
  }
  try {
    const generated = await generateDueRecurringInvoices(typeof req.body?.asOf === 'string' ? req.body.asOf : undefined);
    res.json({ generated });
  } catch {
    res.status(500).json({ error: 'Recurring invoice generation failed' });
  }
});

export default router;