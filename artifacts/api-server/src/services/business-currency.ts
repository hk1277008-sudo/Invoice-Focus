import { supabaseAdmin } from '../lib/supabase';

export const businessCurrencyCodes = [
  'USD', 'EUR', 'GBP', 'PKR', 'AED', 'SAR', 'INR', 'CAD', 'AUD', 'SGD', 'JPY', 'CNY',
] as const;

export type BusinessCurrencyCode = typeof businessCurrencyCodes[number];

export function normalizeBusinessCurrency(value: string | null | undefined): BusinessCurrencyCode {
  const normalized = (value || 'USD').toUpperCase();
  return (businessCurrencyCodes as readonly string[]).includes(normalized)
    ? normalized as BusinessCurrencyCode
    : 'USD';
}

function isMissingManualColumn(error: { code?: string; message?: string } | null) {
  return Boolean(error && (
    error.code === '42703' ||
    error.code === 'PGRST204' ||
    error.message?.toLowerCase().includes('business_currency_manual')
  ));
}

async function loadCurrencySettings(userId: string) {
  const result = await supabaseAdmin
    .from('user_settings')
    .select('default_currency, business_currency_manual')
    .eq('user_id', userId)
    .maybeSingle();
  if (!isMissingManualColumn(result.error)) {
    if (result.error) throw result.error;
    return { data: result.data };
  }

  const fallback = await supabaseAdmin
    .from('user_settings')
    .select('default_currency')
    .eq('user_id', userId)
    .maybeSingle();
  if (fallback.error) throw fallback.error;
  return {
    data: fallback.data ? { ...fallback.data, business_currency_manual: false } : null,
  };
}

/**
 * Resolves the one currency used by business reporting.
 *
 * Older accounts may not have a deliberate business currency yet. For those
 * accounts, the earliest invoice establishes the reporting currency once,
 * while an explicit settings choice is always preserved.
 */
export async function resolveBusinessCurrency(
  userId: string,
  _invoices: Array<{ currency?: string | null; issue_date?: string | null; created_at?: string | null }> = [],
) {
  const { data: settings } = await loadCurrencySettings(userId);

  const current = normalizeBusinessCurrency(settings?.default_currency);
  if (settings?.business_currency_manual) return current;

  const { data: earliest } = await supabaseAdmin
    .from('invoices')
    .select('currency')
    .eq('user_id', userId)
    .not('currency', 'is', null)
    .order('issue_date', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!earliest) return current;

  const inferred = normalizeBusinessCurrency(earliest.currency);
  if (inferred !== current || !settings) {
    const { error: updateError } = await supabaseAdmin.from('user_settings').upsert(
      { user_id: userId, default_currency: inferred },
      { onConflict: 'user_id' },
    );
    if (updateError) throw updateError;
  }
  return inferred;
}

export async function setBusinessCurrency(userId: string, currency: string) {
  const normalized = normalizeBusinessCurrency(currency);
  const withManualFlag = await supabaseAdmin
    .from('user_settings')
    .upsert({
      user_id: userId,
      default_currency: normalized,
      business_currency_manual: true,
    }, { onConflict: 'user_id' })
    .select('default_currency')
    .single();
  if (!isMissingManualColumn(withManualFlag.error)) {
    if (withManualFlag.error) throw withManualFlag.error;
    return normalizeBusinessCurrency(withManualFlag.data.default_currency);
  }

  const fallback = await supabaseAdmin
    .from('user_settings')
    .upsert({ user_id: userId, default_currency: normalized }, { onConflict: 'user_id' })
    .select('default_currency')
    .single();
  if (fallback.error) throw fallback.error;
  return normalizeBusinessCurrency(fallback.data.default_currency);
}

export async function adoptFirstInvoiceCurrency(userId: string, currency: string) {
  const [{ count }, { data: settings }] = await Promise.all([
    supabaseAdmin.from('invoices').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    loadCurrencySettings(userId),
  ]);
  if ((count ?? 0) !== 1 || settings?.business_currency_manual) {
    return normalizeBusinessCurrency(settings?.default_currency);
  }

  const normalized = normalizeBusinessCurrency(currency);
  const { error } = await supabaseAdmin
    .from('user_settings')
    .upsert({ user_id: userId, default_currency: normalized }, { onConflict: 'user_id' });
  if (error) throw error;
  return normalized;
}