import { z } from 'zod';

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
