import { supabaseAdmin } from '../lib/supabase';
import { getBillingProvider } from './provider';

export class InvoiceBillingService {
  async getOverview(userId: string) {
    const { data: billingSubscription } = await supabaseAdmin
      .from('subscriptions')
      .select('provider_subscription_id')
      .eq('user_id', userId)
      .maybeSingle();
    if (billingSubscription?.provider_subscription_id) {
      try {
        const methods = await getBillingProvider().listPaymentMethods({
          userId,
          subscriptionId: billingSubscription.provider_subscription_id,
        });
        await supabaseAdmin.from('billing_payment_methods').update({ is_default: false }).eq('user_id', userId);
        for (const method of methods) {
          await supabaseAdmin.from('billing_payment_methods').upsert({
            user_id: userId,
            provider: 'paddle',
            provider_payment_method_id: method.providerPaymentMethodId,
            brand: method.brand,
            last4: method.last4,
            exp_month: method.expMonth,
            exp_year: method.expYear,
            is_default: method.isDefault,
          }, { onConflict: 'provider,provider_payment_method_id' });
        }
      } catch {
        // The saved local record remains available when Paddle is temporarily unavailable.
      }
    }
    const [subscription, history, paymentMethods] = await Promise.all([
      supabaseAdmin.from('subscriptions').select('plan,billing_cycle,status,renewal_date,invoice_count_this_month,provider,provider_customer_id,provider_subscription_id').eq('user_id', userId).maybeSingle(),
      supabaseAdmin.from('billing_history').select('id,event_type,status,amount,currency,created_at,occurred_at,metadata').eq('user_id', userId).order('occurred_at', { ascending: false }).limit(25),
      supabaseAdmin.from('billing_payment_methods').select('id,brand,last4,exp_month,exp_year,is_default').eq('user_id', userId).order('is_default', { ascending: false }).order('created_at', { ascending: false }),
    ]);
    if (subscription.error) throw subscription.error;
    if (history.error) throw history.error;
    // Older beta projects may not have the optional payment-method table yet.
    // Keep billing history and plan access available while the migration rolls out.
    const methods = paymentMethods.error ? [] : (paymentMethods.data || []).map((method) => ({
      id: method.id,
      brand: method.brand,
      last4: method.last4,
      expMonth: method.exp_month,
      expYear: method.exp_year,
      isDefault: method.is_default,
    }));
    return {
      paymentMethods: methods,
      paymentHistory: (history.data || []).map((item) => {
        const metadata = item.metadata && typeof item.metadata === 'object' ? item.metadata as Record<string, unknown> : {};
        return {
          id: item.id,
          event_type: item.event_type,
          status: item.status,
          amount: item.amount,
          currency: item.currency,
          created_at: item.created_at,
          occurred_at: item.occurred_at,
          invoice_number: typeof metadata.invoice_number === 'string' ? metadata.invoice_number : null,
          plan: typeof metadata.plan === 'string' ? metadata.plan : null,
          receipt_url: typeof metadata.receipt_url === 'string' ? metadata.receipt_url : null,
        };
      }),
      subscription: subscription.data || { plan: 'free', billing_cycle: 'monthly', status: 'active', renewal_date: null, invoice_count_this_month: 0 },
    };
  }
}

export const invoiceBillingService = new InvoiceBillingService();