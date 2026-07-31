import { supabaseAdmin } from '../lib/supabase';
import type { BillingEventHandler, VerifiedWebhook } from './types';

export class SubscriptionBillingEventHandler implements BillingEventHandler {
  async handle(event: VerifiedWebhook) {
    const userId = typeof event.data.userId === 'string' ? event.data.userId : null;
    if (!userId) throw new Error('Billing event is missing a user ID.');

    const providerPatch = {
      ...(typeof event.data.providerCustomerId === 'string' ? { provider_customer_id: event.data.providerCustomerId } : {}),
      ...(typeof event.data.providerSubscriptionId === 'string' ? { provider_subscription_id: event.data.providerSubscriptionId } : {}),
    };
    if (event.type.startsWith('subscription.')) {
      const plan = typeof event.data.plan === 'string' ? event.data.plan : undefined;
      const status = event.type === 'subscription.cancelled' ? 'cancelled' : (typeof event.data.status === 'string' ? event.data.status : 'active');
      const billingCycle = event.data.billingCycle === 'yearly' ? 'yearly' : 'monthly';
      const update = {
        status,
        ...(plan ? { plan } : {}),
        billing_cycle: billingCycle,
        renewal_date: typeof event.data.renewalDate === 'string' ? event.data.renewalDate : null,
        feature_permissions: plan === 'premium'
          ? { unlimitedInvoices: true, unlimitedClients: true, recurringInvoices: true, advancedTemplates: true, invoiceStatusTracking: true, paymentReminders: true, businessInsights: true, dataExport: true, multipleBusinesses: true, teamCollaboration: true, rolesPermissions: true, advancedAnalytics: true, apiAccess: true, integrations: true, auditLogs: true, earlyAccess: true }
          : plan === 'pro'
            ? { unlimitedInvoices: true, unlimitedClients: true, recurringInvoices: true, advancedTemplates: true, invoiceStatusTracking: true, paymentReminders: true, businessInsights: true, dataExport: true, multipleBusinesses: false, teamCollaboration: false, rolesPermissions: false, advancedAnalytics: false, apiAccess: false, integrations: false, auditLogs: false, earlyAccess: false }
            : {},
        ...providerPatch,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabaseAdmin.from('subscriptions').update(update).eq('user_id', userId);
      if (error) throw error;
    }

    const { error: historyError } = await supabaseAdmin.from('billing_history').insert({
      user_id: userId,
      event_type: event.type,
      provider: event.provider,
      provider_event_id: event.eventId,
      status: 'processed',
      amount: typeof event.data.amount === 'number' ? event.data.amount : null,
      currency: typeof event.data.currency === 'string' ? event.data.currency : 'USD',
      metadata: event.data,
      occurred_at: event.occurredAt,
    });
    if (historyError) throw historyError;
  }
}

export const billingEventHandler = new SubscriptionBillingEventHandler();