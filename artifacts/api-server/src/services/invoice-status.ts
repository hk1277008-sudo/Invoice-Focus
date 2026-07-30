export const invoiceStatuses = ['Draft', 'Sent', 'Viewed', 'Partially Paid', 'Paid', 'Overdue', 'Cancelled'] as const;
export type InvoiceStatus = typeof invoiceStatuses[number];

const transitions: Record<InvoiceStatus, InvoiceStatus[]> = {
  Draft: ['Sent', 'Cancelled'],
  Sent: ['Viewed', 'Partially Paid', 'Paid', 'Overdue', 'Cancelled'],
  Viewed: ['Partially Paid', 'Paid', 'Overdue', 'Cancelled'],
  'Partially Paid': ['Paid', 'Cancelled'],
  Paid: ['Sent', 'Cancelled'],
  Overdue: ['Cancelled'],
  Cancelled: [],
};

export function canTransition(from: InvoiceStatus, to: InvoiceStatus) {
  return from === to || transitions[from]?.includes(to);
}

export function statusAfterPayment(total: number, amountPaid: number): InvoiceStatus {
  if (amountPaid >= total) return 'Paid';
  return amountPaid > 0 ? 'Partially Paid' : 'Sent';
}