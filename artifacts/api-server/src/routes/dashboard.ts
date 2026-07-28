import { Router, type IRouter, type Request, type Response } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabase';
import { refreshOverdueInvoices } from '../services/invoice-lifecycle';

const router: IRouter = Router();
const statusValues = ['Draft', 'Sent', 'Viewed', 'Partially Paid', 'Paid', 'Overdue', 'Cancelled'] as const;

const querySchema = z.object({
  start: z.string().date().optional(),
  end: z.string().date().optional(),
});

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

function dateKey(value: string) {
  return value.slice(0, 10);
}

router.get('/dashboard/overview', async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  await refreshOverdueInvoices(user.id);
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success || (parsed.data.start && parsed.data.end && parsed.data.start > parsed.data.end)) {
    res.status(400).json({ error: 'Invalid dashboard date range' });
    return;
  }

  const { start, end } = parsed.data;
  let invoiceQuery = supabaseAdmin
    .from('invoices')
    .select('id, invoice_number, status, issue_date, due_date, client, company, total, amount_paid, currency, client_id, created_at, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });
  let clientQuery = supabaseAdmin
    .from('clients')
    .select('id, full_name, company_name, email, created_at, updated_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  if (start) {
    invoiceQuery = invoiceQuery.gte('issue_date', start);
    clientQuery = clientQuery.gte('created_at', `${start}T00:00:00.000Z`);
  }
  if (end) {
    invoiceQuery = invoiceQuery.lte('issue_date', end);
    clientQuery = clientQuery.lte('created_at', `${end}T23:59:59.999Z`);
  }

  const [{ data: invoices, error: invoiceError }, { data: clients, error: clientError }] = await Promise.all([invoiceQuery, clientQuery]);
  if (invoiceError || clientError) {
    res.status(500).json({ error: 'Failed to load dashboard overview' });
    return;
  }

  const invoiceRows = invoices ?? [];
  const clientRows = clients ?? [];
  const statusDistribution = statusValues.map((status) => ({
    status,
    count: invoiceRows.filter((invoice) => invoice.status === status).length,
  }));
  const paidRows = invoiceRows.filter((invoice) => invoice.status === 'Paid');
  const outstandingRows = invoiceRows.filter((invoice) => ['Sent', 'Viewed', 'Partially Paid', 'Overdue'].includes(invoice.status));
  const totalRevenue = invoiceRows.reduce((sum, invoice) => sum + Number(invoice.amount_paid || 0), 0);
  const outstandingAmount = outstandingRows.reduce((sum, invoice) => sum + Math.max(Number(invoice.total || 0) - Number(invoice.amount_paid || 0), 0), 0);

  const revenueMap = new Map<string, number>();
  for (const invoice of paidRows) {
    const key = dateKey(invoice.issue_date);
    revenueMap.set(key, (revenueMap.get(key) ?? 0) + Number(invoice.total || 0));
  }

  const invoiceCountsByClient = new Map<string, { count: number; outstanding: number }>();
  for (const invoice of invoiceRows) {
    if (!invoice.client_id) continue;
    const current = invoiceCountsByClient.get(invoice.client_id) ?? { count: 0, outstanding: 0 };
    current.count += 1;
    if (['Sent', 'Viewed', 'Partially Paid', 'Overdue'].includes(invoice.status)) current.outstanding += Math.max(Number(invoice.total || 0) - Number(invoice.amount_paid || 0), 0);
    invoiceCountsByClient.set(invoice.client_id, current);
  }

  const { data: recentActivity } = await supabaseAdmin.from('invoice_activity').select('id,invoice_id,action,description,created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(8);
  res.json({
    range: { start: start ?? null, end: end ?? null },
    stats: {
      totalInvoices: invoiceRows.length,
      draftInvoices: invoiceRows.filter((invoice) => invoice.status === 'Draft').length,
      sentInvoices: invoiceRows.filter((invoice) => invoice.status === 'Sent').length,
      viewedInvoices: invoiceRows.filter((invoice) => invoice.status === 'Viewed').length,
      partiallyPaidInvoices: invoiceRows.filter((invoice) => invoice.status === 'Partially Paid').length,
      paidInvoices: invoiceRows.filter((invoice) => invoice.status === 'Paid').length,
      overdueInvoices: invoiceRows.filter((invoice) => invoice.status === 'Overdue').length,
      cancelledInvoices: invoiceRows.filter((invoice) => invoice.status === 'Cancelled').length,
      totalRevenue,
      outstandingAmount,
      totalClients: clientRows.length,
    },
    revenue: [...revenueMap.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, amount]) => ({ date, amount })),
    statusDistribution,
    recentActivity: recentActivity ?? [],
    recentInvoices: invoiceRows.slice(0, 8),
    recentClients: clientRows.slice(0, 6).map((client) => {
      const metrics = invoiceCountsByClient.get(client.id) ?? { count: 0, outstanding: 0 };
      return { ...client, invoice_count: metrics.count, outstanding: metrics.outstanding };
    }),
  });
});

export default router;