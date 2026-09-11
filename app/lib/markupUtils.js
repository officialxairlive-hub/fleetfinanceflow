// ==========================================================
// Parts Markup & Pricing Matrix Utilities
// Supports tiered brackets: Supplier Cost $X to $Y -> Z% Markup
// ==========================================================

export const DEFAULT_MARKUP_TIERS = [
  { id: 'tier-1', minCost: 0, maxCost: 25, markup: 60, label: 'Under $25.00' },
  { id: 'tier-2', minCost: 25.01, maxCost: 100, markup: 50, label: '$25.01 – $100.00' },
  { id: 'tier-3', minCost: 100.01, maxCost: 300, markup: 40, label: '$100.01 – $300.00' },
  { id: 'tier-4', minCost: 300.01, maxCost: 1000, markup: 30, label: '$300.01 – $1,000.00' },
  { id: 'tier-5', minCost: 1000.01, maxCost: null, markup: 20, label: '$1,000.01 and above' }
];

export const DEFAULT_FALLBACK_MARKUP = 35; // % fallback if no tier matches

export const PRESET_MATRICES = {
  standard: {
    name: 'Heavy Duty Diesel Standard',
    description: 'Balanced margins for general fleet maintenance and parts supply.',
    tiers: [
      { id: 'std-1', minCost: 0, maxCost: 25, markup: 60, label: 'Under $25' },
      { id: 'std-2', minCost: 25.01, maxCost: 100, markup: 50, label: '$25.01 – $100' },
      { id: 'std-3', minCost: 100.01, maxCost: 300, markup: 40, label: '$100.01 – $300' },
      { id: 'std-4', minCost: 300.01, maxCost: 1000, markup: 30, label: '$300.01 – $1,000' },
      { id: 'std-5', minCost: 1000.01, maxCost: null, markup: 20, label: 'Over $1,000' }
    ]
  },
  highMargin: {
    name: 'High Margin / Urgent Roadside',
    description: 'Optimized for emergency calls, roadside dispatch, and scarce parts.',
    tiers: [
      { id: 'hm-1', minCost: 0, maxCost: 25, markup: 75, label: 'Under $25' },
      { id: 'hm-2', minCost: 25.01, maxCost: 100, markup: 60, label: '$25.01 – $100' },
      { id: 'hm-3', minCost: 100.01, maxCost: 300, markup: 50, label: '$100.01 – $300' },
      { id: 'hm-4', minCost: 300.01, maxCost: 1000, markup: 40, label: '$300.01 – $1,000' },
      { id: 'hm-5', minCost: 1000.01, maxCost: null, markup: 30, label: 'Over $1,000' }
    ]
  },
  competitive: {
    name: 'Competitive Fleet Commercial',
    description: 'Volume discount pricing designed for large corporate fleet contracts.',
    tiers: [
      { id: 'cf-1', minCost: 0, maxCost: 50, markup: 40, label: 'Under $50' },
      { id: 'cf-2', minCost: 50.01, maxCost: 200, markup: 30, label: '$50.01 – $200' },
      { id: 'cf-3', minCost: 200.01, maxCost: 500, markup: 25, label: '$200.01 – $500' },
      { id: 'cf-4', minCost: 500.01, maxCost: null, markup: 18, label: 'Over $500' }
    ]
  }
};

/**
 * Get active markup tiers from localStorage or fallback defaults
 */
export function getSavedMarkupSettings() {
  if (typeof window === 'undefined') {
    return { tiers: DEFAULT_MARKUP_TIERS, fallbackMarkup: DEFAULT_FALLBACK_MARKUP };
  }

  try {
    const localShop = localStorage.getItem('shop_info');
    if (localShop) {
      const parsed = JSON.parse(localShop);
      if (Array.isArray(parsed.partsMarkupTiers) && parsed.partsMarkupTiers.length > 0) {
        return {
          tiers: parsed.partsMarkupTiers,
          fallbackMarkup: parseFloat(parsed.defaultPartsMarkup) || DEFAULT_FALLBACK_MARKUP
        };
      }
      if (parsed.defaultPartsMarkup) {
        return {
          tiers: DEFAULT_MARKUP_TIERS,
          fallbackMarkup: parseFloat(parsed.defaultPartsMarkup) || DEFAULT_FALLBACK_MARKUP
        };
      }
    }
  } catch (err) {
    console.warn('Could not read saved markup tiers from localStorage:', err);
  }

  return { tiers: DEFAULT_MARKUP_TIERS, fallbackMarkup: DEFAULT_FALLBACK_MARKUP };
}

/**
 * Calculate markup % and customer sell price given a supplier part cost
 * @param {number|string} costInput - Supplier unit cost price
 * @param {Array} [customTiers] - Optional tiers list to evaluate
 * @param {number} [customFallback] - Optional fallback markup %
 * @returns {{ markup: number, sellPrice: number, profit: number, marginPercent: number, matchedTier: object|null }}
 */
export function calculateMarkupAndSellPrice(costInput, customTiers = null, customFallback = null) {
  const cost = Math.max(0, parseFloat(costInput) || 0);
  
  const { tiers: defaultTiers, fallbackMarkup: defaultFallback } = getSavedMarkupSettings();
  const tiers = customTiers && customTiers.length > 0 ? customTiers : defaultTiers;
  const fallback = customFallback != null ? parseFloat(customFallback) : defaultFallback;

  if (cost === 0) {
    return {
      markup: fallback,
      sellPrice: 0,
      profit: 0,
      marginPercent: 0,
      matchedTier: null
    };
  }

  // Find matching tier
  let matchedTier = null;
  for (const tier of tiers) {
    const min = parseFloat(tier.minCost) || 0;
    const max = tier.maxCost != null && tier.maxCost !== '' ? parseFloat(tier.maxCost) : Infinity;
    
    if (cost >= min && cost <= max) {
      matchedTier = tier;
      break;
    }
  }

  const markup = matchedTier ? parseFloat(matchedTier.markup) || 0 : fallback;
  const sellPrice = +(cost * (1 + markup / 100)).toFixed(2);
  const profit = +(sellPrice - cost).toFixed(2);
  const marginPercent = sellPrice > 0 ? +((profit / sellPrice) * 100).toFixed(1) : 0;

  return {
    markup,
    sellPrice,
    profit,
    marginPercent,
    matchedTier
  };
}

/**
 * Format tier range label nicely
 */
export function formatTierBracket(tier) {
  if (!tier) return '';
  const min = parseFloat(tier.minCost) || 0;
  if (tier.maxCost == null || tier.maxCost === '' || tier.maxCost === Infinity) {
    return `$${min.toFixed(2)}+`;
  }
  const max = parseFloat(tier.maxCost) || 0;
  return `$${min.toFixed(2)} – $${max.toFixed(2)}`;
}
