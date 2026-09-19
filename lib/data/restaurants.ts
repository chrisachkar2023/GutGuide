import type { Restaurant } from "@/lib/types";

/** Default map centre for the demo: the Cathedral of Learning, Oakland, Pittsburgh. */
export const DEFAULT_CENTER = { lat: 40.4444, lng: -79.9533, label: "Oakland, Pittsburgh" };

/** Great-circle distance in miles. */
export function milesBetween(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 3958.8;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)) * 10) / 10;
}

/**
 * Demo neighborhood set. Distances are relative to the default map center
 * (Oakland, Pittsburgh) and are replaced by real distances when the browser
 * shares a location.
 */
export const RESTAURANTS: Restaurant[] = [
  {
    id: "hana-sushi",
    slug: "hana-sushi",
    name: "Hana Sushi",
    cuisine: "Japanese",
    neighborhood: "Oakland",
    lat: 40.4425,
    lng: -79.955,
    distanceMi: 0.3,
    priceLevel: 2,
    rating: 4.6,
    heroEmoji: "🍣",
    blurb: "Rice-forward menu with plenty of non-spicy rolls and a quiet back room.",
    menu: [
      { name: "Salmon roll", description: "Six pieces, rice and salmon, nothing else.", foodIds: ["salmon-roll"] },
      { name: "Chicken teriyaki plate", description: "Grilled chicken over steamed white rice.", foodIds: ["grilled-chicken", "white-rice"] },
      { name: "Miso salmon", description: "Baked salmon with rice and soft zucchini.", foodIds: ["baked-salmon", "white-rice", "zucchini"] },
      { name: "Spicy tuna poke", description: "Raw tuna, chili oil, edamame, sesame.", foodIds: ["poke-bowl"] },
    ],
  },
  {
    id: "pho-minh",
    slug: "pho-minh",
    name: "Phở Minh",
    cuisine: "Vietnamese",
    neighborhood: "Bloomfield",
    lat: 40.462,
    lng: -79.949,
    distanceMi: 1.1,
    priceLevel: 1,
    rating: 4.7,
    heroEmoji: "🍜",
    blurb: "Broth and rice noodles all day. Herbs come on the side, which helps.",
    menu: [
      { name: "Chicken phở", description: "Rice noodles in clear broth with poached chicken.", foodIds: ["rice-noodles", "grilled-chicken"] },
      { name: "Cháo gà", description: "Rice congee with shredded chicken and ginger.", foodIds: ["congee", "grilled-chicken"] },
      { name: "Bún with grilled pork", description: "Cold noodles, raw herbs, peanuts, fish sauce.", foodIds: ["rice-noodles", "peanut-butter", "raw-onion"] },
      { name: "Shrimp rice plate", description: "Sautéed shrimp, jasmine rice, cooked carrots.", foodIds: ["shrimp", "white-rice", "steamed-carrots"] },
    ],
  },
  {
    id: "olive-branch",
    slug: "olive-branch",
    name: "The Olive Branch",
    cuisine: "Mediterranean",
    neighborhood: "Shadyside",
    lat: 40.453,
    lng: -79.934,
    distanceMi: 1.4,
    priceLevel: 2,
    rating: 4.4,
    heroEmoji: "🥙",
    blurb: "Grill-forward plates. Sauces come on the side if you ask.",
    menu: [
      { name: "Chicken shawarma plate", description: "Spiced chicken, rice, garlic sauce, pickles.", foodIds: ["chicken-shawarma"] },
      { name: "Grilled salmon plate", description: "Salmon, rice pilaf, sautéed zucchini.", foodIds: ["baked-salmon", "white-rice", "zucchini"] },
      { name: "Falafel bowl", description: "Fried chickpea patties, hummus, raw salad.", foodIds: ["hummus", "kale-salad"] },
      { name: "Lentil soup", description: "Puréed red lentil soup with lemon.", foodIds: ["lentils"] },
    ],
  },
  {
    id: "sunny-side",
    slug: "sunny-side",
    name: "Sunny Side Diner",
    cuisine: "American",
    neighborhood: "Oakland",
    lat: 40.44,
    lng: -79.958,
    distanceMi: 0.5,
    priceLevel: 1,
    rating: 4.2,
    heroEmoji: "🍳",
    blurb: "Breakfast all day, and they will genuinely cook eggs plain if you ask.",
    menu: [
      { name: "Two eggs and toast", description: "Scrambled eggs with sourdough.", foodIds: ["scrambled-eggs", "sourdough-bread"] },
      { name: "Oatmeal bowl", description: "Slow-cooked oats with banana.", foodIds: ["oatmeal", "ripe-banana"] },
      { name: "Sausage skillet", description: "Pork sausage, home fries, cheddar.", foodIds: ["pork-sausage", "aged-cheddar"] },
      { name: "Classic burger and fries", description: "Beef patty, cheese, fries.", foodIds: ["cheeseburger-fries"] },
    ],
  },
  {
    id: "green-kettle",
    slug: "green-kettle",
    name: "Green Kettle",
    cuisine: "Soup & salad",
    neighborhood: "Squirrel Hill",
    lat: 40.438,
    lng: -79.923,
    distanceMi: 2.2,
    priceLevel: 2,
    rating: 4.5,
    heroEmoji: "🥣",
    blurb: "Rotating puréed soups, which tend to be the easiest thing on any menu.",
    menu: [
      { name: "Chicken noodle soup", description: "House broth, noodles, carrot, celery.", foodIds: ["chicken-noodle-soup"] },
      { name: "Butternut squash soup", description: "Puréed squash with a touch of cream.", foodIds: ["butternut-soup"] },
      { name: "Kale caesar", description: "Raw kale, parmesan, seeds.", foodIds: ["kale-salad"] },
      { name: "Turkey rice bowl", description: "Ground turkey, rice, green beans.", foodIds: ["ground-turkey", "white-rice", "green-beans"] },
    ],
  },
  {
    id: "casa-verde",
    slug: "casa-verde",
    name: "Casa Verde",
    cuisine: "Mexican",
    neighborhood: "Strip District",
    lat: 40.452,
    lng: -79.976,
    distanceMi: 2.8,
    priceLevel: 1,
    rating: 4.3,
    heroEmoji: "🌯",
    blurb: "Build-your-own bowls, so you decide exactly how much goes in.",
    menu: [
      { name: "Build-your-own bowl", description: "Rice, chicken, beans, salsa, cheese, sour cream.", foodIds: ["burrito-bowl"] },
      { name: "Chicken and rice bowl", description: "Just rice, grilled chicken, a little cheese.", foodIds: ["white-rice", "grilled-chicken", "aged-cheddar"] },
      { name: "Street corn", description: "Grilled corn, crema, chili powder.", foodIds: ["corn-on-cob", "hot-sauce"] },
      { name: "Chicken tortilla soup", description: "Broth, shredded chicken, corn tortilla strips.", foodIds: ["chicken-noodle-soup", "corn-tortilla"] },
    ],
  },
  {
    id: "forno",
    slug: "forno",
    name: "Forno",
    cuisine: "Italian",
    neighborhood: "Lawrenceville",
    lat: 40.468,
    lng: -79.962,
    distanceMi: 3.1,
    priceLevel: 2,
    rating: 4.6,
    heroEmoji: "🍝",
    blurb: "Wood-fired, but the simple pasta plates are the quiet win here.",
    menu: [
      { name: "Margherita pizza", description: "Tomato, mozzarella, basil.", foodIds: ["margherita-pizza"] },
      { name: "Pasta al olio", description: "White pasta, olive oil, grilled chicken.", foodIds: ["white-pasta", "olive-oil", "grilled-chicken"] },
      { name: "Salmon and potato", description: "Baked salmon with mashed potato.", foodIds: ["baked-salmon", "mashed-potato"] },
      { name: "Arugula and almond salad", description: "Raw greens, shaved cheese, almonds.", foodIds: ["kale-salad", "almonds"] },
    ],
  },
  {
    id: "thai-house",
    slug: "thai-house",
    name: "Thai House",
    cuisine: "Thai",
    neighborhood: "Oakland",
    lat: 40.4445,
    lng: -79.95,
    distanceMi: 0.7,
    priceLevel: 1,
    rating: 4.1,
    heroEmoji: "🍲",
    blurb: "Heat levels are honest here — mild really is mild.",
    menu: [
      { name: "Pad Thai (mild)", description: "Rice noodles, egg, tofu, peanuts on the side.", foodIds: ["pad-thai"] },
      { name: "Chicken and jasmine rice", description: "Grilled chicken over rice with cooked carrots.", foodIds: ["grilled-chicken", "white-rice", "steamed-carrots"] },
      { name: "Tofu rice noodle soup", description: "Clear broth, rice noodles, soft tofu.", foodIds: ["rice-noodles", "firm-tofu"] },
      { name: "Green curry", description: "Coconut curry with chili and bamboo.", foodIds: ["butter-chicken", "hot-sauce"] },
    ],
  },
];

export function getRestaurant(slug: string): Restaurant | undefined {
  return RESTAURANTS.find((r) => r.slug === slug);
}
