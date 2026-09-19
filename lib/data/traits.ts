import type { Trait, TraitId } from "@/lib/types";

/**
 * Trait weights are tuned for *relative* ordering, not medical truth. They only
 * shift an estimate — personal history always outweighs them in the scorer.
 */
export const TRAITS: Record<TraitId, Trait> = {
  "insoluble-fiber": {
    id: "insoluble-fiber",
    label: "Insoluble fiber",
    tone: "watch",
    weight: 0.9,
    blurb: "Skins, seeds and stalks pass through mostly intact and add bulk.",
  },
  "high-fiber": {
    id: "high-fiber",
    label: "High fiber",
    tone: "watch",
    weight: 0.6,
    blurb: "More than ~5g of fiber per serving.",
  },
  "seeds-nuts": {
    id: "seeds-nuts",
    label: "Seeds & nuts",
    tone: "watch",
    weight: 0.85,
    blurb: "Small hard fragments that many people find abrasive.",
  },
  lactose: {
    id: "lactose",
    label: "Lactose",
    tone: "watch",
    weight: 0.7,
    blurb: "Milk sugar — a common overlap sensitivity with Crohn's.",
  },
  gluten: {
    id: "gluten",
    label: "Gluten",
    tone: "watch",
    weight: 0.35,
    blurb: "Wheat, barley and rye protein.",
  },
  spicy: {
    id: "spicy",
    label: "Spicy",
    tone: "watch",
    weight: 0.75,
    blurb: "Capsaicin can speed things up and irritate.",
  },
  fried: {
    id: "fried",
    label: "Fried",
    tone: "watch",
    weight: 0.85,
    blurb: "Deep-fried foods are slow and heavy to digest.",
  },
  "high-fat": {
    id: "high-fat",
    label: "High fat",
    tone: "watch",
    weight: 0.6,
    blurb: "Rich fat loads can trigger cramping for some people.",
  },
  raw: {
    id: "raw",
    label: "Raw",
    tone: "watch",
    weight: 0.55,
    blurb: "Uncooked produce keeps its cell walls intact.",
  },
  "high-fodmap": {
    id: "high-fodmap",
    label: "High FODMAP",
    tone: "watch",
    weight: 0.65,
    blurb: "Fermentable carbs that draw water and produce gas.",
  },
  caffeine: {
    id: "caffeine",
    label: "Caffeine",
    tone: "watch",
    weight: 0.5,
    blurb: "A gut stimulant as well as a brain one.",
  },
  carbonated: {
    id: "carbonated",
    label: "Carbonated",
    tone: "watch",
    weight: 0.4,
    blurb: "Bubbles add gas you have to move along.",
  },
  alcohol: {
    id: "alcohol",
    label: "Alcohol",
    tone: "watch",
    weight: 0.7,
    blurb: "Irritating to the gut lining and dehydrating.",
  },
  "sugar-alcohol": {
    id: "sugar-alcohol",
    label: "Sugar alcohols",
    tone: "watch",
    weight: 0.7,
    blurb: "Sorbitol, xylitol and friends ferment readily.",
  },
  "red-meat": {
    id: "red-meat",
    label: "Red meat",
    tone: "watch",
    weight: 0.4,
    blurb: "Dense protein that takes longer to break down.",
  },
  cruciferous: {
    id: "cruciferous",
    label: "Cruciferous",
    tone: "watch",
    weight: 0.6,
    blurb: "Broccoli, cabbage, cauliflower — famously gassy.",
  },
  acidic: {
    id: "acidic",
    label: "Acidic",
    tone: "watch",
    weight: 0.35,
    blurb: "Citrus, tomato and vinegar-forward dishes.",
  },
  "ultra-processed": {
    id: "ultra-processed",
    label: "Ultra-processed",
    tone: "watch",
    weight: 0.35,
    blurb: "Emulsifiers and additives are an active research area.",
  },
  "low-residue": {
    id: "low-residue",
    label: "Low residue",
    tone: "gentle",
    weight: 0.7,
    blurb: "Leaves little undigested material behind.",
  },
  "easily-digested": {
    id: "easily-digested",
    label: "Easy to digest",
    tone: "gentle",
    weight: 0.8,
    blurb: "Breaks down quickly with minimal work.",
  },
  "soluble-fiber": {
    id: "soluble-fiber",
    label: "Soluble fiber",
    tone: "gentle",
    weight: 0.55,
    blurb: "Gel-forming fiber that can help firm things up.",
  },
  "cooked-soft": {
    id: "cooked-soft",
    label: "Cooked soft",
    tone: "gentle",
    weight: 0.5,
    blurb: "Heat has already done part of the work.",
  },
  "lean-protein": {
    id: "lean-protein",
    label: "Lean protein",
    tone: "gentle",
    weight: 0.5,
    blurb: "Protein without a heavy fat load.",
  },
  hydrating: {
    id: "hydrating",
    label: "Hydrating",
    tone: "gentle",
    weight: 0.3,
    blurb: "Helps replace fluid, which matters a lot with Crohn's.",
  },
  "omega-3": {
    id: "omega-3",
    label: "Omega-3",
    tone: "gentle",
    weight: 0.4,
    blurb: "Fats associated with lower inflammatory markers.",
  },
  fermented: {
    id: "fermented",
    label: "Fermented",
    tone: "gentle",
    weight: 0.3,
    blurb: "Live cultures — helpful for some, gassy for others.",
  },
  "low-fodmap": {
    id: "low-fodmap",
    label: "Low FODMAP",
    tone: "gentle",
    weight: 0.45,
    blurb: "Low in the fermentable carbs that commonly bloat.",
  },
};

export const ALL_TRAITS = Object.values(TRAITS);

export function trait(id: TraitId): Trait {
  return TRAITS[id];
}

export function traitLabel(id: TraitId): string {
  return TRAITS[id]?.label ?? id;
}
