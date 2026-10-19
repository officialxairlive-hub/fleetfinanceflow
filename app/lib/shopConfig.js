import { shopSettings } from './demoData';
import { supabase } from './supabaseClient';

/** Auth header for shop-settings API calls (scopes the request to the caller's shop). */
export async function getShopAuthHeaders() {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

/** Resolves the signed-in user's shop id (used to scope all shop settings). */
export async function getCurrentShopId() {
  try {
    const { data } = await supabase.auth.getUser();
    if (!data?.user) return null;
    const { data: profile } = await supabase
      .from('profiles').select('shop_id').eq('id', data.user.id).maybeSingle();
    return profile?.shop_id || null;
  } catch {
    return null;
  }
}

/**
 * Fetches this shop's own settings and caches them in localStorage.
 * Never reads another shop's record.
 */
export async function fetchShopSettings(shopId) {
  if (typeof window !== 'undefined') {
    try {
      const sid = shopId || (await getCurrentShopId());
      const headers = await getShopAuthHeaders();
      const url = sid
        ? `/api/settings/shop?shopId=${encodeURIComponent(sid)}`
        : '/api/settings/shop';
      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.shopInfo) {
          localStorage.setItem('shop_info', JSON.stringify(data.shopInfo));
          const rate = parseFloat(data.shopInfo.defaultLabourRate) || 145.00;
          const types = Array.isArray(data.shopInfo.labourRateTypes) && data.shopInfo.labourRateTypes.length > 0
            ? data.shopInfo.labourRateTypes
            : DEFAULT_LABOUR_RATE_TYPES.map(t => t.id === 'shop' ? { ...t, rate } : t);
          return {
            ...shopSettings,
            ...data.shopInfo,
            defaultLabourRate: rate,
            labourRateTypes: types
          };
        }
      }
    } catch (err) {
      console.warn('Could not fetch cloud shop settings, using cached:', err);
    }
  }
  return getCachedShopSettings();
}

export const DEFAULT_LABOUR_RATE_TYPES = [
  { id: 'shop', name: 'Standard Shop Labour', rate: 145.00 },
  { id: 'roadside', name: 'Roadside Labour', rate: 185.00 },
  { id: 'travel', name: 'Travel Time', rate: 95.00 },
  { id: 'afterhours', name: 'After-Hours / Emergency', rate: 215.00 },
  { id: 'weekend', name: 'Weekend Rate', rate: 200.00 }
];

/**
 * Synchronously retrieves cached shop settings from localStorage.
 * Falls back to demoData shopSettings.
 */
export function getCachedShopSettings() {
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem('shop_info');
      if (cached) {
        const parsed = JSON.parse(cached);
        const rate = parseFloat(parsed.defaultLabourRate) || parseFloat(shopSettings.defaultLabourRate) || 145.00;
        const types = Array.isArray(parsed.labourRateTypes) && parsed.labourRateTypes.length > 0
          ? parsed.labourRateTypes
          : DEFAULT_LABOUR_RATE_TYPES.map(t => t.id === 'shop' ? { ...t, rate } : t);
        return {
          ...shopSettings,
          ...parsed,
          defaultLabourRate: rate,
          labourRateTypes: types
        };
      }
    } catch (_) {}
  }
  const defaultRate = parseFloat(shopSettings.defaultLabourRate) || 145.00;
  return {
    ...shopSettings,
    defaultLabourRate: defaultRate,
    labourRateTypes: DEFAULT_LABOUR_RATE_TYPES.map(t => t.id === 'shop' ? { ...t, rate: defaultRate } : t)
  };
}

/**
 * Returns the current default labour rate as a number (e.g. 165 or 145).
 */
export function getDefaultShopRate() {
  const settings = getCachedShopSettings();
  return parseFloat(settings.defaultLabourRate) || 145.00;
}

/**
 * Returns the current default labour rate formatted as a 2-decimal string (e.g. '165.00').
 */
export function getDefaultShopRateString() {
  return getDefaultShopRate().toFixed(2);
}
