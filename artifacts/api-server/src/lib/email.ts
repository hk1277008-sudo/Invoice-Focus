import { resend, defaultFromEmail } from './resend';

function brandStyles() {
  return `
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; color: #111827; }
      .container { max-width: 520px; margin: 40px auto; background: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden; }
      .header { background: #0A2540; padding: 32px 32px 24px; text-align: center; }
      .header h1 { margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.02em; }
      .header p { margin: 8px 0 0; color: #a3b8cc; font-size: 14px; }
      .content { padding: 32px; }
      .content p { font-size: 15px; line-height: 1.6; margin: 0 0 16px; }
      .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; }
      .button:hover { background: #1d4ed8; }
      .link { color: #2563eb; word-break: break-all; }
      .footer { padding: 24px 32px; background: #f8fafc; border-top: 1px solid #e5e7eb; text-align: center; }
      .footer p { margin: 0; font-size: 12px; color: #6b7280; }
    </style>
  `;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: SendEmailOptions) {
  const { to, subject, html } = options;
  const { data, error } = await resend.emails.send({
    from: defaultFromEmail,
    to,
    subject,
    html,
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }

  return data;
}

export function buildVerificationEmail(link: string, fullName?: string) {
  const greeting = fullName ? `Hi ${fullName},` : 'Hi there,';
  return {
    subject: 'Verify your InvoiceFocus account',
    html: `<!DOCTYPE html>
<html>
<head>${brandStyles()}</head>
<body>
  <div class="container">
    <div class="header">
      <h1>InvoiceFocus</h1>
      <p>Smart invoicing for freelancers and studios</p>
    </div>
    <div class="content">
      <p>${greeting}</p>
      <p>Thanks for signing up. Please confirm your email address to activate your account.</p>
      <p><a href="${link}" class="button">Verify Email Address</a></p>
      <p style="font-size: 13px; color: #6b7280;">If the button doesn’t work, copy and paste this link into your browser:</p>
      <p><a href="${link}" class="link">${link}</a></p>
    </div>
    <div class="footer">
      <p>If you didn’t create this account, you can safely ignore this email.</p>
    </div>
  </div>
</body>
</html>`,
  };
}

export function buildPasswordResetEmail(link: string, fullName?: string) {
  const greeting = fullName ? `Hi ${fullName},` : 'Hi there,';
  return {
    subject: 'Reset your InvoiceFocus password',
    html: `<!DOCTYPE html>
<html>
<head>${brandStyles()}</head>
<body>
  <div class="container">
    <div class="header">
      <h1>InvoiceFocus</h1>
      <p>Smart invoicing for freelancers and studios</p>
    </div>
    <div class="content">
      <p>${greeting}</p>
      <p>We received a request to reset the password for your InvoiceFocus account.</p>
      <p><a href="${link}" class="button">Reset Password</a></p>
      <p style="font-size: 13px; color: #6b7280;">If the button doesn’t work, copy and paste this link into your browser:</p>
      <p><a href="${link}" class="link">${link}</a></p>
      <p style="font-size: 13px; color: #6b7280;">This link will expire in 24 hours. If you didn’t request a reset, you can ignore this email.</p>
    </div>
    <div class="footer">
      <p>InvoiceFocus account security</p>
    </div>
  </div>
</body>
</html>`,
  };
}

export function buildWelcomeEmail(fullName?: string) {
  const greeting = fullName ? `Welcome, ${fullName}!` : 'Welcome!';
  return {
    subject: 'Welcome to InvoiceFocus',
    html: `<!DOCTYPE html>
<html>
<head>${brandStyles()}</head>
<body>
  <div class="container">
    <div class="header">
      <h1>InvoiceFocus</h1>
      <p>Smart invoicing for freelancers and studios</p>
    </div>
    <div class="content">
      <p>${greeting}</p>
      <p>Your email is verified and your account is ready. You can now create your first invoice, save drafts, and manage clients from your dashboard.</p>
      <p><a href="${process.env.CLIENT_BASE_URL || 'https://invoicefocus.com'}/dashboard" class="button">Go to Dashboard</a></p>
    </div>
    <div class="footer">
      <p>Thanks for choosing InvoiceFocus.</p>
    </div>
  </div>
</body>
</html>`,
  };
}
