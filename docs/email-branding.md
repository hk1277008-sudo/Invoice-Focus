# InvoiceFocus Email Branding

## Application-owned sender branding

The repository currently has no transactional email sender implementation. Invoice
verification, welcome, and password-reset messages are sent by Supabase Auth;
invoice, payment-reminder, and future billing delivery are not currently sent by
this application. No source-level `hello` sender remains to update.

When an application-owned sender is added, it must use:

```text
InvoiceFocus <hello@invoicefocus.com>
```

The display name is the stable brand requirement. The mailbox and domain should
be changed to the production-approved sending domain when configured.

## Supabase Auth configuration

In the Supabase project:

1. Configure custom SMTP with the approved sending provider.
2. Set the sender name/display name to `InvoiceFocus`.
3. Use `InvoiceFocus` consistently in verification, invite/welcome, and password
   recovery email templates.
4. Replace the default Auth email header/avatar with the hosted
   `invoicefocus-mark.svg` asset where the template/client supports an image URL.
5. Use an absolute HTTPS URL for the production logo; local or preview URLs will
   not render for recipients.

## Resend and future application mail

When invoice, payment-reminder, or billing emails are implemented with Resend,
every send call must set the same display name:

```ts
from: 'InvoiceFocus <hello@invoicefocus.com>'
```

Keep this value centralized rather than allowing individual email types to
choose their own sender.

## Mail-client logo limitations

An HTML email logo is controlled by the email template. A logo beside the
sender in a recipient's mailbox is controlled by the recipient's provider and
usually requires a verified sending domain, aligned SPF/DKIM/DMARC, and
provider-specific brand signals such as BIMI with a VMC. The app cannot force
that avatar from frontend code.