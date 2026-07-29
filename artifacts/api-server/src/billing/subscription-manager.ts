import { supabaseAdmin } from '../lib/supabase';
import { PLAN_CATALOG } from '../routes/subscriptions';
import type { BillingCycle, BillingPlan, BillingStatus } from './types';

export type SubscriptionAction = 'upgrade' | 'downgrade' | 'cancel' | 'renew' | 'reactivate';

export interface ManagedSubscription {
  userId: string;
  plan: BillingPlan;
  billingCycle: BillingCycle;
  status: BillingStatus;
  renewalDate: string | null;
}

function renewalDate(cycle: BillingCycle) {
  const value = new Date();
  value.setMonth(value.getMonth() + (cycle === 'yearly' ? 12 : 1));
  return value.toISOString();
}

export class SubscriptionManager {
  async get(userId: string): Promise<ManagedSubscription> {
    const { data, error } = await supabaseAdmin.from('subscriptions').select('user_id,plan,billing_cycle,status,renewal_date').eq('user_id', userId).maybeSingle();
    if (error) throw error;
    return {
      userId,
      plan: (data?.plan as BillingPlan) || 'free',
      billingCycle: (data?.billing_cycle as BillingCycle) || 'monthly',
      status: (data?.status as BillingStatus) || 'active',
      renewalDate: (data?.renewal_date as string | null) || null,
    };
  }

  async applySimulatedAction(userId: string, action: SubscriptionAction, plan?: BillingPlan, billingCycle: BillingCycle = 'monthly') {
    if (plan && !PLAN_CATALOG[plan]) throw new Error('Unknown billing plan.');
    const current = await this.get(userId);
    const nextPlan = action === 'downgrade' ? 'free' : (plan || current.plan);
    const nextStatus: BillingStatus = action === 'cancel' ? 'cancelled' : 'active';
    const nextCycle = action === 'renew' || action === 'reactivate' ? current.billingCycle : billingCycle;
    const permissions = nextPlan === 'premium'
      ? { unlimitedInvoices: true, unlimitedClients: true, recurringInvoices: true, advancedTemplates: true, invoiceStatusTracking: true, paymentReminders: true, businessInsights: true, dataExport: true, multipleBusinesses: true, teamCollaboration: true, rolesPermissions: true, advancedAnalytics: true, apiAccess: true, integrations: true, auditLogs: true, earlyAccess: true }
      : nextPlan === 'pro'
        ? { unlimitedInvoices: true, unlimitedClients: true, recurringInvoices: true, advancedTemplates: true, invoiceStatusTracking: true, paymentReminders: true, businessInsights: true, dataExport: true, multipleBusinesses: false, teamCollaboration: false, rolesPermissions: false, advancedAnalytics: false, apiAccess: false, integrations: false, auditLogs: false, earlyAccess: false }
        : {};
    const patch = {
      plan: nextPlan,
      billing_cycle: nextCycle,
      status: nextStatus,
      renewal_date: nextPlan === 'free' ? null : renewalDate(nextCycle),
      feature_permissions: permissions,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabaseAdmin.from('subscriptions').upsert({ user_id: userId, ...patch }, { onConflict: 'user_id' });
    if (error) throw error;
    return this.get(userId);
  }
}

export const subscriptionManager = new SubscriptionManager();