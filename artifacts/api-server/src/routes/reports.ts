import { Router, type IRouter, type Request, type Response } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabase';
import { refreshOverdueInvoices } from '../services/invoice-lifecycle';

const router: IRouter = Router();
const statuses = ['Draft', 'Sent', 'Viewed', 'Partially Paid', 'Paid', 'Overdue', 'Cancelled'] as const;
const querySchema = z.object({
  start: z.string().date().optional(),
  end: z.string().date().optional(),
  period: z.enum(['week', 'month', 'year']).default('month'),
});

function token(req: Request) {
  const header = req.get('authorization');
  return header?.startsWith('Bearer ') ? header.slice(7) : null;
}

async function requireUser(req: Request, res: Response) {
  const accessToken = token(req);
  if (!accessToken) {
    res.status(401).json({ error: 'Authentication required' });
    return null;
  }
  const { data, error } = await supabaseAdmin.auth.getUser(accessToken);
  if (error || !data.user) {
    res.status(401).json({ error: 'Invalid or expired session' });
    return null;
  }
  return data.user;
}

function day(value: string | null | undefined) {
  return value ? value.slice(0, 10) : '';
}

function periodKey(value: string, period: 'week' | 'month' | 'year') {
  const date = new Date(`${value.slice(0, 10)}T12:00:00Z`);
  if (period === 'year') return String(date.getUTCFullYear());
  if (period === 'month') return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
  const monday = new Date(date);
  const weekday = monday.getUTCDay() || 7;
  monday.setUTCDate(monday.getUTCDate() - weekday + 1);
  return monday.toISOString().slice(0, 10);
}

function add(map: Map<string, number>, key: string, value: number) {
  map.set(key, (map.get(key) ?? 0) + value);
}

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

router.get('/reports/overview', async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success || (parsed.data.start && parsed.data.end && parsed.data.start > parsed.data.end)) {
    res.status(400).json({ error: 'Invalid report date range' });
    return;
  }

  await refreshOverdueInvoices(user.id);
  const { start, end, period } = parsed.data;
  let invoiceQuery = supabaseAdmin
    .from('invoices')
    .select('id,invoice_number,status,issue_date,due_date,total,amount_paid,client,company,client_id,created_at')
    .eq('user_id', user.id);
  let paymentQuery = supabaseAdmin
    .from('invoice_payments')
    .select('id,invoice_id,amount,payment_date,created_at')
    .eq('user_id', user.id);
  let clientQuery = supabaseAdmin
    .from('clients')
    .select('id,full_name,company_name,created_at')
    .eq('user_id', user.id);
  if (start) {
    invoiceQuery = invoiceQuery.gte('issue_date', start);
    paymentQuery = paymentQuery.gte('payment_date', start);
    clientQuery = clientQuery.gte('created_at', `${start}T00:00:00.000Z`);
  }
  if (end) {
    invoiceQuery = invoiceQuery.lte('issue_date', end);
    paymentQuery = paymentQuery.lte('payment_date', end);
    clientQuery = clientQuery.lte('created_at', `${end}T23:59:59.999Z`);
  }
  const [{ data: invoices, error: invoiceError }, { data: payments, error: paymentError }, { data: clients, error: clientError }] = await Promise.all([
    invoiceQuery,
    paymentQuery,
    clientQuery,
  ]);
  if (invoiceError || paymentError || clientError) {
    res.status(500).json({ error: 'Failed to load reports' });
    return;
  }

  const invoiceRows = invoices ?? [];
  const paymentRows = payments ?? [];
  const clientRows = clients ?? [];
  const selectedInvoiceIds = new Set(invoiceRows.map((invoice) => invoice.id));
  const selectedPaymentRows = paymentRows.filter((payment) => selectedInvoiceIds.has(payment.invoice_id));
  const paidByInvoice = new Map<string, number>();
  for (const payment of selectedPaymentRows) add(paidByInvoice, payment.invoice_id, Number(payment.amount || 0));
  const paidFor = (invoice: { id: string; amount_paid?: number | null }) =>
    paidByInvoice.has(invoice.id) ? paidByInvoice.get(invoice.id)! : Number(invoice.amount_paid || 0);
  const paidRows = invoiceRows.filter((invoice) => invoice.status === 'Paid');
  const outstandingRows = invoiceRows.filter((invoice) => ['Sent', 'Viewed', 'Partially Paid', 'Overdue'].includes(invoice.status));
  const totalBilled = invoiceRows.reduce((sum, invoice) => sum + Number(invoice.total || 0), 0);
  const paidAmount = selectedPaymentRows.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const outstandingAmount = outstandingRows.reduce((sum, invoice) => sum + Math.max(Number(invoice.total || 0) - paidFor(invoice), 0), 0);
  const overdueAmount = invoiceRows.filter((invoice) => invoice.status === 'Overdue').reduce((sum, invoice) => sum + Math.max(Number(invoice.total || 0) - paidFor(invoice), 0), 0);
  const invoiceStatus = statuses.map((status) => ({ status, count: invoiceRows.filter((invoice) => invoice.status === status).length }));

  const revenueMap = new Map<string, number>();
  for (const payment of selectedPaymentRows) add(revenueMap, periodKey(payment.payment_date, period), Number(payment.amount || 0));
  const revenue = [...revenueMap.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([label, value]) => ({ label, value }));
  const collectionMap = new Map<string, number>();
  for (const payment of selectedPaymentRows) add(collectionMap, periodKey(payment.payment_date, 'month'), Number(payment.amount || 0));
  const monthlyCollections = [...collectionMap.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([label, value]) => ({ label, value }));

  const clientMetrics = new Map<string, { name: string; revenue: number; invoices: number; paidInvoices: number }>();
  for (const invoice of invoiceRows) {
    const key = invoice.client_id || `name:${invoice.client || invoice.company || 'Unassigned'}`;
    const name = invoice.company || invoice.client || 'Unassigned client';
    const current = clientMetrics.get(key) ?? { name, revenue: 0, invoices: 0, paidInvoices: 0 };
    current.revenue += paidFor(invoice);
    current.invoices += 1;
    if (invoice.status === 'Paid') current.paidInvoices += 1;
    clientMetrics.set(key, current);
  }
  const topClients = [...clientMetrics.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 8);
  const activeClientIds = new Set(invoiceRows.map((invoice) => invoice.client_id).filter(Boolean));
  const returningClients = [...clientMetrics.values()].filter((client) => client.invoices > 1).length;
  const newClients = clientRows.length;
  const averageClientRevenue = clientMetrics.size ? [...clientMetrics.values()].reduce((sum, client) => sum + client.revenue, 0) / clientMetrics.size : 0;
  const invoiceIssueDates = new Map(invoiceRows.map((invoice) => [invoice.id, day(invoice.issue_date)]));
  const paymentTimes = selectedPaymentRows
    .map((payment) => {
      const issueDate = invoiceIssueDates.get(payment.invoice_id);
      if (!issueDate) return null;
      return Math.max(0, Math.round((new Date(day(payment.payment_date)).getTime() - new Date(issueDate).getTime()) / 86400000));
    })
    .filter((value): value is number => value !== null);
  const conversionBase = invoiceRows.filter((invoice) => invoice.status !== 'Draft' && invoice.status !== 'Cancelled').length;
  const previousStart = start && end ? new Date(`${start}T12:00:00Z`) : null;
  const previousEnd = start && end ? new Date(`${end}T12:00:00Z`) : null;
  let revenueGrowth = 0;
  if (previousStart && previousEnd) {
    const span = previousEnd.getTime() - previousStart.getTime() + 86400000;
    const priorStart = new Date(previousStart.getTime() - span).toISOString().slice(0, 10);
    const priorEnd = new Date(previousStart.getTime() - 86400000).toISOString().slice(0, 10);
    const { data: priorInvoices } = await supabaseAdmin.from('invoices').select('amount_paid').eq('user_id', user.id).gte('issue_date', priorStart).lte('issue_date', priorEnd);
    const priorRevenue = (priorInvoices ?? []).reduce((sum, invoice) => sum + Number(invoice.amount_paid || 0), 0);
    revenueGrowth = priorRevenue ? ((paidAmount - priorRevenue) / priorRevenue) * 100 : paidAmount ? 100 : 0;
  }

  res.json({
    range: { start: start ?? null, end: end ?? null, period },
    summary: {
      totalRevenue: totalBilled,
      outstandingRevenue: outstandingAmount,
      paidRevenue: paidAmount,
      overdueRevenue: overdueAmount,
      totalInvoices: invoiceRows.length,
      paidInvoices: paidRows.length,
      outstandingInvoices: outstandingRows.length,
      overdueInvoices: invoiceRows.filter((invoice) => invoice.status === 'Overdue').length,
      activeClients: activeClientIds.size || clientRows.length,
      averageInvoiceValue: average(invoiceRows.map((invoice) => Number(invoice.total || 0))),
      averageClientRevenue,
      newClients,
      returningClients,
    },
    revenue,
    invoiceStatus,
    topClients,
    payments: {
      collectionRate: totalBilled ? (paidAmount / totalBilled) * 100 : 0,
      outstandingBalance: outstandingAmount,
      paidAmount,
      partialPayments: invoiceRows.filter((invoice) => invoice.status === 'Partially Paid').length,
      monthlyCollections,
    },
    kpis: {
      monthlyRevenue: revenue.filter((item) => item.label === periodKey(new Date().toISOString(), 'month')).reduce((sum, item) => sum + item.value, 0),
      annualRevenue: paidAmount,
      averageInvoiceValue: average(invoiceRows.map((invoice) => Number(invoice.total || 0))),
      averagePaymentTime: average(paymentTimes),
      invoiceConversionRate: invoiceRows.length ? (conversionBase / invoiceRows.length) * 100 : 0,
      collectionPercentage: totalBilled ? (paidAmount / totalBilled) * 100 : 0,
      clientGrowth: newClients,
      revenueGrowth,
    },
    totals: { totalBilled, totalPayments: selectedPaymentRows.length },
  });
});

export default router;