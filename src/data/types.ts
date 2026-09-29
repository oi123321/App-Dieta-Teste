import type { EmojiName } from './emoji';

export type ApplianceId = 'fogao' | 'forno' | 'microondas' | 'airfryer' | 'pressao' | 'liquidificador' | 'grill';

export type Unit = 'g' | 'ml' | 'un' | 'dente' | 'maco' | 'lata';

export type Aisle =
  | 'hortifruti'
  | 'acougue'
  | 'frios'
  | 'padaria'
  | 'mercearia'
  | 'temperos'
  | 'congelados'
  | 'outros'
  | 'despensa';

export type IngredientFlag = 'carne' | 'peixe' | 'lactose' | 'gluten';

export interface Ingredient {
  id: string;
  name: string;
  icon: EmojiName;
  aisle: Aisle;
  unit: Unit;
  /** Price in BRL for `per` units (e.g. 21.9 per 1000 g). */
  price: number;
  per: number;
  /** [kcal, protein g, carbs g, fat g] per 100 g/ml, or per unit for counted units. */
  n: [number, number, number, number];
  flags?: IngredientFlag[];
  /** Kitchen basics most people already have (salt, oil…). */
  pantry?: boolean;
}

export interface RecipeIngredient {
  id: string;
  qty: number;
  note?: string;
}

/** Free-text ingredient line from an imported recipe that did not match the catalog. */
export interface LooseIngredient {
  text: string;
}

export type TagId = 'rapido' | 'leve' | 'proteico' | 'conforto' | 'vegetariano' | 'economico' | 'marmita';

export type PrefId = 'vegetariano' | 'sem_lactose' | 'sem_gluten' | 'proteico' | 'low_carb';

export interface Macros {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

/** Each entry is required; an array entry means "any of these". */
export type ApplianceNeed = ApplianceId | ApplianceId[];

export interface RecipeSource {
  platform: 'tiktok' | 'instagram' | 'link';
  url: string;
  author?: string;
}

export interface Recipe {
  id: string;
  title: string;
  minutes: number;
  /** Quantities below are for this many servings. */
  servings: number;
  ingredients: RecipeIngredient[];
  extras?: LooseIngredient[];
  steps: string[];
  appliances: ApplianceNeed[];
  /** Per serving. Estimated from the ingredient catalog when omitted. */
  macros?: Macros;
  /** Hand-picked tags; the rest are derived from the data. */
  tags?: TagId[];
  /** Keeps well, so it can be cooked once and eaten on two days. */
  batch?: boolean;
  source?: RecipeSource;
  /** Remote cover (imported recipes). Built-in recipes use bundled art. */
  imageUrl?: string;
  imported?: boolean;
}

export interface Market {
  id: string;
  name: string;
  short: string;
  kind: 'atacarejo' | 'supermercado' | 'premium' | 'outro';
  /** Price multiplier relative to the catalog baseline. */
  index: number;
  region?: string;
  color: string;
}

export interface PlanEntry {
  id: string;
  recipeId: string;
  /** Day indexes, 0 = Monday. Two days means batch cooking (servings = people × days). */
  days: number[];
}

export interface Plan {
  createdAt: number;
  entries: PlanEntry[];
}

export interface Profile {
  marketId: string | null;
  customMarketName: string;
  budget: number | null;
  people: number;
  dinners: number;
  batch: boolean;
  prefs: PrefId[];
  appliances: ApplianceId[];
}
