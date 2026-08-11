import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import assert from 'node:assert/strict';

const directory = mkdtempSync(join(tmpdir(), 'invoice-auth-email-'));
const output = join(directory, 'email.mjs');

try {
  execFileSync('pnpm', [
    'exec',
    'esbuild',
    'src/lib/email.ts',
    '--bundle',
    '--platform=node',
    '--format=esm',
    `--outfile=${output}`,
  ], {
    cwd: new URL('..', import.meta.url),
    env: { ...process.env, RESEND_API_KEY: 'test-key', FROM_EMAIL: 'hello@invoicefocus.com' },
    stdio: 'pipe',
  });

  const email = await import(`file://${output}`);
  const builders = [
    email.buildVerificationEmail('https://example.test/verify', 'Enafu'),
    email.buildPasswordResetEmail('https://example.test/reset', 'Malak Hamad'),
    email.buildWelcomeEmail('John Smith', 'https://example.test'),
    email.buildMagicLinkEmail('https://example.test/magic', 'Enafu'),
    email.buildTeamInviteEmail({
      inviteUrl: 'https://example.test/invite',
      recipientName: 'Malak Hamad',
    }),
    email.buildInvoiceEmail({
      businessName: 'Acme Studio',
      invoiceNumber: 'INV-1001',
      amountDue: '$1,250.00',
      viewUrl: 'https://example.test/invoice',
    }),
    email.buildInvoiceEmail({
      businessName: 'Acme Studio',
      invoiceNumber: 'INV-1001',
      amountDue: '$1,250.00',
      viewUrl: 'https://example.test/invoice',
      emailType: 'payment-reminder',
    }),
  ];

  for (const message of builders) {
    assert.equal((message.html.match(/src="cid:invoicefocus-logo"/g) || []).length, 1);
    assert.match(message.html, /class="brand-mark" src="cid:invoicefocus-logo" width="34" height="34"/);
    assert.match(message.html, /class="wordmark"[^>]*>Invoice Focus<\/td>/);
    assert.equal((message.html.match(/© 2026 Invoice Focus — Professional Invoicing Made Effortless/g) || []).length, 1);
    assert.match(message.html, /Support: <a href="mailto:hello@invoicefocus\.com">hello@invoicefocus\.com<\/a>/);
    assert.doesNotMatch(message.html, />https:\/\/invoicefocus\.com</);
    assert.doesNotMatch(message.html, /Hi Invoice Focus/);
    assert.doesNotMatch(message.html, /src="https?:\/\//);
  }

  assert.match(email.buildVerificationEmail('https://example.test/verify', 'Enafu').html, />Hi Enafu,</);
  assert.match(email.buildPasswordResetEmail('https://example.test/reset').html, />Hi there,</);
  assert.match(email.buildWelcomeEmail('John Smith', 'https://example.test').html, />Hi John Smith,</);
  assert.match(email.buildMagicLinkEmail('https://example.test/magic').html, />Hi there,</);
  assert.match(email.buildTeamInviteEmail({ inviteUrl: 'https://example.test/invite' }).html, />Hi there,</);

  let requestBody;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_url, init) => {
    requestBody = JSON.parse(init.body);
    return new Response(JSON.stringify({ id: 'test-email' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };
  await email.sendEmail({
    to: 'recipient@example.test',
    subject: 'Authentication email test',
    html: email.buildVerificationEmail('https://example.test/verify', 'Enafu').html,
    disableTracking: true,
  });
  globalThis.fetch = originalFetch;

  assert.equal(requestBody.attachments.length, 1);
  assert.equal(requestBody.from, 'Invoice Focus <hello@invoicefocus.com>');
  assert.equal(requestBody.attachments[0].filename, 'invoicefocus-logo-mark.png');
  assert.equal(requestBody.attachments[0].content_id, 'invoicefocus-logo');
  assert.match(requestBody.attachments[0].content, /^iVBORw0KGgo/);

  console.log('Authentication email branding checks passed.');
} finally {
  rmSync(directory, { recursive: true, force: true });
}