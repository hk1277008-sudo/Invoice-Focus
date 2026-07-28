import { Router, type IRouter, type Request, type Response } from 'express';
import { supabaseAdmin } from '../lib/supabase';

const router: IRouter = Router();

export const PLAN_CATALOG = {
  free: {
    name: 'Free', price: 'Free Forever', monthlyPrice: 0, yearlyPrice: 0, invoiceLimit: 15,
    features: ['15 invoices per month', '1 business', 'Basic invoice templates', 'Basic dashboard', 'Standard email support'],
  },
  pro: {
    name: 'Pro', price: '$9/month', monthlyPrice: 9, yearlyPrice: 89, invoiceLimit: null,
    features: ['Unlimited invoices and clients', 'Recurring invoices', 'Advanced templates', 'Payment reminders', 'Business insights', 'Data export', 'Priority support'],
  },
  premium: {
    name: 'Premium', price: '$19/month', monthlyPrice: 19, yearlyPrice: 189, invoiceLimit: null,
    features: ['Everything in Pro', 'Multiple businesses', 'Team collaboration', 'Roles and permissions', 'Advanced analytics', 'API access', 'Integrations', 'Audit logs', 'Dedicated priority support'],
  },
} as const;

const permissions = {
  unlimitedInvoices: false, unlimitedClients: false, recurringInvoices: false, advancedTemplates: false,
  invoiceStatusTracking: false, paymentReminders: false, businessInsights: false, dataExport: false,
  multipleBusinesses: false, teamCollaboration: false, rolesPermissions: false, advancedAnalytics: false,
  apiAccess: false, integrations: false, auditLogs: false, earlyAccess: false,
};

function authToken(req: Request) {
  const header = req.get('authorization');
  return header?.startsWith('Bearer ') ? header.slice(7) : null;
}
async function requireUser(req: Request, res: Response) {
  const token = authToken(req);
  if (!token) { res.status(401).json({ error: 'Authentication required' }); return null; }
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) { res.status(401).json({ error: 'Invalid or expired session' }); return null; }
  return data.user;
}
function normalize(row: Record<string, unknown> | null) {
  const plan = (row?.plan as keyof typeof PLAN_CATALOG) || 'free';
  const catalog = PLAN_CATALOG[plan] || PLAN_CATALOG.free;
  return {
    plan, planName: catalog.name, billingCycle: row?.billing_cycle || 'monthly',
    status: row?.status || 'active', startedAt: row?.started_at || null, renewalDate: row?.renewal_date || null,
    invoiceCountThisMonth: Number(row?.invoice_count_this_month || 0),
    lastResetDate: row?.last_reset_date || null, invoiceLimit: catalog.invoiceLimit,
    invoiceRemaining: catalog.invoiceLimit === null ? null : Math.max(catalog.invoiceLimit - Number(row?.invoice_count_this_month || 0), 0),
    featurePermissions: { ...permissions, ...(row?.feature_permissions as Record<string, boolean> || {}) },
    catalog,
  };
}

router.get('/subscriptions/catalog', (_req, res) => res.json({ plans: PLAN_CATALOG }));

router.get('/subscriptions/me', async (req, res) => {
  const user = await requireUser(req, res); if (!user) return;
  const devPlan = process.env.NODE_ENV !== 'production' ? process.env.INVOICEFOCUS_DEV_PLAN : undefined;
  if (devPlan && PLAN_CATALOG[devPlan as keyof typeof PLAN_CATALOG]) {
    res.json({ subscription: normalize({ plan: devPlan, status: 'active', feature_permissions: {} }) });
    return;
  }
  const { data, error } = await supabaseAdmin.from('subscriptions').select('*').eq('user_id', user.id).maybeSingle();
  if (error) { res.status(500).json({ error: 'Failed to load subscription' }); return; }
  res.json({ subscription: normalize(data) });
});

router.post('/subscriptions/preview', async (req, res) => {
  const user = await requireUser(req, res); if (!user) return;
  const plan = req.body?.plan as keyof typeof PLAN_CATALOG;
  const billingCycle = req.body?.billingCycle === 'yearly' ? 'yearly' : 'monthly';
  if (!PLAN_CATALOG[plan] || plan === 'free') { res.status(400).json({ error: 'Choose a paid plan to continue.' }); return; }
  res.json({ plan, billingCycle, price: billingCycle === 'yearly' ? PLAN_CATALOG[plan].yearlyPrice : PLAN_CATALOG[plan].monthlyPrice, paymentRequired: true, checkoutReady: true });
});

export async function reserveInvoice(userId: string) {
  const { data, error } = await supabaseAdmin.rpc('reserve_invoice_usage', { p_user_id: userId });
  if (error) throw error;
  return data as { allowed: boolean; plan: string; used: number; limit: number | null; remaining: number | null };
}
export async function releaseInvoice(userId: string) {
  await supabaseAdmin.rpc('release_invoice_usage', { p_user_id: userId });
}

export async function hasSubscriptionFeature(userId: string, feature: string) {
  const devPlan = process.env.NODE_ENV !== 'production' ? process.env.INVOICEFOCUS_DEV_PLAN : undefined;
  if (devPlan && PLAN_CATALOG[devPlan as keyof typeof PLAN_CATALOG]) {
    return devPlan !== 'free' || feature !== 'recurringInvoices';
  }
  const { data, error } = await supabaseAdmin
    .from('subscriptions')
    .select('plan, feature_permissions')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return false;
  const permissionsForPlan = data.feature_permissions as Record<string, boolean> | null;
  if (permissionsForPlan?.[feature] === true) return true;
  return data.plan === 'pro' || data.plan === 'premium'
    ? feature === 'dataExport'
    : false;
}

export default router;