import type {
  BillingProvider,
  CheckoutInput,
  CheckoutResult,
  CustomerPortalInput,
  CustomerPortalResult,
  VerifiedWebhook,
  WebhookVerificationInput,
} from './types';

/**
 * Safe pre-deployment provider. It intentionally never creates a checkout URL
 * or accepts a webhook. A Lemon Squeezy, Paddle, or Stripe adapter can replace
 * this object without changing subscription or route code.
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
  return unconfiguredBillingProvider;
}