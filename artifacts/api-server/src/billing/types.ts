export type BillingPlan = 'free' | 'pro' | 'premium';
export type BillingCycle = 'monthly' | 'yearly';
export type BillingStatus = 'active' | 'trialing' | 'past_due' | 'cancelled' | 'incomplete';

export type BillingEventType =
  | 'subscription.created'
  | 'subscription.updated'
  | 'subscription.cancelled'
  | 'payment.succeeded'
  | 'payment.failed'
  | 'refund.created'
  | 'subscription.renewed';

export interface BillingProvider {
  readonly name: string;
  createCheckoutSession(input: CheckoutInput): Promise<CheckoutResult>;
  createCustomerPortalSession(input: CustomerPortalInput): Promise<CustomerPortalResult>;
  verifyWebhook(input: WebhookVerificationInput): Promise<VerifiedWebhook>;
}

export interface CheckoutInput {
  userId: string;
  plan: BillingPlan;
  billingCycle: BillingCycle;
  returnUrl: string;
}

export interface CheckoutResult {
  provider: string;
  checkoutUrl: string | null;
  status: 'not_configured' | 'ready';
}

export interface CustomerPortalInput {
  userId: string;
  returnUrl: string;
}

export interface CustomerPortalResult {
  provider: string;
  portalUrl: string | null;
  status: 'not_configured' | 'ready';
}

export interface WebhookVerificationInput {
  provider: string;
  rawBody: string;
  signature: string | null;
}

export interface VerifiedWebhook {
  provider: string;
  eventId: string;
  type: BillingEventType;
  occurredAt: string;
  data: Record<string, unknown>;
}

export interface BillingEventHandler {
  handle(event: VerifiedWebhook): Promise<void>;
}