import { Router, type IRouter, type Request, type Response } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabase';
import { uploadFeedbackScreenshot } from '../lib/storage';
import { browserFromUserAgent, deviceFromUserAgent } from '../lib/feedback-metadata';

const router: IRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const feedbackSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5).optional(),
  category: z.enum(['bug', 'feature_request', 'general_feedback', 'improvement']).optional(),
  message: z.string().trim().min(1).max(10000),
  email: z.string().trim().email().or(z.literal('')).optional(),
  screenshotUrl: z.string().url().or(z.literal('')).optional(),
  metadata: z.object({
    browser: z.string().trim().max(240).optional(),
    device: z.string().trim().max(120).optional(),
    screenSize: z.string().trim().max(40).optional(),
    currentPage: z.string().trim().max(500).optional(),
    appVersion: z.string().trim().max(80).optional(),
  }).optional(),
});

function token(req: Request) {
  const value = req.get('authorization');
  return value?.startsWith('Bearer ') ? value.slice(7) : null;
}

async function requireUser(req: Request, res: Response) {
  const value = token(req);
  if (!value) { res.status(401).json({ error: 'Authentication required' }); return null; }
  const { data, error } = await supabaseAdmin.auth.getUser(value);
  if (error || !data.user) { res.status(401).json({ error: 'Invalid or expired session' }); return null; }
  return data.user;
}

function displayName(user: { user_metadata?: Record<string, unknown> }) {
  const metadata = user.user_metadata || {};
  for (const value of [metadata.full_name, metadata.display_name, metadata.name]) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

router.post('/feedback/screenshot', upload.single('screenshot'), async (req, res) => {
  const user = await requireUser(req, res); if (!user) return;
  if (!req.file) { res.status(400).json({ error: 'No screenshot uploaded' }); return; }
  try {
    const result = await uploadFeedbackScreenshot(user.id, req.file);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Could not upload screenshot' });
  }
});

router.post('/feedback', async (req, res) => {
  const user = await requireUser(req, res); if (!user) return;
  const parsed = feedbackSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Please check your feedback', details: parsed.error.flatten() }); return; }
  const input = parsed.data;
  const userAgent = req.get('user-agent') || '';
  const metadata = input.metadata || {};
  const { data, error } = await supabaseAdmin.from('feedback').insert({
    user_id: user.id,
    name: displayName(user),
    email: input.email || user.email || '',
    rating: input.rating ?? null,
    category: input.category ?? null,
    message: input.message,
    screenshot_url: input.screenshotUrl || '',
    browser: metadata.browser || browserFromUserAgent(userAgent),
    device: metadata.device || deviceFromUserAgent(userAgent),
    screen_size: metadata.screenSize || '',
    current_page: metadata.currentPage || '',
    app_version: metadata.appVersion || process.env.APP_VERSION || 'private-beta',
  }).select('id, created_at').single();
  if (error) { res.status(500).json({ error: 'Could not save feedback', details: error.message }); return; }
  res.status(201).json({ feedback: data });
});

export default router;