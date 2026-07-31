export type BillingPlan = 'free' | 'pro' | 'premium';
export type BillingCycle = 'monthly' | 'yearly';
export type BillingStatus = 'active' | 'trialing' | 'past_due' | 'cancelled' | 'incomplete';

export type BillingEventType =
  | 'transaction.completed'
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
  verifyCompletedTransaction(input: VerifyTransactionInput): Promise<VerifiedWebhook>;
  updateSubscription(input: UpdateSubscriptionInput): Promise<VerifiedWebhook>;
  cancelSubscription(input: ManageSubscriptionInput): Promise<VerifiedWebhook>;
  resumeSubscription(input: ManageSubscriptionInput): Promise<VerifiedWebhook>;
  listPaymentMethods(input: ManageSubscriptionInput): Promise<PaymentMethodSnapshot[]>;
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
  transactionId?: string | null;
  clientToken?: string | null;
  priceId?: string | null;
  environment?: 'sandbox' | 'production';
  status: 'not_configured' | 'ready';
  message?: string;
}

export interface CustomerPortalInput {
  userId: string;
  returnUrl: string;
}

export interface VerifyTransactionInput {
  userId: string;
  transactionId: string;
}

export interface UpdateSubscriptionInput {
  userId: string;
  subscriptionId: string;
  plan: Exclude<BillingPlan, 'free'>;
  billingCycle: BillingCycle;
  effectiveFrom: 'immediately' | 'next_billing_period';
}

export interface ManageSubscriptionInput {
  userId: string;
  subscriptionId: string;
}

export interface PaymentMethodSnapshot {
  providerPaymentMethodId: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

export interface CustomerPortalResult {
  provider: string;
  portalUrl: string | null;
  status: 'not_configured' | 'ready';
  message?: string;
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