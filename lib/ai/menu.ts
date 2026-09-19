import "server-only";
import { FOODS, getFood } from "@/lib/data/foods";
import { generateJson, isGeminiEnabled, Type } from "@/lib/ai/gemini";
import { scoreFood, type ScoringContext } from "@/lib/scoring/compatibility";
import type { Food, MenuScanItem, MenuScanResult, TraitId } from "@/lib/types";

/* ------------------------------------------------------------------ *
 * Ingredient / trait inference
 *
 * Menus rarely list ingredients, so we read the language they do use.
 * Gemini fills in more when a key is available; this map is what keeps
 * the feature working when it is not.
 * ------------------------------------------------------------------ */

const KEYWORD_TRAITS: [RegExp, TraitId[]][] = [
  [/\b(fried|deep[- ]fried|crispy|tempura|battered|katsu|schnitzel)\b/i, ["fried", "high-fat"]],
  [/\b(cream|creamy|alfredo|cheese|cheddar|mozzarella|parmesan|queso|butter|milk|yogurt|custard|gelato|ice cream|crema|ranch|aioli)s?\b/i, ["lactose", "high-fat"]],
  [/\b(spicy|chili|chile|jalapen|sriracha|buffalo|cajun|szechuan|kimchi|harissa|arrabbiata|hot sauce|peri[- ]peri)\w*/i, ["spicy"]],
  [/\b(bread|bun|baguette|pasta|spaghetti|penne|flour tortilla|breaded|panko|couscous|barley|pita|naan|crouton|soy sauce|phyllo|filo)s?\b/i, ["gluten"]],
  [/\b(nut|almond|peanut|cashew|walnut|pecan|pistachio|sesame|seed|granola|tahini)s?\b/i, ["seeds-nuts"]],
  [/\b(raw|salad|slaw|ceviche|tartare|crudo|sashimi|carpaccio|tabbouleh|fattoush)s?\b/i, ["raw"]],
  [/\b(kale|broccoli|cabbage|cauliflower|brussels|arugula|romaine|radish)\w*/i, ["cruciferous", "insoluble-fiber"]],
  [/\b(bean|chickpea|lentil|hummus|edamame|falafel|refried)s?\b/i, ["high-fodmap", "high-fiber"]],
  [/\b(onion|garlic|shallot|leek|scallion)s?\b/i, ["high-fodmap"]],
  [/\b(tomato|marinara|lemon|lime|vinegar|vinaigrette|citrus|pickled|sumac|kimchi)\w*/i, ["acidic"]],
  [/\b(white rice|jasmine rice|basmati|steamed rice|rice pilaf|congee|jook|rice noodle|vermicelli|mashed potato|polenta|grits)s?\b/i, ["low-residue", "cooked-soft"]],
  [/\b(grilled|roasted|baked|steamed|poached|braised|stewed|simmered|pur[eé]ed|marinated)\b/i, ["cooked-soft"]],
  [/\b(salmon|tuna|mackerel|sardine|trout)s?\b/i, ["omega-3", "lean-protein"]],
  [/\b(chicken|turkey|tofu|egg|shrimp|prawn|cod|tilapia|halibut)s?\b/i, ["lean-protein"]],
  [/\b(beef|steak|lamb|pork|bacon|sausage|chorizo|brisket|burger|rib|kofta|kebab|gyro)s?\b/i, ["red-meat", "high-fat"]],
  [/\b(soup|broth|bisque|pho|ramen|consomm|stew)s?\b/i, ["hydrating", "cooked-soft"]],
  [/\b(whole wheat|whole grain|bran|quinoa|farro|brown rice|multigrain)s?\b/i, ["high-fiber", "insoluble-fiber"]],
  [/\b(corn|elote|hominy)\b/i, ["insoluble-fiber"]],
  [/\b(beer|wine|cocktail|ipa|margarita|sangria|whiskey|vodka)s?\b/i, ["alcohol"]],
  [/\b(soda|cola|sparkling|seltzer|tonic)s?\b/i, ["carbonated"]],
  [/\b(coffee|espresso|latte|cold brew|matcha)s?\b/i, ["caffeine"]],
  [/\b(avocado|guacamole)s?\b/i, ["high-fat", "high-fodmap"]],
  [/\b(mushroom|shiitake|portobello)s?\b/i, ["high-fodmap"]],
  [/\b(apple|pear|mango|watermelon|honey|agave|syrup|baklava)s?\b/i, ["high-fodmap"]],
  [/\b(sugar|dessert|cake|pastry|chocolate|caramel)s?\b/i, ["ultra-processed"]],
];

export function inferTraits(text: string): TraitId[] {
  const found = new Set<TraitId>();
  for (const [pattern, traits] of KEYWORD_TRAITS) {
    if (pattern.test(text)) traits.forEach((t) => found.add(t));
  }
  return [...found];
}

const STOP_WORDS = new Set([
  "the", "and", "with", "a", "of", "in", "on", "our", "house", "served", "fresh", "style", "side",
  "plate", "bowl", "special", "classic", "topped", "over", "your", "choice",
]);

function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

/** Finds the catalog food a menu item most resembles, if any. */
export function matchKnownFood(name: string, description: string): { food: Food; strength: number } | null {
  const itemTokens = new Set(tokens(`${name} ${description}`));
  if (itemTokens.size === 0) return null;

  let best: { food: Food; strength: number } | null = null;
  for (const food of FOODS) {
    const foodTokens = tokens([food.name, ...(food.aliases ?? []), ...food.ingredients].join(" "));
    if (foodTokens.length === 0) continue;
    const nameTokens = tokens(food.name);
    let hits = 0;
    for (const t of new Set(foodTokens)) if (itemTokens.has(t)) hits += 1;
    const nameHits = nameTokens.filter((t) => itemTokens.has(t)).length;
    const strength = (nameHits / Math.max(1, nameTokens.length)) * 0.75 + (hits / new Set(foodTokens).size) * 0.25;
    if (strength > 0.25 && (!best || strength > best.strength)) best = { food, strength };
  }
  return best;
}

/* ------------------------------------------------------------------ *
 * Extraction
 * ------------------------------------------------------------------ */

export type RawMenuItem = {
  name: string;
  description: string;
  ingredients: string[];
};

const MENU_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    restaurantName: { type: Type.STRING },
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING },
          ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["name", "description", "ingredients"],
      },
    },
  },
  required: ["items"],
};

const EXTRACT_PROMPT = `Extract every dish from this restaurant menu.

For each dish return:
- name: exactly as written on the menu
- description: the menu's own description, or a one-line description you infer from the name if the menu gives none
- ingredients: your best guess at the actual ingredients, including ones a menu would not bother listing (cooking fat, dairy in sauces, onion and garlic in bases, thickeners). Be specific and realistic. 4-10 ingredients per dish.

Skip section headings, prices, addresses and drinks-only lines like "ask your server".
Return at most 24 dishes.`;

export async function extractMenu(input: {
  text?: string;
  imageBase64?: string;
  mimeType?: string;
}): Promise<{ restaurantName?: string; items: RawMenuItem[] } | null> {
  if (!isGeminiEnabled()) return null;

  const parts: ({ text: string } | { inlineData: { mimeType: string; data: string } })[] = [
    { text: EXTRACT_PROMPT },
  ];
  if (input.imageBase64) {
    parts.push({ inlineData: { mimeType: input.mimeType ?? "image/jpeg", data: input.imageBase64 } });
  }
  if (input.text) {
    parts.push({ text: `Menu text:\n\n${input.text.slice(0, 8000)}` });
  }

  const result = await generateJson<{ restaurantName?: string; items: RawMenuItem[] }>({
    parts,
    schema: MENU_SCHEMA,
  });
  if (!result?.items?.length) return null;
  return result;
}

const PRICE = /\s*[.·•\-–—\s]*\$?\d+(\.\d{2})?\s*$/;

/** Parses pasted menu text without a model. Works well enough for typical menus. */
export function heuristicExtract(text: string): RawMenuItem[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const items: RawMenuItem[] = [];
  for (const line of lines) {
    const cleaned = line.replace(PRICE, "").trim();
    if (!cleaned || cleaned.length < 3) continue;
    // Section headings and restaurant banners are shouted in caps.
    if (!/[a-z]/.test(cleaned)) continue;

    const split = cleaned.split(/\s+[—–|]\s+|:\s+/);
    const name = (split[0] ?? cleaned).trim();
    let description = split.slice(1).join(" ").trim();

    if (!description && items.length > 0 && /^[a-z]/.test(cleaned)) {
      // A continuation line describing the dish above it.
      items[items.length - 1].description = `${items[items.length - 1].description} ${cleaned}`.trim();
      continue;
    }

    if (name.split(/\s+/).length > 12) continue;

    const match = matchKnownFood(name, description);
    if (!description && match) description = match.food.summary;

    items.push({
      name,
      description,
      ingredients: match ? match.food.ingredients : [],
    });
    if (items.length >= 24) break;
  }
  return items;
}

/* ------------------------------------------------------------------ *
 * Scoring
 * ------------------------------------------------------------------ */

function toFood(item: RawMenuItem): Food {
  const blob = `${item.name} ${item.description} ${item.ingredients.join(" ")}`;
  const match = matchKnownFood(item.name, `${item.description} ${item.ingredients.join(" ")}`);
  const inferred = inferTraits(blob);
  const traits = [...new Set([...inferred, ...(match && match.strength > 0.45 ? match.food.traits : [])])];

  // Reusing the matched food's id lets the scorer pull in real personal history.
  const useMatchId = match !== null && match.strength > 0.5;
  const base = useMatchId ? match.food : null;

  return {
    id: base ? base.id : `menu:${item.name.toLowerCase().replace(/\s+/g, "-")}`,
    slug: base ? base.slug : "",
    name: item.name,
    emoji: base?.emoji ?? "🍽️",
    category: base?.category ?? "meals",
    summary: item.description || base?.summary || "",
    servingSize: base?.servingSize ?? "1 serving",
    ingredients: item.ingredients.length > 0 ? item.ingredients : (base?.ingredients ?? []),
    nutrition: base?.nutrition ?? { calories: 0, protein: 0, carbs: 0, fiber: 0, fat: 0, sugar: 0, sodium: 0 },
    traits: traits.length > 0 ? traits : ["cooked-soft"],
    prepTips: base?.prepTips ?? [],
  };
}

export function scoreMenuItems(items: RawMenuItem[], ctx: ScoringContext): MenuScanItem[] {
  return items
    .map((item) => {
      const food = toFood(item);
      const compat = scoreFood(food, ctx);
      const known = getFood(food.id);
      return {
        name: item.name,
        description: item.description || food.summary,
        guessedIngredients: food.ingredients,
        traits: food.traits,
        compatibility: {
          ...compat,
          tips: known ? compat.tips : compat.tips.slice(0, 2),
        },
      } satisfies MenuScanItem;
    })
    .sort((a, b) => b.compatibility.score - a.compatibility.score);
}

export async function scanMenu(
  input: { text?: string; imageBase64?: string; mimeType?: string },
  ctx: ScoringContext,
): Promise<MenuScanResult> {
  const extracted = await extractMenu(input);

  if (extracted) {
    return {
      restaurantName: extracted.restaurantName,
      items: scoreMenuItems(extracted.items, ctx),
      source: "gemini",
      note: "Gemini read the menu and filled in the ingredients restaurants usually leave out. Scores come from your own logged history.",
    };
  }

  if (input.text?.trim()) {
    const items = heuristicExtract(input.text);
    return {
      items: scoreMenuItems(items, ctx),
      source: "heuristic",
      note: isGeminiEnabled()
        ? "Gemini could not be reached, so GutGuide parsed the text directly. Ingredient guesses are rougher than usual."
        : "Parsed on-device from the text you pasted. Add a GEMINI_API_KEY to read photos of menus and infer hidden ingredients.",
    };
  }

  return {
    items: [],
    source: "heuristic",
    note: "Add a GEMINI_API_KEY to scan a photo of a menu, or paste the menu text instead.",
  };
}
