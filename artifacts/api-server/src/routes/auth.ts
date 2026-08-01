import { Router, type IRouter, type Request, type Response } from "express";
import multer from "multer";
import { supabaseAdmin } from "../lib/supabase";
import {
  sendEmail,
  buildVerificationEmail,
  buildPasswordResetEmail,
  buildWelcomeEmail,
} from "../lib/email";
import { uploadAvatar } from "../lib/storage";
import { z } from "zod";

const router: IRouter = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
});
const authRequestCounts = new Map<string, { count: number; resetAt: number }>();
const AUTH_WINDOW_MS = 60_000;
const AUTH_MAX_REQUESTS = 12;

function rateLimitAuth(req: Request, res: Response, next: () => void) {
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const current = authRequestCounts.get(key);
  if (!current || current.resetAt <= now) {
    authRequestCounts.set(key, { count: 1, resetAt: now + AUTH_WINDOW_MS });
    next();
    return;
  }
  current.count += 1;
  if (current.count > AUTH_MAX_REQUESTS) {
    res.setHeader('Retry-After', Math.ceil((current.resetAt - now) / 1000));
    res.status(429).json({ error: 'Too many requests. Please try again shortly.' });
    return;
  }
  next();
}

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
  fullName: z.string().optional(),
});

function normalizeBaseUrl(value: string | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    url.hash = "";
    url.search = "";
    url.pathname = url.pathname.replace(/\/+$/, "") || "/";
    return url.toString();
  } catch {
    return null;
  }
}

const configuredClientBaseUrl = normalizeBaseUrl(process.env.CLIENT_BASE_URL);
function isAuthClientError(
  error: unknown,
): { status: number; message: string } | null {
  if (!(error instanceof Error)) return null;
  const message = error.message.toLowerCase();
  if (
    message.includes("already been registered") ||
    message.includes("user already registered")
  ) {
    return {
      status: 400,
      message: "A user with this email address has already been registered",
    };
  }
  if (message.includes("invalid login credentials")) {
    return { status: 400, message: "Invalid email or password" };
  }
  if (message.includes("user not found")) {
    return { status: 400, message: "No account found with this email address" };
  }
  return null;
}

function handleAuthError(error: unknown, res: Response, defaultStatus = 500) {
  const clientError = isAuthClientError(error);
  if (clientError) {
    res.status(clientError.status).json({ error: clientError.message });
    return;
  }
  res.status(defaultStatus).json({ error: "Unable to complete this request right now." });
}

async function requireUser(req: Request, res: Response) {
  const header = req.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: "Authentication required" });
    return null;
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    res.status(401).json({ error: "Invalid or expired session" });
    return null;
  }

  return data.user;
}

function getRequestBaseUrl(req: Request) {
  if (!configuredClientBaseUrl) {
    throw new Error("CLIENT_BASE_URL is not configured");
  }
  return configuredClientBaseUrl;
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

function getDisplayName(user: { user_metadata?: Record<string, unknown> }) {
  const metadata = user.user_metadata || {};
  for (const value of [metadata.full_name, metadata.display_name, metadata.name]) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

router.post("/auth/signup", rateLimitAuth, async (req, res) => {
  const parse = signupSchema.safeParse(req.body);
  if (!parse.success) {
    res
      .status(400)
      .json({ error: "Invalid signup data", details: parse.error.flatten() });
    return;
  }

  const { email, password, fullName } = parse.data;

  try {
    const { data: userData, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: false,
        user_metadata: { full_name: fullName },
      });

    if (createError) {
      throw createError;
    }

    const { data: linkData, error: linkError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "signup",
        email,
        password,
        options: { redirectTo: buildCallbackUrl(req, "/verify-email", {}) },
      });

    if (linkError) {
      throw linkError;
    }

    const { properties } = linkData;
    const confirmationUrl = buildCallbackUrl(req, "/verify-email", {
      token: properties.hashed_token,
      type: "email",
      email,
    });

    await sendEmail({
      to: email,
      ...buildVerificationEmail(confirmationUrl, fullName),
      disableTracking: true,
    });

    res.status(201).json({
      message:
        "Account created. Please check your email to verify your account.",
      userId: userData.user.id,
    });
  } catch (error) {
    handleAuthError(error, res, 500);
  }
});

router.post("/auth/resend-verification", rateLimitAuth, async (req, res) => {
  const parse = resendVerificationSchema.safeParse(req.body);
  if (!parse.success) {
    res
      .status(400)
      .json({ error: "Invalid data", details: parse.error.flatten() });
    return;
  }

  const { email, password } = parse.data;

  try {
    // Retrieve user metadata to include the full name in the email if available.
    const { data: usersData, error: listError } =
      await supabaseAdmin.auth.admin.listUsers();
    if (listError) throw listError;

    const user = usersData.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase(),
    );
    const fullName = user ? getDisplayName(user) : undefined;

    const { data: linkData, error: linkError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "signup",
        email,
        password,
        options: { redirectTo: buildCallbackUrl(req, "/verify-email", {}) },
      });

    if (linkError) {
      throw linkError;
    }

    const { properties } = linkData;
    const confirmationUrl = buildCallbackUrl(req, "/verify-email", {
      token: properties.hashed_token,
      type: "email",
      email,
    });

    await sendEmail({
      to: email,
      ...buildVerificationEmail(confirmationUrl, fullName),
      disableTracking: true,
    });

    res.json({ message: "Verification email sent. Please check your inbox." });
  } catch (error) {
    handleAuthError(error, res, 500);
  }
});

router.post("/auth/forgot-password", rateLimitAuth, async (req, res) => {
  const parse = emailSchema.safeParse(req.body);
  if (!parse.success) {
    res
      .status(400)
      .json({ error: "Invalid email", details: parse.error.flatten() });
    return;
  }

  const { email } = parse.data;

  try {
    const { data: usersData, error: listError } =
      await supabaseAdmin.auth.admin.listUsers();
    if (listError) throw listError;

    const user = usersData.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase(),
    );

    if (!user) {
      // Don’t reveal whether an email is registered.
      res.json({
        message: "If an account exists, a password reset email has been sent.",
      });
      return;
    }

    const fullName = getDisplayName(user);

    const { data: linkData, error: linkError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "recovery",
        email,
        options: { redirectTo: buildCallbackUrl(req, "/reset-password", {}) },
      });

    if (linkError) {
      throw linkError;
    }

    const { properties } = linkData;
    const resetUrl = buildCallbackUrl(req, "/reset-password", {
      token: properties.hashed_token,
      type: "recovery",
      email,
    });

    await sendEmail({
      to: email,
      ...buildPasswordResetEmail(resetUrl, fullName),
      disableTracking: true,
    });

    res.json({
      message: "If an account exists, a password reset email has been sent.",
    });
  } catch (error) {
    handleAuthError(error, res, 500);
  }
});

router.post("/auth/welcome", async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;

  const parse = welcomeSchema.safeParse(req.body);
  if (!parse.success) {
    res
      .status(400)
      .json({ error: "Invalid data", details: parse.error.flatten() });
    return;
  }

  const email = user.email;
  if (!email) {
    res.status(400).json({ error: "Authenticated user email is required" });
    return;
  }

  try {
    await sendEmail({
      to: email,
      ...buildWelcomeEmail(
        getDisplayName(user),
        getRequestBaseUrl(req),
      ),
      disableTracking: true,
    });

    res.json({ message: "Welcome email sent." });
  } catch (error) {
    handleAuthError(error, res, 500);
  }
});

router.post("/auth/avatar", upload.single("avatar"), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    const token = req.get("authorization")?.startsWith("Bearer ")
      ? req.get("authorization")!.slice(7)
      : null;
    if (!token) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const { data: authData, error: authError } =
      await supabaseAdmin.auth.getUser(token);
    if (authError || !authData.user) {
      res.status(401).json({ error: "Invalid or expired session" });
      return;
    }

    const userId = authData.user.id;
    const { url } = await uploadAvatar(userId, req.file);
    res.json({ url });
  } catch (error) {
    res.status(500).json({ error: "Unable to upload avatar right now." });
  }
});

export default router;
