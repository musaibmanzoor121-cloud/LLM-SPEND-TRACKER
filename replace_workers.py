import sys

with open('src/db/workers.ts', 'r') as f:
    content = f.read()

content = content.replace("from '../encryption.js'", "from '../lib/encryption.js'")
content = content.replace("from '../providers/openai.js'", "from '../lib/providers/openai.js'")
content = content.replace("from '../providers/anthropic.js'", "from '../lib/providers/anthropic.js'")

with open('src/db/workers.ts', 'w') as f:
    f.write(content)
