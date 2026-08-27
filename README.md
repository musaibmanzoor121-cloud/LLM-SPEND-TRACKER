# Watchdog — API Spend Intelligence & Security Vault

![Watchdog Dashboard](https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=2000&h=800)
*(Note: Replace the URL above with a screenshot of your actual Watchdog dashboard)*

**🌍 Live Demo:** [Try Watchdog Online Here](https://ais-pre-sntyk6owqwryftrrvec4xz-814823091306.asia-southeast1.run.app) | **🛠️ Edit in AI Studio:** [Open Workspace](https://ai.studio/apps/4ad86028-4628-45da-b7e7-4fe5ec04e0c9)

This repository contains the complete source code for **Watchdog**, a secure, multi-tenant platform designed to track, analyze, and govern API expenditure across multiple AI inference providers. 

The project was built to solve the fragmentation of AI billing. It provides a readable, full-stack implementation (React 18 + Node.js/Express) with a zero-knowledge encryption boundary for API credentials, a deterministic daily syncing engine, and a polished frontend renderer. 

This is a production-ready baseline for teams or individuals who need absolute visibility into their LLM token usage without exposing their root API keys to third-party SaaS trackers.

## What is in the repository?

The checked-in tree contains the complete frontend and backend boundaries required to spin up the Watchdog platform. 

The resulting app is a hybrid full-stack design:
*   **Encrypted Storage**: The database tier stores API keys using AES-256-GCM encryption. The backend never logs or exposes plaintext keys.
*   **The Renderer**: A highly polished, dark-mode React UI utilizing Tailwind CSS, Recharts, and Framer Motion for interactive analytics.
*   **The Sync Engine**: A Node.js CRON-style worker that securely polls provider billing endpoints and aggregates usage data.
*   **Alerting**: A built-in threshold evaluator that dispatches Resend emails when expenditure crosses configurable boundaries.

## Current features

### Provider Support & Model-Level Analytics
Watchdog tracks usage and billing across 10 major AI inference providers:
*   OpenAI, Anthropic, Google Gemini, Mistral AI, Cohere, Groq, DeepSeek, Perplexity, Together AI, and OpenRouter.

The application preserves granular model-level data (e.g., GPT-4o vs Claude 3.5 Sonnet) and allows you to tag keys with specific environments (e.g., `Production`, `Dev`) to isolate exactly where your token budget is being spent.

### Zero-Knowledge Vault
Navigate to **API Keys** to safely inject your credentials. The application instantly encrypts the payload using the `ENCRYPTION_KEY` environment variable. If the database is compromised, the keys remain mathematically unreadable.

### Automated Intercepts
Navigate to **Budgets** to set maximum monthly spend limits per provider. You can define multiple threshold tiers (e.g., `50, 80, 100`). The sync engine evaluates your live spend against these thresholds daily and triggers automated email alerts to prevent bill shock.

## Architecture

```text
      Polished React Renderer
                 │
                 │ JWT / REST API
                 ▼
          Express Node Server
                 │
       ┌─────────┴─────────┐
       │                   │
  Sync Engine       Encryption Boundary (AES-256)
       │                   │
       ▼                   ▼
 External APIs     PostgreSQL (Cloud SQL)
 (OpenAI, etc.)
```

The main source areas are:
*   `server.ts` — The Node.js/Express host, JWT authentication, and the daily sync engine.
*   `src/db/` — Database schemas, PG client configuration, and connection pooling.
*   `src/components/` — The readable React/TypeScript renderer, analytics dashboard, and onboarding flows.
*   `src/App.tsx` — Application routing and global state boundaries.

## Requirements

*   Node.js 18.x or higher
*   PostgreSQL database (e.g., Cloud SQL, Supabase, local Postgres)
*   A Resend API Key (for email alerts)
*   A secure 32-byte hex string for encryption

## Quick start

```bash
git clone https://github.com/yourusername/watchdog.git
cd watchdog
npm install
```

Configure your environment by copying `.env.example` to `.env`:

```env
DATABASE_URL="your_postgresql_connection_string"
ENCRYPTION_KEY="generate_this_via_crypto_module"
JWT_SECRET="generate_this_via_crypto_module"
RESEND_API_KEY="your_resend_api_key"
```

Start the local development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Development commands

```bash
npm run dev       # Starts the combined Vite frontend and tsx backend
npm run build     # Compiles the TypeScript server and bundles the React app
npm run start     # Runs the compiled production server
```

## Project status
The application is fully operational. The core reconstructed flows are usable, including encrypted credential storage, multi-provider polling, animated onboarding, and automated email alerts. 

