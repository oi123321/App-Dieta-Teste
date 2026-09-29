import type { EmojiName } from '../data/emoji';
import { getIngredient } from '../data/ingredients';
import type { LooseIngredient, Recipe } from '../data/types';
import { decimal, friendlyNumber } from '../lib/format';
import { matchIngredient, normalize, parseQuantity, toCatalogQty, type ParsedUnit } from '../lib/importer';
import type { Post, PostIngredient, PostUnit } from './types';

export const UNIT_OPTIONS: { unit: PostUnit; label: string }[] = [
  { unit: 'g', label: 'g' },
  { unit: 'kg', label: 'kg' },
  { unit: 'ml', label: 'ml' },
  { unit: 'l', label: 'L' },
  { unit: 'un', label: 'unidade' },
  { unit: 'colher_sopa', label: 'colher (sopa)' },
  { unit: 'colher_cha', label: 'colher (chá)' },
  { unit: 'xicara', label: 'xícara' },
  { unit: 'dente', label: 'dente' },
  { unit: 'maco', label: 'maço' },
  { unit: 'lata', label: 'lata' },
  { unit: 'pitada', label: 'pitada' },
  { unit: 'a_gosto', label: 'a gosto' },
];

const WORDS: Partial<Record<PostUnit, [string, string]>> = {
  un: ['unidade', 'unidades'],
  colher_sopa: ['colher (sopa)', 'colheres (sopa)'],
  colher_cha: ['colher (chá)', 'colheres (chá)'],
  xicara: ['xícara', 'xícaras'],
  dente: ['dente', 'dentes'],
  maco: ['maço', 'maços'],
  lata: ['lata', 'latas'],
  pitada: ['pitada', 'pitadas'],
};

export function unitLabel(unit: PostUnit): string {
  return UNIT_OPTIONS.find((u) => u.unit === unit)?.label ?? unit;
}

/** "300 g", "2 colheres (sopa)", "½ xícara", "a gosto". */
export function formatPostQty(qty: number | null, unit: PostUnit, factor = 1): string {
  if (unit === 'a_gosto' || qty === null) return 'a gosto';
  const value = qty * factor;
  switch (unit) {
    case 'g':
      return value >= 1000 ? `${decimal(value / 1000, 2)} kg` : `${Math.round(value)} g`;
    case 'ml':
      return value >= 1000 ? `${decimal(value / 1000, 2)} L` : `${Math.round(value)} ml`;
    case 'kg':
      return `${decimal(value, 2)} kg`;
    case 'l':
      return `${decimal(value, 2)} L`;
    default: {
      const [one, many] = WORDS[unit] ?? [unit, unit];
      return `${friendlyNumber(value)} ${value > 1 ? many : one}`;
    }
  }
}

const TO_PARSED: Record<PostUnit, ParsedUnit | undefined> = {
  g: 'g',
  kg: 'kg',
  ml: 'ml',
  l: 'l',
  un: 'piece',
  colher_sopa: 'tbsp',
  colher_cha: 'tsp',
  xicara: 'cup',
  dente: 'piece',
  maco: 'piece',
  lata: 'piece',
  pitada: 'pinch',
  a_gosto: undefined,
};

function unitFromParsed(unit: ParsedUnit | undefined, word: string | undefined): PostUnit {
  switch (unit) {
    case 'g':
    case 'kg':
    case 'ml':
    case 'l':
      return unit;
    case 'cup':
      return 'xicara';
    case 'tbsp':
      return 'colher_sopa';
    case 'tsp':
      return 'colher_cha';
    case 'pinch':
      return 'pitada';
    case 'piece':
      if (word?.startsWith('dente')) return 'dente';
      if (word?.startsWith('lata')) return 'lata';
      if (word?.startsWith('maco')) return 'maco';
      return 'un';
    default:
      return 'un';
  }
}

function capitalize(text: string): string {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

/** "2 colheres de sopa de azeite" → { name: 'Azeite de oliva', qty: 2, unit: 'colher_sopa' }. */
export function ingredientFromLine(line: string): PostIngredient | null {
  const text = line.trim();
  if (!text) return null;
  const parsed = parseQuantity(text);
  const catalogId = matchIngredient(parsed.rest) ?? matchIngredient(text);
  const loose = /a gosto/i.test(text);
  const unit: PostUnit = loose && parsed.value === undefined ? 'a_gosto' : unitFromParsed(parsed.unit, parsed.unitWord);
  const qty = unit === 'a_gosto' ? null : (parsed.value ?? 1);
  const rawName = parsed.rest.replace(/\s+a gosto$/i, '').trim() || text;
  const name = catalogId ? (getIngredient(catalogId)?.name ?? capitalize(rawName)) : capitalize(rawName);
  return { name, qty, unit, catalogId };
}

/** Reads amounts typed by people: "2", "1,5", "1/2", "1 1/2". */
export function parseAmount(text: string): number | null {
  const t = text.trim().replace(',', '.');
  const mixed = t.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (mixed) return Number(mixed[3]) ? Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]) : null;
  const fraction = t.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (fraction) return Number(fraction[2]) ? Number(fraction[1]) / Number(fraction[2]) : null;
  if (!/^\d*\.?\d+$/.test(t)) return null;
  const value = Number(t);
  return Number.isFinite(value) ? value : null;
}

/** Shows an amount the way it would be typed: 0.5 → "0,5". */
export function amountText(value: number | null): string {
  return value === null ? '' : String(Math.round(value * 100) / 100).replace('.', ',');
}

export function resolveCatalogId(name: string): string | undefined {
  return matchIngredient(name);
}

export function postRecipeId(postId: string): string {
  return `post:${postId}`;
}

/** Turns a community post into a Recipe the planner, list and detail screens understand. */
export function postToRecipe(post: Post): Recipe {
  const merged = new Map<string, number>();
  const extras: LooseIngredient[] = [];
  for (const item of post.ingredients) {
    const id = item.catalogId ?? resolveCatalogId(item.name);
    const qty = id ? toCatalogQty(id, item.qty ?? undefined, TO_PARSED[item.unit]) : undefined;
    if (id && qty !== undefined) merged.set(id, (merged.get(id) ?? 0) + qty);
    else extras.push({ text: `${item.name} — ${formatPostQty(item.qty, item.unit)}` });
  }
  return {
    id: postRecipeId(post.id),
    title: post.title,
    minutes: post.minutes,
    servings: post.servings,
    ingredients: [...merged].map(([id, qty]) => ({ id, qty })),
    extras,
    steps: post.steps,
    appliances: post.appliances,
    imageUrl: post.photoUrl ?? undefined,
    community: true,
    source: { platform: 'comunidade', url: '', author: post.author.username, postId: post.id },
  };
}

/** Emoji for posts without a photo: the first ingredient we recognise. */
export function postEmoji(post: Pick<Post, 'ingredients'>): EmojiName {
  for (const item of post.ingredients) {
    const id = item.catalogId ?? resolveCatalogId(item.name);
    const icon = id ? getIngredient(id)?.icon : undefined;
    if (icon) return icon;
  }
  return 'cook';
}

export function ingredientIcon(item: PostIngredient): EmojiName | undefined {
  const id = item.catalogId ?? resolveCatalogId(item.name);
  return id ? getIngredient(id)?.icon : undefined;
}

/** Suggests a username from a display name: "Maria Luíza" → "maria.luiza". */
export function suggestUsername(name: string): string {
  const base = normalize(name)
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '')
    .slice(0, 20);
  return base.length >= 3 ? base : `${base}cozinha`.slice(0, 20);
}

export const USERNAME_RE = /^[a-z0-9_.]{3,20}$/;

/** Keeps only what a username may contain: "Ana_Lú!" → "ana_lu". */
export function cleanUsername(text: string): string {
  return text
    .split('_')
    .map((part) => normalize(part).replace(/[^a-z0-9.]/g, ''))
    .join('_')
    .slice(0, 20);
}
