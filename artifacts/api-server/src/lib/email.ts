import { resend, defaultFromEmail } from './resend';

function brandStyles() {
  return `
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; color: #111827; }
      .container { max-width: 520px; margin: 40px auto; background: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden; }
      .header { background: #0A2540; padding: 32px 32px 24px; text-align: center; }
      .brand { margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.02em; }
      .tagline { margin: 8px 0 0; color: #a3b8cc; font-size: 14px; }
      .content { padding: 32px; }
      .content h1 { margin: 0 0 20px; color: #111827; font-size: 24px; line-height: 1.25; font-weight: 700; letter-spacing: -0.02em; }
      .content p { font-size: 15px; line-height: 1.6; margin: 0 0 16px; }
      .button-wrap { margin: 24px 0; text-align: center; }
      .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; }
      .button:hover { background: #1d4ed8; }
      .link { color: #2563eb; word-break: break-all; }
      .muted { font-size: 13px !important; color: #6b7280; }
      .footer { padding: 24px 32px; background: #f8fafc; border-top: 1px solid #e5e7eb; text-align: center; }
      .footer p { margin: 0; font-size: 12px; color: #6b7280; }
    </style>
  `;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{ filename: string; content: string }>;
}

export async function sendEmail(options: SendEmailOptions) {
  const { to, subject, html, attachments } = options;
  const { data, error } = await resend.emails.send({
    from: defaultFromEmail,
    to,
    subject,
    html,
    attachments,
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }

  return data;
}

export function buildInvoiceEmail(input: {
  businessName: string;
  logo?: string;
  recipientName?: string;
  invoiceNumber: string;
  amountDue: string;
  dueDate?: string | null;
  personalMessage?: string;
  viewUrl: string;
}) {
  const greeting = input.recipientName ? `Hi ${input.recipientName},` : 'Hello,';
  return {
    subject: `Invoice ${input.invoiceNumber} from InvoiceFocus`,
    html: `<!DOCTYPE html><html><head>${brandStyles()}</head><body><div class="container"><div class="header">${input.logo ? `<img src="${input.logo}" alt="${input.businessName}" style="max-height:48px;max-width:160px;margin-bottom:10px">` : ''}<p class="brand">${input.businessName || 'InvoiceFocus'}</p><p class="tagline">Professional invoicing, made simple</p></div><div class="content"><h1>Invoice ${input.invoiceNumber}</h1><p>${greeting}</p>${input.personalMessage ? `<p>${input.personalMessage}</p>` : '<p>Please find your invoice details below.</p>'}<p><strong>Amount due: ${input.amountDue}</strong><br>Due date: ${input.dueDate || 'Upon receipt'}</p><p class="button-wrap"><a href="${input.viewUrl}" class="button">View Invoice</a></p><p class="muted">A PDF copy of this invoice is attached for your records.</p></div><div class="footer"><p>Sent with InvoiceFocus.</p></div></div></body></html>`,
  };
}

export function buildVerificationEmail(link: string, fullName?: string) {
  const greeting = fullName ? `Hi ${fullName},` : 'Hi there,';
  return {
    subject: 'Verify Your InvoiceFocus Account',
    html: `<!DOCTYPE html>
<html>
<head>${brandStyles()}</head>
<body>
  <div class="container">
    <div class="header">
       <p class="brand">InvoiceFocus</p>
       <p class="tagline">Smart Invoicing for Freelancers and Businesses</p>
    </div>
    <div class="content">
       <h1>Verify Your Email Address</h1>
       <p>${greeting}</p>
       <p>Thanks for creating your InvoiceFocus account. Please verify your email address to activate your account and securely access all features.</p>
       <p class="button-wrap"><a href="${link}" class="button">Verify Email Address</a></p>
       <p class="muted">If the button doesn’t work, copy and paste this link into your browser:</p>
      <p><a href="${link}" class="link">${link}</a></p>
    </div>
    <div class="footer">
       <p>If You Didn’t Create This Account, You Can Safely Ignore This Email.</p>
    </div>
  </div>
</body>
</html>`,
  };
}

export function buildPasswordResetEmail(link: string, fullName?: string) {
  const greeting = fullName ? `Hi ${fullName},` : 'Hi there,';
  return {
    subject: 'Reset Your InvoiceFocus Password',
    html: `<!DOCTYPE html>
<html>
<head>${brandStyles()}</head>
<body>
  <div class="container">
    <div class="header">
       <p class="brand">InvoiceFocus</p>
       <p class="tagline">Smart Invoicing for Freelancers and Businesses</p>
    </div>
    <div class="content">
       <h1>Reset Your Password</h1>
       <p>${greeting}</p>
      <p>We received a request to reset the password for your InvoiceFocus account.</p>
       <p class="button-wrap"><a href="${link}" class="button">Reset Password</a></p>
       <p class="muted">If the button doesn’t work, copy and paste this link into your browser:</p>
      <p><a href="${link}" class="link">${link}</a></p>
       <p class="muted">This link will expire in 24 hours. If You Didn’t Request a Reset, You Can Ignore This Email.</p>
    </div>
    <div class="footer">
       <p>InvoiceFocus Account Security</p>
    </div>
  </div>
</body>
</html>`,
  };
}

export function buildWelcomeEmail(
  fullName?: string,
  dashboardBaseUrl = process.env.CLIENT_BASE_URL || 'https://invoicefocus.com',
) {
  const greeting = fullName ? `Welcome, ${fullName}!` : 'Welcome to InvoiceFocus!';
  return {
    subject: 'Welcome to InvoiceFocus',
    html: `<!DOCTYPE html>
<html>
<head>${brandStyles()}</head>
<body>
  <div class="container">
    <div class="header">
       <p class="brand">InvoiceFocus</p>
       <p class="tagline">Smart Invoicing for Freelancers and Businesses</p>
    </div>
    <div class="content">
       <h1>Welcome to InvoiceFocus!</h1>
       <p>${fullName ? `Hi ${fullName},` : greeting}</p>
       <p>Your email has been verified successfully. Your InvoiceFocus account is now ready. We're excited to help you create professional invoices faster, stay organized, and grow your business with confidence.</p>
       <p class="button-wrap"><a href="${dashboardBaseUrl}/dashboard" class="button">Go to Dashboard</a></p>
    </div>
    <div class="footer">
       <p>Thanks for Choosing InvoiceFocus.</p>
    </div>
  </div>
</body>
</html>`,
  };
}
