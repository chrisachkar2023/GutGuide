/**
 * Applies migrations, promotes the log tables to TimescaleDB / Tiger Data
 * hypertables when the extension is available, then seeds the demo history.
 *
 *   npm run db:setup
 *
 * Safe to run repeatedly. Without DATABASE_URL the app uses its in-memory demo
 * dataset instead, so this step is optional.
 */
import { config } from "dotenv";

// Match Next.js: .env.local wins over .env.
config({ path: [".env.local", ".env"], quiet: true });
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { DEMO_PROFILE, DEMO_USER_ID, demoHistory } from "../lib/data/demo-user";
import * as schema from "../lib/db/schema";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.");
  process.exit(1);
}

const client = postgres(url, { max: 1, prepare: false, onnotice: () => {} });
const db = drizzle(client, { schema });

async function promoteToHypertables() {
  try {
    await client.unsafe("CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE");
  } catch {
    console.log("· TimescaleDB extension unavailable — continuing with plain Postgres tables.");
    return;
  }

  for (const table of ["meal_logs", "symptom_logs"]) {
    try {
      await client.unsafe(
        `SELECT create_hypertable('${table}', 'logged_at', if_not_exists => TRUE, migrate_data => TRUE)`,
      );
      console.log(`· ${table} is a hypertable`);
    } catch (error) {
      console.log(`· ${table} left as a regular table:`, (error as Error).message);
    }
  }
}

async function seed() {
  const { meals, symptoms } = demoHistory();

  await db
    .insert(schema.users)
    .values({
      id: DEMO_PROFILE.id,
      name: DEMO_PROFILE.name,
      diagnosedYear: DEMO_PROFILE.diagnosedYear,
      phase: DEMO_PROFILE.phase,
      restrictions: DEMO_PROFILE.restrictions,
      watchTraits: DEMO_PROFILE.watchTraits,
      favoriteCuisines: DEMO_PROFILE.favoriteCuisines,
      dislikes: DEMO_PROFILE.dislikes,
      goal: DEMO_PROFILE.goal,
    })
    .onConflictDoNothing();

  await client`DELETE FROM meal_logs WHERE user_id = ${DEMO_USER_ID}`;
  await client`DELETE FROM symptom_logs WHERE user_id = ${DEMO_USER_ID}`;

  const chunk = <T,>(items: T[], size: number): T[][] =>
    items.reduce<T[][]>((acc, item, i) => {
      if (i % size === 0) acc.push([]);
      acc[acc.length - 1].push(item);
      return acc;
    }, []);

  for (const batch of chunk(meals, 200)) {
    await db.insert(schema.mealLogs).values(
      batch.map((meal) => ({
        id: meal.id,
        userId: meal.userId,
        name: meal.name,
        foodIds: meal.foodIds,
        portion: meal.portion,
        notes: meal.notes ?? null,
        source: meal.source ?? ("manual" as const),
        loggedAt: new Date(meal.loggedAt),
      })),
    );
  }

  for (const batch of chunk(symptoms, 200)) {
    await db.insert(schema.symptomLogs).values(
      batch.map((entry) => ({
        id: entry.id,
        userId: entry.userId,
        pain: entry.pain,
        bloating: entry.bloating,
        energy: entry.energy,
        urgency: entry.urgency,
        notes: entry.notes ?? null,
        loggedAt: new Date(entry.loggedAt),
      })),
    );
  }

  console.log(`· seeded ${meals.length} meals and ${symptoms.length} symptom check-ins`);
}

async function main() {
  console.log("Setting up the GutGuide database…");
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("· migrations applied");
  await promoteToHypertables();
  await seed();
  console.log("Done.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => client.end({ timeout: 5 }));
