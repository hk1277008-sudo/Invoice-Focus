import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.FROM_EMAIL;

if (!resendApiKey || !fromEmail) {
  throw new Error(
    'Missing Resend environment variables. Please set RESEND_API_KEY and FROM_EMAIL.',
  );
}

export const resend = new Resend(resendApiKey);
export const defaultFromEmail = `InvoiceFocus <${fromEmail}>`;
