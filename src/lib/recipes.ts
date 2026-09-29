import { getIngredient } from '../data/ingredients';
import { RECIPES } from '../data/recipes';
import type { IngredientFlag, Macros, PrefId, Recipe, TagId } from '../data/types';

const BUILT_IN = new Map(RECIPES.map((r) => [r.id, r]));

export function findRecipe(id: string, imported: Recipe[]): Recipe | undefined {
  return BUILT_IN.get(id) ?? imported.find((r) => r.id === id);
}

export function allRecipes(imported: Recipe[]): Recipe[] {
  return [...imported, ...RECIPES];
}

export function ingredientCost(id: string, qty: number, index: number): number {
  const ing = getIngredient(id);
  if (!ing) return 0;
  return (ing.price / ing.per) * qty * index;
}

/** Estimated cost in BRL to cook `recipe` for `servings` people at a market with `index`. */
export function recipeCost(recipe: Recipe, servings: number, index: number): number {
  const factor = servings / recipe.servings;
  return recipe.ingredients.reduce((sum, item) => sum + ingredientCost(item.id, item.qty * factor, index), 0);
}

/** Per-serving macros estimated from the ingredient catalog (raw weights). */
export function estimateMacros(recipe: Recipe): Macros {
  const total = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
  for (const item of recipe.ingredients) {
    const ing = getIngredient(item.id);
    if (!ing) continue;
    const factor = ing.unit === 'g' || ing.unit === 'ml' ? item.qty / 100 : item.qty;
    total.kcal += ing.n[0] * factor;
    total.protein += ing.n[1] * factor;
    total.carbs += ing.n[2] * factor;
    total.fat += ing.n[3] * factor;
  }
  const s = Math.max(1, recipe.servings);
  return {
    kcal: Math.round(total.kcal / s),
    protein: Math.round(total.protein / s),
    carbs: Math.round(total.carbs / s),
    fat: Math.round(total.fat / s),
  };
}

const macroCache = new WeakMap<Recipe, Macros>();

export function recipeMacros(recipe: Recipe): Macros {
  if (recipe.macros) return recipe.macros;
  let cached = macroCache.get(recipe);
  if (!cached) {
    cached = estimateMacros(recipe);
    macroCache.set(recipe, cached);
  }
  return cached;
}

export function recipeFlags(recipe: Recipe): Set<IngredientFlag> {
  const flags = new Set<IngredientFlag>();
  for (const item of recipe.ingredients) {
    for (const flag of getIngredient(item.id)?.flags ?? []) flags.add(flag);
  }
  return flags;
}

export function isVegetarian(recipe: Recipe): boolean {
  const flags = recipeFlags(recipe);
  return !flags.has('carne') && !flags.has('peixe');
}

/** Hard dietary filters. "proteico" and "low_carb" only influence ranking. */
export function fitsPrefs(recipe: Recipe, prefs: PrefId[]): boolean {
  const flags = recipeFlags(recipe);
  if (prefs.includes('vegetariano') && (flags.has('carne') || flags.has('peixe'))) return false;
  if (prefs.includes('sem_lactose') && flags.has('lactose')) return false;
  if (prefs.includes('sem_gluten') && flags.has('gluten')) return false;
  return true;
}

/** The ingredient that defines the dish, used to avoid repeating proteins. */
export function mainProtein(recipe: Recipe): string {
  const hit = recipe.ingredients.find((i) => {
    const flags = getIngredient(i.id)?.flags ?? [];
    return flags.includes('carne') || flags.includes('peixe');
  });
  if (hit) return hit.id === 'bacon' || hit.id === 'calabresa' ? 'porco' : hit.id;
  if (recipe.ingredients.some((i) => i.id === 'ovo')) return 'ovo';
  return 'vegetal';
}

const TAG_ORDER: TagId[] = ['rapido', 'proteico', 'leve', 'economico', 'vegetariano', 'conforto', 'marmita'];

export function recipeTags(recipe: Recipe): TagId[] {
  const tags = new Set<TagId>(recipe.tags ?? []);
  const macros = recipeMacros(recipe);
  if (recipe.minutes <= 25) tags.add('rapido');
  if (macros.kcal > 0 && macros.kcal <= 500) tags.add('leve');
  if (macros.protein >= 40) tags.add('proteico');
  if (recipe.ingredients.length > 0 && isVegetarian(recipe)) tags.add('vegetariano');
  if (recipe.ingredients.length > 0 && recipeCost(recipe, 1, 1) <= 8) tags.add('economico');
  if (recipe.batch) tags.add('marmita');
  return TAG_ORDER.filter((t) => tags.has(t));
}

export const TAG_META: Record<TagId, { label: string; short: string; bg: string; fg: string }> = {
  rapido: { label: 'Rápido e fácil', short: 'Rápido', bg: '#FFF0C2', fg: '#7A5A00' },
  proteico: { label: 'Rico em proteína', short: 'Proteico', bg: '#F9D7D0', fg: '#8A2C1C' },
  leve: { label: 'Baixa caloria', short: 'Leve', bg: '#DCEBF5', fg: '#1F4E6E' },
  economico: { label: 'Econômico', short: 'Econômico', bg: '#E4F1D6', fg: '#2F5A18' },
  vegetariano: { label: 'Vegetariano', short: 'Vegetariano', bg: '#E4F1D6', fg: '#2F5A18' },
  conforto: { label: 'Comida afetiva', short: 'Afetiva', bg: '#F3E3D3', fg: '#7A4A1E' },
  marmita: { label: 'Rende marmita', short: 'Marmita', bg: '#ECE5F5', fg: '#4B3A7A' },
};
