import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { getMarket } from '../data/markets';
import type { ApplianceId, Plan, PlanEntry, PrefId, Profile, Recipe } from '../data/types';
import { buildSlots, fitToBudget, generatePlan, newEntryId, type PlannerContext } from '../lib/planner';
import { allRecipes } from '../lib/recipes';
import { safeStorage } from './safeStorage';

export const DEFAULT_PROFILE: Profile = {
  marketId: null,
  customMarketName: '',
  budget: null,
  people: 2,
  dinners: 7,
  batch: true,
  prefs: [],
  appliances: [],
};

export function suggestedBudget(people: number): number {
  return Math.round((100 + people * 75) / 10) * 10;
}

interface AppState {
  onboarded: boolean;
  profile: Profile;
  plan: Plan | null;
  liked: string[];
  disliked: string[];
  checked: Record<string, boolean>;
  customItems: { id: string; name: string }[];
  imported: Recipe[];
  /** Community recipes the user saved or put on the plan (kept for offline use). */
  community: Recipe[];

  setMarket: (marketId: string, customName?: string) => void;
  setBudget: (budget: number) => void;
  setHousehold: (patch: Partial<Pick<Profile, 'people' | 'dinners' | 'batch' | 'prefs'>>) => void;
  togglePref: (pref: PrefId) => void;
  setAppliances: (appliances: ApplianceId[]) => void;
  toggleAppliance: (id: ApplianceId) => void;

  completeOnboarding: () => void;
  regeneratePlan: () => void;
  fitPlanToBudget: () => void;
  setPlanEntries: (entries: PlanEntry[]) => void;
  replaceRecipe: (entryId: string, recipeId: string) => void;
  putRecipeOnDay: (recipeId: string, day: number) => void;

  toggleLike: (recipeId: string) => void;
  toggleDislike: (recipeId: string) => void;

  toggleChecked: (key: string) => void;
  clearChecked: () => void;
  addCustomItem: (name: string) => void;
  removeCustomItem: (id: string) => void;

  saveImported: (recipe: Recipe) => void;
  deleteImported: (recipeId: string) => void;
  rememberRecipe: (recipe: Recipe) => void;
  forgetRecipe: (recipeId: string) => void;

  reset: () => void;
}

export function plannerContext(
  state: Pick<AppState, 'profile' | 'liked' | 'disliked' | 'imported' | 'community'>,
): PlannerContext {
  return {
    recipes: allRecipes(state.imported, state.community),
    profile: state.profile,
    liked: state.liked,
    disliked: state.disliked,
    marketIndex: getMarket(state.profile.marketId)?.index ?? 1,
  };
}

const INITIAL = {
  onboarded: false,
  profile: DEFAULT_PROFILE,
  plan: null as Plan | null,
  liked: [] as string[],
  disliked: [] as string[],
  checked: {} as Record<string, boolean>,
  customItems: [] as { id: string; name: string }[],
  imported: [] as Recipe[],
  community: [] as Recipe[],
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...INITIAL,

      setMarket: (marketId, customName) =>
        set((s) => ({ profile: { ...s.profile, marketId, customMarketName: customName ?? s.profile.customMarketName } })),

      setBudget: (budget) => set((s) => ({ profile: { ...s.profile, budget } })),

      setHousehold: (patch) => set((s) => ({ profile: { ...s.profile, ...patch } })),

      togglePref: (pref) =>
        set((s) => {
          const has = s.profile.prefs.includes(pref);
          return {
            profile: { ...s.profile, prefs: has ? s.profile.prefs.filter((p) => p !== pref) : [...s.profile.prefs, pref] },
          };
        }),

      setAppliances: (appliances) => set((s) => ({ profile: { ...s.profile, appliances } })),

      toggleAppliance: (id) =>
        set((s) => {
          const has = s.profile.appliances.includes(id);
          const appliances = has ? s.profile.appliances.filter((a) => a !== id) : [...s.profile.appliances, id];
          return { profile: { ...s.profile, appliances } };
        }),

      completeOnboarding: () => {
        const plan = generatePlan(plannerContext(get()));
        set({ plan, onboarded: true, checked: {} });
      },

      regeneratePlan: () => {
        const plan = generatePlan(plannerContext(get()));
        set({ plan, checked: {} });
      },

      fitPlanToBudget: () => {
        const { plan } = get();
        if (!plan) return;
        const entries = plan.entries.map((e) => ({ ...e }));
        fitToBudget(entries, plannerContext(get()));
        set({ plan: { ...plan, entries } });
      },

      setPlanEntries: (entries) => set({ plan: { createdAt: Date.now(), entries }, checked: {} }),

      replaceRecipe: (entryId, recipeId) =>
        set((s) =>
          s.plan ? { plan: { ...s.plan, entries: s.plan.entries.map((e) => (e.id === entryId ? { ...e, recipeId } : e)) } } : {},
        ),

      putRecipeOnDay: (recipeId, day) =>
        set((s) => {
          const entries = s.plan?.entries ?? [];
          const existing = entries.find((e) => e.days.includes(day));
          if (existing) {
            return {
              plan: {
                createdAt: s.plan?.createdAt ?? Date.now(),
                entries: entries.map((e) => (e === existing ? { ...e, recipeId } : e)),
              },
            };
          }
          const next = [...entries, { id: newEntryId(), recipeId, days: [day] }].sort((a, b) => a.days[0] - b.days[0]);
          return { plan: { createdAt: s.plan?.createdAt ?? Date.now(), entries: next } };
        }),

      toggleLike: (recipeId) =>
        set((s) => ({
          liked: s.liked.includes(recipeId) ? s.liked.filter((id) => id !== recipeId) : [...s.liked, recipeId],
          disliked: s.disliked.filter((id) => id !== recipeId),
        })),

      toggleDislike: (recipeId) =>
        set((s) => ({
          disliked: s.disliked.includes(recipeId) ? s.disliked.filter((id) => id !== recipeId) : [...s.disliked, recipeId],
          liked: s.liked.filter((id) => id !== recipeId),
        })),

      toggleChecked: (key) => set((s) => ({ checked: { ...s.checked, [key]: !s.checked[key] } })),

      clearChecked: () => set({ checked: {} }),

      addCustomItem: (name) =>
        set((s) => ({ customItems: [...s.customItems, { id: Date.now().toString(36), name: name.trim() }] })),

      removeCustomItem: (id) => set((s) => ({ customItems: s.customItems.filter((c) => c.id !== id) })),

      saveImported: (recipe) => set((s) => ({ imported: [recipe, ...s.imported.filter((r) => r.id !== recipe.id)] })),

      deleteImported: (recipeId) =>
        set((s) => ({
          imported: s.imported.filter((r) => r.id !== recipeId),
          plan: s.plan ? { ...s.plan, entries: s.plan.entries.filter((e) => e.recipeId !== recipeId) } : s.plan,
        })),

      rememberRecipe: (recipe) => set((s) => ({ community: [recipe, ...s.community.filter((r) => r.id !== recipe.id)] })),

      // Keeps the copy while the plan still uses it.
      forgetRecipe: (recipeId) =>
        set((s) =>
          s.plan?.entries.some((e) => e.recipeId === recipeId) ? {} : { community: s.community.filter((r) => r.id !== recipeId) },
        ),

      reset: () => set({ ...INITIAL }),
    }),
    {
      name: 'salsa-app',
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => ({
        onboarded: s.onboarded,
        profile: s.profile,
        plan: s.plan,
        liked: s.liked,
        disliked: s.disliked,
        checked: s.checked,
        customItems: s.customItems,
        imported: s.imported,
        community: s.community,
      }),
    },
  ),
);

/** Number of cooking sessions the current settings produce. */
export function slotCount(profile: Profile): number {
  return buildSlots(profile.dinners, profile.batch).length;
}
