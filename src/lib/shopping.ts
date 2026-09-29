import type { EmojiName } from '../data/emoji';
import { AISLES, getIngredient } from '../data/ingredients';
import type { Aisle, Plan, Recipe } from '../data/types';
import { daysRange, shoppingQty } from './format';
import { servingsFor } from './planner';
import { ingredientCost } from './recipes';

export interface ShoppingItem {
  key: string;
  name: string;
  icon?: EmojiName;
  qty: string;
  aisle: Aisle;
  cost: number;
  pantry: boolean;
  /** Titles of the recipes that use this item. */
  usedIn: string[];
}

export interface ShoppingSection {
  aisle: Aisle;
  title: string;
  items: ShoppingItem[];
}

export interface ShoppingList {
  sections: ShoppingSection[];
  total: number;
  count: number;
  range: string;
}

export function buildShoppingList(
  plan: Plan | null,
  findRecipe: (id: string) => Recipe | undefined,
  people: number,
  marketIndex: number,
  customItems: { id: string; name: string }[] = [],
): ShoppingList {
  const totals = new Map<string, { qty: number; usedIn: Set<string> }>();
  const loose: ShoppingItem[] = [];
  const days: number[] = [];

  for (const entry of plan?.entries ?? []) {
    const recipe = findRecipe(entry.recipeId);
    if (!recipe) continue;
    days.push(...entry.days);
    const factor = servingsFor(entry, people) / recipe.servings;
    for (const item of recipe.ingredients) {
      const current = totals.get(item.id) ?? { qty: 0, usedIn: new Set<string>() };
      current.qty += item.qty * factor;
      current.usedIn.add(recipe.title);
      totals.set(item.id, current);
    }
    recipe.extras?.forEach((extra, i) => {
      loose.push({
        key: `x:${recipe.id}:${i}`,
        name: extra.text,
        qty: '',
        aisle: 'outros',
        cost: 0,
        pantry: false,
        usedIn: [recipe.title],
      });
    });
  }

  const items: ShoppingItem[] = [];
  let total = 0;
  totals.forEach((value, id) => {
    const ingredient = getIngredient(id);
    if (!ingredient) return;
    const cost = ingredientCost(id, value.qty, marketIndex);
    total += cost;
    items.push({
      key: id,
      name: ingredient.name,
      icon: ingredient.icon,
      qty: ingredient.pantry ? 'tenha em casa' : shoppingQty(ingredient, value.qty),
      aisle: ingredient.aisle,
      cost,
      pantry: Boolean(ingredient.pantry),
      usedIn: [...value.usedIn],
    });
  });
  items.push(...loose);
  for (const custom of customItems) {
    items.push({ key: `c:${custom.id}`, name: custom.name, qty: '', aisle: 'outros', cost: 0, pantry: false, usedIn: [] });
  }

  const sections = AISLES.map((aisle) => ({
    aisle: aisle.id,
    title: aisle.title,
    items: items
      .filter((i) => i.aisle === aisle.id)
      .sort((a, b) => (a.key.startsWith('c:') ? 1 : 0) - (b.key.startsWith('c:') ? 1 : 0) || b.cost - a.cost),
  })).filter((s) => s.items.length > 0);

  return {
    sections,
    total,
    count: items.length,
    range: daysRange([...new Set(days)]),
  };
}

export function shoppingListText(list: ShoppingList, marketName: string, checked: Record<string, boolean>): string {
  const lines: string[] = [`🛒 Lista de compras (${list.range || 'semana'})`, `Mercado: ${marketName}`, ''];
  for (const section of list.sections) {
    const pending = section.items.filter((i) => !checked[i.key]);
    if (pending.length === 0) continue;
    lines.push(section.title.toUpperCase());
    for (const item of pending) {
      lines.push(item.qty ? `• ${item.name} — ${item.qty}` : `• ${item.name}`);
    }
    lines.push('');
  }
  lines.push('Feito com o salsa 🌿');
  return lines.join('\n');
}
