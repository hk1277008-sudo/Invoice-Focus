import { supabaseAdmin } from '../lib/supabase';
import type { BillingCycle, BillingPlan, BillingStatus } from './types';

export type SubscriptionAction = 'upgrade' | 'downgrade' | 'cancel' | 'renew' | 'reactivate';

export interface ManagedSubscription {
  userId: string;
  plan: BillingPlan;
  billingCycle: BillingCycle;
  status: BillingStatus;
  renewalDate: string | null;
  providerCustomerId: string | null;
  providerSubscriptionId: string | null;
}

export class SubscriptionManager {
  async get(userId: string): Promise<ManagedSubscription> {
    const { data, error } = await supabaseAdmin.from('subscriptions').select('user_id,plan,billing_cycle,status,renewal_date,provider_customer_id,provider_subscription_id').eq('user_id', userId).maybeSingle();
    if (error) throw error;
    return {
      userId,
      plan: (data?.plan as BillingPlan) || 'free',
      billingCycle: (data?.billing_cycle as BillingCycle) || 'monthly',
      status: (data?.status as BillingStatus) || 'active',
      renewalDate: (data?.renewal_date as string | null) || null,
      providerCustomerId: (data?.provider_customer_id as string | null) || null,
      providerSubscriptionId: (data?.provider_subscription_id as string | null) || null,
    };
  }

}

export const subscriptionManager = new SubscriptionManager();