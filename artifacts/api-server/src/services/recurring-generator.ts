import { supabaseAdmin } from '../lib/supabase';

type Frequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';

type RecurringRow = {
  id: string;
  user_id: string;
  client_name: string;
  frequency: Frequency;
  interval_count: number;
  start_date: string;
  end_date: string | null;
  next_run_date: string;
  due_date_offset: number;
  auto_invoice_number: boolean;
  auto_generation: boolean;
  invoice_status: 'Draft' | 'Sent' | 'Viewed' | 'Partially Paid' | 'Paid' | 'Overdue' | 'Cancelled';
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  template_data: Record<string, any>;
  generated_invoice_count: number;
};

function addMonths(date: Date, months: number) {
  const day = date.getUTCDate();
  const result = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
  const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
  result.setUTCDate(Math.min(day, lastDay));
  return result;
}

function addFrequency(dateValue: string, frequency: Frequency, interval: number) {
  const date = new Date(`${dateValue.slice(0, 10)}T12:00:00Z`);
  if (frequency === 'daily' || frequency === 'custom') date.setUTCDate(date.getUTCDate() + interval);
  if (frequency === 'weekly') date.setUTCDate(date.getUTCDate() + interval * 7);
  if (frequency === 'monthly') return addMonths(date, interval);
  if (frequency === 'quarterly') return addMonths(date, interval * 3);
  if (frequency === 'yearly') return addMonths(date, interval * 12);
  return date;
}

function dateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}
function localDateInTimezone(timezone: string) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

function invoiceNumber(row: RecurringRow, issueDate: string, attempt: number) {
  const templateNumber = row.template_data?.details?.number;
  if (!row.auto_invoice_number && typeof templateNumber === 'string' && templateNumber.trim()) {
    return `${templateNumber.trim()}-${row.generated_invoice_count + 1}`;
  }
  return `REC-${issueDate.replaceAll('-', '')}-${row.id.slice(0, 8)}-${row.generated_invoice_count + 1 + attempt}`;
}

function dueDate(issueDate: string, offset: number) {
  const date = new Date(`${issueDate}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return dateOnly(date);
}

export async function generateDueRecurringInvoices(asOf?: string) {
  const hasExplicitAsOf = asOf !== undefined;
  const { data, error } = await supabaseAdmin
    .from('recurring_invoices')
    .select('*')
    .eq('status', 'active')
    .order('next_run_date', { ascending: true })
    .limit(100);
  if (error) throw error;

  const generated: Array<{ recurringInvoiceId: string; invoiceId: string }> = [];
  for (const row of (data ?? []) as RecurringRow[]) {
    if ((row as Partial<RecurringRow>).auto_generation === false) continue;
    const effectiveAsOf = hasExplicitAsOf ? asOf! : localDateInTimezone((row as any).timezone || 'UTC');
    if (row.next_run_date > effectiveAsOf) continue;
    let nextRun = row.next_run_date;
    let count = row.generated_invoice_count;
    let lastGeneratedAt = new Date().toISOString();
    while (nextRun <= effectiveAsOf && (!row.end_date || nextRun <= row.end_date)) {
      const template = row.template_data ?? {};
      const details = template.details ?? {};
      const client = template.client ?? {};
      const business = template.business ?? {};
      const items = Array.isArray(template.items) ? template.items : [];
      if (!items.length) break;
      const total = items.reduce((sum: number, item: any) => {
        const quantity = Number(item.quantity) || 0;
        const unitPrice = Number(item.unitPrice) || 0;
        const base = quantity * unitPrice;
        const discount = base * ((Number(item.discountPercent) || 0) / 100);
        const taxable = base - discount;
        const tax = taxable * ((Number(item.taxPercent) || 0) / 100);
        return sum + taxable + tax;
      }, 0);
       const shipping = Number(template.additional?.shipping) || 0;
       const number = invoiceNumber(row, nextRun, 0);
       const documentType = template.documentType;
       const generatedDueDate = ['receipt', 'credit-note', 'purchase-order'].includes(documentType) ? null : dueDate(nextRun, row.due_date_offset);
      const invoiceInsert = {
        user_id: row.user_id,
        recurring_invoice_id: row.id,
        invoice_number: number,
        status: row.invoice_status || 'Draft',
        issue_date: nextRun,
         due_date: generatedDueDate,
        client: client.name || row.template_data.client_name || row.template_data.clientName || row.client_name,
        company: client.companyName || business.name || '',
        client_id: client.clientId || null,
         total: total + shipping,
        currency: details.currency || 'USD',
        payload: template,
      };
      let inserted: { data: { id: string } | null; error: { code?: string; message?: string } | null } =
        await supabaseAdmin.from('invoices').insert(invoiceInsert).select('id').single();
      if (inserted.error?.code === '23505') {
        const existing = await supabaseAdmin
          .from('invoices')
          .select('id')
          .eq('user_id', row.user_id)
          .eq('invoice_number', number)
          .maybeSingle();
        inserted = { data: existing.data, error: existing.error };
      }
      if (inserted.error || !inserted.data) throw inserted.error ?? new Error('Generated invoice was not returned');
      generated.push({ recurringInvoiceId: row.id, invoiceId: inserted.data.id });
      // Notification persistence is additive. Never make invoice generation fail
      // just because the optional notification migration has not been deployed yet.
      try {
        await supabaseAdmin.from('notifications').insert({
          user_id: row.user_id,
          type: 'recurring_invoice_generated',
          title: 'Recurring invoice generated',
          message: `A new invoice was generated for ${invoiceInsert.client}.`,
          data: { recurringInvoiceId: row.id, invoiceId: inserted.data.id },
        });
      } catch {
        // Notifications are optional until migration 007 is deployed.
      }
      count += 1;
      lastGeneratedAt = new Date().toISOString();
      nextRun = dateOnly(addFrequency(nextRun, row.frequency, row.interval_count));
      if (row.end_date && nextRun > row.end_date) break;
    }
    const completed = Boolean(row.end_date && nextRun > row.end_date);
    const update = await supabaseAdmin
      .from('recurring_invoices')
      .update({
        next_run_date: nextRun,
        last_generated_at: lastGeneratedAt,
        generated_invoice_count: count,
        status: completed ? 'completed' : row.status,
      })
      .eq('id', row.id)
      .eq('status', 'active');
    if (update.error) throw update.error;
  }
  return generated;
}