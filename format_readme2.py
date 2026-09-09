with open('README.md', 'r') as f:
    content = f.read()

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
    # insert before "## Current features"
    content = content.replace("## Current features", f"{arch_diagram}\n## Current features")

with open('README.md', 'w') as f:
    f.write(content)
