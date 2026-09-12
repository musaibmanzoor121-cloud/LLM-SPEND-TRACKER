#!/bin/bash
set -e

# 1. Install dependencies
npm i winston swagger-ui-express swagger-jsdoc drizzle-orm
npm i -D @playwright/test @types/swagger-ui-express @types/swagger-jsdoc drizzle-kit tsx

# 2. Setup Logger
mkdir -p src/lib
cat << 'INNER_EOF' > src/lib/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});
INNER_EOF

# 3. Setup Swagger
cat << 'INNER_EOF' > src/lib/swagger.ts
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Watchdog API',
      version: '1.0.0',
      description: 'API Spend Intelligence & Security Vault',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./server.ts'],
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Express) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
};
INNER_EOF

# 4. Setup Playwright
cat << 'INNER_EOF' > playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: 1,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
  },
});
INNER_EOF

mkdir -p tests/e2e
cat << 'INNER_EOF' > tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test('homepage loads correctly', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Vite|React|Watchdog/i);
});
INNER_EOF

# 5. Setup Drizzle
cat << 'INNER_EOF' > src/db/schema.ts
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
INNER_EOF

cat << 'INNER_EOF' > drizzle.config.ts
import { defineConfig } from "drizzle-kit";
export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgres://watchdog_user:secretpassword@localhost:5432/watchdog",
  },
});
INNER_EOF

# 6. Apply file modifications using Python
cat << 'INNER_EOF' > apply_master_features.py
import json

# Update package.json scripts
with open('package.json', 'r') as f:
    data = json.load(f)
data['scripts']['db:generate'] = 'drizzle-kit generate'
data['scripts']['db:migrate'] = 'drizzle-kit push'
data['scripts']['test:e2e'] = 'playwright test'
with open('package.json', 'w') as f:
    json.dump(data, f, indent=2)

# Update server.ts
with open('server.ts', 'r') as f: content = f.read()
content = "import { logger } from './src/lib/logger.js';\n" + content
content = content.replace("console.log", "logger.info")
content = content.replace("console.error", "logger.error")
content = content.replace("console.warn", "logger.warn")

content = "import { setupSwagger } from './src/lib/swagger.js';\n" + content
if "setupSwagger(app);" not in content:
    content = content.replace("app.use(express.json());", "app.use(express.json());\n  setupSwagger(app);")

swagger_login = """
/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Authenticate user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 */
"""
if "/api/auth/login:" not in content:
    content = content.replace("app.post('/api/auth/login',", swagger_login + "app.post('/api/auth/login',")
with open('server.ts', 'w') as f: f.write(content)

# Update workers.ts
with open('src/db/workers.ts', 'r') as f: workers = f.read()
workers = "import { logger } from '../lib/logger.js';\n" + workers
workers = workers.replace("console.log", "logger.info")
workers = workers.replace("console.error", "logger.error")
workers = workers.replace("console.warn", "logger.warn")
with open('src/db/workers.ts', 'w') as f: f.write(workers)

# Update README
with open('README.md', 'r') as f: readme = f.read()
new_badges = "[![Playwright E2E](https://img.shields.io/badge/playwright-tested-green.svg)](https://playwright.dev/)\n[![Drizzle ORM](https://img.shields.io/badge/drizzle-orm-yellow.svg)](https://orm.drizzle.team/)\n[![Swagger API Docs](https://img.shields.io/badge/swagger-api--docs-85EA2D.svg)](https://swagger.io/)\n"
if "[![Playwright E2E]" not in readme:
    readme = readme.replace("[![Redis Caching]", new_badges + "[![Redis Caching]")

features_addition = """### Enterprise Code Quality
* **Observability:** Centralized, structured logging implemented via Winston.
* **API Documentation:** Interactive OpenAPI (Swagger) documentation automatically generated at `/api-docs`.
* **Testing:** End-to-End (E2E) browser testing configured via Playwright alongside Jest unit tests.
* **Database Migrations:** Schema definition and migrations managed safely using Drizzle ORM.
"""
if "Enterprise Code Quality" not in readme:
    readme = readme.replace("## Current features", "## Current features\n\n" + features_addition)
with open('README.md', 'w') as f: f.write(readme)
INNER_EOF
python3 apply_master_features.py

