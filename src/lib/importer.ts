import { getIngredient } from '../data/ingredients';
import type { LooseIngredient, Recipe, RecipeIngredient, RecipeSource } from '../data/types';

export type SourcePlatform = RecipeSource['platform'];

export function extractUrl(text: string): string | null {
  const match = text.match(/https?:\/\/[^\s<>"']+/i);
  return match ? match[0].replace(/[),.;!?]+$/, '') : null;
}

function hostOf(url: string): string {
  const match = url.match(/^https?:\/\/([^/?#]+)/i);
  return match ? match[1].toLowerCase() : '';
}

export function detectPlatform(url: string): SourcePlatform {
  const host = hostOf(url);
  if (host === 'tiktok.com' || host.endsWith('.tiktok.com')) return 'tiktok';
  if (host === 'instagram.com' || host.endsWith('.instagram.com') || host === 'instagr.am') return 'instagram';
  return 'link';
}

export interface LinkPreview {
  caption?: string;
  author?: string;
  thumbnail?: string;
}

/**
 * TikTok exposes a public oEmbed endpoint with the caption and thumbnail.
 * Instagram requires an authenticated Graph API app, so it falls back to manual entry.
 */
export async function fetchPreview(url: string, platform: SourcePlatform): Promise<LinkPreview> {
  if (platform !== 'tiktok') return {};
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`, {
      signal: controller.signal,
    });
    if (!res.ok) return {};
    const data = (await res.json()) as { title?: string; author_name?: string; thumbnail_url?: string };
    return { caption: data.title, author: data.author_name, thumbnail: data.thumbnail_url };
  } catch {
    return {};
  } finally {
    clearTimeout(timer);
  }
}

const ACCENTS: Record<string, string> = {
  á: 'a',
  à: 'a',
  â: 'a',
  ã: 'a',
  ä: 'a',
  é: 'e',
  è: 'e',
  ê: 'e',
  ë: 'e',
  í: 'i',
  ì: 'i',
  î: 'i',
  ï: 'i',
  ó: 'o',
  ò: 'o',
  ô: 'o',
  õ: 'o',
  ö: 'o',
  ú: 'u',
  ù: 'u',
  û: 'u',
  ü: 'u',
  ç: 'c',
  ñ: 'n',
};

export function normalize(text: string, keepSlash = false): string {
  return text
    .toLowerCase()
    .replace(/[áàâãäéèêëíìîïóòôõöúùûüçñ]/g, (c) => ACCENTS[c] ?? c)
    .replace(keepSlash ? /[-_]/g : /[-_/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Strips bullets, emoji and other decorations from the start of a caption line. */
function cleanLine(line: string): string {
  return line
    .replace(/#[^\s#]+/g, '')
    .replace(/^[^0-9A-Za-zÀ-ÿ½¼¾⅓⅔]+/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const INGREDIENT_HEADER = /^(ingredientes?|voce vai precisar|lista de compras|o que vai)\b/;
const STEPS_HEADER = /^(modo de preparo|preparo|como fazer|passo a passo|instrucoes|modo de fazer)\b/;
const QTY_START = /^(\d|½|¼|¾|⅓|⅔|meia |meio |uma |um |duas |dois |tres |quatro |cinco |seis )/;
const UNIT_WORD =
  /\b(kg|g|gr|gramas?|ml|l|litros?|xicaras?|colher(es)?|cs|cc|unidades?|dentes?|latas?|macos?|pitadas?|fatias?|files?|postas?|pacotes?|potes?|caixinhas?|copos?|a gosto)\b/;

export interface ParsedCaption {
  title?: string;
  ingredients: string[];
  steps: string[];
}

export function parseCaption(caption: string): ParsedCaption {
  let lines = caption
    .split(/\r?\n|\s[•|]\s|;\s/)
    .map(cleanLine)
    .filter((l) => l.length > 1);
  // Single-line captions: try splitting a comma separated ingredient list.
  if (lines.length === 1 && lines[0].split(',').length >= 4) {
    const [head, ...rest] = lines[0].split(':');
    lines = rest.length ? [head, ...rest.join(':').split(',')].map(cleanLine) : lines[0].split(',').map(cleanLine);
  }

  const result: ParsedCaption = { ingredients: [], steps: [] };
  let mode: 'intro' | 'ingredients' | 'steps' = 'intro';
  for (const line of lines) {
    const norm = normalize(line);
    if (INGREDIENT_HEADER.test(norm)) {
      mode = 'ingredients';
      const after = line.split(':').slice(1).join(':').trim();
      if (after) result.ingredients.push(...after.split(',').map(cleanLine).filter(Boolean));
      continue;
    }
    if (STEPS_HEADER.test(norm)) {
      mode = 'steps';
      continue;
    }
    const looksLikeIngredient = QTY_START.test(norm) && (UNIT_WORD.test(norm) || norm.split(' ').length <= 6);
    if (mode === 'ingredients' || (mode === 'intro' && looksLikeIngredient)) {
      if (mode === 'intro') mode = 'ingredients';
      if (!looksLikeIngredient && norm.split(' ').length > 9) {
        mode = 'steps';
        result.steps.push(line);
      } else {
        result.ingredients.push(line);
      }
    } else if (mode === 'steps') {
      result.steps.push(line.replace(/^\d+[.)-]\s*/, ''));
    } else if (!result.title) {
      // Cut at the first sentence break or emoji ("Frango cremoso 🔥 Receita fácil…" → "Frango cremoso").
      result.title = line
        .split(/[.!?|:]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF]/)[0]
        .slice(0, 70)
        .trim();
    }
  }
  return result;
}

// Longer aliases first so "batata doce" wins over "batata" and "leite de coco" over "leite".
const ALIASES: [string, string][] = (
  [
    ['peito de frango', 'peito_frango'],
    ['file de frango', 'peito_frango'],
    ['frango', 'peito_frango'],
    ['sobrecoxa', 'peito_frango'],
    ['carne moida', 'carne_moida'],
    ['patinho', 'carne_moida'],
    ['acem', 'acem'],
    ['musculo', 'acem'],
    ['alcatra', 'alcatra'],
    ['contra file', 'alcatra'],
    ['carne', 'acem'],
    ['calabresa', 'calabresa'],
    ['linguica', 'calabresa'],
    ['bacon', 'bacon'],
    ['tilapia', 'tilapia'],
    ['peixe', 'tilapia'],
    ['salmao', 'salmao'],
    ['camarao', 'camarao'],
    ['camaroes', 'camarao'],
    ['atum', 'atum'],
    ['batata doce', 'batata_doce'],
    ['batatas doces', 'batata_doce'],
    ['batatas doce', 'batata_doce'],
    ['batata palha', 'batata_palha'],
    ['batatas', 'batata'],
    ['batata', 'batata'],
    ['mandioca', 'mandioca'],
    ['aipim', 'mandioca'],
    ['macaxeira', 'mandioca'],
    ['abobora', 'abobora'],
    ['cebolas', 'cebola'],
    ['cebola', 'cebola'],
    ['alho', 'alho'],
    ['tomate cereja', 'tomate_cereja'],
    ['tomatinhos', 'tomate_cereja'],
    ['extrato de tomate', 'extrato_tomate'],
    ['molho de tomate', 'molho_tomate'],
    ['passata', 'molho_tomate'],
    ['tomates', 'tomate'],
    ['tomate', 'tomate'],
    ['cenouras', 'cenoura'],
    ['cenoura', 'cenoura'],
    ['pimentao', 'pimentao'],
    ['abobrinha', 'abobrinha'],
    ['brocolis', 'brocolis'],
    ['espinafre', 'espinafre'],
    ['couve', 'couve'],
    ['alface', 'alface'],
    ['rucula', 'rucula'],
    ['repolho', 'repolho'],
    ['pepino', 'pepino'],
    ['limoes', 'limao'],
    ['limao', 'limao'],
    ['gengibre', 'gengibre'],
    ['cheiro verde', 'cheiro_verde'],
    ['salsinha', 'cheiro_verde'],
    ['cebolinha', 'cheiro_verde'],
    ['coentro', 'coentro'],
    ['manjericao', 'manjericao'],
    ['cogumelos', 'cogumelo'],
    ['cogumelo', 'cogumelo'],
    ['champignon', 'cogumelo'],
    ['shimeji', 'cogumelo'],
    ['abacate', 'abacate'],
    ['pimenta dedo de moca', 'pimenta_dedo'],
    ['pimenta calabresa', 'pimenta_calabresa'],
    ['pimenta do reino', 'pimenta_reino'],
    ['ovos', 'ovo'],
    ['ovo', 'ovo'],
    ['mussarela', 'mucarela'],
    ['mucarela', 'mucarela'],
    ['muzzarella', 'mucarela'],
    ['queijo coalho', 'queijo_coalho'],
    ['parmesao', 'parmesao'],
    ['queijo', 'mucarela'],
    ['requeijao', 'requeijao'],
    ['cream cheese', 'requeijao'],
    ['creme de leite', 'creme_leite'],
    ['leite de coco', 'leite_coco'],
    ['leite', 'leite'],
    ['iogurte', 'iogurte'],
    ['manteiga', 'manteiga'],
    ['tortilhas', 'tortilha'],
    ['tortilha', 'tortilha'],
    ['rap10', 'tortilha'],
    ['pao folha', 'tortilha'],
    ['pao de hamburguer', 'pao_hamburguer'],
    ['arroz arboreo', 'arroz_arboreo'],
    ['arroz', 'arroz'],
    ['feijao preto', 'feijao_preto'],
    ['feijao', 'feijao_carioca'],
    ['grao de bico', 'grao_bico'],
    ['lentilha', 'lentilha'],
    ['espaguete', 'espaguete'],
    ['macarrao', 'espaguete'],
    ['penne', 'espaguete'],
    ['talharim', 'espaguete'],
    ['farinha de mandioca', 'farinha_mandioca'],
    ['farofa', 'farinha_mandioca'],
    ['farinha de trigo', 'farinha_trigo'],
    ['farinha', 'farinha_trigo'],
    ['fermento', 'fermento'],
    ['milho', 'milho'],
    ['ervilha', 'ervilha'],
    ['azeitonas', 'azeitona'],
    ['azeitona', 'azeitona'],
    ['mel', 'mel'],
    ['gergelim', 'gergelim'],
    ['caldo', 'caldo_legumes'],
    ['shoyu', 'shoyu'],
    ['molho de soja', 'shoyu'],
    ['mostarda', 'mostarda'],
    ['azeite de dende', 'dende'],
    ['dende', 'dende'],
    ['curry', 'curry'],
    ['paprica', 'paprica'],
    ['cominho', 'cominho'],
    ['oregano', 'oregano'],
    ['sal', 'sal'],
    ['azeite', 'azeite'],
    ['oleo', 'oleo'],
  ] as [string, string][]
).sort((a, b) => b[0].length - a[0].length);

/** Every alias (normalized) that maps to catalog ingredient `id`. */
export function aliasesFor(id: string): string[] {
  return ALIASES.filter(([, target]) => target === id).map(([alias]) => alias);
}

export function matchIngredient(name: string): string | undefined {
  const padded = ` ${normalize(name)} `;
  return ALIASES.find(([alias]) => padded.includes(` ${alias} `))?.[1];
}

const NUMBER_WORDS: Record<string, number> = {
  meia: 0.5,
  meio: 0.5,
  uma: 1,
  um: 1,
  duas: 2,
  dois: 2,
  tres: 3,
  quatro: 4,
  cinco: 5,
  seis: 6,
};
const FRACTION_CHARS: Record<string, number> = { '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 0.33, '⅔': 0.67 };

/** Grams in one "piece" of produce/protein, used to convert between counts and weight. */
const GRAMS_PER_PIECE: Record<string, number> = {
  batata: 170,
  batata_doce: 250,
  mandioca: 400,
  abobora: 1200,
  peito_frango: 180,
  tilapia: 120,
  salmao: 180,
  carne_moida: 500,
  acem: 500,
  alcatra: 500,
  calabresa: 250,
  bacon: 250,
  brocolis: 350,
  repolho: 900,
  cogumelo: 200,
  tomate_cereja: 250,
  mucarela: 20,
  queijo_coalho: 60,
  parmesao: 50,
  requeijao: 200,
  creme_leite: 200,
  iogurte: 170,
  espaguete: 500,
  molho_tomate: 300,
  extrato_tomate: 140,
  grao_bico: 400,
  cebola: 150,
  tomate: 120,
  cenoura: 100,
  pimentao: 150,
  abobrinha: 250,
  pepino: 200,
  limao: 80,
  alho: 5,
  abacate: 300,
  ovo: 50,
  alface: 300,
};
const GRAMS_PER_CUP: Record<string, number> = {
  arroz: 185,
  arroz_arboreo: 190,
  farinha_trigo: 120,
  farinha_mandioca: 140,
  feijao_carioca: 180,
  feijao_preto: 180,
  lentilha: 190,
  grao_bico: 160,
  parmesao: 80,
  mucarela: 110,
  batata_palha: 40,
};

export type ParsedUnit = 'g' | 'kg' | 'ml' | 'l' | 'cup' | 'tbsp' | 'tsp' | 'pinch' | 'piece';

export interface ParsedQty {
  value?: number;
  unit?: ParsedUnit;
  /** The unit as written, normalized (e.g. "dentes", "colheres de sopa"). */
  unitWord?: string;
  rest: string;
}

export function parseQuantity(line: string): ParsedQty {
  let rest = normalize(line.replace(/(\d),(\d)/g, '$1.$2'), true);
  let value: number | undefined;
  const num = rest.match(/^(\d+)\s+(\d+)\/(\d+)|^(\d+)\/(\d+)|^(\d+(?:\.\d+)?)/);
  if (num) {
    if (num[1]) value = Number(num[1]) + Number(num[2]) / Number(num[3]);
    else if (num[4]) value = Number(num[4]) / Number(num[5]);
    else value = Number(num[6]);
    rest = rest.slice(num[0].length).trim();
    const tail = rest.charAt(0);
    if (tail in FRACTION_CHARS) {
      value += FRACTION_CHARS[tail];
      rest = rest.slice(1).trim();
    }
  } else {
    const word = rest.split(' ')[0];
    if (word in NUMBER_WORDS) {
      value = NUMBER_WORDS[word];
      rest = rest.slice(word.length).trim();
    }
  }
  const frac = line.trim().charAt(0);
  if (value === undefined && frac in FRACTION_CHARS) {
    value = FRACTION_CHARS[frac];
    rest = normalize(line.trim().slice(1), true);
  }
  const units: [RegExp, ParsedQty['unit']][] = [
    [/^(kg|quilos?)\b/, 'kg'],
    [/^(g|gr|gramas?)\b/, 'g'],
    [/^(ml|mililitros?)\b/, 'ml'],
    [/^(l|litros?)\b/, 'l'],
    [/^(xicaras?|xic|copos?)( \(?(de )?(cha|chá)\)?)?\b/, 'cup'],
    [/^(colher(es)? (de )?sopa|cs|colher(es)?)\b/, 'tbsp'],
    [/^(colher(es)? (de )?cha|cc)\b/, 'tsp'],
    [/^(pitadas?)\b/, 'pinch'],
    [/^(unidades?|un|dentes?|latas?|macos?|fatias?|files?|postas?|pacotes?|potes?|caixinhas?|bandejas?)\b/, 'piece'],
  ];
  let unit: ParsedQty['unit'];
  let unitWord: string | undefined;
  for (const [re, u] of units) {
    const m = rest.match(re);
    if (m) {
      unit = u;
      unitWord = m[0];
      rest = rest.slice(m[0].length).trim();
      break;
    }
  }
  rest = rest.replace(/^(de|da|do|das|dos)\s+/, '');
  return { value, unit, unitWord, rest };
}

/**
 * Converts an amount in a kitchen unit to the catalog unit of ingredient `id`
 * (grams, ml or pieces). `value` undefined means "a gosto" / unspecified.
 */
export function toCatalogQty(id: string, value: number | undefined, unit: ParsedUnit | undefined): number | undefined {
  const ingredient = getIngredient(id);
  if (!ingredient) return undefined;
  const piece = GRAMS_PER_PIECE[id] ?? 100;
  const amount = value ?? (unit ? 1 : undefined);
  let qty: number;
  if (ingredient.unit === 'g' || ingredient.unit === 'ml') {
    const cup = ingredient.unit === 'ml' ? 240 : (GRAMS_PER_CUP[id] ?? 150);
    const seasoning = ingredient.pantry || ingredient.aisle === 'temperos';
    if (amount === undefined && seasoning) return ingredient.unit === 'ml' ? 10 : 2;
    const base = amount ?? 1;
    switch (unit) {
      case 'kg':
      case 'l':
        qty = base * 1000;
        break;
      case 'g':
      case 'ml':
        qty = base;
        break;
      case 'cup':
        qty = base * cup;
        break;
      case 'tbsp':
        qty = base * 15;
        break;
      case 'tsp':
        qty = base * 5;
        break;
      case 'pinch':
        qty = base;
        break;
      default:
        qty = base * (ingredient.unit === 'ml' ? 200 : piece);
    }
  } else {
    const base = amount ?? 1;
    qty = unit === 'g' || unit === 'kg' ? Math.max(0.5, ((unit === 'kg' ? 1000 : 1) * base) / piece) : base;
  }
  return Math.round(qty * 100) / 100;
}

/** Converts a free-text line to a catalog ingredient with a quantity in the catalog's unit. */
export function parseIngredientLine(line: string): RecipeIngredient | LooseIngredient {
  const text = line.trim();
  const { value, unit, rest } = parseQuantity(text);
  const id = matchIngredient(rest) ?? matchIngredient(text);
  const qty = id ? toCatalogQty(id, value, unit) : undefined;
  if (!id || qty === undefined) return { text };
  return { id, qty, note: text };
}

export interface ImportDraft {
  title: string;
  minutes: string;
  servings: string;
  ingredientsText: string;
  stepsText: string;
  url: string;
  platform: SourcePlatform;
  author?: string;
  thumbnail?: string;
}

export function draftFromPreview(url: string, platform: SourcePlatform, preview: LinkPreview): ImportDraft {
  const parsed = preview.caption ? parseCaption(preview.caption) : { ingredients: [], steps: [] as string[] };
  const fallbackTitle =
    platform === 'tiktok' ? 'Receita do TikTok' : platform === 'instagram' ? 'Receita do Instagram' : 'Receita importada';
  return {
    title: 'title' in parsed && parsed.title ? parsed.title : fallbackTitle,
    minutes: '30',
    servings: '2',
    ingredientsText: parsed.ingredients.join('\n'),
    stepsText: parsed.steps.join('\n'),
    url,
    platform,
    author: preview.author,
    thumbnail: preview.thumbnail,
  };
}

export function recipeFromDraft(draft: ImportDraft): Recipe {
  const merged = new Map<string, number>();
  const extras: LooseIngredient[] = [];
  for (const line of draft.ingredientsText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)) {
    const parsed = parseIngredientLine(line);
    if ('id' in parsed) merged.set(parsed.id, (merged.get(parsed.id) ?? 0) + parsed.qty);
    else extras.push(parsed);
  }
  const minutes = Math.max(5, Math.min(240, parseInt(draft.minutes, 10) || 30));
  const servings = Math.max(1, Math.min(12, parseInt(draft.servings, 10) || 2));
  return {
    id: `imp-${Date.now().toString(36)}`,
    title: draft.title.trim() || 'Receita importada',
    minutes,
    servings,
    ingredients: [...merged].map(([id, qty]) => ({ id, qty })),
    extras,
    steps: draft.stepsText
      .split('\n')
      .map((l) => l.replace(/^\d+[.)-]\s*/, '').trim())
      .filter(Boolean),
    appliances: [],
    batch: false,
    imported: true,
    imageUrl: draft.thumbnail,
    source: { platform: draft.platform, url: draft.url, author: draft.author },
  };
}
