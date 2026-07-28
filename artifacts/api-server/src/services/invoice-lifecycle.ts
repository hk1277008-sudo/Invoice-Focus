import { supabaseAdmin } from '../lib/supabase';
import { buildInvoiceEmail, sendEmail } from '../lib/email';

export const invoiceStatuses = ['Draft', 'Sent', 'Viewed', 'Partially Paid', 'Paid', 'Overdue', 'Cancelled'] as const;
export type InvoiceStatus = typeof invoiceStatuses[number];

const transitions: Record<InvoiceStatus, InvoiceStatus[]> = {
  Draft: ['Sent', 'Cancelled'],
  Sent: ['Viewed', 'Overdue', 'Cancelled'],
  Viewed: ['Partially Paid', 'Paid', 'Overdue', 'Cancelled'],
  'Partially Paid': ['Paid', 'Cancelled'],
  Paid: ['Cancelled'],
  Overdue: ['Cancelled'],
  Cancelled: [],
};

export function canTransition(from: InvoiceStatus, to: InvoiceStatus) {
  return from === to || transitions[from]?.includes(to);
}

export async function refreshOverdueInvoices(userId: string) {
  const today = new Date().toISOString().slice(0, 10);
  const result = await supabaseAdmin
    .from('invoices')
    .update({ status: 'Overdue' })
    .eq('user_id', userId)
    .in('status', ['Sent', 'Viewed', 'Partially Paid'])
    .lt('due_date', today)
    .not('due_date', 'is', null);
  if (result.error && !['42703', 'PGRST204'].includes(result.error.code ?? '')) throw result.error;
}

export async function recordActivity(
  invoiceId: string,
  userId: string,
  action: string,
  description: string,
  metadata: Record<string, unknown> = {},
) {
  await supabaseAdmin.from('invoice_activity').insert({
    invoice_id: invoiceId, user_id: userId, action, description, metadata,
  });
}

export function remainingBalance(total: number, amountPaid: number) {
  return Math.max(Number(total || 0) - Number(amountPaid || 0), 0);
}

export function statusAfterPayment(total: number, amountPaid: number): InvoiceStatus {
  if (amountPaid >= total) return 'Paid';
  return amountPaid > 0 ? 'Partially Paid' : 'Sent';
}

export function createSimplePdf(lines: string[]) {
  const safe = lines.map((line) => line.replace(/[()\\]/g, '\\$&').slice(0, 110));
  const content = ['BT', '/F1 11 Tf', '50 780 Td', ...safe.flatMap((line, index) => [
    `(${line}) Tj`, index === safe.length - 1 ? '' : '0 -18 Td',
  ]), 'ET'].filter(Boolean).join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets[index + 1] = pdf.length;
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let index = 1; index <= objects.length; index++) pdf += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf).toString('base64');
}

export async function processDueReminders(asOf = new Date().toISOString().slice(0, 10)) {
  const due = await supabaseAdmin
    .from('invoice_reminders')
    .select('*, invoices(*)')
    .eq('enabled', true)
    .is('sent_at', null)
    .lte('scheduled_for', asOf)
    .limit(100);
  if (due.error) throw due.error;
  const sent: string[] = [];
  for (const reminder of (due.data ?? []) as any[]) {
    const invoice = reminder.invoices;
    if (!invoice || ['Paid', 'Cancelled'].includes(invoice.status)) continue;
    const email = buildInvoiceEmail({
      businessName: invoice.company || 'InvoiceFocus',
      invoiceNumber: invoice.invoice_number,
      amountDue: new Intl.NumberFormat(undefined, { style: 'currency', currency: invoice.currency }).format(remainingBalance(Number(invoice.total), Number(invoice.amount_paid || 0))),
      dueDate: invoice.due_date,
      personalMessage: reminder.personal_message,
      viewUrl: `${process.env.CLIENT_BASE_URL || 'https://invoicefocus.com'}/invoice?id=${invoice.id}`,
    });
    try {
      const provider = await sendEmail({
        to: reminder.recipient_email,
        subject: reminder.subject || `Payment reminder for invoice ${invoice.invoice_number}`,
        html: email.html,
      });
      await supabaseAdmin.from('invoice_reminders').update({ sent_at: new Date().toISOString() }).eq('id', reminder.id);
      await recordActivity(invoice.id, reminder.user_id, 'reminder_sent', `Payment reminder sent to ${reminder.recipient_email}`, { providerMessageId: provider?.id ?? null });
      sent.push(reminder.id);
    } catch {
      // Leave unsent reminders available for the next retry.
    }
  }
  return sent;
}