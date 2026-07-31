import { Router, type IRouter, type Request, type Response } from 'express';
import { invoiceBillingService } from '../billing/invoice-billing-service';
import { subscriptionManager, type SubscriptionAction } from '../billing/subscription-manager';
import { getBillingProvider, getPaddleBillingAvailability } from '../billing/provider';
import { checkoutService, customerPortalService } from '../billing/services';
import { billingEventHandler } from '../billing/events';
import { TransactionVerificationError, type BillingCycle, type BillingPlan } from '../billing/types';
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
  if (plan === 'free') { res.status(400).json({ error: 'Free downgrades are handled from Billing without checkout.' }); return; }
   try {
     const current = await subscriptionManager.get(user.id);
       if (current.plan === plan && current.status !== 'incomplete') {
         res.status(409).json({
           error: `You already have an active ${current.plan === 'premium' ? 'Premium' : 'Pro'} subscription.`,
           code: 'ACTIVE_SUBSCRIPTION',
           subscription: current,
         }); return;
      }
      if (current.providerSubscriptionId) {
         res.status(409).json({
           error: `You already have an active ${current.plan === 'premium' ? 'Premium' : 'Pro'} subscription.`,
           code: 'ACTIVE_SUBSCRIPTION',
           subscription: current,
         }); return;
      }
       const pendingSince = new Date(Date.now() - 15 * 60 * 1000).toISOString();
       const { data: pendingCheckout, error: pendingCheckoutError } = await supabaseAdmin
         .from('billing_transactions')
         .select('provider_transaction_id')
         .eq('user_id', user.id)
         .eq('provider', 'paddle')
         .eq('status', 'pending')
         .gte('created_at', pendingSince)
         .order('created_at', { ascending: false })
         .limit(1)
         .maybeSingle();
       if (pendingCheckoutError && !pendingCheckoutError.message.includes('does not exist')) throw pendingCheckoutError;
       if (pendingCheckout?.provider_transaction_id) {
         res.status(409).json({
           error: 'A payment is already being confirmed for this workspace.',
           code: 'CHECKOUT_IN_PROGRESS',
           transactionId: pendingCheckout.provider_transaction_id,
         }); return;
       }
      if (billingCycle === 'yearly' && !(await getPaddleBillingAvailability()).yearly) {
        res.status(409).json({ error: 'Yearly billing is not available yet.' }); return;
      }
     const result = await checkoutService.create(user.id, plan, billingCycle, req.body?.returnUrl || '/dashboard/billing');
     if (result.status === 'not_configured') { res.status(503).json({ ...result, error: result.message || 'Paddle checkout is not configured yet.' }); return; }
      if (result.transactionId) {
        const { error: transactionError } = await supabaseAdmin.from('billing_transactions').insert({
          user_id: user.id,
          provider: result.provider,
          provider_transaction_id: result.transactionId,
          transaction_type: 'charge',
          status: 'pending',
          amount: 0,
          currency: 'USD',
          metadata: { plan, billing_cycle: billingCycle, checkout_status: 'created' },
        });
        if (transactionError && !transactionError.message.includes('duplicate')) {
          req.log.error({ err: transactionError, transactionId: result.transactionId }, 'Failed to persist Paddle checkout intent');
        }
      }
     res.json({ ...result });
   } catch (error) {
     res.status(502).json({ error: error instanceof Error ? error.message : 'Could not create Paddle checkout.' });
   }
});

router.post('/billing/transactions/verify', async (req, res) => {
  const user = await requireUser(req, res); if (!user) return;
  const transactionId = typeof req.body?.transactionId === 'string' ? req.body.transactionId.trim() : '';
  if (!transactionId) { res.status(400).json({ error: 'A Paddle transaction ID is required.' }); return; }
  try {
    const event = await getBillingProvider().verifyCompletedTransaction({ userId: user.id, transactionId });
    await billingEventHandler.handle(event);
    const subscription = await subscriptionManager.get(user.id);
    res.json({ status: 'active', verified: true, subscription });
  } catch (error) {
    if (error instanceof TransactionVerificationError && error.outcome === 'pending') {
      req.log.info({ transactionId, outcome: error.outcome }, 'Paddle checkout is still pending confirmation');
      res.json({
        status: 'pending',
        verified: false,
        message: 'Your payment was received and is still being verified.',
      });
      return;
    }
    if (error instanceof TransactionVerificationError && error.outcome === 'failed') {
      req.log.warn({ transactionId, outcome: error.outcome }, 'Paddle checkout could not be confirmed');
      res.status(422).json({
        status: 'failed',
        verified: false,
        code: 'PAYMENT_FAILED',
        error: 'We could not confirm the payment. No subscription was activated.',
      });
      return;
    }
    req.log.error({ err: error, transactionId }, 'Paddle checkout verification failed');
    res.json({
      status: 'pending',
      verified: false,
      message: 'Your payment was received and is still being verified.',
    });
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
     const current = await subscriptionManager.get(user.id);
     const provider = getBillingProvider();
     let event;
      if (action === 'cancel' || (action === 'downgrade' && plan === 'free')) {
       if (!current.providerSubscriptionId) throw new Error('No active Paddle subscription is connected to this workspace.');
       event = await provider.cancelSubscription({ userId: user.id, subscriptionId: current.providerSubscriptionId });
     } else if (action === 'renew' || action === 'reactivate') {
       if (!current.providerSubscriptionId) throw new Error('No Paddle subscription is connected to this workspace.');
       event = await provider.resumeSubscription({ userId: user.id, subscriptionId: current.providerSubscriptionId });
     } else if (plan && plan !== 'free') {
       if (current.plan === plan && current.billingCycle === cycle && current.status !== 'cancelled') {
         res.status(409).json({ error: "You're already subscribed to this plan." }); return;
       }
       if (!current.providerSubscriptionId) {
         res.status(409).json({ error: 'Start secure checkout to activate your first paid subscription.' }); return;
       }
       event = await provider.updateSubscription({
         userId: user.id,
         subscriptionId: current.providerSubscriptionId,
         plan,
         billingCycle: cycle,
         effectiveFrom: 'immediately',
       });
     } else {
       throw new Error('Choose a valid paid plan or subscription action.');
     }
     await billingEventHandler.handle(event);
     res.json({ subscription: await subscriptionManager.get(user.id), message: 'Subscription updated.' });
   } catch (error) {
     res.status(400).json({ error: error instanceof Error ? error.message : 'Unable to update subscription' });
   }
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
  let verifiedEventId: string | null = null;
  try {
    const event = await provider.verifyWebhook({ provider: 'paddle', rawBody, signature });
    verifiedEventId = event.eventId;
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
    if (receivedError) {
      const { data: concurrentEvent } = await supabaseAdmin
        .from('billing_webhook_events')
        .select('id')
        .eq('provider', event.provider)
        .eq('provider_event_id', event.eventId)
        .maybeSingle();
      if (concurrentEvent) { res.status(204).end(); return; }
      throw receivedError;
    }
    await billingEventHandler.handle(event);
    await supabaseAdmin.from('billing_webhook_events').update({ status: 'processed', processed_at: new Date().toISOString() }).eq('provider', event.provider).eq('provider_event_id', event.eventId);
    res.status(204).end();
  } catch (error) {
    if (verifiedEventId) {
      await supabaseAdmin
        .from('billing_webhook_events')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Webhook processing failed.',
        })
        .eq('provider', 'paddle')
        .eq('provider_event_id', verifiedEventId);
    }
    res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid Paddle webhook.' });
  }
}

export default router;