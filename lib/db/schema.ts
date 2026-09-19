import {
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import type { DietaryRestriction, Phase, Portion, TraitId } from "@/lib/types";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  diagnosedYear: integer("diagnosed_year").notNull(),
  phase: text("phase").$type<Phase>().notNull().default("remission"),
  restrictions: jsonb("restrictions").$type<DietaryRestriction[]>().notNull().default([]),
  watchTraits: jsonb("watch_traits").$type<TraitId[]>().notNull().default([]),
  favoriteCuisines: jsonb("favorite_cuisines").$type<string[]>().notNull().default([]),
  dislikes: jsonb("dislikes").$type<string[]>().notNull().default([]),
  goal: text("goal").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Meal and symptom logs are append-only time series — the shape TimescaleDB /
 * Tiger Data hypertables are built for. `drizzle/0001_hypertables.sql` promotes
 * both tables when the extension is present.
 */
export const mealLogs = pgTable(
  "meal_logs",
  {
    id: text("id").notNull(),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    foodIds: jsonb("food_ids").$type<string[]>().notNull().default([]),
    portion: text("portion").$type<Portion>().notNull().default("regular"),
    notes: text("notes"),
    source: text("source").$type<"manual" | "recipe" | "menu-scan">().notNull().default("manual"),
    loggedAt: timestamp("logged_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // Time is part of the key so the table can become a hypertable.
    primaryKey({ columns: [t.id, t.loggedAt] }),
    index("meal_logs_user_time_idx").on(t.userId, t.loggedAt),
  ],
);

export const symptomLogs = pgTable(
  "symptom_logs",
  {
    id: text("id").notNull(),
    userId: text("user_id").notNull(),
    pain: real("pain").notNull(),
    bloating: real("bloating").notNull(),
    energy: real("energy").notNull(),
    urgency: real("urgency").notNull(),
    notes: text("notes"),
    loggedAt: timestamp("logged_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.id, t.loggedAt] }),
    index("symptom_logs_user_time_idx").on(t.userId, t.loggedAt),
  ],
);

export type UserRow = typeof users.$inferSelect;
export type MealLogRow = typeof mealLogs.$inferSelect;
export type SymptomLogRow = typeof symptomLogs.$inferSelect;
