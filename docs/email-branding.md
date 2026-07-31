# InvoiceFocus Email Branding

## Application-owned sender branding

Application-owned transactional email delivery uses the shared Resend helper.
Verification, welcome, password-reset, invoice, and payment-reminder emails all
use the centralized InvoiceFocus sender and responsive branded templates.

The application sender uses:

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

Invoice and payment-reminder emails already use the shared sender. Future
application emails must use the same display name:

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