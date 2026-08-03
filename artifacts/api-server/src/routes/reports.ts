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

function currencyCode(value: string | null | undefined) {
  return (value || 'USD').toUpperCase();
}

type CurrencyAmount = { currency: string; amount: number };
type CurrencyRate = { currency: string; value: number };

function addCurrencyAmount(map: Map<string, number>, currency: string, amount: number) {
  map.set(currency, (map.get(currency) ?? 0) + amount);
}

function currencyAmounts(map: Map<string, number>): CurrencyAmount[] {
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([currency, amount]) => ({ currency, amount }));
}

function currencyRates(map: Map<string, { numerator: number; denominator: number }>): CurrencyRate[] {
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([currency, values]) => ({
      currency,
      value: values.denominator ? (values.numerator / values.denominator) * 100 : 0,
    }));
}

function averageCurrencyAmounts(
  values: Map<string, { total: number; count: number }>,
): CurrencyAmount[] {
  return [...values.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([currency, { total, count }]) => ({ currency, amount: count ? total / count : 0 }));
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
    .select('id,invoice_number,status,issue_date,due_date,total,amount_paid,currency,client,company,client_id,created_at')
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
  const invoiceCurrency = new Map(invoiceRows.map((invoice) => [invoice.id, currencyCode(invoice.currency)]));
  const paidByInvoice = new Map<string, number>();
  for (const payment of selectedPaymentRows) add(paidByInvoice, payment.invoice_id, Number(payment.amount || 0));
  const paidFor = (invoice: { id: string; amount_paid?: number | null }) =>
    paidByInvoice.has(invoice.id) ? paidByInvoice.get(invoice.id)! : Number(invoice.amount_paid || 0);
  const paidRows = invoiceRows.filter((invoice) => invoice.status === 'Paid');
  const outstandingRows = invoiceRows.filter((invoice) => ['Sent', 'Viewed', 'Partially Paid', 'Overdue'].includes(invoice.status));
  const totalBilledByCurrency = new Map<string, number>();
  const paidAmountByCurrency = new Map<string, number>();
  const outstandingAmountByCurrency = new Map<string, number>();
  const overdueAmountByCurrency = new Map<string, number>();
  for (const invoice of invoiceRows) {
    const currency = currencyCode(invoice.currency);
    addCurrencyAmount(totalBilledByCurrency, currency, Number(invoice.total || 0));
    addCurrencyAmount(paidAmountByCurrency, currency, paidFor(invoice));
    if (outstandingRows.includes(invoice)) {
      addCurrencyAmount(outstandingAmountByCurrency, currency, Math.max(Number(invoice.total || 0) - paidFor(invoice), 0));
    }
    if (invoice.status === 'Overdue') {
      addCurrencyAmount(overdueAmountByCurrency, currency, Math.max(Number(invoice.total || 0) - paidFor(invoice), 0));
    }
  }
  const invoiceStatus = statuses.map((status) => ({ status, count: invoiceRows.filter((invoice) => invoice.status === status).length }));

  const revenueMap = new Map<string, { label: string; currency: string; value: number }>();
  for (const payment of selectedPaymentRows) {
    const label = periodKey(payment.payment_date, period);
    const currency = invoiceCurrency.get(payment.invoice_id) ?? 'USD';
    const key = `${label}:${currency}`;
    const current = revenueMap.get(key) ?? { label, currency, value: 0 };
    current.value += Number(payment.amount || 0);
    revenueMap.set(key, current);
  }
  const revenue = [...revenueMap.values()].sort((a, b) => `${a.label}:${a.currency}`.localeCompare(`${b.label}:${b.currency}`));
  const collectionMap = new Map<string, { label: string; currency: string; value: number }>();
  for (const payment of selectedPaymentRows) {
    const label = periodKey(payment.payment_date, 'month');
    const currency = invoiceCurrency.get(payment.invoice_id) ?? 'USD';
    const key = `${label}:${currency}`;
    const current = collectionMap.get(key) ?? { label, currency, value: 0 };
    current.value += Number(payment.amount || 0);
    collectionMap.set(key, current);
  }
  const monthlyCollections = [...collectionMap.values()].sort((a, b) => `${a.label}:${a.currency}`.localeCompare(`${b.label}:${b.currency}`));

  const clientMetrics = new Map<string, { name: string; revenue: Map<string, number>; invoices: number; paidInvoices: number }>();
  for (const invoice of invoiceRows) {
    const key = invoice.client_id || `name:${invoice.client || invoice.company || 'Unassigned'}`;
    const name = invoice.company || invoice.client || 'Unassigned client';
    const current = clientMetrics.get(key) ?? { name, revenue: new Map<string, number>(), invoices: 0, paidInvoices: 0 };
    addCurrencyAmount(current.revenue, currencyCode(invoice.currency), paidFor(invoice));
    current.invoices += 1;
    if (invoice.status === 'Paid') current.paidInvoices += 1;
    clientMetrics.set(key, current);
  }
  const topClients = [...clientMetrics.values()]
    .sort((a, b) => [...b.revenue.values()].reduce((sum, value) => sum + value, 0) - [...a.revenue.values()].reduce((sum, value) => sum + value, 0))
    .slice(0, 8)
    .map((client) => ({ ...client, revenue: currencyAmounts(client.revenue) }));
  const activeClientIds = new Set(invoiceRows.map((invoice) => invoice.client_id).filter(Boolean));
  const returningClients = [...clientMetrics.values()].filter((client) => client.invoices > 1).length;
  const newClients = clientRows.length;
  const averageClientRevenueByCurrency = new Map<string, { total: number; count: number }>();
  for (const client of clientMetrics.values()) {
    for (const [currency, amount] of client.revenue) {
      const current = averageClientRevenueByCurrency.get(currency) ?? { total: 0, count: 0 };
      current.total += amount;
      current.count += 1;
      averageClientRevenueByCurrency.set(currency, current);
    }
  }
  const averageClientRevenue = averageCurrencyAmounts(averageClientRevenueByCurrency);
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
  let revenueGrowth = new Map<string, { numerator: number; denominator: number }>();
  if (previousStart && previousEnd) {
    const span = previousEnd.getTime() - previousStart.getTime() + 86400000;
    const priorStart = new Date(previousStart.getTime() - span).toISOString().slice(0, 10);
    const priorEnd = new Date(previousStart.getTime() - 86400000).toISOString().slice(0, 10);
    const { data: priorInvoices } = await supabaseAdmin.from('invoices').select('amount_paid,currency').eq('user_id', user.id).gte('issue_date', priorStart).lte('issue_date', priorEnd);
    const priorRevenueByCurrency = new Map<string, number>();
    for (const invoice of priorInvoices ?? []) addCurrencyAmount(priorRevenueByCurrency, currencyCode(invoice.currency), Number(invoice.amount_paid || 0));
    const growthInputs = new Map<string, { numerator: number; denominator: number }>();
    for (const [currency, current] of paidAmountByCurrency) {
      const prior = priorRevenueByCurrency.get(currency) ?? 0;
      growthInputs.set(currency, { numerator: current - prior, denominator: prior });
    }
    revenueGrowth = growthInputs;
  }

  const collectionRate = new Map<string, { numerator: number; denominator: number }>();
  for (const [currency, billed] of totalBilledByCurrency) {
    collectionRate.set(currency, { numerator: paidAmountByCurrency.get(currency) ?? 0, denominator: billed });
  }
  const currentMonth = periodKey(new Date().toISOString(), 'month');
  const monthlyRevenue = new Map<string, number>();
  for (const item of revenue) if (item.label === currentMonth) addCurrencyAmount(monthlyRevenue, item.currency, item.value);

  res.json({
    range: { start: start ?? null, end: end ?? null, period },
    summary: {
       totalRevenue: currencyAmounts(totalBilledByCurrency),
       outstandingRevenue: currencyAmounts(outstandingAmountByCurrency),
       paidRevenue: currencyAmounts(paidAmountByCurrency),
       overdueRevenue: currencyAmounts(overdueAmountByCurrency),
      totalInvoices: invoiceRows.length,
      paidInvoices: paidRows.length,
      outstandingInvoices: outstandingRows.length,
      overdueInvoices: invoiceRows.filter((invoice) => invoice.status === 'Overdue').length,
      activeClients: activeClientIds.size || clientRows.length,
       averageInvoiceValue: averageCurrencyAmounts(new Map([...totalBilledByCurrency].map(([currency, total]) => [currency, { total, count: invoiceRows.filter((invoice) => currencyCode(invoice.currency) === currency).length }]))),
      averageClientRevenue,
      newClients,
      returningClients,
    },
     revenue,
    invoiceStatus,
     topClients,
    payments: {
       collectionRate: currencyRates(collectionRate),
       outstandingBalance: currencyAmounts(outstandingAmountByCurrency),
       paidAmount: currencyAmounts(paidAmountByCurrency),
      partialPayments: invoiceRows.filter((invoice) => invoice.status === 'Partially Paid').length,
      monthlyCollections,
    },
    kpis: {
       monthlyRevenue: currencyAmounts(monthlyRevenue),
       annualRevenue: currencyAmounts(paidAmountByCurrency),
       averageInvoiceValue: averageCurrencyAmounts(new Map([...totalBilledByCurrency].map(([currency, total]) => [currency, { total, count: invoiceRows.filter((invoice) => currencyCode(invoice.currency) === currency).length }]))),
      averagePaymentTime: average(paymentTimes),
      invoiceConversionRate: invoiceRows.length ? (conversionBase / invoiceRows.length) * 100 : 0,
       collectionPercentage: currencyRates(collectionRate),
      clientGrowth: newClients,
       revenueGrowth: currencyRates(revenueGrowth),
    },
     totals: { totalBilled: currencyAmounts(totalBilledByCurrency), totalPayments: selectedPaymentRows.length },
  });
});

export default router;