import type { Ingredient, Unit } from '../data/types';

/** Typed percentage for React Native dimension styles. */
export function pct(value: number): `${number}%` {
  return `${Math.round(value * 100) / 100}%`;
}

export const DAY_SHORT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
export const DAY_LONG = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

function groupThousands(int: string): string {
  return int.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** R$ 1.234,56 — formatted by hand so it is identical on every JS engine. */
export function brl(value: number, opts: { cents?: boolean } = {}): string {
  const cents = opts.cents ?? true;
  const safe = Number.isFinite(value) ? value : 0;
  const sign = safe < 0 ? '−' : '';
  const abs = Math.abs(safe);
  // Non-breaking space keeps "R$" and the amount on the same line.
  if (!cents) return `${sign}R$\u00A0${groupThousands(String(Math.round(abs)))}`;
  const [int, dec] = abs.toFixed(2).split('.');
  return `${sign}R$\u00A0${groupThousands(int)},${dec}`;
}

export function signedBrl(value: number): string {
  if (Math.abs(value) < 0.005) return 'mesmo preço';
  return value > 0 ? `+${brl(value)}` : brl(value);
}

export function decimal(value: number, digits = 1): string {
  const fixed = value.toFixed(digits);
  const trimmed = digits > 0 ? fixed.replace(/\.?0+$/, '') : fixed;
  return trimmed.replace('.', ',');
}

const FRACTIONS: [number, string][] = [
  [0.25, '¼'],
  [0.33, '⅓'],
  [0.5, '½'],
  [0.67, '⅔'],
  [0.75, '¾'],
];

/** 1.5 → "1 ½", 0.25 → "¼", 2 → "2". */
export function friendlyNumber(value: number): string {
  const whole = Math.floor(value + 1e-9);
  const frac = value - whole;
  if (frac < 0.08) return String(whole);
  if (frac > 0.92) return String(whole + 1);
  const match = FRACTIONS.reduce((best, cur) => (Math.abs(cur[0] - frac) < Math.abs(best[0] - frac) ? cur : best));
  if (Math.abs(match[0] - frac) < 0.09) return whole > 0 ? `${whole} ${match[1]}` : match[1];
  return decimal(value, 1);
}

const UNIT_WORDS: Record<Exclude<Unit, 'g' | 'ml'>, [string, string]> = {
  un: ['unidade', 'unidades'],
  dente: ['dente', 'dentes'],
  maco: ['maço', 'maços'],
  lata: ['lata', 'latas'],
};

function countLabel(unit: Exclude<Unit, 'g' | 'ml'>, value: number, text: string): string {
  const [one, many] = UNIT_WORDS[unit];
  return `${text} ${value > 1 ? many : one}`;
}

/** Quantity as written in a recipe (keeps fractions). */
export function recipeQty(ingredient: Ingredient, qty: number): string {
  switch (ingredient.unit) {
    case 'g':
      return qty >= 1000 ? `${decimal(qty / 1000, 2)} kg` : `${Math.round(qty)} g`;
    case 'ml':
      return qty >= 1000 ? `${decimal(qty / 1000, 2)} L` : `${Math.round(qty)} ml`;
    default:
      return countLabel(ingredient.unit, qty, friendlyNumber(qty));
  }
}

function roundUpTo(value: number, step: number): number {
  return Math.ceil(value / step - 1e-9) * step;
}

/** Quantity to buy: whole units, grams rounded up to a sensible package size. */
export function shoppingQty(ingredient: Ingredient, qty: number): string {
  switch (ingredient.unit) {
    case 'g':
    case 'ml': {
      const step = qty < 100 ? 10 : qty < 500 ? 50 : 100;
      const rounded = roundUpTo(qty, step);
      const big = ingredient.unit === 'g' ? 'kg' : 'L';
      return rounded >= 1000 ? `${decimal(rounded / 1000, 1)} ${big}` : `${rounded} ${ingredient.unit}`;
    }
    default: {
      const whole = Math.max(1, Math.ceil(qty - 1e-9));
      return countLabel(ingredient.unit, whole, String(whole));
    }
  }
}

export function minutesLabel(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`;
}

export function daysLabel(days: number[], style: 'short' | 'long' = 'short'): string {
  const names = days.map((d) => (style === 'short' ? DAY_SHORT[d] : DAY_LONG[d]));
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} e ${names[names.length - 1]}`;
}

export function daysRange(days: number[]): string {
  if (days.length === 0) return '';
  const sorted = [...days].sort((a, b) => a - b);
  const first = DAY_SHORT[sorted[0]];
  const last = DAY_SHORT[sorted[sorted.length - 1]];
  return sorted.length === 1 ? first : `${first} – ${last}`;
}

/** "na segunda", "no sábado". */
export function onDayLabel(day: number): string {
  return `${day >= 5 ? 'no' : 'na'} ${DAY_LONG[day].toLowerCase()}`;
}

export function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}
