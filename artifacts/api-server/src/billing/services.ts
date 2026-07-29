import { getBillingProvider } from './provider';
import type { BillingCycle, BillingPlan, CheckoutResult, CustomerPortalResult } from './types';

export class CheckoutService {
  async create(userId: string, plan: BillingPlan, billingCycle: BillingCycle, returnUrl: string): Promise<CheckoutResult> {
    return getBillingProvider().createCheckoutSession({ userId, plan, billingCycle, returnUrl });
  }
}

export class CustomerPortalService {
  async create(userId: string, returnUrl: string): Promise<CustomerPortalResult> {
    return getBillingProvider().createCustomerPortalSession({ userId, returnUrl });
  }
}

export const checkoutService = new CheckoutService();
export const customerPortalService = new CustomerPortalService();