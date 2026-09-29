import { useMemo } from 'react';

import { getMarket, marketLabel } from '../data/markets';
import type { Recipe } from '../data/types';
import { planCost } from '../lib/planner';
import { allRecipes, findRecipe } from '../lib/recipes';
import { buildShoppingList } from '../lib/shopping';
import { plannerContext, useAppStore } from './useAppStore';

export function useMarketInfo() {
  const marketId = useAppStore((s) => s.profile.marketId);
  const customName = useAppStore((s) => s.profile.customMarketName);
  return useMemo(() => {
    const market = getMarket(marketId);
    return { market, index: market?.index ?? 1, label: marketLabel(marketId, customName) };
  }, [marketId, customName]);
}

export function useRecipeLookup() {
  const imported = useAppStore((s) => s.imported);
  return useMemo(() => {
    const all = allRecipes(imported);
    return { all, find: (id: string): Recipe | undefined => findRecipe(id, imported) };
  }, [imported]);
}

export function usePlannerContext() {
  const profile = useAppStore((s) => s.profile);
  const liked = useAppStore((s) => s.liked);
  const disliked = useAppStore((s) => s.disliked);
  const imported = useAppStore((s) => s.imported);
  return useMemo(() => plannerContext({ profile, liked, disliked, imported }), [profile, liked, disliked, imported]);
}

export function usePlanCost() {
  const plan = useAppStore((s) => s.plan);
  const ctx = usePlannerContext();
  return useMemo(() => (plan ? planCost(plan.entries, ctx) : 0), [plan, ctx]);
}

export function useShoppingList() {
  const plan = useAppStore((s) => s.plan);
  const people = useAppStore((s) => s.profile.people);
  const customItems = useAppStore((s) => s.customItems);
  const { find } = useRecipeLookup();
  const { index } = useMarketInfo();
  return useMemo(() => buildShoppingList(plan, find, people, index, customItems), [plan, find, people, index, customItems]);
}
