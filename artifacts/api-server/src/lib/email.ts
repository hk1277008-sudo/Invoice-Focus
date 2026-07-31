import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resend, defaultFromEmail, resendApiKey } from './resend';

const brandLogoCid = 'invoicefocus-logo';
const supportEmail = 'hello@invoicefocus.com';

function loadProductionLogo() {
  const candidates = [
    fileURLToPath(new URL('../../invoice-focus/public/invoicefocus-logo.png', import.meta.url)),
    resolve(process.cwd(), 'artifacts/invoice-focus/public/invoicefocus-logo.png'),
    resolve(process.cwd(), '../invoice-focus/public/invoicefocus-logo.png'),
  ];
  const path = candidates.find((candidate) => existsSync(candidate));
  if (!path) throw new Error('The canonical InvoiceFocus production logo is unavailable.');
  return readFileSync(path).toString('base64');
}

const productionLogoAttachment = {
  filename: 'invoicefocus-logo.png',
  content: loadProductionLogo(),
  contentId: brandLogoCid,
};

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function authGreeting(fullName?: string) {
  const displayName = fullName?.trim();
  return displayName ? `Hi ${escapeHtml(displayName)},` : 'Hi there,';
}

function emailDocument(preheader: string, content: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>InvoiceFocus</title>
  <style>
    body { margin: 0; padding: 0; width: 100% !important; background: #f5f7fb; color: #172033; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
    table { border-spacing: 0; border-collapse: collapse; }
    img { border: 0; display: block; max-width: 100%; }
    a { color: #2f5be7; }
    .preheader { display: none !important; visibility: hidden; opacity: 0; color: transparent; height: 0; width: 0; overflow: hidden; }
    .shell { width: 100%; background: #f5f7fb; }
    .container { width: 100%; max-width: 600px; margin: 0 auto; }
     .topbar { padding: 36px 24px 26px; text-align: center; }
     .brand-header { width: 100%; }
     .logo { width: 64px; height: 64px; border-radius: 14px; margin: 0 auto 14px; }
     .wordmark { color: #172033; font-size: 18px; font-weight: 750; letter-spacing: -0.035em; line-height: 22px; white-space: nowrap; }
     .wordmark-focus { color: #2454D6; }
    .card { background: #ffffff; border: 1px solid #e3e8f1; border-radius: 16px; box-shadow: 0 8px 28px rgba(23, 32, 51, 0.06); }
    .hero { padding: 36px 40px 12px; }
     .hero-mark { width: 64px; height: 64px; margin-bottom: 24px; border-radius: 16px; }
    .eyebrow { margin: 0 0 12px; color: #315de8; font-size: 11px; font-weight: 750; letter-spacing: 0.12em; line-height: 1.4; text-transform: uppercase; }
    h1 { margin: 0; color: #172033; font-size: 30px; font-weight: 750; letter-spacing: -0.04em; line-height: 1.15; }
    .body { padding: 12px 40px 40px; }
    p { margin: 0 0 18px; color: #4f5d73; font-size: 15px; line-height: 1.65; }
    .greeting { color: #172033; font-weight: 650; }
    .cta-wrap { padding: 8px 0 12px; }
    .button { display: inline-block; padding: 13px 22px; border-radius: 9px; background: #315de8; color: #ffffff !important; font-size: 14px; font-weight: 700; line-height: 1.2; text-decoration: none; }
    .button-secondary { margin-left: 8px; background: #eef2ff; color: #294ecb !important; }
    .detail-card { margin: 22px 0 24px; padding: 20px; border: 1px solid #e3e8f1; border-radius: 12px; background: #f8faff; }
    .detail-label { margin: 0 0 6px; color: #718096; font-size: 11px; font-weight: 750; letter-spacing: 0.08em; text-transform: uppercase; }
    .detail-value { margin: 0; color: #172033; font-size: 20px; font-weight: 750; line-height: 1.3; }
    .detail-secondary { margin: 5px 0 0; color: #617087; font-size: 13px; line-height: 1.5; }
    .fallback { margin-top: 24px; padding-top: 18px; border-top: 1px solid #e8ecf3; }
    .fallback p { margin-bottom: 8px; color: #718096; font-size: 12px; }
    .fallback a { color: #315de8; font-size: 12px; line-height: 1.55; overflow-wrap: anywhere; }
    .security-note { margin-top: 24px; padding: 14px 16px; border-radius: 9px; background: #f5f7fb; color: #68768b; font-size: 12px; line-height: 1.55; }
    .footer { padding: 24px 24px 32px; text-align: center; }
     .footer p { margin: 0 0 7px; color: #8793a5; font-size: 12px; line-height: 1.5; }
     .footer .copyright { white-space: nowrap; }
    .footer a { color: #617087; text-decoration: underline; }
    @media screen and (max-width: 620px) {
       .topbar { padding: 28px 16px 20px; }
      .hero { padding: 28px 24px 10px; }
      .body { padding: 10px 24px 28px; }
      h1 { font-size: 26px; }
      .button { display: block; text-align: center; }
      .button-secondary { margin: 10px 0 0; }
       .footer { padding: 20px 16px 26px; }
       .footer .copyright { white-space: normal; }
    }
  </style>
</head>
<body>
  <div class="preheader">${escapeHtml(preheader)}</div>
  <table role="presentation" class="shell" width="100%">
    <tr><td align="center">
      <table role="presentation" class="container" width="100%">
         <tr><td class="topbar">
           <table role="presentation" class="brand-header" width="100%">
             <tr>
                <td align="center" valign="middle">
                  <img class="logo" src="cid:${brandLogoCid}" width="64" height="64" alt="InvoiceFocus logo" style="display:block;width:64px;height:64px;border:0;border-radius:14px;margin:0 auto 14px">
                  <div class="wordmark">Invoice<span class="wordmark-focus">Focus</span></div>
                </td>
             </tr>
           </table>
        </td></tr>
        <tr><td class="card">${content}</td></tr>
        <tr><td class="footer">
            <p>Support: <a href="mailto:${supportEmail}">${supportEmail}</a></p>
            <p class="copyright">© 2026 Invoice Focus — Professional Invoicing Made Effortless</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function hero(eyebrow: string, title: string) {
  return `<div class="hero"><p class="eyebrow">${escapeHtml(eyebrow)}</p><h1>${escapeHtml(title)}</h1></div>`;
}

function button(url: string, label: string, secondary = false) {
  return `<a class="button${secondary ? ' button-secondary' : ''}" href="${escapeHtml(url)}">${escapeHtml(label)}</a>`;
}

function fallbackLink(url: string) {
  return `<div class="fallback"><p>If the button doesn’t work, <a href="${escapeHtml(url)}">open the secure link in your browser</a>.</p></div>`;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{ filename: string; content: string; contentId?: string }>;
  disableTracking?: boolean;
}

export async function sendEmail(options: SendEmailOptions) {
  const { to, subject, html, attachments, disableTracking } = options;
  const emailAttachments = [...(attachments || []), productionLogoAttachment];
  if (disableTracking) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: defaultFromEmail,
        to,
        subject,
        html,
        attachments: emailAttachments.map(({ contentId, ...attachment }) => ({
          ...attachment,
          ...(contentId ? { content_id: contentId } : {}),
        })),
        click_tracking: false,
        open_tracking: false,
      }),
    });
    const body = await response.json().catch(() => null) as { id?: string; message?: string };
    if (!response.ok) {
      throw new Error(`Failed to send email: ${body?.message || response.statusText}`);
    }
    return body;
  }
  const { data, error } = await resend.emails.send({
    from: defaultFromEmail,
    to,
    subject,
    html,
    attachments: emailAttachments,
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
  downloadUrl?: string;
  emailType?: 'invoice' | 'payment-reminder';
}) {
  const invoiceNumber = escapeHtml(input.invoiceNumber);
  const businessName = escapeHtml(input.businessName || 'InvoiceFocus');
  const greeting = input.recipientName ? `Hi ${escapeHtml(input.recipientName)},` : 'Hello,';
  const isReminder = input.emailType === 'payment-reminder';
  const dueDate = escapeHtml(input.dueDate || 'Upon receipt');
  const customLogo = input.logo ? `<img src="${escapeHtml(input.logo)}" alt="${businessName}" style="max-height:42px;max-width:150px;margin:0 auto 18px">` : '';
  const personalMessage = input.personalMessage ? `<p>${escapeHtml(input.personalMessage)}</p>` : '<p>Your invoice is ready to review. You can view it online or download a PDF copy for your records.</p>';
  const actions = `${button(input.viewUrl, 'View Invoice')}${input.downloadUrl ? button(input.downloadUrl, 'Download PDF', true) : ''}`;
  const content = `${hero(isReminder ? 'Payment reminder' : 'Invoice ready', isReminder ? 'A friendly payment reminder' : 'Your invoice is ready')}<div class="body"><p class="greeting">${greeting}</p><p>${isReminder ? `${businessName} sent you a reminder about an outstanding invoice through InvoiceFocus.` : `${businessName} has sent you an invoice through InvoiceFocus.`}</p>${customLogo}<div class="detail-card"><p class="detail-label">Amount due</p><p class="detail-value">${escapeHtml(input.amountDue)}</p><p class="detail-secondary">Due ${dueDate}</p></div>${personalMessage}<div class="cta-wrap">${actions}</div><p class="security-note">If you have already paid this invoice, you can disregard this reminder. If you weren’t expecting this message, you can safely ignore it.</p></div>`;
  return {
    subject: isReminder ? 'Payment Reminder – InvoiceFocus' : `Your Invoice ${input.invoiceNumber} Is Ready – InvoiceFocus`,
    html: emailDocument(isReminder ? 'A friendly reminder that your invoice is approaching its due date.' : `Your invoice ${invoiceNumber} is ready to review or download.`, content),
  };
}

export function buildVerificationEmail(link: string, fullName?: string) {
  const content = `${hero('Account setup', 'Verify your email address')}<div class="body"><p class="greeting">${authGreeting(fullName)}</p><p>Thanks for creating your InvoiceFocus account. Confirm your email address to finish setup and start creating professional invoices.</p><div class="cta-wrap">${button(link, 'Verify Email Address')}</div>${fallbackLink(link)}<p class="security-note">For your security, this verification link is intended only for you. If you didn’t create an InvoiceFocus account, no action is needed.</p></div>`;
  return {
    subject: 'Verify Your Email Address – InvoiceFocus',
    html: emailDocument('Complete your account setup and start creating professional invoices.', content),
  };
}

export function buildPasswordResetEmail(link: string, fullName?: string) {
  const content = `${hero('Account security', 'Reset your password')}<div class="body"><p class="greeting">${authGreeting(fullName)}</p><p>We received a request to reset your InvoiceFocus password. Use the secure link below to choose a new one.</p><div class="cta-wrap">${button(link, 'Reset Password')}</div>${fallbackLink(link)}<p class="security-note">This link expires in 24 hours. If you didn’t request a password reset, you can safely ignore this email.</p></div>`;
  return {
    subject: 'Reset Your InvoiceFocus Password',
    html: emailDocument('Use the secure link below to reset your password.', content),
  };
}

export function buildWelcomeEmail(
  fullName?: string,
  dashboardBaseUrl = process.env.CLIENT_BASE_URL || 'https://invoicefocus.com',
) {
  const content = `${hero('Welcome to InvoiceFocus', 'Your account is ready')}<div class="body"><p class="greeting">${authGreeting(fullName)}</p><p>Your workspace is ready. Create polished invoices, share them with confidence, and spend less time on billing administration.</p><div class="cta-wrap">${button(`${dashboardBaseUrl}/dashboard`, 'Go to Dashboard')}</div><p class="security-note">You’re receiving this because your InvoiceFocus account was successfully verified.</p></div>`;
  return {
    subject: 'Welcome to InvoiceFocus',
    html: emailDocument('Your account is ready. Start creating invoices in minutes.', content),
  };
}

export function buildMagicLinkEmail(link: string, fullName?: string) {
  const content = `${hero('Secure sign in', 'Sign in to InvoiceFocus')}<div class="body"><p class="greeting">${authGreeting(fullName)}</p><p>Use the secure link below to sign in to your InvoiceFocus account.</p><div class="cta-wrap">${button(link, 'Sign In Securely')}</div>${fallbackLink(link)}<p class="security-note">This sign-in link expires soon and can only be used once. If you didn’t request it, you can safely ignore this email.</p></div>`;
  return {
    subject: 'Your InvoiceFocus Sign-In Link',
    html: emailDocument('Use the secure link below to sign in to InvoiceFocus.', content),
  };
}

export function buildTeamInviteEmail(input: {
  inviteUrl: string;
  inviterName?: string;
  workspaceName?: string;
  recipientName?: string;
}) {
  const inviter = input.inviterName ? escapeHtml(input.inviterName) : 'A teammate';
  const workspace = input.workspaceName ? escapeHtml(input.workspaceName) : 'an InvoiceFocus workspace';
  const content = `${hero('Team invitation', 'You’re invited to InvoiceFocus')}<div class="body"><p class="greeting">${authGreeting(input.recipientName)}</p><p>${inviter} invited you to join ${workspace} on InvoiceFocus.</p><div class="cta-wrap">${button(input.inviteUrl, 'Accept Invitation')}</div>${fallbackLink(input.inviteUrl)}<p class="security-note">If you weren’t expecting this invitation, you can safely ignore this email.</p></div>`;
  return {
    subject: `${inviter} invited you to InvoiceFocus`,
    html: emailDocument('You have been invited to collaborate in InvoiceFocus.', content),
  };
}