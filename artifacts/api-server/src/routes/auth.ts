import { Router, type IRouter, type Request, type Response } from 'express';
import multer from 'multer';
import { supabaseAdmin } from '../lib/supabase';
import { sendEmail, buildVerificationEmail, buildPasswordResetEmail, buildWelcomeEmail } from '../lib/email';
import { uploadAvatar } from '../lib/storage';
import { z } from 'zod';

const router: IRouter = Router();
const upload = multer({ storage: multer.memoryStorage() });

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(1).max(120),
});

const emailSchema = z.object({
  email: z.string().email(),
});

const resendVerificationSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const welcomeSchema = z.object({
  email: z.string().email(),
  fullName: z.string().optional(),
});

const clientBaseUrl = process.env.CLIENT_BASE_URL || 'https://invoicefocus.com';

function isAuthClientError(error: unknown): { status: number; message: string } | null {
  if (!(error instanceof Error)) return null;
  const message = error.message.toLowerCase();
  if (message.includes('already been registered') || message.includes('user already registered')) {
    return { status: 400, message: 'A user with this email address has already been registered' };
  }
  if (message.includes('invalid login credentials')) {
    return { status: 400, message: 'Invalid email or password' };
  }
  if (message.includes('user not found')) {
    return { status: 400, message: 'No account found with this email address' };
  }
  return null;
}

function handleAuthError(error: unknown, res: Response, defaultStatus = 500) {
  const clientError = isAuthClientError(error);
  if (clientError) {
    res.status(clientError.status).json({ error: clientError.message });
    return;
  }
  const message = error instanceof Error ? error.message : 'An unexpected error occurred';
  res.status(defaultStatus).json({ error: message });
}

function getRequestBaseUrl(req: Request) {
  const forwardedProto = req.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const forwardedHost = req.get('x-forwarded-host')?.split(',')[0]?.trim();

  if (forwardedHost) {
    return `${forwardedProto || req.protocol}://${forwardedHost}`;
  }

  return clientBaseUrl;
}

function buildCallbackUrl(
  req: Request,
  path: string,
  params: Record<string, string>,
) {
  const url = new URL(path, getRequestBaseUrl(req));
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

router.post('/auth/signup', async (req, res) => {
  const parse = signupSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: 'Invalid signup data', details: parse.error.flatten() });
    return;
  }

  const { email, password, fullName } = parse.data;

  try {
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: { full_name: fullName },
    });

    if (createError) {
      throw createError;
    }

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email,
      password,
      options: { redirectTo: buildCallbackUrl(req, '/verify-email', {}) },
    });

    if (linkError) {
      throw linkError;
    }

    const { properties } = linkData;
    const confirmationUrl = buildCallbackUrl(req, '/verify-email', {
      token: properties.hashed_token,
      type: 'email',
      email,
    });

    await sendEmail({
      to: email,
      ...buildVerificationEmail(confirmationUrl, fullName),
    });

    res.status(201).json({
      message: 'Account created. Please check your email to verify your account.',
      userId: userData.user.id,
    });
  } catch (error) {
    handleAuthError(error, res, 500);
  }
});

router.post('/auth/resend-verification', async (req, res) => {
  const parse = resendVerificationSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: 'Invalid data', details: parse.error.flatten() });
    return;
  }

  const { email, password } = parse.data;

  try {
    // Retrieve user metadata to include the full name in the email if available.
    const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) throw listError;

    const user = usersData.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    const fullName = user?.user_metadata?.full_name as string | undefined;

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email,
      password,
      options: { redirectTo: buildCallbackUrl(req, '/verify-email', {}) },
    });

    if (linkError) {
      throw linkError;
    }

    const { properties } = linkData;
    const confirmationUrl = buildCallbackUrl(req, '/verify-email', {
      token: properties.hashed_token,
      type: 'email',
      email,
    });

    await sendEmail({
      to: email,
      ...buildVerificationEmail(confirmationUrl, fullName),
    });

    res.json({ message: 'Verification email sent. Please check your inbox.' });
  } catch (error) {
    handleAuthError(error, res, 500);
  }
});

router.post('/auth/forgot-password', async (req, res) => {
  const parse = emailSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: 'Invalid email', details: parse.error.flatten() });
    return;
  }

  const { email } = parse.data;

  try {
    const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) throw listError;

    const user = usersData.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

    if (!user) {
      // Don’t reveal whether an email is registered.
      res.json({ message: 'If an account exists, a password reset email has been sent.' });
      return;
    }

    const fullName = user.user_metadata?.full_name as string | undefined;

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo: buildCallbackUrl(req, '/reset-password', {}) },
    });

    if (linkError) {
      throw linkError;
    }

    const { properties } = linkData;
    const resetUrl = buildCallbackUrl(req, '/reset-password', {
      token: properties.hashed_token,
      type: 'recovery',
      email,
    });

    await sendEmail({
      to: email,
      ...buildPasswordResetEmail(resetUrl, fullName),
    });

    res.json({ message: 'If an account exists, a password reset email has been sent.' });
  } catch (error) {
    handleAuthError(error, res, 500);
  }
});

router.post('/auth/welcome', async (req, res) => {
  const parse = welcomeSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: 'Invalid data', details: parse.error.flatten() });
    return;
  }

  const { email, fullName } = parse.data;

  try {
    await sendEmail({
      to: email,
      ...buildWelcomeEmail(fullName, getRequestBaseUrl(req)),
    });

    res.json({ message: 'Welcome email sent.' });
  } catch (error) {
    handleAuthError(error, res, 500);
  }
});

router.post('/auth/avatar', upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const userId = req.body.userId;
    if (!userId || typeof userId !== 'string') {
      res.status(400).json({ error: 'userId is required' });
      return;
    }

    const { url } = await uploadAvatar(userId, req.file);
    res.json({ url });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to upload avatar';
    res.status(500).json({ error: message });
  }
});

export default router;
