import { createHash, randomBytes } from 'node:crypto';
import { Router, type IRouter, type Request, type Response } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabase';

const router: IRouter = Router();
const uuid = z.string().uuid();
const tokenPattern = /^[A-Za-z0-9_-]{43}$/;
const expirySchema = z.object({ expiresAt: z.string().datetime().nullable().optional() });
const requestCounts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 60;

function tokenHash(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function newToken() {
  return randomBytes(32).toString('base64url');
}

function authToken(req: Request) {
  const header = req.get('authorization');
  return header?.startsWith('Bearer ') ? header.slice(7) : null;
}

async function requireUser(req: Request, res: Response) {
  const token = authToken(req);
  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return null;
  }
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    res.status(401).json({ error: 'Invalid or expired session' });
    return null;
  }
  return data.user;
}

function rateLimit(req: Request, res: Response) {
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const current = requestCounts.get(key);
  if (!current || current.resetAt <= now) {
    requestCounts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  current.count += 1;
  if (current.count > MAX_REQUESTS) {
    res.setHeader('Retry-After', Math.ceil((current.resetAt - now) / 1000));
    res.status(429).json({ error: 'Too many requests. Please try again shortly.' });
    return false;
  }
  return true;
}

function publicToken(row: Record<string, unknown>) {
  return {
    id: row.id,
    enabled: row.enabled,
    expiresAt: row.expires_at,
    revokedAt: row.revoked_at,
    createdAt: row.created_at,
    lastAccessedAt: row.last_accessed_at,
    accessCount: row.access_count,
  };
}

function validExpiry(value: string | null | undefined) {
  if (value === null || value === undefined) return true;
  const time = new Date(value).getTime();
  return Number.isFinite(time) && time > Date.now();
}

async function ownedInvoice(userId: string, id: string) {
  if (!uuid.safeParse(id).success) return null;
  const result = await supabaseAdmin.from('invoices').select('id,invoice_number,user_id').eq('id', id).eq('user_id', userId).maybeSingle();
  if (result.error) throw result.error;
  return result.data;
}

router.get('/invoices/:id/share-tokens', async (req, res) => {
  const user = await requireUser(req, res); if (!user) return;
  try {
    if (!await ownedInvoice(user.id, req.params.id)) { res.status(404).json({ error: 'Invoice not found' }); return; }
    const { data, error } = await supabaseAdmin.from('invoice_share_tokens').select('*').eq('invoice_id', req.params.id).eq('user_id', user.id).order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ shareTokens: (data ?? []).map(publicToken) });
  } catch { res.status(500).json({ error: 'Failed to load invoice share links' }); }
});

router.post('/invoices/:id/share-tokens', async (req, res) => {
  const user = await requireUser(req, res); if (!user) return;
  const parsed = expirySchema.safeParse(req.body ?? {});
  if (!parsed.success) { res.status(400).json({ error: 'Invalid expiration date' }); return; }
  if (!validExpiry(parsed.data.expiresAt)) { res.status(400).json({ error: 'Expiration must be in the future' }); return; }
  try {
    if (!await ownedInvoice(user.id, req.params.id)) { res.status(404).json({ error: 'Invoice not found' }); return; }
    const raw = newToken();
    const { data, error } = await supabaseAdmin.from('invoice_share_tokens').insert({
      invoice_id: req.params.id,
      user_id: user.id,
      token_hash: tokenHash(raw),
      expires_at: parsed.data.expiresAt ?? null,
    }).select('*').single();
    if (error) throw error;
    res.status(201).json({ shareToken: publicToken(data), token: raw });
  } catch { res.status(500).json({ error: 'Could not create invoice share link' }); }
});

router.post('/invoices/:id/share-tokens/regenerate', async (req, res) => {
  const user = await requireUser(req, res); if (!user) return;
  const parsed = expirySchema.safeParse(req.body ?? {});
  if (!parsed.success) { res.status(400).json({ error: 'Invalid expiration date' }); return; }
  if (!validExpiry(parsed.data.expiresAt)) { res.status(400).json({ error: 'Expiration must be in the future' }); return; }
  try {
    if (!await ownedInvoice(user.id, req.params.id)) { res.status(404).json({ error: 'Invoice not found' }); return; }
    await supabaseAdmin.from('invoice_share_tokens').update({ revoked_at: new Date().toISOString(), enabled: false }).eq('invoice_id', req.params.id).eq('user_id', user.id).is('revoked_at', null);
    const raw = newToken();
    const { data, error } = await supabaseAdmin.from('invoice_share_tokens').insert({
      invoice_id: req.params.id, user_id: user.id, token_hash: tokenHash(raw), expires_at: parsed.data.expiresAt ?? null,
    }).select('*').single();
    if (error) throw error;
    res.status(201).json({ shareToken: publicToken(data), token: raw });
  } catch { res.status(500).json({ error: 'Could not regenerate invoice share link' }); }
});

router.patch('/invoices/:id/share-tokens/:tokenId', async (req, res) => {
  const user = await requireUser(req, res); if (!user) return;
  const body = z.object({ enabled: z.boolean().optional(), expiresAt: z.string().datetime().nullable().optional(), revoked: z.boolean().optional() }).safeParse(req.body);
  if (!body.success || !uuid.safeParse(req.params.tokenId).success) { res.status(400).json({ error: 'Invalid share link update' }); return; }
  if (!validExpiry(body.data.expiresAt)) { res.status(400).json({ error: 'Expiration must be in the future' }); return; }
  const update: Record<string, unknown> = {};
  if (body.data.enabled !== undefined) update.enabled = body.data.enabled;
  if (body.data.expiresAt !== undefined) update.expires_at = body.data.expiresAt;
  if (body.data.revoked) { update.revoked_at = new Date().toISOString(); update.enabled = false; }
  try {
    const { data, error } = await supabaseAdmin.from('invoice_share_tokens').update(update).eq('id', req.params.tokenId).eq('invoice_id', req.params.id).eq('user_id', user.id).select('*').maybeSingle();
    if (error) throw error;
    if (!data) { res.status(404).json({ error: 'Share link not found' }); return; }
    res.json({ shareToken: publicToken(data) });
  } catch { res.status(500).json({ error: 'Could not update invoice share link' }); }
});

router.get('/share/:token', async (req, res) => {
  if (!rateLimit(req, res)) return;
  const raw = String(req.params.token);
  if (!tokenPattern.test(raw)) { res.status(404).json({ error: 'Share link not found' }); return; }
  try {
    const { data: link, error } = await supabaseAdmin.from('invoice_share_tokens').select('id,invoice_id,enabled,expires_at,revoked_at').eq('token_hash', tokenHash(raw)).maybeSingle();
    if (error) throw error;
    if (!link || !link.enabled || link.revoked_at || (link.expires_at && new Date(link.expires_at).getTime() <= Date.now())) {
      res.status(404).json({ error: 'This share link is unavailable or expired.' }); return;
    }
    const { data: invoice, error: invoiceError } = await supabaseAdmin.from('invoices').select('invoice_number,status,issue_date,due_date,total,currency,payload').eq('id', link.invoice_id).maybeSingle();
    if (invoiceError) throw invoiceError;
    if (!invoice) { res.status(404).json({ error: 'Invoice not found' }); return; }
    await supabaseAdmin.rpc('record_invoice_share_access', { p_token_id: link.id });
    res.setHeader('Cache-Control', 'no-store');
    res.json({ invoice: { invoice_number: invoice.invoice_number, status: invoice.status, issue_date: invoice.issue_date, due_date: invoice.due_date, total: invoice.total, currency: invoice.currency, payload: invoice.payload } });
  } catch { res.status(500).json({ error: 'Share link service unavailable' }); }
});

export default router;