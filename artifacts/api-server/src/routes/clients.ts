import { Router, type IRouter, type Request, type Response } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabase';

const router: IRouter = Router();

const clientSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required').max(160),
  companyName: z.string().trim().max(240).default(''),
  email: z.string().trim().email('Enter a valid email address').or(z.literal('')).default(''),
  phone: z.string().trim().max(80).default(''),
  billingAddress: z.string().trim().max(500).default(''),
  city: z.string().trim().max(120).default(''),
  state: z.string().trim().max(120).default(''),
  postalCode: z.string().trim().max(40).default(''),
  country: z.string().trim().max(120).default(''),
  taxId: z.string().trim().max(120).default(''),
  notes: z.string().trim().max(4000).default(''),
});

const listSchema = z.object({
  search: z.string().trim().max(120).optional(),
  sort: z.enum(['recent', 'name', 'company', 'updated']).default('recent'),
  direction: z.enum(['asc', 'desc']).default('desc'),
});
const clientIdSchema = z.string().uuid();

function currencyCode(value: string | null | undefined) {
  return (value || 'USD').toUpperCase();
}

function addCurrencyAmount(map: Map<string, number>, currency: string, amount: number) {
  map.set(currency, (map.get(currency) ?? 0) + amount);
}

function currencyAmounts(map: Map<string, number>) {
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([currency, amount]) => ({ currency, amount }));
}

function getToken(req: Request) {
  const header = req.get('authorization');
  return header?.startsWith('Bearer ') ? header.slice(7) : null;
}

async function requireUser(req: Request, res: Response) {
  const token = getToken(req);
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

const sortColumns = {
  recent: 'created_at',
  name: 'full_name',
  company: 'company_name',
  updated: 'updated_at',
} as const;

function escapeFilter(value: string) {
  return value.replace(/[%_,]/g, (character) => `\\${character}`);
}

router.get('/clients', async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  const parsed = listSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid client filters', details: parsed.error.flatten() });
    return;
  }
  const { search, sort, direction } = parsed.data;
  let query = supabaseAdmin
    .from('clients')
    .select('id, full_name, company_name, email, phone, billing_address, city, state, postal_code, country, tax_id, notes, created_at, updated_at')
    .eq('user_id', user.id)
    .order(sortColumns[sort], { ascending: direction === 'asc' });
  if (search) {
    const value = escapeFilter(search);
    query = query.or(`full_name.ilike.%${value}%,company_name.ilike.%${value}%,email.ilike.%${value}%,phone.ilike.%${value}%`);
  }
  const { data, error } = await query;
  if (error) {
    res.status(500).json({ error: 'Failed to load clients' });
    return;
  }
  res.json({ clients: data ?? [] });
});

router.get('/clients/:id', async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  if (!clientIdSchema.safeParse(req.params.id).success) {
    res.status(400).json({ error: 'Invalid client ID' });
    return;
  }
  const { data: client, error: clientError } = await supabaseAdmin
    .from('clients')
    .select('*')
    .eq('id', req.params.id)
    .eq('user_id', user.id)
    .maybeSingle();
  if (clientError) {
    res.status(500).json({ error: 'Failed to load client' });
    return;
  }
  if (!client) {
    res.status(404).json({ error: 'Client not found' });
    return;
  }
  const { data: invoices, error: invoiceError } = await supabaseAdmin
    .from('invoices')
    .select('id, invoice_number, status, issue_date, due_date, total, currency, client, company, client_id, created_at, updated_at')
    .eq('user_id', user.id)
    .eq('client_id', client.id);
  if (invoiceError) {
    res.status(500).json({ error: 'Failed to load client invoices' });
    return;
  }
  const history = [...(invoices ?? [])].sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at));
  const totalInvoicedByCurrency = new Map<string, number>();
  const totalPaidByCurrency = new Map<string, number>();
  for (const invoice of history) {
    const currency = currencyCode(invoice.currency);
    addCurrencyAmount(totalInvoicedByCurrency, currency, Number(invoice.total || 0));
    if (invoice.status === 'Paid') {
      addCurrencyAmount(totalPaidByCurrency, currency, Number(invoice.total || 0));
    }
  }
  const outstandingByCurrency = new Map<string, number>();
  for (const [currency, amount] of totalInvoicedByCurrency) {
    addCurrencyAmount(outstandingByCurrency, currency, amount - (totalPaidByCurrency.get(currency) ?? 0));
  }
  res.json({
    client,
    stats: {
      invoiceCount: history.length,
      totalInvoiced: currencyAmounts(totalInvoicedByCurrency),
      totalPaid: currencyAmounts(totalPaidByCurrency),
      outstanding: currencyAmounts(outstandingByCurrency),
    },
    recentInvoices: history.slice(0, 10),
  });
});

router.post('/clients', async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  const parsed = clientSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Please check the client details', details: parsed.error.flatten() });
    return;
  }
  const input = parsed.data;
  const { data, error } = await supabaseAdmin
    .from('clients')
    .insert({ user_id: user.id, full_name: input.fullName, company_name: input.companyName, email: input.email, phone: input.phone, billing_address: input.billingAddress, city: input.city, state: input.state, postal_code: input.postalCode, country: input.country, tax_id: input.taxId, notes: input.notes })
    .select('*')
    .single();
  if (error) {
    res.status(error.code === '23505' ? 409 : 500).json({ error: error.code === '23505' ? 'A client with this email and company already exists.' : 'Failed to create client' });
    return;
  }
  res.status(201).json({ client: data });
});

router.patch('/clients/:id', async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  if (!clientIdSchema.safeParse(req.params.id).success) {
    res.status(400).json({ error: 'Invalid client ID' });
    return;
  }
  const parsed = clientSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Please check the client details', details: parsed.error.flatten() });
    return;
  }
  const input = parsed.data;
  const updates: Record<string, unknown> = {};
  const fields: Record<string, keyof typeof input> = {
    full_name: 'fullName', company_name: 'companyName', email: 'email', phone: 'phone',
    billing_address: 'billingAddress', city: 'city', state: 'state', postal_code: 'postalCode',
    country: 'country', tax_id: 'taxId', notes: 'notes',
  };
  for (const [column, key] of Object.entries(fields)) {
    if (input[key] !== undefined) updates[column] = input[key];
  }
  const { data, error } = await supabaseAdmin
    .from('clients')
    .update(updates)
    .eq('id', req.params.id)
    .eq('user_id', user.id)
    .select('*')
    .maybeSingle();
  if (error) {
    res.status(error.code === '23505' ? 409 : 500).json({ error: error.code === '23505' ? 'A client with this email and company already exists.' : 'Failed to update client' });
    return;
  }
  if (!data) {
    res.status(404).json({ error: 'Client not found' });
    return;
  }
  res.json({ client: data });
});

router.delete('/clients/:id', async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  if (!clientIdSchema.safeParse(req.params.id).success) {
    res.status(400).json({ error: 'Invalid client ID' });
    return;
  }
  const { count, error } = await supabaseAdmin
    .from('clients')
    .delete({ count: 'exact' })
    .eq('id', req.params.id)
    .eq('user_id', user.id);
  if (error) {
    res.status(500).json({ error: 'Failed to delete client' });
    return;
  }
  if (!count) {
    res.status(404).json({ error: 'Client not found' });
    return;
  }
  res.status(204).send();
});

export default router;