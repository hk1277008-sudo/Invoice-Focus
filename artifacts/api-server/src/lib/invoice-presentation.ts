import { z } from 'zod';
import { supabaseAdmin } from './supabase';

export const invoicePresentationSchema = z.object({
  template: z.enum(['modern', 'minimal', 'corporate', 'executive', 'elegant', 'creative', 'clean', 'professional']).default('modern'),
  primaryColor: z.string().regex(/^#[0-9a-f]{6}$/i).default('#2e5bff'),
  accentColor: z.string().regex(/^#[0-9a-f]{6}$/i).default('#13a6a6'),
  font: z.enum(['Inter', 'Fraunces', 'DM Mono']).default('Inter'),
  headerLayout: z.enum(['Split', 'Centered', 'Band']).default('Split'),
  footerLayout: z.enum(['Simple', 'Detailed', 'Bar']).default('Simple'),
  paperSize: z.enum(['A4', 'Letter']).default('A4'),
  titleStyle: z.enum(['default', 'compact', 'editorial']).default('default'),
});

export const invoicePresentationPayloadSchema = invoicePresentationSchema.optional();
export type InvoicePresentationPayload = z.infer<typeof invoicePresentationSchema>;

export async function enforceInvoicePresentationEntitlement(userId: string, presentation: InvoicePresentationPayload | undefined) {
  if (!presentation) return null;
  if (process.env.NODE_ENV !== 'production') return null;
  const devPlan = process.env.NODE_ENV !== 'production' ? process.env.INVOICEFOCUS_DEV_PLAN : undefined;
  let plan: 'free' | 'pro' | 'premium' = devPlan === 'pro' || devPlan === 'premium' ? devPlan : 'free';
  if (!devPlan) {
    const { data, error } = await supabaseAdmin.from('subscriptions').select('plan').eq('user_id', userId).maybeSingle();
    if (error) throw error;
    if (data?.plan === 'pro' || data?.plan === 'premium') plan = data.plan;
  }

  const freeTemplates = ['modern', 'minimal'];
  const proTemplates = ['corporate', 'executive', 'elegant'];
  const premiumTemplates = ['creative', 'clean', 'professional'];
  const allowedTemplates = plan === 'free'
    ? freeTemplates
    : plan === 'pro'
      ? [...freeTemplates, ...proTemplates]
      : [...freeTemplates, ...proTemplates, ...premiumTemplates];
  if (!allowedTemplates.includes(presentation.template)) {
    return {
      error: 'That invoice template is not included in your plan.',
      code: 'TEMPLATE_NOT_INCLUDED',
      requiredPlan: premiumTemplates.includes(presentation.template) ? 'premium' : 'pro',
    } as const;
  }

  const customBranding = presentation.primaryColor !== '#2e5bff'
    || presentation.accentColor !== '#13a6a6'
    || presentation.font !== 'Inter'
    || presentation.headerLayout !== 'Split'
    || presentation.footerLayout !== 'Simple'
    || presentation.titleStyle !== 'default';
  if (customBranding && plan !== 'premium') {
    return {
      error: 'Full branding customization is available on Premium.',
      code: 'BRANDING_NOT_INCLUDED',
      requiredPlan: 'premium',
    } as const;
  }
  return null;
}