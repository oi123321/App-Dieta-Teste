import type { Market } from './types';

/**
 * Price index is a rough multiplier over the catalog baseline, used only for
 * estimates. Chains are listed by name so the user can recognise where they shop.
 */
export const MARKETS: Market[] = [
  { id: 'assai', name: 'Assaí Atacadista', short: 'Assaí', kind: 'atacarejo', index: 0.87, color: '#F08A3C' },
  { id: 'atacadao', name: 'Atacadão', short: 'Atacadão', kind: 'atacarejo', index: 0.86, color: '#E2574C' },
  { id: 'tenda', name: 'Tenda Atacado', short: 'Tenda', kind: 'atacarejo', index: 0.88, region: 'SP', color: '#D9A21B' },
  { id: 'carrefour', name: 'Carrefour', short: 'Carrefour', kind: 'supermercado', index: 1, color: '#3F7AD9' },
  { id: 'dia', name: 'Dia', short: 'Dia', kind: 'supermercado', index: 0.93, color: '#D8434B' },
  { id: 'guanabara', name: 'Guanabara', short: 'Guanabara', kind: 'supermercado', index: 0.9, region: 'RJ', color: '#2E9B5F' },
  { id: 'bh', name: 'Supermercados BH', short: 'BH', kind: 'supermercado', index: 0.94, region: 'MG', color: '#E0703A' },
  { id: 'muffato', name: 'Super Muffato', short: 'Muffato', kind: 'supermercado', index: 0.97, region: 'PR', color: '#C7462F' },
  { id: 'savegnago', name: 'Savegnago', short: 'Savegnago', kind: 'supermercado', index: 0.97, region: 'SP', color: '#2F6FB5' },
  { id: 'zaffari', name: 'Zaffari', short: 'Zaffari', kind: 'supermercado', index: 1.06, region: 'RS', color: '#4C8C3A' },
  { id: 'hirota', name: 'Hirota', short: 'Hirota', kind: 'supermercado', index: 1.04, region: 'SP', color: '#B8433A' },
  { id: 'paodeacucar', name: 'Pão de Açúcar', short: 'Pão de Açúcar', kind: 'premium', index: 1.15, color: '#3B9A57' },
  { id: 'oba', name: 'Oba Hortifruti', short: 'Oba', kind: 'premium', index: 1.17, color: '#6BA539' },
  { id: 'stmarche', name: 'St Marche', short: 'St Marche', kind: 'premium', index: 1.26, region: 'SP', color: '#2C4A3B' },
  { id: 'outro', name: 'Outro mercado', short: 'seu mercado', kind: 'outro', index: 1, color: '#8A978D' },
];

export const MARKET_GROUPS: { kind: Market['kind']; title: string; hint: string }[] = [
  { kind: 'atacarejo', title: 'Atacarejos', hint: 'preços mais baixos' },
  { kind: 'supermercado', title: 'Supermercados', hint: 'preço médio' },
  { kind: 'premium', title: 'Premium e hortifrúti', hint: 'preços mais altos' },
  { kind: 'outro', title: 'Não está na lista?', hint: '' },
];

export function getMarket(id: string | null | undefined): Market | undefined {
  return MARKETS.find((m) => m.id === id);
}

export function priceTier(market: Market): '$' | '$$' | '$$$' {
  if (market.index < 0.92) return '$';
  if (market.index < 1.1) return '$$';
  return '$$$';
}

export function marketLabel(marketId: string | null, customName: string): string {
  const market = getMarket(marketId);
  if (!market) return 'seu mercado';
  if (market.id === 'outro') return customName.trim() || 'seu mercado';
  return market.short;
}

export function marketInitials(name: string): string {
  const words = name.split(/\s+/).filter((w) => w.length > 0 && w.toLowerCase() !== 'de');
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}
