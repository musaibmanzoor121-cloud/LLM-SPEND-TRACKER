with open('README.md', 'r') as f:
    content = f.read()

badges = """
[![CI](https://github.com/musaibmanzoor/watchdog-api-vault/actions/workflows/main.yml/badge.svg)](https://github.com/musaibmanzoor/watchdog-api-vault/actions/workflows/main.yml)
[![Docker Support](https://img.shields.io/badge/docker-ready-blue.svg)](https://www.docker.com/)
[![Redis Caching](https://img.shields.io/badge/redis-caching-red.svg)](https://redis.io/)
"""

if "[![CI]" not in content:
    content = content.replace("# Watchdog — API Spend Intelligence & Security Vault\n", f"# Watchdog — API Spend Intelligence & Security Vault\n\n{badges}\n")

arch_diagram = """
## 🧠 System Architecture

Watchdog uses a robust, enterprise-grade architecture:

```mermaid
graph TD
    Client[React Frontend] -->|REST API| API[Express.js API Gateway]
    API -->|Reads/Writes| Cache[(Redis Cache)]
    API -->|Encrypts Keys| DB[(PostgreSQL DB)]
    API -->|Queues Jobs| Queue[BullMQ Message Queue]
    Queue --> Worker[Background Worker]
    Worker -->|Fetches Data| Providers[OpenAI/Anthropic APIs]
    Worker -->|Sends Emails| Resend[Resend Email API]
    Worker -->|Updates Metrics| DB
```

- **Redis** is used for rate limiting, high-speed API response caching, and managing the BullMQ background job queues.
- **Background Workers** handle the heavy lifting of polling LLM APIs so the main web thread stays responsive.
- **AES-256-GCM** encryption ensures API keys are securely vaulted in the PostgreSQL database.
"""

if "## 🧠 System Architecture" not in content:
    # insert before "## 🚀 Features"
    content = content.replace("## 🚀 Features", f"{arch_diagram}\n## 🚀 Features")

with open('README.md', 'w') as f:
    f.write(content)
