import { supabaseAdmin } from '../lib/supabase';

export class InvoiceBillingService {
  async getOverview(userId: string) {
    const [subscription, history] = await Promise.all([
      supabaseAdmin.from('subscriptions').select('plan,billing_cycle,status,renewal_date,invoice_count_this_month').eq('user_id', userId).maybeSingle(),
      supabaseAdmin.from('billing_history').select('id,event_type,status,amount,currency,created_at,occurred_at').eq('user_id', userId).order('occurred_at', { ascending: false }).limit(25),
    ]);
    if (subscription.error) throw subscription.error;
    if (history.error) throw history.error;
    return {
      paymentMethods: [],
      paymentHistory: history.data || [],
      subscription: subscription.data || { plan: 'free', billing_cycle: 'monthly', status: 'active', renewal_date: null, invoice_count_this_month: 0 },
    };
  }
}

export const invoiceBillingService = new InvoiceBillingService();