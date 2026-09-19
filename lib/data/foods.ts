import type { Food, FoodCategory, Nutrition, TraitId } from "@/lib/types";

type Draft = Omit<Food, "id" | "slug"> & { slug: string };

/** [calories, protein, carbs, fiber, fat, sugar, sodium] */
type NutritionTuple = [number, number, number, number, number, number, number];

function n(t: NutritionTuple): Nutrition {
  const [calories, protein, carbs, fiber, fat, sugar, sodium] = t;
  return { calories, protein, carbs, fiber, fat, sugar, sodium };
}

function f(
  slug: string,
  name: string,
  emoji: string,
  category: FoodCategory,
  summary: string,
  servingSize: string,
  ingredients: string[],
  nutrition: NutritionTuple,
  traits: TraitId[],
  prepTips: string[],
  aliases: string[] = [],
): Draft {
  return { slug, name, emoji, category, summary, servingSize, ingredients, nutrition: n(nutrition), traits, prepTips, aliases };
}

const DRAFTS: Draft[] = [
  // ── Grains & starches ─────────────────────────────────────────────
  f("white-rice", "White rice", "🍚", "grains",
    "The classic low-residue starch. Bland on purpose, and that is the point.",
    "1 cup cooked", ["White long-grain rice", "Water", "Salt"],
    [205, 4, 45, 0.6, 0.4, 0.1, 2],
    ["low-residue", "easily-digested", "low-fodmap", "cooked-soft"],
    ["Cook it a little wetter than usual for an even softer texture.", "Pairs well as a base when you are testing a new protein."]),

  f("brown-rice", "Brown rice", "🌾", "grains",
    "Nuttier and more filling, but the intact bran keeps a lot of insoluble fiber.",
    "1 cup cooked", ["Brown rice", "Water", "Salt"],
    [218, 5, 46, 3.5, 1.6, 0.7, 2],
    ["insoluble-fiber", "high-fiber", "low-fodmap"],
    ["Cooking it longer with extra water softens the bran noticeably.", "Try half brown, half white if you want to ease into it."]),

  f("sourdough-bread", "Sourdough bread", "🍞", "grains",
    "Slow fermentation breaks down some of the fermentable carbs before you eat it.",
    "2 slices", ["Wheat flour", "Water", "Sourdough starter", "Salt"],
    [185, 6, 36, 1.6, 1.2, 1.5, 380],
    ["gluten", "fermented", "cooked-soft"],
    ["A true long-ferment loaf tends to sit differently than quick supermarket sourdough.", "Toasting can make it easier on the stomach."]),

  f("whole-wheat-bread", "Whole wheat bread", "🍞", "grains",
    "More fiber and more bran fragments than white bread.",
    "2 slices", ["Whole wheat flour", "Water", "Yeast", "Honey", "Salt"],
    [160, 8, 28, 4.0, 2.2, 3.0, 300],
    ["gluten", "high-fiber", "insoluble-fiber"],
    ["If seeds are on the crust, they add abrasive fragments."]),

  f("oatmeal", "Oatmeal", "🥣", "grains",
    "Soluble fiber that turns into a gel — a very different fiber than a raw salad.",
    "1 cup cooked", ["Rolled oats", "Water or lactose-free milk", "Pinch of salt"],
    [166, 6, 28, 4.0, 3.6, 0.6, 9],
    ["soluble-fiber", "cooked-soft", "easily-digested"],
    ["Cook it long and loose rather than instant-and-stiff.", "Skip the berry and nut toppings while you are testing it."],
    ["porridge", "oats"]),

  f("quinoa", "Quinoa", "🌾", "grains",
    "Complete protein, but the tiny germ rings are still fiber.",
    "1 cup cooked", ["Quinoa", "Water", "Salt"],
    [222, 8, 39, 5.2, 3.6, 1.6, 13],
    ["high-fiber", "gluten", "lean-protein"],
    ["Rinse well — the natural saponin coating is bitter and irritating."]),

  f("rice-noodles", "Rice noodles", "🍜", "grains",
    "Gluten-free, low-residue, and soft when cooked through.",
    "1 cup cooked", ["Rice flour", "Water"],
    [192, 2, 44, 1.8, 0.4, 0, 33],
    ["low-residue", "easily-digested", "low-fodmap", "cooked-soft"],
    ["Soft-cooked rather than al dente is usually the gentler call."]),

  f("white-pasta", "White pasta", "🍝", "grains",
    "Refined semolina — low residue, but it still carries gluten.",
    "1 cup cooked", ["Semolina wheat flour", "Water"],
    [220, 8, 43, 2.5, 1.3, 0.8, 1],
    ["gluten", "low-residue", "cooked-soft"],
    ["Cook past al dente if you are in a sensitive stretch."]),

  f("corn-tortilla", "Corn tortilla", "🫓", "grains",
    "Gluten-free and small, though corn hulls are notoriously hard to break down.",
    "2 tortillas", ["Masa harina", "Water", "Lime"],
    [104, 3, 21, 2.9, 1.3, 0.4, 22],
    ["insoluble-fiber", "low-fodmap"],
    ["Warming them until pliable helps; charred, brittle edges do not."]),

  f("congee", "Congee", "🥣", "meals",
    "Rice simmered until it dissolves. Many people reach for this during a rough week.",
    "1 large bowl", ["White rice", "Water or light broth", "Ginger", "Salt", "Scallion greens"],
    [180, 4, 38, 0.8, 1.0, 0.5, 420],
    ["low-residue", "easily-digested", "cooked-soft", "hydrating", "low-fodmap"],
    ["Ginger is optional but often welcome.", "Add shredded chicken once you want more protein."],
    ["rice porridge", "jook"]),

  // ── Protein ───────────────────────────────────────────────────────
  f("grilled-chicken", "Grilled chicken breast", "🍗", "protein",
    "Lean, simple protein with almost no fiber to work through.",
    "4 oz", ["Chicken breast", "Olive oil", "Salt", "Pepper"],
    [187, 35, 0, 0, 4.0, 0, 84],
    ["lean-protein", "low-residue", "easily-digested", "low-fodmap"],
    ["Slice thin against the grain — less chewing work overall.", "Keep the rub simple; spice blends are often the real culprit."]),

  f("baked-salmon", "Baked salmon", "🐟", "protein",
    "Soft-textured protein plus omega-3 fats.",
    "4 oz", ["Salmon fillet", "Olive oil", "Lemon", "Salt"],
    [233, 25, 0, 0, 14, 0, 70],
    ["omega-3", "lean-protein", "easily-digested", "low-residue", "low-fodmap"],
    ["Baked or poached is gentler than pan-seared in lots of butter."]),

  f("scrambled-eggs", "Scrambled eggs", "🍳", "protein",
    "Soft protein that most people tolerate well, even on rough days.",
    "2 eggs", ["Eggs", "Butter or olive oil", "Salt"],
    [182, 12, 2, 0, 14, 1.0, 340],
    ["easily-digested", "low-residue", "lean-protein", "low-fodmap"],
    ["Low and slow keeps them custardy instead of rubbery.", "Skip the splash of milk if lactose is a factor for you."]),

  f("ground-turkey", "Ground turkey", "🦃", "protein",
    "Lean and already broken into small pieces before you chew it.",
    "4 oz cooked", ["Ground turkey", "Olive oil", "Salt"],
    [170, 22, 0, 0, 9, 0, 75],
    ["lean-protein", "easily-digested", "low-residue", "low-fodmap"],
    ["Brown it in a little broth to keep it from drying out."]),

  f("firm-tofu", "Firm tofu", "🧊", "protein",
    "Plant protein without the fiber load of beans.",
    "4 oz", ["Soybeans", "Water", "Calcium sulfate"],
    [144, 16, 3, 2.0, 8, 1.0, 14],
    ["lean-protein", "easily-digested", "low-fodmap"],
    ["Firm and extra-firm are lower FODMAP than silken."]),

  f("shrimp", "Shrimp", "🦐", "protein",
    "Very lean, very quick to digest.",
    "4 oz", ["Shrimp", "Olive oil", "Garlic", "Lemon"],
    [120, 23, 1, 0, 2, 0, 585],
    ["lean-protein", "low-residue", "easily-digested"],
    ["Ask for it sautéed rather than breaded and fried."]),

  f("ribeye-steak", "Ribeye steak", "🥩", "protein",
    "Rich and fatty — a slow, heavy meal for the gut to move.",
    "6 oz", ["Ribeye steak", "Salt", "Pepper", "Butter"],
    [480, 42, 0, 0, 34, 0, 115],
    ["red-meat", "high-fat", "low-residue"],
    ["A smaller portion alongside rice often lands better than a full steak dinner."]),

  f("black-beans", "Black beans", "🫘", "protein",
    "Great nutrition, and one of the most reliably gassy foods there is.",
    "1/2 cup", ["Black beans", "Water", "Salt", "Cumin"],
    [114, 8, 20, 7.5, 0.5, 0.3, 200],
    ["high-fiber", "high-fodmap", "insoluble-fiber"],
    ["Rinsing canned beans thoroughly removes some of the fermentable sugars.", "A small spoonful is a very different test than a full side."]),

  f("lentils", "Lentils", "🍲", "protein",
    "Softer than most beans, still high in fermentable fiber.",
    "1/2 cup cooked", ["Lentils", "Water", "Salt"],
    [115, 9, 20, 8.0, 0.4, 1.8, 2],
    ["high-fiber", "high-fodmap", "lean-protein"],
    ["Red lentils cooked to mush are usually easier than whole green ones."]),

  f("canned-tuna", "Canned tuna", "🐟", "protein",
    "Shelf-stable lean protein with no fiber.",
    "1 can, drained", ["Tuna", "Water", "Salt"],
    [110, 25, 0, 0, 1, 0, 320],
    ["lean-protein", "low-residue", "easily-digested"],
    ["Mixing with olive oil instead of heavy mayo keeps the fat load lower."]),

  f("peanut-butter", "Peanut butter", "🥜", "protein",
    "Smooth is a very different texture experience than crunchy.",
    "2 tbsp", ["Peanuts", "Salt"],
    [190, 8, 7, 2.0, 16, 3.0, 140],
    ["high-fat", "seeds-nuts", "high-fodmap"],
    ["Smooth, natural, and thinly spread is the gentlest version.", "Avoid the crunchy style if fragments bother you."]),

  f("pork-sausage", "Pork sausage", "🌭", "protein",
    "Fatty, spiced and usually heavily processed.",
    "2 links", ["Pork", "Fat", "Salt", "Sage", "Red pepper", "Curing agents"],
    [290, 14, 2, 0, 25, 1.0, 640],
    ["high-fat", "red-meat", "spicy", "ultra-processed"],
    ["A single link with plain starch is a smaller test than a full plate."]),

  // ── Vegetables ────────────────────────────────────────────────────
  f("steamed-carrots", "Steamed carrots", "🥕", "vegetables",
    "Cooked soft, carrots lose most of the crunch that causes trouble raw.",
    "1 cup", ["Carrots", "Water", "Salt", "Butter or olive oil"],
    [55, 1, 13, 3.5, 0.3, 6.0, 90],
    ["cooked-soft", "soluble-fiber", "low-fodmap"],
    ["Peel them and cook until a fork slides through with no resistance."]),

  f("mashed-potato", "Mashed potato", "🥔", "vegetables",
    "Peeled potato is one of the lowest-residue vegetables you can eat.",
    "1 cup", ["Potatoes", "Butter", "Milk", "Salt"],
    [214, 4, 35, 3.2, 7, 3.0, 350],
    ["low-residue", "cooked-soft", "easily-digested", "lactose"],
    ["Make it with olive oil and broth instead of milk to drop the lactose.", "Always peel — the skin is where the insoluble fiber lives."]),

  f("sweet-potato", "Roasted sweet potato", "🍠", "vegetables",
    "Soft, sweet and full of soluble fiber when the skin is off.",
    "1 medium", ["Sweet potato", "Olive oil", "Salt"],
    [162, 3, 37, 5.9, 0.2, 7.0, 72],
    ["soluble-fiber", "cooked-soft", "high-fiber"],
    ["Scoop the flesh and leave the skin behind."]),

  f("zucchini", "Sautéed zucchini", "🥒", "vegetables",
    "One of the mildest cooked vegetables around.",
    "1 cup", ["Zucchini", "Olive oil", "Salt"],
    [60, 2, 5, 1.6, 4, 3.0, 150],
    ["cooked-soft", "low-fodmap", "easily-digested"],
    ["Cook until translucent rather than leaving it squeaky."]),

  f("sauteed-spinach", "Sautéed spinach", "🥬", "vegetables",
    "Wilted greens take up far less volume than a raw salad.",
    "1 cup cooked", ["Spinach", "Olive oil", "Salt"],
    [63, 3, 4, 2.4, 4, 0.4, 130],
    ["cooked-soft", "low-fodmap"],
    ["Cooking down 3 cups of raw into 1 cup makes a real difference."]),

  f("raw-broccoli", "Raw broccoli", "🥦", "vegetables",
    "Cruciferous, fibrous and raw — three things at once.",
    "1 cup", ["Broccoli florets"],
    [31, 2.5, 6, 2.4, 0.3, 1.5, 30],
    ["raw", "cruciferous", "insoluble-fiber", "high-fodmap"],
    ["Steaming the florets soft removes two of the three risk factors."]),

  f("kale-salad", "Kale salad", "🥗", "vegetables",
    "Raw, tough leaves that are famously hard work to break down.",
    "2 cups", ["Kale", "Olive oil", "Lemon", "Parmesan", "Seeds"],
    [180, 6, 12, 5.0, 13, 2.0, 320],
    ["raw", "insoluble-fiber", "cruciferous", "high-fiber", "seeds-nuts"],
    ["Massaged and finely shredded is easier than big torn leaves."]),

  f("green-beans", "Cooked green beans", "🫛", "vegetables",
    "A mild vegetable that softens well.",
    "1 cup", ["Green beans", "Olive oil", "Salt"],
    [70, 2, 10, 4.0, 3, 3.0, 160],
    ["cooked-soft", "high-fiber", "low-fodmap"],
    ["Cook past bright-green into fully tender."]),

  f("corn-on-cob", "Corn on the cob", "🌽", "vegetables",
    "The hull is cellulose that your body genuinely cannot break down.",
    "1 ear", ["Corn", "Butter", "Salt"],
    [155, 4, 27, 3.0, 5, 6.0, 120],
    ["insoluble-fiber", "high-fodmap", "raw"],
    ["Creamed corn or corn soup removes the whole-hull problem."]),

  f("butternut-soup", "Butternut squash soup", "🥣", "vegetables",
    "Puréed soup: the blender has already done the mechanical work.",
    "1 bowl", ["Butternut squash", "Broth", "Onion", "Cream", "Nutmeg"],
    [190, 3, 28, 4.0, 8, 8.0, 620],
    ["cooked-soft", "easily-digested", "hydrating", "high-fodmap", "lactose"],
    ["Ask whether onion or cream is in the base if either is an issue for you."]),

  f("raw-onion", "Raw onion", "🧅", "vegetables",
    "A concentrated FODMAP source and a very common hidden trigger.",
    "1/4 cup", ["Onion"],
    [16, 0.5, 4, 0.7, 0, 2.0, 2],
    ["raw", "high-fodmap"],
    ["Onion-infused oil gives you the flavor without the fructans."]),

  f("peeled-cucumber", "Peeled cucumber", "🥒", "vegetables",
    "Mostly water once the skin and seeds are gone.",
    "1 cup", ["Cucumber"],
    [16, 0.7, 3.8, 0.5, 0.1, 1.8, 2],
    ["hydrating", "low-fodmap", "raw", "low-residue"],
    ["Peel it and scrape the seed core out."]),

  // ── Fruit ─────────────────────────────────────────────────────────
  f("ripe-banana", "Ripe banana", "🍌", "fruit",
    "Soft, soluble-fiber fruit that shows up on nearly everyone's safe list.",
    "1 medium", ["Banana"],
    [105, 1.3, 27, 3.1, 0.4, 14, 1],
    ["soluble-fiber", "easily-digested", "low-residue", "low-fodmap"],
    ["Spotty-ripe is easier than green-tipped.", "Very ripe bananas climb in FODMAPs — medium-ripe is the sweet spot."]),

  f("applesauce", "Applesauce", "🍎", "fruit",
    "An apple with the skin and structure already removed.",
    "1/2 cup", ["Apples", "Water", "Cinnamon"],
    [51, 0.2, 14, 1.4, 0.1, 11, 2],
    ["low-residue", "cooked-soft", "easily-digested"],
    ["Unsweetened keeps the sugar load lower."]),

  f("apple-with-skin", "Apple with skin", "🍏", "fruit",
    "The skin is where almost all the insoluble fiber sits.",
    "1 medium", ["Apple"],
    [95, 0.5, 25, 4.4, 0.3, 19, 2],
    ["raw", "insoluble-fiber", "high-fodmap", "high-fiber"],
    ["Peeled and stewed is a completely different food for your gut."]),

  f("blueberries", "Blueberries", "🫐", "fruit",
    "Small skins and seeds, but a modest portion is often fine.",
    "1/2 cup", ["Blueberries"],
    [42, 0.5, 11, 1.8, 0.2, 7, 1],
    ["raw", "low-fodmap", "insoluble-fiber"],
    ["Blending into a smoothie breaks the skins down."]),

  f("cantaloupe", "Cantaloupe", "🍈", "fruit",
    "High water content and no skin to deal with.",
    "1 cup", ["Cantaloupe"],
    [54, 1.3, 13, 1.4, 0.3, 12, 25],
    ["hydrating", "low-fodmap", "easily-digested", "raw"],
    ["Serve it cold and cut small."]),

  f("orange", "Orange", "🍊", "fruit",
    "Acidic, with membranes that some people find scratchy.",
    "1 medium", ["Orange"],
    [62, 1.2, 15, 3.1, 0.2, 12, 0],
    ["acidic", "raw", "insoluble-fiber", "low-fodmap"],
    ["Removing the pith and membranes helps a lot."]),

  f("avocado", "Avocado", "🥑", "fruit",
    "Creamy texture, but a real fat and FODMAP load in a full one.",
    "1/2 medium", ["Avocado"],
    [160, 2, 9, 6.7, 15, 0.7, 7],
    ["high-fat", "high-fiber", "high-fodmap", "easily-digested"],
    ["An eighth of an avocado is considered low FODMAP; half is not."]),

  f("strawberries", "Strawberries", "🍓", "fruit",
    "Low FODMAP, though the surface seeds bother some people.",
    "1 cup", ["Strawberries"],
    [49, 1, 12, 3.0, 0.5, 7, 2],
    ["raw", "low-fodmap", "seeds-nuts", "hydrating"],
    ["Blending removes the seed texture."]),

  f("canned-peaches", "Canned peaches", "🍑", "fruit",
    "Skinless and soft — a classic low-residue fruit.",
    "1/2 cup", ["Peaches", "Juice or light syrup"],
    [60, 0.6, 15, 1.3, 0.1, 13, 6],
    ["low-residue", "cooked-soft", "easily-digested"],
    ["Choose juice-packed over heavy syrup."]),

  // ── Dairy ─────────────────────────────────────────────────────────
  f("greek-yogurt", "Greek yogurt", "🥛", "dairy",
    "Straining removes much of the lactose and leaves the protein.",
    "3/4 cup", ["Cultured milk", "Live active cultures"],
    [130, 17, 7, 0, 4, 6, 60],
    ["fermented", "lean-protein", "lactose", "easily-digested"],
    ["Plain beats flavored — fruit-on-the-bottom adds a lot of sugar.", "Lactose-free Greek yogurt exists and tastes the same."]),

  f("whole-milk", "Whole milk", "🥛", "dairy",
    "A full lactose and fat load in one glass.",
    "1 cup", ["Milk"],
    [149, 8, 12, 0, 8, 12, 105],
    ["lactose", "high-fat", "high-fodmap"],
    ["Lactose-free milk is nutritionally identical minus the lactose."]),

  f("aged-cheddar", "Aged cheddar", "🧀", "dairy",
    "Aging leaves very little lactose behind, but the fat stays.",
    "1 oz", ["Cultured milk", "Salt", "Enzymes"],
    [115, 7, 0.4, 0, 9, 0.1, 180],
    ["high-fat", "low-fodmap", "fermented"],
    ["Hard aged cheeses are much lower lactose than soft fresh ones."]),

  f("lactose-free-milk", "Lactose-free milk", "🥛", "dairy",
    "Regular milk with the lactose already broken down for you.",
    "1 cup", ["Milk", "Lactase enzyme"],
    [149, 8, 12, 0, 8, 12, 105],
    ["low-fodmap", "easily-digested", "high-fat"],
    ["A straightforward one-for-one swap in recipes."]),

  f("ice-cream", "Ice cream", "🍨", "dairy",
    "Fat, lactose and sugar together — a common late-night regret.",
    "1/2 cup", ["Cream", "Milk", "Sugar", "Egg yolk", "Stabilizers"],
    [210, 3.5, 24, 0.7, 11, 21, 80],
    ["lactose", "high-fat", "ultra-processed", "high-fodmap"],
    ["Sorbet skips the dairy entirely if that is the issue."]),

  // ── Drinks ────────────────────────────────────────────────────────
  f("coffee", "Coffee", "☕", "drinks",
    "A gut stimulant that speeds motility for a lot of people.",
    "8 oz", ["Coffee", "Water"],
    [2, 0.3, 0, 0, 0, 0, 5],
    ["caffeine", "acidic"],
    ["Half-caf or a smaller cup is an easier test than quitting outright.", "Drinking it with food rather than on an empty stomach helps some people."]),

  f("peppermint-tea", "Peppermint tea", "🍵", "drinks",
    "Warm, caffeine-free and often used to settle cramping.",
    "8 oz", ["Peppermint leaves", "Water"],
    [2, 0, 0.5, 0, 0, 0, 5],
    ["hydrating", "easily-digested", "low-fodmap"],
    ["Peppermint can worsen reflux for some people even as it eases cramping."]),

  f("sparkling-water", "Sparkling water", "🫧", "drinks",
    "Hydrating, but the carbonation adds gas you have to move.",
    "12 oz", ["Carbonated water"],
    [0, 0, 0, 0, 0, 0, 10],
    ["carbonated", "hydrating"],
    ["Letting it go flat keeps the hydration without the bubbles."]),

  f("beer", "Beer", "🍺", "drinks",
    "Alcohol, carbonation and fermentable carbs in one glass.",
    "12 oz", ["Water", "Barley malt", "Hops", "Yeast"],
    [153, 1.6, 13, 0, 0, 0, 14],
    ["alcohol", "carbonated", "gluten", "high-fodmap"],
    ["If you are drinking, pacing with water between rounds matters more than the choice of drink."]),

  f("oral-rehydration", "Oral rehydration drink", "💧", "drinks",
    "Balanced salts and sugar designed to actually stay with you.",
    "16 oz", ["Water", "Glucose", "Sodium", "Potassium"],
    [60, 0, 15, 0, 0, 14, 480],
    ["hydrating", "easily-digested", "low-residue"],
    ["Worth keeping on hand for high-output days."],
    ["electrolyte drink", "pedialyte"]),

  f("orange-juice", "Orange juice", "🧃", "drinks",
    "Acidic and concentrated in fruit sugar without the pulp fiber.",
    "8 oz", ["Orange juice"],
    [112, 2, 26, 0.5, 0.5, 21, 2],
    ["acidic", "low-residue", "high-fodmap"],
    ["Diluting it by half takes the edge off the acid and the sugar."]),

  // ── Meals ─────────────────────────────────────────────────────────
  f("chicken-noodle-soup", "Chicken noodle soup", "🍲", "meals",
    "Warm, salty, hydrating and soft — a reliable fallback meal.",
    "1 bowl", ["Chicken broth", "Chicken", "Egg noodles", "Carrot", "Celery", "Onion"],
    [180, 14, 20, 2.0, 5, 3.0, 880],
    ["hydrating", "cooked-soft", "easily-digested", "lean-protein", "high-fodmap", "gluten"],
    ["Homemade lets you leave the onion and celery out.", "Celery strings are worth fishing out on a sensitive day."]),

  f("burrito-bowl", "Burrito bowl", "🥙", "meals",
    "Highly customizable — the build decides how it sits.",
    "1 bowl", ["White rice", "Grilled chicken", "Black beans", "Cheese", "Salsa", "Sour cream", "Lettuce"],
    [720, 42, 70, 12, 28, 6, 1600],
    ["high-fiber", "high-fodmap", "lactose", "spicy", "high-fat", "lean-protein"],
    ["Rice + chicken + a little cheese is a very different bowl than the loaded version.", "Beans and raw salsa are the two biggest variables."]),

  f("margherita-pizza", "Margherita pizza", "🍕", "meals",
    "Gluten, dairy and acidic tomato on a high-fat base.",
    "2 slices", ["Wheat dough", "Tomato sauce", "Mozzarella", "Basil", "Olive oil"],
    [540, 22, 62, 3.0, 22, 7.0, 1180],
    ["gluten", "lactose", "acidic", "high-fat"],
    ["A thin crust with light cheese is a smaller ask than a deep-dish slice."]),

  f("pad-thai", "Pad Thai", "🍜", "meals",
    "Rice noodles are gentle; the peanuts, chili and tamarind are the variables.",
    "1 plate", ["Rice noodles", "Egg", "Tofu", "Tamarind", "Fish sauce", "Peanuts", "Bean sprouts", "Chili"],
    [640, 24, 82, 4.0, 22, 18, 1420],
    ["low-residue", "seeds-nuts", "spicy", "high-fat", "raw"],
    ["Ask for it mild and peanuts on the side — the noodle base itself is easy."]),

  f("salmon-roll", "Salmon sushi roll", "🍣", "meals",
    "Rice and soft fish, assuming nothing spicy comes with it.",
    "6 pieces", ["Sushi rice", "Salmon", "Nori", "Rice vinegar"],
    [290, 14, 44, 1.5, 6, 6.0, 480],
    ["low-residue", "easily-digested", "omega-3", "lean-protein"],
    ["Spicy mayo and tempura rolls change the picture entirely."]),

  f("cheeseburger-fries", "Cheeseburger and fries", "🍔", "meals",
    "Fried, fatty and large — one of the heaviest common restaurant meals.",
    "1 meal", ["Beef patty", "Cheese", "Bun", "Lettuce", "Tomato", "Fries", "Sauce"],
    [1100, 45, 96, 6.0, 60, 12, 1900],
    ["fried", "high-fat", "red-meat", "gluten", "lactose", "ultra-processed"],
    ["Splitting the fries or going with a side of rice cuts the fat load meaningfully."]),

  f("chicken-shawarma", "Chicken shawarma plate", "🥙", "meals",
    "Well-spiced lean protein with rice — the garlic sauce is the wildcard.",
    "1 plate", ["Chicken", "Rice", "Garlic sauce", "Pickles", "Spice blend", "Pita"],
    [780, 48, 72, 5.0, 32, 6.0, 1500],
    ["lean-protein", "spicy", "high-fodmap", "high-fat", "gluten"],
    ["Sauce on the side lets you control the garlic and fat together."]),

  f("poke-bowl", "Poke bowl", "🐟", "meals",
    "Rice, raw fish and whatever toppings you pile on.",
    "1 bowl", ["Sushi rice", "Ahi tuna", "Soy sauce", "Avocado", "Edamame", "Seaweed salad", "Sesame seeds"],
    [620, 38, 72, 8.0, 20, 8.0, 1300],
    ["raw", "omega-3", "lean-protein", "seeds-nuts", "high-fodmap"],
    ["Rice, fish and cucumber is the low-variable build."]),

  f("butter-chicken", "Butter chicken", "🍛", "meals",
    "Cream, butter and warm spice over rice.",
    "1 plate", ["Chicken", "Tomato", "Cream", "Butter", "Garam masala", "Ginger", "Garlic", "Basmati rice"],
    [820, 40, 68, 4.0, 42, 12, 1400],
    ["high-fat", "lactose", "acidic", "spicy", "high-fodmap"],
    ["Mild versions lean on warm spice rather than chili heat."]),

  // ── Snacks ────────────────────────────────────────────────────────
  f("saltine-crackers", "Saltine crackers", "🍘", "snacks",
    "Dry, bland, low residue — the classic nothing-else-sounds-good food.",
    "6 crackers", ["Wheat flour", "Oil", "Salt", "Baking soda"],
    [80, 1.5, 14, 0.5, 2, 0, 190],
    ["low-residue", "gluten", "easily-digested", "ultra-processed"],
    ["Pairs well with broth when appetite is low."]),

  f("pretzels", "Pretzels", "🥨", "snacks",
    "Low fat and low fiber, but salty and refined.",
    "1 oz", ["Wheat flour", "Salt", "Yeast", "Malt"],
    [110, 3, 23, 1.0, 1, 1.0, 350],
    ["low-residue", "gluten", "ultra-processed"],
    ["The salt is actually useful if you are losing fluid."]),

  f("popcorn", "Popcorn", "🍿", "snacks",
    "Hulls and kernels — frequently named as a personal trigger.",
    "3 cups", ["Popcorn kernels", "Oil", "Salt"],
    [160, 3, 19, 3.6, 9, 0.2, 320],
    ["insoluble-fiber", "high-fiber", "seeds-nuts"],
    ["If you have had a stricture, popcorn is usually a conversation with your care team."]),

  f("almonds", "Almonds", "🌰", "snacks",
    "Hard fragments plus a solid fat load.",
    "1 oz (23)", ["Almonds", "Salt"],
    [164, 6, 6, 3.5, 14, 1.2, 95],
    ["seeds-nuts", "high-fat", "high-fiber", "high-fodmap"],
    ["Smooth almond butter gives you the nutrition without the fragments."]),

  f("protein-bar", "Protein bar", "🍫", "snacks",
    "Convenient, but often full of sugar alcohols and chicory root fiber.",
    "1 bar", ["Protein isolate", "Chicory root fiber", "Erythritol", "Palm oil", "Cocoa"],
    [210, 20, 24, 12, 8, 2.0, 200],
    ["sugar-alcohol", "high-fiber", "ultra-processed", "high-fodmap"],
    ["Check the label for sorbitol, maltitol, xylitol and chicory root."]),

  f("rice-cakes", "Rice cakes", "🍙", "snacks",
    "Almost nothing to them, which is sometimes exactly what you want.",
    "2 cakes", ["Puffed rice", "Salt"],
    [70, 1.4, 15, 0.8, 0.5, 0, 60],
    ["low-residue", "easily-digested", "low-fodmap"],
    ["Topped with smooth nut butter or mashed banana for staying power."]),

  // ── Condiments ────────────────────────────────────────────────────
  f("hot-sauce", "Hot sauce", "🌶️", "condiments",
    "A small amount carries a lot of capsaicin.",
    "1 tsp", ["Chili peppers", "Vinegar", "Salt"],
    [5, 0, 1, 0.1, 0, 0.2, 190],
    ["spicy", "acidic"],
    ["Smoked paprika gives warmth and color without the heat."]),

  f("olive-oil", "Olive oil", "🫒", "condiments",
    "A clean fat that most people tolerate in normal amounts.",
    "1 tbsp", ["Extra virgin olive oil"],
    [119, 0, 0, 0, 14, 0, 0],
    ["easily-digested", "low-fodmap"],
    ["Great vehicle for garlic flavor without the garlic itself."]),

  f("hummus", "Hummus", "🫙", "condiments",
    "Blended chickpeas — smooth, but still chickpeas and garlic.",
    "1/4 cup", ["Chickpeas", "Tahini", "Garlic", "Lemon", "Olive oil"],
    [140, 5, 12, 4.0, 9, 0.5, 240],
    ["high-fodmap", "high-fiber", "high-fat", "cooked-soft"],
    ["Two tablespoons is roughly the low-FODMAP threshold."]),
];

export const FOODS: Food[] = DRAFTS.map((d) => ({ ...d, id: d.slug }));

export const FOOD_BY_ID = new Map(FOODS.map((food) => [food.id, food]));

export function getFood(id: string): Food | undefined {
  return FOOD_BY_ID.get(id);
}

export function getFoods(ids: string[]): Food[] {
  return ids.map((id) => FOOD_BY_ID.get(id)).filter((x): x is Food => Boolean(x));
}
