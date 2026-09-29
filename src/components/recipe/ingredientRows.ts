import type { EmojiName } from '../../data/emoji';
import { getIngredient } from '../../data/ingredients';
import type { Aisle, Recipe } from '../../data/types';
import { recipeQty } from '../../lib/format';
import { aliasesFor, normalize } from '../../lib/importer';
import { formatPostQty, ingredientIcon, resolveCatalogId } from '../../social/convert';
import type { PostIngredient } from '../../social/types';

export const AISLE_TINT: Record<Aisle, string> = {
  hortifruti: '#E8F3DC',
  acougue: '#FBE0DA',
  frios: '#FFF0C2',
  padaria: '#F6E6D2',
  mercearia: '#F1EADB',
  temperos: '#DCEBF5',
  congelados: '#E3EEF7',
  outros: '#EEE8F7',
  despensa: '#F0EBDF',
};

export interface IngredientRowData {
  key: string;
  name: string;
  icon?: EmojiName;
  tint: string;
  qty: string;
  /** Normalized phrases that identify this ingredient inside a step. */
  keywords: string[];
  /** Seasonings "a gosto" are left out of the per-step quantities. */
  toTaste: boolean;
}

function keywordsFor(name: string, catalogId: string | undefined): string[] {
  const phrases = new Set<string>([normalize(name)]);
  if (catalogId) for (const alias of aliasesFor(catalogId)) phrases.add(alias);
  const first = normalize(name).split(' ')[0];
  if (first && first.length >= 4) phrases.add(first);
  return [...phrases].filter((p) => p.length >= 3);
}

export function recipeRows(recipe: Recipe, factor: number): IngredientRowData[] {
  const rows: IngredientRowData[] = [];
  for (const item of recipe.ingredients) {
    const ing = getIngredient(item.id);
    if (!ing) continue;
    rows.push({
      key: item.id,
      name: ing.name,
      icon: ing.icon,
      tint: AISLE_TINT[ing.aisle],
      qty: ing.pantry ? 'a gosto' : recipeQty(ing, item.qty * factor),
      keywords: keywordsFor(ing.name, item.id),
      toTaste: Boolean(ing.pantry),
    });
  }
  recipe.extras?.forEach((extra, i) => {
    const [name, qty = ''] = extra.text.split(' — ');
    rows.push({ key: `x${i}`, name, tint: AISLE_TINT.outros, qty, keywords: keywordsFor(name, undefined), toTaste: !qty });
  });
  return rows;
}

export function postRows(ingredients: PostIngredient[], factor: number): IngredientRowData[] {
  return ingredients.map((item, i) => {
    const catalogId = item.catalogId ?? resolveCatalogId(item.name);
    const ing = catalogId ? getIngredient(catalogId) : undefined;
    return {
      key: `${i}-${item.name}`,
      name: item.name,
      icon: ingredientIcon(item),
      tint: ing ? AISLE_TINT[ing.aisle] : AISLE_TINT.outros,
      qty: formatPostQty(item.qty, item.unit, factor),
      keywords: keywordsFor(item.name, catalogId),
      toTaste: item.unit === 'a_gosto',
    };
  });
}

function phraseRegex(phrase: string): RegExp {
  const words = phrase.split(' ').map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + 's?');
  return new RegExp(`(^| )${words.join(' ')}( |$)`);
}

/** Ingredients mentioned in a step, in the order they appear in the list. */
export function mentionedIn(step: string, rows: IngredientRowData[]): IngredientRowData[] {
  const text = ` ${normalize(step)
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')} `;
  return rows.filter((row) => !row.toTaste && row.qty && row.keywords.some((k) => phraseRegex(k).test(text)));
}
