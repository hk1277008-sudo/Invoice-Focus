import { Router, type IRouter, type Request, type Response } from 'express';
import { supabaseAdmin } from '../lib/supabase';

const router: IRouter = Router();
function getToken(req: Request) {
  const value = req.get('authorization');
  return value?.startsWith('Bearer ') ? value.slice(7) : null;
}
async function user(req: Request, res: Response) {
  const token = getToken(req);
  if (!token) { res.status(401).json({ error: 'Authentication required' }); return null; }
  const result = await supabaseAdmin.auth.getUser(token);
  if (result.error || !result.data.user) { res.status(401).json({ error: 'Invalid or expired session' }); return null; }
  return result.data.user;
}
router.get('/notifications', async (req, res) => {
  const current = await user(req, res); if (!current) return;
  const result = await supabaseAdmin.from('notifications').select('*').eq('user_id', current.id).order('created_at', { ascending: false }).limit(50);
  if (result.error) { res.status(500).json({ error: 'Failed to load notifications' }); return; }
  res.json({ notifications: result.data ?? [] });
});
router.post('/notifications/:id/read', async (req, res) => {
  const current = await user(req, res); if (!current) return;
  const result = await supabaseAdmin.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', String(req.params.id)).eq('user_id', current.id).select('*').maybeSingle();
  if (result.error) { res.status(500).json({ error: 'Failed to mark notification as read' }); return; }
  if (!result.data) { res.status(404).json({ error: 'Notification not found' }); return; }
  res.json({ notification: result.data });
});
export default router;