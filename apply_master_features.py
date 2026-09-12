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
