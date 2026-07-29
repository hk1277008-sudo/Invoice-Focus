import { supabaseAdmin } from '../lib/supabase';
import type { BillingEventHandler, VerifiedWebhook } from './types';

export class SubscriptionBillingEventHandler implements BillingEventHandler {
  async handle(event: VerifiedWebhook) {
    const userId = typeof event.data.userId === 'string' ? event.data.userId : null;
    if (!userId) throw new Error('Billing event is missing a user ID.');

    if (event.type.startsWith('subscription.')) {
      const plan = typeof event.data.plan === 'string' ? event.data.plan : undefined;
      const status = event.type === 'subscription.cancelled' ? 'cancelled' : (typeof event.data.status === 'string' ? event.data.status : 'active');
      const update = { status, ...(plan ? { plan } : {}), updated_at: new Date().toISOString() };
      const { error } = await supabaseAdmin.from('subscriptions').update(update).eq('user_id', userId);
      if (error) throw error;
    }

    await supabaseAdmin.from('billing_history').insert({
      user_id: userId,
      event_type: event.type,
      provider: event.provider,
      provider_event_id: event.eventId,
      status: 'processed',
      metadata: event.data,
      occurred_at: event.occurredAt,
    });
  }
}

export const billingEventHandler = new SubscriptionBillingEventHandler();