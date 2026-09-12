import { pgTable, serial, varchar, timestamp, text, numeric, integer, boolean } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  password_hash: varchar("password_hash", { length: 255 }).notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

export const apiCredentials = pgTable("api_credentials", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id).notNull(),
  provider_id: varchar("provider_id", { length: 50 }).notNull(),
  encrypted_key: text("encrypted_key").notNull(),
  label: varchar("label", { length: 100 }),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
});

export const usageSnapshots = pgTable("usage_snapshots", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id).notNull(),
  provider_id: varchar("provider_id", { length: 50 }).notNull(),
  snapshot_date: timestamp("snapshot_date").notNull(),
  cost_usd: numeric("cost_usd", { precision: 10, scale: 4 }).notNull(),
  input_tokens: integer("input_tokens").default(0),
  output_tokens: integer("output_tokens").default(0),
  model: varchar("model", { length: 100 }).notNull().default('default'),
  project_tag: varchar("project_tag", { length: 100 }).notNull().default('default'),
  fetched_at: timestamp("fetched_at").defaultNow(),
});
