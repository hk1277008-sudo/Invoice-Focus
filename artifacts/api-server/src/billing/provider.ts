import type {
  BillingProvider,
  CheckoutInput,
  CheckoutResult,
  CustomerPortalInput,
  CustomerPortalResult,
  ManageSubscriptionInput,
  PaymentMethodSnapshot,
  UpdateSubscriptionInput,
  VerifyTransactionInput,
  VerifiedWebhook,
  WebhookVerificationInput,
} from './types';
import { TransactionVerificationError } from './types';
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

function field(record: Record<string, unknown>, camel: string, snake: string) {
  return record[camel] ?? record[snake];
}

function planFromName(name: unknown): PaidPlan | null {
  if (typeof name !== 'string') return null;
  const normalized = name.toLowerCase();
  return normalized.includes('premium') ? 'premium' : normalized.includes('pro') ? 'pro' : null;
}

function cycleFromInterval(interval: unknown): 'monthly' | 'yearly' {
  return interval === 'year' ? 'yearly' : 'monthly';
}

function transactionData(transaction: any, userId: string) {
  const customData = asRecord(transaction.customData);
  const item = transaction.items?.[0];
  const price = item?.price;
  const plan = customData.plan === 'pro' || customData.plan === 'premium' ? customData.plan : planFromName(price?.product?.name);
  const billingCycle = customData.billing_cycle === 'yearly' || customData.billing_cycle === 'monthly'
    ? customData.billing_cycle
    : cycleFromInterval(price?.billingCycle?.interval);
  const total = transaction.details?.totals?.total;
  const payment = transaction.payments?.[0];
  const card = payment?.methodDetails?.card;
  return {
    ...asRecord(transaction),
    userId,
    plan,
    billingCycle,
    providerCustomerId: transaction.customerId || null,
    providerSubscriptionId: transaction.subscriptionId || null,
    transactionId: transaction.id,
    invoiceId: transaction.invoiceId || null,
    invoiceNumber: transaction.invoiceNumber || null,
    priceId: price?.id || null,
    renewalDate: null,
    amount: typeof total === 'string' ? Number(total) : null,
    currency: transaction.currencyCode || 'USD',
    paymentMethod: card ? {
      providerPaymentMethodId: payment.storedPaymentMethodId || payment.paymentMethodId || null,
      brand: card.type || 'card',
      last4: card.last4,
      expMonth: card.expiryMonth,
      expYear: card.expiryYear,
    } : null,
  };
}

function subscriptionData(subscription: any, userId: string, planOverride?: PaidPlan, cycleOverride?: 'monthly' | 'yearly') {
  const customData = asRecord(subscription.customData);
  const item = subscription.items?.[0];
  const plan = planOverride || (customData.plan === 'pro' || customData.plan === 'premium' ? customData.plan : planFromName(item?.price?.product?.name));
  const billingCycle = cycleOverride || (customData.billing_cycle === 'yearly' || customData.billing_cycle === 'monthly'
    ? customData.billing_cycle
    : cycleFromInterval(subscription.billingCycle?.interval));
  return {
    ...asRecord(subscription),
    userId,
    plan,
    billingCycle,
    providerCustomerId: subscription.customerId || null,
    providerSubscriptionId: subscription.id,
    renewalDate: subscription.nextBilledAt || null,
    status: subscription.status === 'canceled' ? 'cancelled' : subscription.status,
    priceId: item?.price?.id || null,
  };
}

async function resolvePriceId(plan: PaidPlan, billingCycle: 'monthly' | 'yearly') {
  const paddle = paddleClient();
  if (!paddle) return null;
  const configured = configuredPriceIds[`${plan}_${billingCycle}`];

  const products = [];
  for await (const product of paddle.products.list({ perPage: 100 })) products.push(product);
  const product = products.find((candidate) => candidate.status === 'active'
    && (plan === 'premium' ? candidate.name.toLowerCase().includes('premium') : candidate.name.trim().toLowerCase() === 'pro'));
  if (!product) return null;

  const prices = [];
  for await (const price of paddle.prices.list({ perPage: 100, productId: [product.id], recurring: true })) prices.push(price);
  const expectedInterval = billingCycle === 'yearly' ? 'year' : 'month';
  return prices.find((price) => price.status === 'active'
    && (configured ? price.id === configured : price.billingCycle?.interval === expectedInterval))?.id || null;
}

let billingAvailabilityCache: { expiresAt: number; yearly: boolean } | null = null;

export async function getPaddleBillingAvailability() {
  if (!paddleClient()) return { monthly: true, yearly: false };
  if (billingAvailabilityCache && billingAvailabilityCache.expiresAt > Date.now()) {
    return { monthly: true, yearly: billingAvailabilityCache.yearly };
  }
  try {
    const [proYearly, premiumYearly] = await Promise.all([
      resolvePriceId('pro', 'yearly'),
      resolvePriceId('premium', 'yearly'),
    ]);
    const yearly = Boolean(proYearly && premiumYearly);
    billingAvailabilityCache = { expiresAt: Date.now() + 60_000, yearly };
    return { monthly: true, yearly };
  } catch {
    billingAvailabilityCache = { expiresAt: Date.now() + 15_000, yearly: false };
    return { monthly: true, yearly: false };
  }
}

function normalizeWebhookType(eventType: string): VerifiedWebhook['type'] | null {
  if (eventType === 'subscription.canceled') return 'subscription.cancelled';
  if (eventType === 'subscription.past_due') return 'payment.failed';
  if (eventType === 'subscription.activated' || eventType === 'subscription.resumed' || eventType === 'subscription.trialing') return 'subscription.updated';
  if (eventType === 'transaction.completed') return 'transaction.completed';
  if (eventType === 'transaction.paid' || eventType === 'transaction.billed') return 'payment.succeeded';
  if (eventType === 'transaction.payment_failed' || eventType === 'transaction.past_due') return 'payment.failed';
  if (eventType === 'subscription.created' || eventType === 'subscription.updated') return eventType;
  return null;
}

function webhookData(event: { data: object; eventType: string }) {
  const data = asRecord(event.data);
  const customData = asRecord(field(data, 'customData', 'custom_data'));
  const item = Array.isArray(data.items) ? asRecord(data.items[0]) : {};
  const price = asRecord(item.price);
  const priceIdValue = field(item, 'priceId', 'price_id');
  const priceId = typeof priceIdValue === 'string' ? priceIdValue : typeof price.id === 'string' ? price.id : null;
  const billingCycle = asRecord(field(data, 'billingCycle', 'billing_cycle'));
  const interval = billingCycle.interval === 'year' ? 'yearly' : 'monthly';
  const amount = asRecord(asRecord(data.details).totals).total;
  const payment = Array.isArray(data.payments) ? asRecord(data.payments[0]) : {};
  const methodDetails = asRecord(field(payment, 'methodDetails', 'method_details'));
  const card = asRecord(methodDetails.card);
  const userId = field(customData, 'user_id', 'user_id');
  const providerCustomerId = field(data, 'customerId', 'customer_id');
  const providerSubscriptionId = field(data, 'subscriptionId', 'subscription_id');
  const nextBilledAt = field(data, 'nextBilledAt', 'next_billed_at');
  const invoiceId = field(data, 'invoiceId', 'invoice_id');
  const invoiceNumber = field(data, 'invoiceNumber', 'invoice_number');
  return {
    ...data,
    userId: typeof userId === 'string' ? userId : null,
    plan: customData.plan === 'pro' || customData.plan === 'premium' ? customData.plan : null,
    billingCycle: customData.billing_cycle === 'yearly' || customData.billing_cycle === 'monthly' ? customData.billing_cycle : interval,
    priceId,
    transactionId: typeof data.id === 'string' && event.eventType.startsWith('transaction.') ? data.id : null,
    invoiceId: typeof invoiceId === 'string' ? invoiceId : null,
    invoiceNumber: typeof invoiceNumber === 'string' ? invoiceNumber : null,
    providerCustomerId: typeof providerCustomerId === 'string' ? providerCustomerId : null,
    providerSubscriptionId: typeof providerSubscriptionId === 'string' ? providerSubscriptionId : typeof data.id === 'string' && event.eventType.startsWith('subscription.') ? data.id : null,
    renewalDate: typeof nextBilledAt === 'string' ? nextBilledAt : null,
    amount: typeof amount === 'string' ? Number(amount) : null,
    currency: typeof data.currencyCode === 'string' ? data.currencyCode : 'USD',
    paymentMethod: card.last4 ? {
      providerPaymentMethodId: typeof field(payment, 'storedPaymentMethodId', 'stored_payment_method_id') === 'string'
        ? field(payment, 'storedPaymentMethodId', 'stored_payment_method_id') as string
        : null,
      brand: typeof card.type === 'string' ? card.type : 'card',
      last4: card.last4,
      expMonth: typeof card.expiryMonth === 'number' ? card.expiryMonth : null,
      expYear: typeof card.expiryYear === 'number' ? card.expiryYear : null,
    } : null,
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

  async verifyCompletedTransaction(input: VerifyTransactionInput): Promise<VerifiedWebhook> {
    const paddle = paddleClient();
    if (!paddle) throw new Error('Paddle API credentials are not configured.');
    const transaction = await paddle.transactions.get(input.transactionId);
    if (transaction.status === 'canceled' || transaction.status === 'past_due') {
      throw new TransactionVerificationError('The payment could not be completed.', 'failed');
    }
    if (!['billed', 'paid', 'completed'].includes(transaction.status)) {
      throw new TransactionVerificationError('The payment is still being confirmed.', 'pending');
    }
    const customData = asRecord(transaction.customData);
    if (customData.user_id !== input.userId) {
      throw new TransactionVerificationError('The payment could not be matched to this workspace.', 'failed');
    }
    let data = transactionData(transaction, input.userId);
    if (transaction.subscriptionId) {
      const subscription = await paddle.subscriptions.get(transaction.subscriptionId);
      if (subscription.customerId) await paddle.customers.get(subscription.customerId);
      data = {
        ...data,
        ...subscriptionData(subscription, input.userId, data.plan || undefined, data.billingCycle),
        transactionId: transaction.id,
        invoiceId: transaction.invoiceId || null,
        invoiceNumber: transaction.invoiceNumber || null,
        amount: data.amount,
        currency: data.currency,
        paymentMethod: data.paymentMethod,
      };
    }
    if (!transaction.subscriptionId) {
      throw new TransactionVerificationError('The subscription is still being created.', 'pending');
    }
    if (data.plan !== 'pro' && data.plan !== 'premium') {
      throw new TransactionVerificationError('The payment could not be matched to an InvoiceFocus plan.', 'failed');
    }
    return {
      provider: this.name,
      eventId: `transaction:${transaction.id}`,
      type: 'transaction.completed',
      occurredAt: transaction.billedAt || transaction.updatedAt || transaction.createdAt,
      data,
    };
  }

  async updateSubscription(input: UpdateSubscriptionInput): Promise<VerifiedWebhook> {
    const paddle = paddleClient();
    if (!paddle) throw new Error('Paddle API credentials are not configured.');
    const priceId = await resolvePriceId(input.plan, input.billingCycle);
    if (!priceId) throw new Error(`The ${input.plan} ${input.billingCycle} Paddle price is not configured.`);
    const subscription = await paddle.subscriptions.update(input.subscriptionId, {
      items: [{ priceId, quantity: 1 }],
      scheduledChange: null,
      customData: { user_id: input.userId, plan: input.plan, billing_cycle: input.billingCycle },
      prorationBillingMode: input.effectiveFrom === 'immediately' ? 'prorated_immediately' : 'prorated_next_billing_period',
    });
    return {
      provider: this.name,
      eventId: `subscription:${subscription.id}:${subscription.updatedAt}`,
      type: 'subscription.updated',
      occurredAt: subscription.updatedAt,
      data: subscriptionData(subscription, input.userId, input.plan, input.billingCycle),
    };
  }

  async cancelSubscription(input: ManageSubscriptionInput): Promise<VerifiedWebhook> {
    const paddle = paddleClient();
    if (!paddle) throw new Error('Paddle API credentials are not configured.');
    const subscription = await paddle.subscriptions.cancel(input.subscriptionId, { effectiveFrom: 'next_billing_period' });
    return {
      provider: this.name,
      eventId: `subscription:${subscription.id}:${subscription.updatedAt}`,
      type: 'subscription.updated',
      occurredAt: subscription.updatedAt,
      data: subscriptionData(subscription, input.userId),
    };
  }

  async resumeSubscription(input: ManageSubscriptionInput): Promise<VerifiedWebhook> {
    const paddle = paddleClient();
    if (!paddle) throw new Error('Paddle API credentials are not configured.');
    const subscription = await paddle.subscriptions.resume(input.subscriptionId, { effectiveFrom: 'immediately' });
    return {
      provider: this.name,
      eventId: `subscription:${subscription.id}:${subscription.updatedAt}`,
      type: 'subscription.updated',
      occurredAt: subscription.updatedAt,
      data: subscriptionData(subscription, input.userId),
    };
  }

  async listPaymentMethods(input: ManageSubscriptionInput): Promise<PaymentMethodSnapshot[]> {
    const paddle = paddleClient();
    if (!paddle) throw new Error('Paddle API credentials are not configured.');
    const subscription = await paddle.subscriptions.get(input.subscriptionId);
    const methods: PaymentMethodSnapshot[] = [];
    for await (const method of paddle.paymentMethods.list(subscription.customerId, {
      addressId: [subscription.addressId],
      supportsCheckout: true,
      perPage: 100,
    })) {
      if (!method.card) continue;
      methods.push({
        providerPaymentMethodId: method.id,
        brand: method.card.type,
        last4: method.card.last4,
        expMonth: method.card.expiryMonth,
        expYear: method.card.expiryYear,
        isDefault: methods.length === 0,
      });
    }
    return methods;
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
  async verifyCompletedTransaction(_input: VerifyTransactionInput): Promise<VerifiedWebhook> {
    throw new Error('Billing provider transaction verification is not configured.');
  },
  async updateSubscription(_input: UpdateSubscriptionInput): Promise<VerifiedWebhook> {
    throw new Error('Billing provider subscription updates are not configured.');
  },
  async cancelSubscription(_input: ManageSubscriptionInput): Promise<VerifiedWebhook> {
    throw new Error('Billing provider subscription cancellation is not configured.');
  },
  async resumeSubscription(_input: ManageSubscriptionInput): Promise<VerifiedWebhook> {
    throw new Error('Billing provider subscription resumption is not configured.');
  },
  async listPaymentMethods(_input: ManageSubscriptionInput): Promise<PaymentMethodSnapshot[]> {
    return [];
  },
};

export function getBillingProvider(): BillingProvider {
  return paddleClient() ? new PaddleBillingProvider() : unconfiguredBillingProvider;
}

export { PaddleBillingProvider };