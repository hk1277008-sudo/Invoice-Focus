import { supabaseAdmin } from '../lib/supabase';
import type { BillingEventHandler, VerifiedWebhook } from './types';

const permissionsForPlan = (plan: unknown) => plan === 'premium'
  ? { unlimitedInvoices: true, unlimitedClients: true, recurringInvoices: true, advancedTemplates: true, invoiceStatusTracking: true, paymentReminders: true, businessInsights: true, dataExport: true, multipleBusinesses: true, teamCollaboration: true, rolesPermissions: true, advancedAnalytics: true, apiAccess: true, integrations: true, auditLogs: true, earlyAccess: true }
  : plan === 'pro'
    ? { unlimitedInvoices: true, unlimitedClients: true, recurringInvoices: true, advancedTemplates: true, invoiceStatusTracking: true, paymentReminders: true, businessInsights: true, dataExport: true, multipleBusinesses: false, teamCollaboration: false, rolesPermissions: false, advancedAnalytics: false, apiAccess: false, integrations: false, auditLogs: false, earlyAccess: false }
    : { unlimitedInvoices: false, unlimitedClients: false, recurringInvoices: false, advancedTemplates: false, invoiceStatusTracking: false, paymentReminders: false, businessInsights: false, dataExport: false, multipleBusinesses: false, teamCollaboration: false, rolesPermissions: false, advancedAnalytics: false, apiAccess: false, integrations: false, auditLogs: false, earlyAccess: false };

export class SubscriptionBillingEventHandler implements BillingEventHandler {
  async handle(event: VerifiedWebhook) {
    let userId = typeof event.data.userId === 'string' ? event.data.userId : null;
    if (!userId && typeof event.data.providerSubscriptionId === 'string') {
      const { data: subscriptionByProvider, error: providerLookupError } = await supabaseAdmin
        .from('subscriptions')
        .select('user_id')
        .eq('provider_subscription_id', event.data.providerSubscriptionId)
        .maybeSingle();
      if (providerLookupError) throw providerLookupError;
      userId = subscriptionByProvider?.user_id || null;
    }
    if (!userId && typeof event.data.providerCustomerId === 'string') {
      const { data: subscriptionByCustomer, error: customerLookupError } = await supabaseAdmin
        .from('subscriptions')
        .select('user_id')
        .eq('provider_customer_id', event.data.providerCustomerId)
        .maybeSingle();
      if (customerLookupError) throw customerLookupError;
      userId = subscriptionByCustomer?.user_id || null;
    }
    if (!userId) throw new Error('Billing event is missing an InvoiceFocus user mapping.');

    const { data: current, error: currentError } = await supabaseAdmin
      .from('subscriptions')
      .select('plan,billing_cycle,status,renewal_date,provider_customer_id,provider_subscription_id')
      .eq('user_id', userId)
      .maybeSingle();
    if (currentError) throw currentError;

    const providerData = event.data;
    const eventPlan = providerData.plan === 'pro' || providerData.plan === 'premium' ? providerData.plan : current?.plan || 'free';
    const eventCycle = providerData.billingCycle === 'yearly' ? 'yearly' : providerData.billingCycle === 'monthly' ? 'monthly' : current?.billing_cycle || 'monthly';
    const scheduledChange = providerData.scheduledChange && typeof providerData.scheduledChange === 'object'
      ? providerData.scheduledChange as Record<string, unknown>
      : providerData.scheduled_change && typeof providerData.scheduled_change === 'object'
        ? providerData.scheduled_change as Record<string, unknown>
      : null;
    const hasScheduledCancellation = scheduledChange?.action === 'cancel';
    const providerStatus = typeof providerData.status === 'string' ? providerData.status : '';
    const isFinalCancellation = event.type === 'subscription.cancelled';
    const persistedPlan = isFinalCancellation ? 'free' : eventPlan;
    const persistedCycle = isFinalCancellation ? 'monthly' : eventCycle;
    const status = event.type === 'subscription.cancelled' || hasScheduledCancellation
      ? isFinalCancellation ? 'active' : 'cancelled'
      : event.type === 'payment.failed'
        ? 'past_due'
        : ['active', 'trialing', 'past_due', 'cancelled', 'incomplete'].includes(providerStatus)
          ? providerStatus
          : 'active';
    const providerPatch = {
      provider: event.provider,
      ...(typeof event.data.providerCustomerId === 'string' ? { provider_customer_id: event.data.providerCustomerId } : {}),
      ...(isFinalCancellation
        ? { provider_subscription_id: null }
        : typeof event.data.providerSubscriptionId === 'string'
          ? { provider_subscription_id: event.data.providerSubscriptionId }
          : {}),
    };
    const { error: subscriptionError } = await supabaseAdmin.from('subscriptions').upsert({
      user_id: userId,
      plan: persistedPlan,
      billing_cycle: persistedCycle,
      status,
      renewal_date: isFinalCancellation
        ? null
        : typeof event.data.renewalDate === 'string' ? event.data.renewalDate : current?.renewal_date || null,
      feature_permissions: permissionsForPlan(persistedPlan),
      ...providerPatch,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
    if (subscriptionError) throw subscriptionError;

    const transactionId = typeof event.data.transactionId === 'string' ? event.data.transactionId : null;
    if (transactionId) {
      const { error: transactionError } = await supabaseAdmin.from('billing_transactions').upsert({
        user_id: userId,
        provider: event.provider,
        provider_transaction_id: transactionId,
        transaction_type: 'charge',
        status: event.type === 'payment.failed' ? 'failed' : 'completed',
        amount: typeof event.data.amount === 'number' ? event.data.amount : 0,
        currency: typeof event.data.currency === 'string' ? event.data.currency : 'USD',
        metadata: event.data,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'provider,provider_transaction_id' });
      if (transactionError && !transactionError.message.includes('no unique')) throw transactionError;
    }

    const paymentMethod = event.data.paymentMethod && typeof event.data.paymentMethod === 'object'
      ? event.data.paymentMethod as Record<string, unknown>
      : null;
    if (paymentMethod
      && typeof paymentMethod.providerPaymentMethodId === 'string'
      && typeof paymentMethod.last4 === 'string'
      && typeof paymentMethod.expMonth === 'number'
      && typeof paymentMethod.expYear === 'number') {
      await supabaseAdmin.from('billing_payment_methods').update({ is_default: false }).eq('user_id', userId);
      const { error: methodError } = await supabaseAdmin.from('billing_payment_methods').upsert({
        user_id: userId,
        provider: event.provider,
        provider_payment_method_id: typeof paymentMethod.providerPaymentMethodId === 'string' ? paymentMethod.providerPaymentMethodId : null,
        brand: typeof paymentMethod.brand === 'string' ? paymentMethod.brand : 'card',
        last4: paymentMethod.last4,
        exp_month: paymentMethod.expMonth,
        exp_year: paymentMethod.expYear,
        is_default: true,
      }, { onConflict: 'provider,provider_payment_method_id' });
      if (methodError && !methodError.message.includes('no unique')) throw methodError;
    }

    const historyEventId = transactionId
      ? `${event.provider}:transaction:${transactionId}`
      : `${event.provider}:event:${event.eventId}`;
    const { data: existingHistory, error: existingHistoryError } = await supabaseAdmin
      .from('billing_history')
      .select('id')
      .eq('provider', event.provider)
      .eq('provider_event_id', historyEventId)
      .maybeSingle();
    if (existingHistoryError) throw existingHistoryError;
    if (!existingHistory) {
      const { error: historyError } = await supabaseAdmin.from('billing_history').insert({
        user_id: userId,
        event_type: event.type,
        provider: event.provider,
        provider_event_id: historyEventId,
        status: event.type === 'payment.failed'
          ? 'failed'
          : event.type === 'transaction.completed' || event.type === 'payment.succeeded'
            ? 'paid'
            : 'processed',
        amount: typeof event.data.amount === 'number' ? event.data.amount : null,
        currency: typeof event.data.currency === 'string' ? event.data.currency : 'USD',
        metadata: {
          ...event.data,
          plan: persistedPlan,
          billing_cycle: persistedCycle,
          invoice_number: event.data.invoiceNumber || null,
        },
        occurred_at: event.occurredAt,
      });
      if (historyError) throw historyError;
    }
  }
}

export const billingEventHandler = new SubscriptionBillingEventHandler();