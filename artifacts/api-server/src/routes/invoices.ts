import { Router, type IRouter, type Request, type Response } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabase';
import { buildInvoiceEmail, sendEmail } from '../lib/email';
import { canTransition, invoiceStatuses, recordActivity, refreshOverdueInvoices, remainingBalance, statusAfterPayment, withInvoicePayloadStatus, createSimplePdf, processDueReminders, type InvoiceStatus } from '../services/invoice-lifecycle';
import { invoicePresentationPayloadSchema } from '../lib/invoice-presentation';
import { adoptFirstInvoiceCurrency } from '../services/business-currency';

const router: IRouter = Router();
const statuses = invoiceStatuses;
const statusSchema = z.enum(statuses);

const invoicePayloadSchema = z.object({
  documentType: z.enum(['invoice', 'receipt', 'estimate', 'quote', 'credit-note', 'purchase-order']).optional(),
  business: z.record(z.string(), z.unknown()).optional(),
  client: z.record(z.string(), z.unknown()).optional(),
  details: z.record(z.string(), z.unknown()).optional(),
  items: z.array(z.record(z.string(), z.unknown())).optional(),
  additional: z.record(z.string(), z.unknown()).optional(),
  documentDetails: z.record(z.string(), z.unknown()).optional(),
  presentation: invoicePresentationPayloadSchema,
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
const paymentSchema = z.object({
  amount: z.coerce.number().finite().positive(),
  paymentDate: z.string().date(),
  paymentMethod: z.string().trim().min(1).max(80),
  referenceNumber: z.string().trim().max(160).default(''),
  notes: z.string().max(2000).default(''),
});
const paymentPatchSchema = paymentSchema.partial();
const sendSchema = z.object({
  recipientEmail: z.string().email(),
  subject: z.string().trim().min(1).max(200),
  personalMessage: z.string().max(4000).default(''),
});
const reminderSchema = z.object({
  triggerType: z.enum(['before_3_days', 'before_1_day', 'due_date', 'overdue_3_days', 'overdue_7_days', 'manual']),
  enabled: z.boolean().default(true),
  recipientEmail: z.string().email(),
  subject: z.string().trim().min(1).max(200),
  personalMessage: z.string().max(4000).default(''),
});

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
  await refreshOverdueInvoices(user.id);
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

router.get('/invoices/:id/details', async (req, res) => {
  const user = await requireUser(req, res); if (!user) return;
  if (!invoiceIdSchema.safeParse(req.params.id).success) { res.status(400).json({ error: 'Invalid invoice ID' }); return; }
  await refreshOverdueInvoices(user.id);
  const invoice = await supabaseAdmin.from('invoices').select('*').eq('id', req.params.id).eq('user_id', user.id).maybeSingle();
  if (invoice.error) { res.status(500).json({ error: 'Failed to load invoice details' }); return; }
  if (!invoice.data) { res.status(404).json({ error: 'Invoice not found' }); return; }
  const [payments, activity, emails, reminders] = await Promise.all([
    supabaseAdmin.from('invoice_payments').select('*').eq('invoice_id', req.params.id).eq('user_id', user.id).order('payment_date', { ascending: false }),
    supabaseAdmin.from('invoice_activity').select('*').eq('invoice_id', req.params.id).eq('user_id', user.id).order('created_at', { ascending: false }),
    supabaseAdmin.from('invoice_email_events').select('*').eq('invoice_id', req.params.id).eq('user_id', user.id).order('occurred_at', { ascending: false }),
    supabaseAdmin.from('invoice_reminders').select('*').eq('invoice_id', req.params.id).eq('user_id', user.id).order('created_at', { ascending: false }),
  ]);
  if (payments.error || activity.error || emails.error || reminders.error) {
    const schemaMissing = [payments.error, activity.error, emails.error, reminders.error].some((error) => error?.code === 'PGRST205');
    res.status(schemaMissing ? 503 : 500).json({ error: 'Invoice history is temporarily unavailable. Please try again later.' });
    return;
  }
  res.json({ invoice: invoice.data, payments: payments.data ?? [], activity: activity.data ?? [], emails: emails.data ?? [], reminders: reminders.data ?? [] });
});

router.get('/invoices/:id', async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  if (!invoiceIdSchema.safeParse(req.params.id).success) {
    res.status(400).json({ error: 'Invalid invoice ID' });
    return;
  }
  await refreshOverdueInvoices(user.id);
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
      payload: withInvoicePayloadStatus(input.payload, input.status),
    })
    .select('*')
    .single();
  if (error) {
    res.status(error.code === '23505' ? 409 : 500).json({ error: error.code === '23505' ? 'Invoice number already exists' : 'Failed to save invoice' });
    return;
  }
  try {
    await adoptFirstInvoiceCurrency(user.id, data.currency);
  } catch {
    // Reporting also self-heals from the earliest invoice if settings migration
    // has not been applied yet; invoice creation must not be blocked by it.
  }
  await recordActivity(data.id, user.id, 'created', `Invoice ${data.invoice_number} created`);
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
  if (input.status !== undefined) {
    const current = await supabaseAdmin.from('invoices').select('status,invoice_number,payload').eq('id', req.params.id).eq('user_id', user.id).maybeSingle();
    if (current.error) { res.status(500).json({ error: 'Failed to load invoice' }); return; }
    if (!current.data) { res.status(404).json({ error: 'Invoice not found' }); return; }
    if (!canTransition(current.data.status as InvoiceStatus, input.status)) {
      res.status(409).json({ error: `Cannot transition invoice from ${current.data.status} to ${input.status}.`, code: 'INVALID_STATUS_TRANSITION' }); return;
    }
    updates.status = input.status;
    updates.payload = withInvoicePayloadStatus(input.payload ?? current.data.payload, input.status);
    if (input.status === 'Sent' && current.data.status === 'Draft') updates.sent_at = new Date().toISOString();
    if (input.status === 'Viewed') updates.viewed_at = new Date().toISOString();
  }
  if (input.issueDate !== undefined) updates.issue_date = input.issueDate;
  if (input.dueDate !== undefined) updates.due_date = input.dueDate;
  if (input.client !== undefined) updates.client = input.client;
  if (input.company !== undefined) updates.company = input.company;
  if (input.clientId !== undefined) updates.client_id = input.clientId;
  if (input.total !== undefined) updates.total = input.total;
  if (input.currency !== undefined) updates.currency = input.currency.toUpperCase();
  // When status is part of this PATCH, the status branch above deliberately
  // synchronizes payload.details.status. Do not overwrite that canonical value
  // with the client payload after the transition has been validated.
  if (input.payload !== undefined && input.status === undefined) updates.payload = input.payload;
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
  if (input.status === 'Viewed') await recordActivity(data.id, user.id, 'viewed', `Invoice ${data.invoice_number} viewed`);
  else if (input.status === 'Paid') await recordActivity(data.id, user.id, 'marked_paid', `Invoice ${data.invoice_number} marked Paid`);
  else if (input.status === 'Partially Paid') await recordActivity(data.id, user.id, 'marked_partially_paid', `Invoice ${data.invoice_number} marked Partially Paid`);
  else if (input.status === 'Cancelled') await recordActivity(data.id, user.id, 'marked_cancelled', `Invoice ${data.invoice_number} cancelled`);
  else await recordActivity(data.id, user.id, 'edited', `Invoice ${data.invoice_number} edited`);
  res.json({ invoice: data });
});

router.post('/invoices/:id/status', async (req, res) => {
  const user = await requireUser(req, res); if (!user) return;
  if (!invoiceIdSchema.safeParse(req.params.id).success) { res.status(400).json({ error: 'Invalid invoice ID' }); return; }
  const parsed = z.object({ status: statusSchema }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Invalid invoice status' }); return; }
  const current = await supabaseAdmin.from('invoices').select('id,invoice_number,status,payload').eq('id', req.params.id).eq('user_id', user.id).maybeSingle();
  if (current.error) { res.status(500).json({ error: 'Failed to load invoice' }); return; }
  if (!current.data) { res.status(404).json({ error: 'Invoice not found' }); return; }
  if (!canTransition(current.data.status as InvoiceStatus, parsed.data.status)) {
    res.status(409).json({ error: `Cannot transition invoice from ${current.data.status} to ${parsed.data.status}.`, code: 'INVALID_STATUS_TRANSITION' }); return;
  }
  const updates: Record<string, unknown> = {
    status: parsed.data.status,
    payload: withInvoicePayloadStatus(current.data.payload, parsed.data.status),
  };
  if (parsed.data.status === 'Sent' && current.data.status === 'Draft') updates.sent_at = new Date().toISOString();
  if (parsed.data.status === 'Viewed') updates.viewed_at = new Date().toISOString();
  const updated = await supabaseAdmin.from('invoices').update(updates).eq('id', req.params.id).eq('user_id', user.id).select('*').single();
  if (updated.error) { res.status(500).json({ error: 'Failed to update invoice status' }); return; }
  const action = parsed.data.status === 'Paid' ? 'marked_paid' : parsed.data.status === 'Partially Paid' ? 'marked_partially_paid' : parsed.data.status === 'Cancelled' ? 'marked_cancelled' : 'edited';
  await recordActivity(req.params.id, user.id, action, `Invoice ${updated.data.invoice_number} marked ${parsed.data.status}`);
  res.json({ invoice: updated.data });
});

router.post('/invoices/:id/send', async (req, res) => {
  const user = await requireUser(req, res); if (!user) return;
  if (!invoiceIdSchema.safeParse(req.params.id).success) { res.status(400).json({ error: 'Invalid invoice ID' }); return; }
  const parsed = sendSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Invalid send data', details: parsed.error.flatten() }); return; }
  const found = await supabaseAdmin.from('invoices').select('*').eq('id', req.params.id).eq('user_id', user.id).maybeSingle();
  if (found.error) { res.status(500).json({ error: 'Failed to load invoice' }); return; }
  if (!found.data) { res.status(404).json({ error: 'Invoice not found' }); return; }
  if (!canTransition(found.data.status as InvoiceStatus, 'Sent')) { res.status(409).json({ error: 'Only draft invoices can be sent.' }); return; }
  const payload = found.data.payload ?? {};
  const business = payload.business ?? {};
  const client = payload.client ?? {};
  const details = payload.details ?? {};
  const amount = new Intl.NumberFormat(undefined, { style: 'currency', currency: found.data.currency }).format(Number(found.data.total));
  const email = buildInvoiceEmail({
    businessName: String((business as any).name || found.data.company || 'InvoiceFocus'),
    logo: typeof (business as any).logo === 'string' ? (business as any).logo : undefined,
    recipientName: String((client as any).name || found.data.client || ''),
    invoiceNumber: found.data.invoice_number,
    amountDue: amount,
    dueDate: found.data.due_date,
    personalMessage: parsed.data.personalMessage,
    viewUrl: `${process.env.CLIENT_BASE_URL || 'https://invoicefocus.com'}/invoice?id=${found.data.id}`,
    downloadUrl: `${process.env.CLIENT_BASE_URL || 'https://invoicefocus.com'}/invoice?id=${found.data.id}&download=1`,
  });
  try {
    const pdfBase64 = createSimplePdf([
      String((business as any).name || found.data.company || 'InvoiceFocus'),
      `Invoice ${found.data.invoice_number}`,
      `Bill to: ${found.data.client}`,
      `Amount due: ${amount}`,
      `Due date: ${found.data.due_date || 'Upon receipt'}`,
    ]);
    const provider = await sendEmail({ to: parsed.data.recipientEmail, subject: parsed.data.subject || email.subject, html: email.html, attachments: [{ filename: `${found.data.invoice_number}.pdf`, content: pdfBase64 }] });
    const event = await supabaseAdmin.from('invoice_email_events').insert({
      invoice_id: found.data.id, user_id: user.id, event_type: 'sent', recipient_email: parsed.data.recipientEmail,
      subject: parsed.data.subject || email.subject, personal_message: parsed.data.personalMessage, provider_message_id: provider?.id ?? null,
    }).select('*').single();
    const updated = await supabaseAdmin.from('invoices').update({
      status: 'Sent',
      sent_at: new Date().toISOString(),
      payload: withInvoicePayloadStatus(found.data.payload, 'Sent'),
    }).eq('id', found.data.id).eq('user_id', user.id).select('*').single();
    if (updated.error) throw updated.error;
    await recordActivity(found.data.id, user.id, 'sent', `Invoice ${found.data.invoice_number} sent to ${parsed.data.recipientEmail}`);
    res.json({ invoice: updated.data, email: event.data });
  } catch {
    await supabaseAdmin.from('invoice_email_events').insert({
      invoice_id: found.data.id, user_id: user.id, event_type: 'failed', recipient_email: parsed.data.recipientEmail,
      subject: parsed.data.subject, personal_message: parsed.data.personalMessage,
    });
    res.status(502).json({ error: 'Invoice email could not be sent.' });
  }
});

router.post('/invoices/:id/payments', async (req, res) => {
  const user = await requireUser(req, res); if (!user) return;
  if (!invoiceIdSchema.safeParse(req.params.id).success) { res.status(400).json({ error: 'Invalid invoice ID' }); return; }
  const parsed = paymentSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Invalid payment data', details: parsed.error.flatten() }); return; }
  const found = await supabaseAdmin.from('invoices').select('*').eq('id', req.params.id).eq('user_id', user.id).maybeSingle();
  if (found.error || !found.data) { res.status(404).json({ error: 'Invoice not found' }); return; }
  if (found.data.status === 'Cancelled') { res.status(409).json({ error: 'Cancelled invoices cannot receive payments.' }); return; }
  const existing = await supabaseAdmin.from('invoice_payments').select('amount').eq('invoice_id', found.data.id).eq('user_id', user.id);
  if (existing.error) { res.status(500).json({ error: 'Failed to load payment history' }); return; }
  const currentPaid = (existing.data ?? []).reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const balance = remainingBalance(Number(found.data.total), currentPaid);
  if (parsed.data.amount > balance) { res.status(400).json({ error: `Payment exceeds the remaining balance of ${balance.toFixed(2)}.` }); return; }
  const payment = await supabaseAdmin.from('invoice_payments').insert({ invoice_id: found.data.id, user_id: user.id, amount: parsed.data.amount, payment_date: parsed.data.paymentDate, payment_method: parsed.data.paymentMethod, reference_number: parsed.data.referenceNumber, notes: parsed.data.notes }).select('*').single();
  if (payment.error) { res.status(500).json({ error: 'Failed to record payment' }); return; }
  const amountPaid = currentPaid + parsed.data.amount;
  const status = statusAfterPayment(Number(found.data.total), amountPaid);
  const updated = await supabaseAdmin.from('invoices').update({
    amount_paid: amountPaid,
    status,
    payload: withInvoicePayloadStatus(found.data.payload, status),
  }).eq('id', found.data.id).eq('user_id', user.id).select('*').single();
  if (updated.error) { await supabaseAdmin.from('invoice_payments').delete().eq('id', payment.data.id).eq('user_id', user.id); res.status(500).json({ error: 'Failed to update invoice balance' }); return; }
  await recordActivity(found.data.id, user.id, 'payment_recorded', `Payment of ${parsed.data.amount.toFixed(2)} recorded`, { paymentId: payment.data.id });
  await recordActivity(found.data.id, user.id, status === 'Paid' ? 'marked_paid' : 'marked_partially_paid', `Invoice marked ${status}`);
  res.status(201).json({ payment: payment.data, invoice: updated.data });
});

router.patch('/invoices/:id/payments/:paymentId', async (req, res) => {
  const user = await requireUser(req, res); if (!user) return;
  if (!invoiceIdSchema.safeParse(req.params.id).success || !invoiceIdSchema.safeParse(req.params.paymentId).success) { res.status(400).json({ error: 'Invalid payment ID' }); return; }
  const parsed = paymentPatchSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Invalid payment data', details: parsed.error.flatten() }); return; }
  const invoice = await supabaseAdmin.from('invoices').select('id,total,status,payload').eq('id', req.params.id).eq('user_id', user.id).maybeSingle();
  if (invoice.error || !invoice.data) { res.status(404).json({ error: 'Invoice not found' }); return; }
  const existing = await supabaseAdmin.from('invoice_payments').select('*').eq('id', req.params.paymentId).eq('invoice_id', invoice.data.id).eq('user_id', user.id).maybeSingle();
  if (existing.error || !existing.data) { res.status(404).json({ error: 'Payment not found' }); return; }
  const all = await supabaseAdmin.from('invoice_payments').select('amount').eq('invoice_id', invoice.data.id).eq('user_id', user.id).neq('id', existing.data.id);
  if (all.error) { res.status(500).json({ error: 'Failed to load payment history' }); return; }
  const otherPaid = (all.data ?? []).reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const nextAmount = parsed.data.amount ?? Number(existing.data.amount);
  if (nextAmount > remainingBalance(Number(invoice.data.total), otherPaid)) { res.status(400).json({ error: 'Payment exceeds the remaining balance.' }); return; }
  const updatedPayment = await supabaseAdmin.from('invoice_payments').update(parsed.data).eq('id', existing.data.id).eq('invoice_id', invoice.data.id).eq('user_id', user.id).select('*').single();
  if (updatedPayment.error) { res.status(500).json({ error: 'Failed to update payment' }); return; }
  const amountPaid = otherPaid + nextAmount;
  const status = statusAfterPayment(Number(invoice.data.total), amountPaid);
  const updatedInvoice = await supabaseAdmin.from('invoices').update({
    amount_paid: amountPaid,
    status,
    payload: withInvoicePayloadStatus(invoice.data.payload, status),
  }).eq('id', invoice.data.id).eq('user_id', user.id).select('*').single();
  if (updatedInvoice.error) { res.status(500).json({ error: 'Failed to update invoice balance' }); return; }
  await recordActivity(invoice.data.id, user.id, 'payment_recorded', `Payment updated to ${nextAmount.toFixed(2)}`, { paymentId: existing.data.id });
  await recordActivity(invoice.data.id, user.id, status === 'Paid' ? 'marked_paid' : 'marked_partially_paid', `Invoice marked ${status}`);
  res.json({ payment: updatedPayment.data, invoice: updatedInvoice.data });
});

router.delete('/invoices/:id/payments/:paymentId', async (req, res) => {
  const user = await requireUser(req, res); if (!user) return;
  if (!invoiceIdSchema.safeParse(req.params.id).success || !invoiceIdSchema.safeParse(req.params.paymentId).success) { res.status(400).json({ error: 'Invalid payment ID' }); return; }
  const invoice = await supabaseAdmin.from('invoices').select('id,total,status,payload').eq('id', req.params.id).eq('user_id', user.id).maybeSingle();
  if (invoice.error || !invoice.data) { res.status(404).json({ error: 'Invoice not found' }); return; }
  const payment = await supabaseAdmin.from('invoice_payments').select('id,amount').eq('id', req.params.paymentId).eq('invoice_id', invoice.data.id).eq('user_id', user.id).maybeSingle();
  if (payment.error || !payment.data) { res.status(404).json({ error: 'Payment not found' }); return; }
  const removed = await supabaseAdmin.from('invoice_payments').delete().eq('id', payment.data.id).eq('invoice_id', invoice.data.id).eq('user_id', user.id);
  if (removed.error) { res.status(500).json({ error: 'Failed to delete payment' }); return; }
  const all = await supabaseAdmin.from('invoice_payments').select('amount').eq('invoice_id', invoice.data.id).eq('user_id', user.id);
  const amountPaid = (all.data ?? []).reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const status = statusAfterPayment(Number(invoice.data.total), amountPaid);
  const updatedInvoice = await supabaseAdmin.from('invoices').update({
    amount_paid: amountPaid,
    status,
    payload: withInvoicePayloadStatus(invoice.data.payload, status),
  }).eq('id', invoice.data.id).eq('user_id', user.id).select('*').single();
  if (updatedInvoice.error) { res.status(500).json({ error: 'Failed to update invoice balance' }); return; }
  await recordActivity(invoice.data.id, user.id, 'payment_recorded', `Payment of ${Number(payment.data.amount).toFixed(2)} removed`, { paymentId: payment.data.id });
  res.json({ invoice: updatedInvoice.data });
});

router.post('/invoices/:id/reminders', async (req, res) => {
  const user = await requireUser(req, res); if (!user) return;
  const parsed = reminderSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Invalid reminder data', details: parsed.error.flatten() }); return; }
  const invoice = await supabaseAdmin.from('invoices').select('id,due_date').eq('id', req.params.id).eq('user_id', user.id).maybeSingle();
  if (invoice.error || !invoice.data) { res.status(404).json({ error: 'Invoice not found' }); return; }
  const offsets: Record<string, number> = { before_3_days: -3, before_1_day: -1, due_date: 0, overdue_3_days: 3, overdue_7_days: 7, manual: 0 };
  const scheduled = invoice.data.due_date && parsed.data.triggerType !== 'manual' ? new Date(`${invoice.data.due_date}T12:00:00Z`) : null;
  if (scheduled) scheduled.setUTCDate(scheduled.getUTCDate() + offsets[parsed.data.triggerType]);
  const reminder = await supabaseAdmin.from('invoice_reminders').insert({ invoice_id: invoice.data.id, user_id: user.id, ...parsed.data, scheduled_for: scheduled?.toISOString().slice(0, 10) ?? null }).select('*').single();
  if (reminder.error) { res.status(500).json({ error: 'Failed to schedule reminder' }); return; }
  res.status(201).json({ reminder: reminder.data });
});

router.post('/invoices/:id/reminders/send', async (req, res) => {
  const user = await requireUser(req, res); if (!user) return;
  const parsed = sendSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Invalid reminder data' }); return; }
  const invoice = await supabaseAdmin.from('invoices').select('*').eq('id', req.params.id).eq('user_id', user.id).maybeSingle();
  if (invoice.error || !invoice.data) { res.status(404).json({ error: 'Invoice not found' }); return; }
  const viewUrl = `${process.env.CLIENT_BASE_URL || 'https://invoicefocus.com'}/invoice?id=${invoice.data.id}`;
  const email = buildInvoiceEmail({ businessName: invoice.data.company || 'InvoiceFocus', invoiceNumber: invoice.data.invoice_number, amountDue: new Intl.NumberFormat(undefined, { style: 'currency', currency: invoice.data.currency }).format(remainingBalance(Number(invoice.data.total), Number(invoice.data.amount_paid || 0))), dueDate: invoice.data.due_date, personalMessage: parsed.data.personalMessage, viewUrl, downloadUrl: `${viewUrl}&download=1`, emailType: 'payment-reminder' });
  try {
    const provider = await sendEmail({ to: parsed.data.recipientEmail, subject: parsed.data.subject || email.subject, html: email.html });
    const reminder = await supabaseAdmin.from('invoice_reminders').insert({ invoice_id: invoice.data.id, user_id: user.id, trigger_type: 'manual', enabled: true, recipient_email: parsed.data.recipientEmail, subject: parsed.data.subject, personal_message: parsed.data.personalMessage, sent_at: new Date().toISOString() }).select('*').single();
    await recordActivity(invoice.data.id, user.id, 'reminder_sent', `Payment reminder sent to ${parsed.data.recipientEmail}`, { providerMessageId: provider?.id ?? null });
    res.json({ reminder: reminder.data });
  } catch { res.status(502).json({ error: 'Payment reminder could not be sent.' }); }
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