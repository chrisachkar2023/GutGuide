export type TraitId =
  | "insoluble-fiber"
  | "high-fiber"
  | "seeds-nuts"
  | "lactose"
  | "gluten"
  | "spicy"
  | "fried"
  | "high-fat"
  | "raw"
  | "high-fodmap"
  | "caffeine"
  | "carbonated"
  | "alcohol"
  | "sugar-alcohol"
  | "red-meat"
  | "cruciferous"
  | "acidic"
  | "ultra-processed"
  | "low-residue"
  | "easily-digested"
  | "soluble-fiber"
  | "cooked-soft"
  | "lean-protein"
  | "hydrating"
  | "omega-3"
  | "fermented"
  | "low-fodmap";

export type TraitTone = "watch" | "gentle";

export type Trait = {
  id: TraitId;
  label: string;
  tone: TraitTone;
  /** How strongly this trait moves a compatibility estimate, 0–1. */
  weight: number;
  blurb: string;
};

export type FoodCategory =
  | "grains"
  | "protein"
  | "vegetables"
  | "fruit"
  | "dairy"
  | "drinks"
  | "meals"
  | "snacks"
  | "condiments";

export type Nutrition = {
  calories: number;
  protein: number;
  carbs: number;
  fiber: number;
  fat: number;
  sugar: number;
  sodium: number;
};

export type Food = {
  id: string;
  slug: string;
  name: string;
  emoji: string;
  category: FoodCategory;
  summary: string;
  servingSize: string;
  ingredients: string[];
  nutrition: Nutrition;
  traits: TraitId[];
  /** Practical preparation tweaks that often change how a food sits. */
  prepTips: string[];
  aliases?: string[];
};

export type Phase = "remission" | "recovering" | "flare";

export type DietaryRestriction =
  | "lactose-free"
  | "gluten-free"
  | "vegetarian"
  | "vegan"
  | "low-fodmap"
  | "nut-free"
  | "low-residue";

export type UserProfile = {
  id: string;
  name: string;
  diagnosedYear: number;
  phase: Phase;
  restrictions: DietaryRestriction[];
  watchTraits: TraitId[];
  favoriteCuisines: string[];
  dislikes: string[];
  goal: string;
};

export type Portion = "small" | "regular" | "large";

export type MealLog = {
  id: string;
  userId: string;
  name: string;
  foodIds: string[];
  loggedAt: string;
  portion: Portion;
  notes?: string;
  source?: "manual" | "recipe" | "menu-scan";
};

export type SymptomLog = {
  id: string;
  userId: string;
  loggedAt: string;
  /** 0–10, higher is worse. */
  pain: number;
  bloating: number;
  /** 0–10, higher is better. */
  energy: number;
  urgency: number;
  notes?: string;
};

export type FoodOutcome = "good" | "mixed" | "rough";

export type FoodHistoryEntry = {
  loggedAt: string;
  mealName: string;
  outcome: FoodOutcome;
  /** Worst-case discomfort observed in the hours after the meal, 0–10. */
  discomfort: number;
};

export type FoodHistory = {
  foodId: string;
  timesLogged: number;
  good: number;
  mixed: number;
  rough: number;
  lastLoggedAt?: string;
  entries: FoodHistoryEntry[];
};

export type ScoreBand = "gentle" | "usually-ok" | "go-slow" | "caution";

export type ScoreFactor = {
  label: string;
  detail: string;
  impact: number;
  kind: "history" | "trait" | "profile" | "pattern";
};

export type Compatibility = {
  score: number;
  band: ScoreBand;
  headline: string;
  confidence: "low" | "medium" | "high";
  dataPoints: number;
  factors: ScoreFactor[];
  restrictionConflicts: string[];
  tips: string[];
};

export type Restaurant = {
  id: string;
  slug: string;
  name: string;
  cuisine: string;
  neighborhood: string;
  lat: number;
  lng: number;
  /** Straight-line distance from the default demo centre, in miles. */
  distanceMi: number;
  priceLevel: 1 | 2 | 3;
  rating: number;
  heroEmoji: string;
  blurb: string;
  menu: { name: string; description: string; foodIds: string[] }[];
};

export type RecipeStep = {
  instruction: string;
  /** Optional hands-off timer in seconds, surfaced in guided cooking. */
  timerSeconds?: number;
  tip?: string;
};

export type Recipe = {
  id: string;
  slug: string;
  title: string;
  emoji: string;
  blurb: string;
  minutes: number;
  servings: number;
  difficulty: "easy" | "medium";
  foodIds: string[];
  ingredients: { item: string; amount: string }[];
  steps: RecipeStep[];
  tags: string[];
  swaps: { from: string; to: string; why: string }[];
};

export type MenuScanItem = {
  name: string;
  description: string;
  guessedIngredients: string[];
  traits: TraitId[];
  compatibility: Compatibility;
};

export type MenuScanResult = {
  restaurantName?: string;
  items: MenuScanItem[];
  source: "gemini" | "heuristic";
  note: string;
};
