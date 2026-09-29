import { hasAppliances } from '../data/appliances';
import type { Plan, PlanEntry, Profile, Recipe } from '../data/types';
import { fitsPrefs, mainProtein, recipeCost, recipeMacros } from './recipes';

/** Which weekdays get a planned dinner (0 = Monday). */
export function dinnerDays(dinners: number): number[] {
  switch (dinners) {
    case 3:
      return [0, 2, 4];
    case 4:
      return [0, 1, 3, 4];
    case 5:
      return [0, 1, 2, 3, 4];
    case 6:
      return [0, 1, 2, 3, 4, 5];
    default:
      return [0, 1, 2, 3, 4, 5, 6];
  }
}

/**
 * Groups dinner days into cooking sessions. With batch cooking on, the pattern
 * is "cook once, eat twice" followed by a fresh dinner, e.g. Seg+Ter, Qua, Qui+Sex, Sáb, Dom.
 */
export function buildSlots(dinners: number, batch: boolean): number[][] {
  if (!batch) return dinnerDays(dinners).map((d) => [d]);
  switch (dinners) {
    case 3:
      return [[0], [2], [4]];
    case 4:
      return [
        [0, 1],
        [3, 4],
      ];
    case 5:
      return [[0, 1], [2], [3, 4]];
    case 6:
      return [[0, 1], [2], [3, 4], [5]];
    default:
      return [[0, 1], [2], [3, 4], [5], [6]];
  }
}

export function servingsFor(entry: Pick<PlanEntry, 'days'>, people: number): number {
  return people * entry.days.length;
}

export interface PlannerContext {
  recipes: Recipe[];
  profile: Profile;
  liked: string[];
  disliked: string[];
  marketIndex: number;
}

/** Small deterministic PRNG so a seed always produces the same plan. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function eligibleRecipes(ctx: PlannerContext): Recipe[] {
  const { profile } = ctx;
  return ctx.recipes.filter(
    (r) =>
      !ctx.disliked.includes(r.id) &&
      r.ingredients.length > 0 &&
      hasAppliances(r.appliances, profile.appliances) &&
      fitsPrefs(r, profile.prefs),
  );
}

function baseScore(recipe: Recipe, ctx: PlannerContext, days: number[]): number {
  const { prefs } = ctx.profile;
  let score = 0;
  if (ctx.liked.includes(recipe.id)) score += 3;
  if (recipe.imported) score += 1;
  const macros = recipeMacros(recipe);
  if (prefs.includes('proteico')) score += (macros.protein - 38) / 8;
  if (prefs.includes('low_carb')) score += (70 - macros.carbs) / 18;
  if (days.length > 1) score += recipe.batch ? 1.2 : -4;
  // Weeknight dinners should be quick; slow recipes fit better on weekends.
  const weekend = days.some((d) => d >= 5);
  if (!weekend && recipe.minutes > 45) score -= 1;
  return score;
}

function varietyPenalty(recipe: Recipe, picked: Recipe[]): number {
  const protein = mainProtein(recipe);
  let penalty = 0;
  picked.forEach((p, i) => {
    if (mainProtein(p) === protein) penalty += i === picked.length - 1 ? 2.2 : 0.9;
  });
  return penalty;
}

let entryCounter = 0;
export function newEntryId(): string {
  entryCounter += 1;
  return `e${Date.now().toString(36)}${entryCounter.toString(36)}`;
}

export function planCost(entries: PlanEntry[], ctx: Pick<PlannerContext, 'recipes' | 'marketIndex' | 'profile'>): number {
  return entries.reduce((sum, entry) => {
    const recipe = ctx.recipes.find((r) => r.id === entry.recipeId);
    return recipe ? sum + recipeCost(recipe, servingsFor(entry, ctx.profile.people), ctx.marketIndex) : sum;
  }, 0);
}

export function generatePlan(ctx: PlannerContext, seed = Date.now()): Plan {
  const rng = mulberry32(seed);
  const slots = buildSlots(ctx.profile.dinners, ctx.profile.batch);
  const pool = eligibleRecipes(ctx);
  const fallback = pool.length > 0 ? pool : ctx.recipes.filter((r) => r.ingredients.length > 0);
  const picked: Recipe[] = [];
  const entries: PlanEntry[] = [];

  for (const days of slots) {
    const fresh = fallback.filter((r) => !picked.includes(r));
    const options = fresh.length > 0 ? fresh : fallback;
    let best: Recipe | undefined;
    let bestScore = -Infinity;
    for (const recipe of options) {
      const score = baseScore(recipe, ctx, days) - varietyPenalty(recipe, picked) + rng() * 2.5;
      if (score > bestScore) {
        bestScore = score;
        best = recipe;
      }
    }
    if (!best) continue;
    picked.push(best);
    entries.push({ id: newEntryId(), recipeId: best.id, days });
  }

  fitToBudget(entries, ctx);
  return { createdAt: Date.now(), entries };
}

/** Swaps the priciest picks for cheaper eligible recipes until the plan fits the budget. */
export function fitToBudget(entries: PlanEntry[], ctx: PlannerContext): void {
  const budget = ctx.profile.budget;
  if (!budget) return;
  const pool = eligibleRecipes(ctx);
  let total = planCost(entries, ctx);
  for (let guard = 0; guard < 30 && total > budget; guard++) {
    const used = new Set(entries.map((e) => e.recipeId));
    let best: { entry: PlanEntry; recipe: Recipe; saving: number } | undefined;
    for (const entry of entries) {
      const current = ctx.recipes.find((r) => r.id === entry.recipeId);
      if (!current) continue;
      const servings = servingsFor(entry, ctx.profile.people);
      const currentCost = recipeCost(current, servings, ctx.marketIndex);
      for (const recipe of pool) {
        if (used.has(recipe.id)) continue;
        if (entry.days.length > 1 && !recipe.batch) continue;
        const saving = currentCost - recipeCost(recipe, servings, ctx.marketIndex);
        if (saving > 0.5 && (!best || saving > best.saving)) best = { entry, recipe, saving };
      }
    }
    if (!best) break;
    best.entry.recipeId = best.recipe.id;
    total -= best.saving;
  }
}

export interface Suggestion {
  recipe: Recipe;
  delta: number;
}

/** Alternatives for one plan entry, best matches first. */
export function swapOptions(ctx: PlannerContext, plan: Plan, entry: PlanEntry, limit = 8): Suggestion[] {
  const current = ctx.recipes.find((r) => r.id === entry.recipeId);
  const servings = servingsFor(entry, ctx.profile.people);
  const currentCost = current ? recipeCost(current, servings, ctx.marketIndex) : 0;
  const inPlan = new Set(plan.entries.map((e) => e.recipeId));
  const others = plan.entries
    .filter((e) => e.id !== entry.id)
    .map((e) => ctx.recipes.find((r) => r.id === e.recipeId))
    .filter((r): r is Recipe => Boolean(r));
  return eligibleRecipes(ctx)
    .filter((r) => !inPlan.has(r.id))
    .map((recipe) => ({
      recipe,
      delta: recipeCost(recipe, servings, ctx.marketIndex) - currentCost,
      score: baseScore(recipe, ctx, entry.days) - varietyPenalty(recipe, others),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ recipe, delta }) => ({ recipe, delta }));
}

/** Recipes for the swipe deck, in a pleasant but varied order. */
export function deckOrder(ctx: PlannerContext, seed: number): Recipe[] {
  const rng = mulberry32(seed);
  return eligibleRecipes(ctx)
    .map((recipe) => ({ recipe, score: baseScore(recipe, ctx, [0]) + rng() * 3 }))
    .sort((a, b) => b.score - a.score)
    .map((x) => x.recipe);
}
