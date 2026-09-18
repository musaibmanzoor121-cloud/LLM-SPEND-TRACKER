<div align="center">

# 🐕 Watchdog
### Enterprise-Grade AI Spend Intelligence & Zero-Knowledge Credential Vault

[![CI / Build Workflow](https://img.shields.io/badge/CI-Passing-3DDC97?style=for-the-badge&logo=github-actions&logoColor=white)](https://github.com/musaibmanzoor/watchdog-api-vault)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Docker Ready](https://img.shields.io/badge/Docker-Compose_Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![AES-256-GCM](https://img.shields.io/badge/Vault-AES--256--GCM-9B51E0?style=for-the-badge&logo=securityscorecard&logoColor=white)](https://en.wikipedia.org/wiki/Galois/Counter_Mode)
[![Swagger API Docs](https://img.shields.io/badge/OpenAPI-Swagger_3.0-85EA2D?style=for-the-badge&logo=swagger&logoColor=black)](/api-docs)
[![Playwright Tested](https://img.shields.io/badge/Testing-Playwright_E2E-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)](https://playwright.dev/)

<p align="center">
  <b>Eliminate surprise AI bills. Track real-time token spend across 10+ providers. Store API keys in an audited cryptographic vault.</b>
</p>

[Explore Live Demo](https://llm-spend-tracker.onrender.com) • [Quick Start](#-quick-start) • [Architecture](#-system-architecture) • [API Documentation](#-api-specification) • [Security Model](#-cryptographic-security-model)

</div>

---

## ⚡ The Problem & The Solution

Modern AI engineering stacks juggle API keys across OpenAI, Anthropic, Google Gemini, Mistral, Groq, DeepSeek, and more. 

| Challenge | Traditional SaaS Trackers | **Watchdog Vault** |
| :--- | :--- | :--- |
| **Credential Privacy** | Transmit root keys to 3rd-party servers | **Zero-Knowledge AES-256-GCM local encryption** |
| **Model Visibility** | High-level invoice summaries only | **Granular token usage down to specific models (e.g., GPT-4o vs Claude 3.5 Sonnet)** |
| **Budget Intercepts** | Billing alerts arrive after invoice close | **Proactive threshold alerts (50%, 80%, 100%) dispatched via Resend** |
| **Data Ownership** | Vendor lock-in with closed telemetry | **100% self-hostable with instant CSV export and PostgreSQL storage** |
| **Run Velocity** | Static monthly snapshots | **Real-time daily burn rate, EOM projected forecast, and active key monitoring** |

---

## 🌟 Key Features

### 1. 📊 Real-Time Cost Intelligence & Summary Cards
- **Total Keys Active**: Live tracking of verified, active credentials across all your providers with instant vault status indicators.
- **Projected Spend This Month**: End-of-month (EOM) burn forecast derived from linear daily run rates and historical token consumption velocity.
- **Alerts Triggered**: Real-time evaluation of active threshold warnings and automated dispatch logs.
- **Total Spend (MTD)**: Dynamic monthly-to-date expenditure progress mapped against global and per-provider spending caps.

### 2. 🛡️ Zero-Knowledge Cryptographic Vault
- API keys are encrypted at rest using **AES-256-GCM** with a distinct 16-byte cryptographic Initialization Vector (IV) and authentication tag per credential.
- Secrets are decrypted strictly in memory at the exact instant of provider synchronization and purged immediately afterward.
- Plaintext keys are **never** logged, persisted, or returned in API responses.

### 3. 🌐 Universal Provider Coverage (10 Inference Providers)
Native usage polling and model cost calculations for:
- 🟢 **OpenAI** (`gpt-4o`, `gpt-4o-mini`, `o1`, `o3-mini`, `text-embedding-3`)
- 🟣 **Anthropic** (`claude-3-5-sonnet`, `claude-3-5-haiku`, `claude-3-opus`)
- 🔵 **Google Gemini** (`gemini-2.0-flash`, `gemini-1.5-pro`, `gemini-1.5-flash`)
- 🟠 **Mistral AI** (`mistral-large`, `mistral-small`, `codestral`)
- 🔴 **Groq** (`llama-3.3-70b-versatile`, `mixtral-8x7b-32768`)
- 🔷 **DeepSeek** (`deepseek-chat`, `deepseek-reasoner`)
- 🩵 **Perplexity** (`sonar-pro`, `sonar`)
- 🟣 **Cohere** (`command-r-plus`, `command-r`)
- 🔵 **Together AI** (`meta-llama/Llama-3-70b-chat-hf`, `Qwen/Qwen2.5-72B`)
- 🦄 **OpenRouter** (Unified multi-model aggregator billing)

### 4. 🚨 Multi-Tier Budget Guardrails & Transactional Alerts
- Set monthly budget limits per provider (e.g., $500 for OpenAI, $250 for Anthropic).
- Configure tiered threshold intercepts (e.g., `50%`, `80%`, `100%`).
- Dispatches transactional email notifications via **Resend** the moment a threshold is breached to eliminate bill shock.

### 5. 📥 Instant CSV Data Export & Reporting
- Streamline accounting and FinOps reconciliation with a single-click CSV export.
- Generates structured audit reports including Provider, Model, Cost (USD), Input Tokens, Output Tokens, and Budget Caps.

---

## 🧠 System Architecture

Watchdog is structured as a high-concurrency, asynchronous, decoupled micro-architecture:

```mermaid
flowchart TD
    subgraph Client Tier
        UI[React 19 Frontend<br/>Tailwind CSS + Recharts + Lucide]
    end

    subgraph Gateway & API Tier
        API[Express 4 + TypeScript Gateway]
        AUTH[JWT Session Guard]
        DOCS[Swagger OpenAPI /api-docs]
        CSV[CSV Stream Engine]
    end

    subgraph Data & Vault Tier
        VAULT[(PostgreSQL Database<br/>AES-256-GCM Vault)]
        REDIS[(Redis 7 Cache<br/>Rate Limiting & Memory)]
    end

    subgraph Asynchronous Worker Tier
        QUEUE[BullMQ Polling Queue]
        CRON[Node-Cron Scheduler<br/>23:50 Daily System Polling]
        WORKER[BullMQ Multi-Threaded Workers]
    end

    subgraph External Inference APIs
        LLM[OpenAI / Anthropic / Gemini / DeepSeek APIs]
        MAIL[Resend Transactional Email API]
    end

    UI -->|Bearer JWT Requests| API
    API --> AUTH
    API --> DOCS
    API --> CSV
    API -->|High-Speed Read/Write| REDIS
    API -->|Store Encrypted Keys & Snapshots| VAULT
    API -->|Enqueue Polling Jobs| QUEUE
    CRON -->|Trigger Daily Sync| QUEUE
    QUEUE -->|Process Jobs| WORKER
    WORKER -->|Decrypt In-Memory| VAULT
    WORKER -->|Fetch Real Usage & Cost| LLM
    WORKER -->|Dispatch Threshold Alerts| MAIL
    WORKER -->|Write Snapshots & Alerts Sent| VAULT
```

---

## 🔒 Cryptographic Security Model

Watchdog enforces zero-trust architecture at the persistence boundary:

$$\text{Ciphertext} = \mathbf{AES\text{-}256\text{-}GCM}_{K}(\text{PlaintextKey}, \text{IV}) \parallel \text{AuthTag}$$

1. **Key Derivation**: The system requires a cryptographically secure 256-bit key (`ENCRYPTION_KEY`, 64 hexadecimal characters).
2. **IV Randomization**: Every API credential encryption generates a cryptographically random 16-byte initialization vector (`crypto.randomBytes(16)`). Two identical keys produce completely different ciphertexts.
3. **Galois/Counter Mode Authentication**: GCM mode computes a 16-byte authentication tag that detects any unauthorized database tampering or bit-flipping attacks.

```typescript
// server.ts - Cryptographic Vault Implementation
export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${encrypted}:${authTag}`;
}
```

---

## 🚀 Quick Start

### Option A: One-Command Launch with Docker Compose (Recommended)

Run Watchdog alongside isolated PostgreSQL and Redis containers with zero configuration:

```bash
# 1. Clone the repository
git clone https://github.com/musaibmanzoor/watchdog-api-vault.git
cd watchdog-api-vault

# 2. Launch the entire stack
docker-compose up -d --build
```

The application will be live immediately:
* 🖥️ **Web Dashboard**: [http://localhost:3000](http://localhost:3000)
* 📖 **Swagger API Docs**: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

---

### Option B: Local Bare-Metal Setup

#### Prerequisites
* **Node.js**: v18.x or v20.x+
* **PostgreSQL**: v14+ (Local, Cloud SQL, Supabase, or Neon)
* **Redis**: v6+ (Optional, graceful degradation supported)

#### 1. Clone & Install Dependencies
```bash
git clone https://github.com/musaibmanzoor/watchdog-api-vault.git
cd watchdog-api-vault
npm install
```

#### 2. Configure Environment Variables
Generate your encryption keys and configure `.env`:

```bash
cp .env.example .env
```

Generate a secure 32-byte hexadecimal encryption key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Populate `.env`:
```env
PORT=3000
NODE_ENV=development
DATABASE_URL="postgres://user:password@localhost:5432/watchdog"
ENCRYPTION_KEY="your_64_char_hex_key_generated_above"
JWT_SECRET="your_secure_random_jwt_secret"
RESEND_API_KEY="re_your_resend_api_key_optional"
REDIS_URL="redis://localhost:6379"
```

#### 3. Initialize Database & Run Migrations
```bash
npm run db:migrate
```

#### 4. Launch Development Server
```bash
npm run dev
```

---

## 📖 API Specification

Watchdog includes a fully documented OpenAPI 3.0 specification accessible at `/api-docs`.

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/auth/register` | Create a new tenant account | ❌ |
| `POST` | `/api/auth/login` | Authenticate and obtain JWT bearer token | ❌ |
| `GET` | `/api/dashboard` | Fetch aggregated spend, trends, and summary stats | ✅ |
| `GET` | `/api/reports/csv` | Download monthly usage report as CSV | ✅ |
| `GET` | `/api/keys` | List all masked credentials and active states | ✅ |
| `POST` | `/api/keys` | Encrypt and store a new API key in the vault | ✅ |
| `DELETE`| `/api/keys/:id` | Purge an API credential from the vault | ✅ |
| `POST` | `/api/budgets` | Set provider spend limits and threshold rules | ✅ |
| `POST` | `/api/cron/trigger-sync` | Force an immediate BullMQ background sync | ✅ |
| `POST` | `/api/account/reset` | Nuclear reset: erase snapshots, budgets, and keys | ✅ |

---

## 🧪 Testing & Observability

### End-to-End Testing (Playwright)
Watchdog runs automated browser tests validating authentication, key injection, budget triggers, and dashboard rendering:
```bash
npm run test:e2e
```

### Unit & Integration Testing (Jest)
Unit test cryptographic encrypt/decrypt cycles, JWT token validation, and rate limiters:
```bash
npm test
```

### Type Checking & Linting
```bash
npm run lint
```

### Structured Logging (Winston)
All system events, worker queues, and synchronization logs are formatted with ISO-8601 timestamps and structured metadata via Winston.

---

## 🗺️ Engineering Roadmap

- [x] **Universal Provider Polling** (10 Providers supported)
- [x] **AES-256-GCM Vault Architecture**
- [x] **Real-Time Summary Cards** (Keys Active, Projected Spend, Alerts Triggered)
- [x] **Automated Resend Email Alerts**
- [x] **CSV Audit Reporting Engine**
- [x] **Interactive Swagger API Documentation**
- [x] **Docker Compose Multi-Container Deployment**
- [ ] **Slack & Discord Webhook Integration** for real-time channel alerts
- [ ] **Anomaly Detection Engine** using statistical standard-deviation spike alerts
- [ ] **Team Workspaces & Role-Based Access Control (RBAC)**
- [ ] **Custom Proxy Gateway** for on-the-fly local token tracking

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/amazing-feature`)
3. Commit your Changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the Branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the **Apache-2.0 License**. See `LICENSE` for more information.

---

<div align="center">
  <sub>Engineered with precision for AI engineers, FinOps teams, and privacy-first builders.</sub>
</div>
