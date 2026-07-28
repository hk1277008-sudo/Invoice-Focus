import { Router, type IRouter, type Request, type Response } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabase';
import { releaseInvoice, reserveInvoice } from './subscriptions';

const router: IRouter = Router();
const statuses = ['Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled'] as const;
const statusSchema = z.enum(statuses);

const invoicePayloadSchema = z.object({
  business: z.record(z.string(), z.unknown()).optional(),
  client: z.record(z.string(), z.unknown()).optional(),
  details: z.record(z.string(), z.unknown()).optional(),
  items: z.array(z.record(z.string(), z.unknown())).optional(),
  additional: z.record(z.string(), z.unknown()).optional(),
});

const invoiceInputSchema = z.object({
  invoiceNumber: z.string().trim().min(1).max(80).optional(),
  status: statusSchema.default('Draft'),
  issueDate: z.string().date(),
  dueDate: z.string().date().nullable().optional(),
  client: z.string().trim().max(240).default(''),
  company: z.string().trim().max(240).default(''),
  clientId: z.string().uuid().nullable().optional(),
  total: z.coerce.number().finite().nonnegative().default(0),
  currency: z.string().trim().min(3).max(3).default('USD'),
  payload: invoicePayloadSchema.default({}),
});
const invoiceIdSchema = z.string().uuid();

const listQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  status: statusSchema.optional(),
  sort: z.enum(['updated', 'created', 'issueDate', 'dueDate', 'total', 'invoiceNumber']).default('updated'),
  direction: z.enum(['asc', 'desc']).default('desc'),
});

function authToken(req: Request) {
  const header = req.get('authorization');
  return header?.startsWith('Bearer ') ? header.slice(7) : null;
}

async function requireUser(req: Request, res: Response) {
  const token = authToken(req);
  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return null;
  }
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    res.status(401).json({ error: 'Invalid or expired session' });
    return null;
  }
  return data.user;
}

function nextInvoiceNumber() {
  const date = new Date();
  const year = date.getUTCFullYear();
  const suffix = `${date.getTime()}`.slice(-6);
  return `INV-${year}-${suffix}`;
}

const sortColumns = {
  updated: 'updated_at',
  created: 'created_at',
  issueDate: 'issue_date',
  dueDate: 'due_date',
  total: 'total',
  invoiceNumber: 'invoice_number',
} as const;

router.get('/invoices', async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid invoice filters', details: parsed.error.flatten() });
    return;
  }
  const { search, status, sort, direction } = parsed.data;
  let query = supabaseAdmin
    .from('invoices')
    .select('id, invoice_number, status, issue_date, due_date, client, company, total, currency, created_at, updated_at')
    .eq('user_id', user.id);
  if (status) query = query.eq('status', status);
  if (search) {
    const escaped = search.replace(/[%_,]/g, (value) => `\\${value}`);
    query = query.or(`invoice_number.ilike.%${escaped}%,client.ilike.%${escaped}%,company.ilike.%${escaped}%`);
  }
  query = query.order(sortColumns[sort], { ascending: direction === 'asc', nullsFirst: false });
  const { data, error } = await query;
  if (error) {
    res.status(500).json({ error: 'Failed to load invoices' });
    return;
  }
  res.json({ invoices: data ?? [] });
});

router.get('/invoices/:id', async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  if (!invoiceIdSchema.safeParse(req.params.id).success) {
    res.status(400).json({ error: 'Invalid invoice ID' });
    return;
  }
  const { data, error } = await supabaseAdmin
    .from('invoices')
    .select('*')
    .eq('id', req.params.id)
    .eq('user_id', user.id)
    .maybeSingle();
  if (error) {
    res.status(500).json({ error: 'Failed to load invoice' });
    return;
  }
  if (!data) {
    res.status(404).json({ error: 'Invoice not found' });
    return;
  }
  res.json({ invoice: data });
});

router.post('/invoices', async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  const parsed = invoiceInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid invoice data', details: parsed.error.flatten() });
    return;
  }
  const input = parsed.data;
  let usage: Awaited<ReturnType<typeof reserveInvoice>>;
  try {
    usage = await reserveInvoice(user.id);
  } catch {
    res.status(503).json({ error: 'Invoice service is temporarily unavailable. Please try again.' });
    return;
  }
  if (!usage.allowed) {
    res.status(402).json({
      error: "You've reached your monthly limit of 15 invoices. Upgrade to Pro for unlimited invoicing and additional business tools.",
      code: 'INVOICE_LIMIT_REACHED', subscription: usage,
    });
    return;
  }
  const { data, error } = await supabaseAdmin
    .from('invoices')
    .insert({
      user_id: user.id,
      invoice_number: input.invoiceNumber || nextInvoiceNumber(),
      status: input.status,
      issue_date: input.issueDate,
      due_date: input.dueDate ?? null,
      client: input.client,
      company: input.company,
      client_id: input.clientId ?? null,
      total: input.total,
      currency: input.currency.toUpperCase(),
      payload: input.payload,
    })
    .select('*')
    .single();
  if (error) {
    await releaseInvoice(user.id);
    res.status(error.code === '23505' ? 409 : 500).json({ error: error.code === '23505' ? 'Invoice number already exists' : 'Failed to save invoice' });
    return;
  }
  res.status(201).json({ invoice: data });
});

router.patch('/invoices/:id', async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  if (!invoiceIdSchema.safeParse(req.params.id).success) {
    res.status(400).json({ error: 'Invalid invoice ID' });
    return;
  }
  const parsed = invoiceInputSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid invoice data', details: parsed.error.flatten() });
    return;
  }
  const input = parsed.data;
  const updates: Record<string, unknown> = {};
  if (input.invoiceNumber !== undefined) updates.invoice_number = input.invoiceNumber;
  if (input.status !== undefined) updates.status = input.status;
  if (input.issueDate !== undefined) updates.issue_date = input.issueDate;
  if (input.dueDate !== undefined) updates.due_date = input.dueDate;
  if (input.client !== undefined) updates.client = input.client;
  if (input.company !== undefined) updates.company = input.company;
  if (input.clientId !== undefined) updates.client_id = input.clientId;
  if (input.total !== undefined) updates.total = input.total;
  if (input.currency !== undefined) updates.currency = input.currency.toUpperCase();
  if (input.payload !== undefined) updates.payload = input.payload;
  const { data, error } = await supabaseAdmin
    .from('invoices')
    .update(updates)
    .eq('id', req.params.id)
    .eq('user_id', user.id)
    .select('*')
    .maybeSingle();
  if (error) {
    res.status(error.code === '23505' ? 409 : 500).json({ error: 'Failed to update invoice' });
    return;
  }
  if (!data) {
    res.status(404).json({ error: 'Invoice not found' });
    return;
  }
  res.json({ invoice: data });
});

router.post('/invoices/:id/duplicate', async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  if (!invoiceIdSchema.safeParse(req.params.id).success) {
    res.status(400).json({ error: 'Invalid invoice ID' });
    return;
  }
  const { data: source, error: sourceError } = await supabaseAdmin
    .from('invoices')
    .select('*')
    .eq('id', req.params.id)
    .eq('user_id', user.id)
    .single();
  if (sourceError || !source) {
    res.status(404).json({ error: 'Invoice not found' });
    return;
  }
  let usage: Awaited<ReturnType<typeof reserveInvoice>>;
  try {
    usage = await reserveInvoice(user.id);
  } catch {
    res.status(503).json({ error: 'Invoice service is temporarily unavailable. Please try again.' });
    return;
  }
  if (!usage.allowed) {
    res.status(402).json({
      error: "You've reached your monthly limit of 15 invoices. Upgrade to Pro for unlimited invoicing and additional business tools.",
      code: 'INVOICE_LIMIT_REACHED', subscription: usage,
    });
    return;
  }
  const { data, error } = await supabaseAdmin
    .from('invoices')
    .insert({
      user_id: user.id,
      invoice_number: nextInvoiceNumber(),
      status: 'Draft',
      issue_date: new Date().toISOString().slice(0, 10),
      due_date: source.due_date,
      client: source.client,
      company: source.company,
      client_id: source.client_id ?? null,
      total: source.total,
      currency: source.currency,
      payload: source.payload,
    })
    .select('*')
    .single();
  if (error) {
    await releaseInvoice(user.id);
    res.status(500).json({ error: 'Failed to duplicate invoice' });
    return;
  }
  res.status(201).json({ invoice: data });
});

router.delete('/invoices/:id', async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  if (!invoiceIdSchema.safeParse(req.params.id).success) {
    res.status(400).json({ error: 'Invalid invoice ID' });
    return;
  }
  const { count, error } = await supabaseAdmin
    .from('invoices')
    .delete({ count: 'exact' })
    .eq('id', req.params.id)
    .eq('user_id', user.id);
  if (error) {
    res.status(500).json({ error: 'Failed to delete invoice' });
    return;
  }
  if (!count) {
    res.status(404).json({ error: 'Invoice not found' });
    return;
  }
  res.status(204).send();
});

export default router;