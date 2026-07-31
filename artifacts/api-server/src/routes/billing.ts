import { Router, type IRouter, type Request, type Response } from 'express';
import { invoiceBillingService } from '../billing/invoice-billing-service';
import { subscriptionManager, type SubscriptionAction } from '../billing/subscription-manager';
import { getBillingProvider } from '../billing/provider';
import { checkoutService, customerPortalService } from '../billing/services';
import { billingEventHandler } from '../billing/events';
import type { BillingCycle, BillingPlan } from '../billing/types';
import { supabaseAdmin } from '../lib/supabase';

const router: IRouter = Router();

async function requireUser(req: Request, res: Response) {
  const token = req.get('authorization')?.startsWith('Bearer ') ? req.get('authorization')!.slice(7) : null;
  if (!token) { res.status(401).json({ error: 'Authentication required' }); return null; }
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) { res.status(401).json({ error: 'Invalid or expired session' }); return null; }
  return data.user;
}

router.get('/billing/overview', async (req, res) => {
  const user = await requireUser(req, res); if (!user) return;
  try { res.json(await invoiceBillingService.getOverview(user.id)); }
  catch { res.status(500).json({ error: 'Failed to load billing overview' }); }
});

router.post('/billing/checkout', async (req, res) => {
  const user = await requireUser(req, res); if (!user) return;
  const plan = req.body?.plan as BillingPlan;
  const billingCycle = req.body?.billingCycle === 'yearly' ? 'yearly' : 'monthly';
  if (!['free', 'pro', 'premium'].includes(plan)) { res.status(400).json({ error: 'Invalid billing plan' }); return; }
   try {
     const current = await subscriptionManager.get(user.id);
     if (current.plan !== 'free' && current.status !== 'cancelled' && current.status !== 'incomplete') {
       res.status(409).json({ error: 'You already have an active paid subscription. Manage it from the billing portal.' }); return;
     }
     const result = await checkoutService.create(user.id, plan, billingCycle, req.body?.returnUrl || '/dashboard/billing');
     if (result.status === 'not_configured') { res.status(503).json({ ...result, error: result.message || 'Paddle checkout is not configured yet.' }); return; }
     res.json({ ...result });
   } catch (error) {
     res.status(502).json({ error: error instanceof Error ? error.message : 'Could not create Paddle checkout.' });
   }
});

router.post('/billing/portal', async (req, res) => {
  const user = await requireUser(req, res); if (!user) return;
  const result = await customerPortalService.create(user.id, req.body?.returnUrl || '/dashboard/billing');
  res.json({ ...result });
});

router.post('/billing/actions', async (req, res) => {
  const user = await requireUser(req, res); if (!user) return;
  const action = req.body?.action as SubscriptionAction;
  const plan = req.body?.plan as BillingPlan | undefined;
  const cycle: BillingCycle = req.body?.billingCycle === 'yearly' ? 'yearly' : 'monthly';
  if (!['upgrade', 'downgrade', 'cancel', 'renew', 'reactivate'].includes(action)) { res.status(400).json({ error: 'Invalid billing action' }); return; }
  try {
    const subscription = await subscriptionManager.applySimulatedAction(user.id, action, plan, cycle);
    res.json({ simulated: true, subscription, message: 'Subscription updated in simulation mode.' });
  } catch { res.status(400).json({ error: 'Unable to update subscription' }); }
});

router.post('/webhooks/billing/:provider', async (req, res) => {
  const provider = getBillingProvider();
  const signature = req.get('x-billing-signature') || req.get('stripe-signature') || null;
  try {
    const event = await provider.verifyWebhook({ provider: req.params.provider, rawBody: JSON.stringify(req.body), signature });
    await billingEventHandler.handle(event);
    res.status(204).end();
  } catch {
    res.status(503).json({ error: 'Billing provider webhook verification is not configured.' });
  }
});

export async function handlePaddleWebhook(req: Request, res: Response) {
  const provider = getBillingProvider();
  const signature = req.get('paddle-signature') || null;
  const rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : '';
  try {
    const event = await provider.verifyWebhook({ provider: 'paddle', rawBody, signature });
    const { data: duplicate, error: duplicateError } = await supabaseAdmin
      .from('billing_webhook_events')
      .select('id,status')
      .eq('provider', event.provider)
      .eq('provider_event_id', event.eventId)
      .maybeSingle();
    if (duplicateError) throw duplicateError;
    if (duplicate) { res.status(204).end(); return; }
    const { error: receivedError } = await supabaseAdmin.from('billing_webhook_events').insert({
      provider: event.provider,
      provider_event_id: event.eventId,
      event_type: event.type,
      status: 'received',
      payload: event.data,
    });
    if (receivedError) throw receivedError;
    await billingEventHandler.handle(event);
    await supabaseAdmin.from('billing_webhook_events').update({ status: 'processed', processed_at: new Date().toISOString() }).eq('provider', event.provider).eq('provider_event_id', event.eventId);
    res.status(204).end();
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid Paddle webhook.' });
  }
}

export default router;