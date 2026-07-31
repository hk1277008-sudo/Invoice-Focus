import type {
  BillingProvider,
  CheckoutInput,
  CheckoutResult,
  CustomerPortalInput,
  CustomerPortalResult,
  VerifiedWebhook,
  WebhookVerificationInput,
} from './types';
import { Environment, Paddle } from '@paddle/paddle-node-sdk';
import { supabaseAdmin } from '../lib/supabase';

const paidPlans = ['pro', 'premium'] as const;
type PaidPlan = (typeof paidPlans)[number];

const configuredPriceIds: Record<`${PaidPlan}_${'monthly' | 'yearly'}`, string | undefined> = {
  pro_monthly: process.env.PADDLE_PRO_MONTHLY_PRICE_ID,
  pro_yearly: process.env.PADDLE_PRO_YEARLY_PRICE_ID,
  premium_monthly: process.env.PADDLE_PREMIUM_MONTHLY_PRICE_ID,
  premium_yearly: process.env.PADDLE_PREMIUM_YEARLY_PRICE_ID,
};

function paddleEnvironment() {
  return String(process.env.PADDLE_ENV || '').toLowerCase() === 'production'
    ? Environment.production
    : Environment.sandbox;
}

function paddleClient() {
  const apiKey = process.env.PADDLE_API_KEY;
  if (!apiKey) return null;
  return new Paddle(apiKey, { environment: paddleEnvironment() });
}

function paddleMode() {
  return String(process.env.PADDLE_ENV || '').toLowerCase() === 'production' ? 'production' : 'sandbox';
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {};
}

async function resolvePriceId(plan: PaidPlan, billingCycle: 'monthly' | 'yearly') {
  const configured = configuredPriceIds[`${plan}_${billingCycle}`];
  if (configured) return configured;

  const paddle = paddleClient();
  if (!paddle) return null;

  const products = [];
  for await (const product of paddle.products.list({ perPage: 100 })) products.push(product);
  const product = products.find((candidate) => candidate.status === 'active'
    && (plan === 'premium' ? candidate.name.toLowerCase().includes('premium') : candidate.name.trim().toLowerCase() === 'pro'));
  if (!product) return null;

  const prices = [];
  for await (const price of paddle.prices.list({ perPage: 100, productId: [product.id], recurring: true })) prices.push(price);
  const expectedInterval = billingCycle === 'yearly' ? 'year' : 'month';
  return prices.find((price) => price.status === 'active' && price.billingCycle?.interval === expectedInterval)?.id || null;
}

function normalizeWebhookType(eventType: string): VerifiedWebhook['type'] | null {
  if (eventType === 'subscription.canceled') return 'subscription.cancelled';
  if (eventType === 'transaction.completed') return 'payment.succeeded';
  if (eventType === 'transaction.payment_failed') return 'payment.failed';
  if (eventType === 'subscription.created' || eventType === 'subscription.updated') return eventType;
  return null;
}

function webhookData(event: { data: object; eventType: string }) {
  const data = asRecord(event.data);
  const customData = asRecord(data.customData);
  const item = Array.isArray(data.items) ? asRecord(data.items[0]) : {};
  const price = asRecord(item.price);
  const priceId = typeof item.priceId === 'string' ? item.priceId : typeof price.id === 'string' ? price.id : null;
  const billingCycle = asRecord(data.billingCycle);
  const interval = billingCycle.interval === 'year' ? 'yearly' : 'monthly';
  const amount = asRecord(asRecord(data.details).totals).total;
  return {
    ...data,
    userId: typeof customData.user_id === 'string' ? customData.user_id : null,
    plan: customData.plan === 'pro' || customData.plan === 'premium' ? customData.plan : null,
    billingCycle: customData.billing_cycle === 'yearly' || customData.billing_cycle === 'monthly' ? customData.billing_cycle : interval,
    priceId,
    providerCustomerId: typeof data.customerId === 'string' ? data.customerId : null,
    providerSubscriptionId: typeof data.subscriptionId === 'string' ? data.subscriptionId : typeof data.id === 'string' && event.eventType.startsWith('subscription.') ? data.id : null,
    renewalDate: typeof data.nextBilledAt === 'string' ? data.nextBilledAt : null,
    amount: typeof amount === 'string' ? Number(amount) : null,
    currency: typeof data.currencyCode === 'string' ? data.currencyCode : 'USD',
  };
}

class PaddleBillingProvider implements BillingProvider {
  readonly name = 'paddle';

  async createCheckoutSession(input: CheckoutInput): Promise<CheckoutResult> {
    if (input.plan === 'free') return { provider: this.name, checkoutUrl: null, transactionId: null, clientToken: null, priceId: null, environment: paddleMode(), status: 'not_configured', message: 'Free does not require checkout.' };
    const paddle = paddleClient();
    const priceId = await resolvePriceId(input.plan, input.billingCycle);
    const clientToken = process.env.PADDLE_CLIENT_TOKEN || null;
    if (!paddle || !priceId || !clientToken) {
      return {
        provider: this.name, checkoutUrl: null, transactionId: null, clientToken, priceId, environment: paddleMode(),
        status: 'not_configured',
        message: !priceId
          ? `The ${input.plan} ${input.billingCycle} price is not configured in Paddle Sandbox yet.`
          : 'Paddle checkout is not configured yet.',
      };
    }

    const transaction = await paddle.transactions.create({
      items: [{ priceId, quantity: 1 }],
      currencyCode: 'USD',
      collectionMode: 'automatic',
      customData: { user_id: input.userId, plan: input.plan, billing_cycle: input.billingCycle },
    });
    return {
      provider: this.name,
      checkoutUrl: transaction.checkout?.url || null,
      transactionId: transaction.id,
      clientToken,
      priceId,
      environment: paddleMode(),
      status: 'ready',
    };
  }

  async createCustomerPortalSession(input: CustomerPortalInput): Promise<CustomerPortalResult> {
    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .select('provider_customer_id,provider_subscription_id')
      .eq('user_id', input.userId)
      .maybeSingle();
    if (error) throw error;
    const paddle = paddleClient();
    if (!paddle || !data?.provider_customer_id || !data.provider_subscription_id) {
      return { provider: this.name, portalUrl: null, status: 'not_configured', message: 'A completed Paddle subscription is required before opening the billing portal.' };
    }
    const session = await paddle.customerPortalSessions.create(data.provider_customer_id, [data.provider_subscription_id]);
    return { provider: this.name, portalUrl: session.urls.general.overview, status: 'ready' };
  }

  async verifyWebhook(input: WebhookVerificationInput): Promise<VerifiedWebhook> {
    const paddle = paddleClient();
    if (!paddle) throw new Error('Paddle API credentials are not configured.');
    const secret = process.env.PADDLE_WEBHOOK_SECRET;
    let event: { eventId: string; eventType: string; occurredAt: string; data: object };
    if (secret) {
      if (!input.signature) throw new Error('Paddle webhook signature is missing.');
      event = await paddle.webhooks.unmarshal(input.rawBody, secret, input.signature) as typeof event;
    } else if (paddleMode() === 'sandbox') {
      const parsed = JSON.parse(input.rawBody) as { event_id?: string; event_type?: string; occurred_at?: string; data?: object };
      if (!parsed.event_id || !parsed.event_type || !parsed.data) throw new Error('Invalid unsigned Paddle Sandbox webhook payload.');
      event = { eventId: parsed.event_id, eventType: parsed.event_type, occurredAt: parsed.occurred_at || new Date().toISOString(), data: parsed.data };
    } else {
      throw new Error('PADDLE_WEBHOOK_SECRET is required outside Paddle Sandbox.');
    }
    const type = normalizeWebhookType(event.eventType);
    if (!type) throw new Error(`Unsupported Paddle webhook event: ${event.eventType}`);
    return { provider: this.name, eventId: event.eventId, type, occurredAt: event.occurredAt, data: webhookData(event) };
  }
}

/**
 * Safe fallback used only when Paddle credentials are absent. The active Paddle
 * adapter below owns provider IDs, checkout, portal sessions, and webhooks.
 */
export const unconfiguredBillingProvider: BillingProvider = {
  name: 'unconfigured',
  async createCheckoutSession(_input: CheckoutInput): Promise<CheckoutResult> {
    return { provider: this.name, checkoutUrl: null, status: 'not_configured' };
  },
  async createCustomerPortalSession(_input: CustomerPortalInput): Promise<CustomerPortalResult> {
    return { provider: this.name, portalUrl: null, status: 'not_configured' };
  },
  async verifyWebhook(_input: WebhookVerificationInput): Promise<VerifiedWebhook> {
    throw new Error('Billing provider webhook verification is not configured.');
  },
};

export function getBillingProvider(): BillingProvider {
  return paddleClient() ? new PaddleBillingProvider() : unconfiguredBillingProvider;
}

export { PaddleBillingProvider };