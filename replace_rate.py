with open('server.ts', 'r') as f:
    content = f.read()

import_statement = "import rateLimit from 'express-rate-limit';"
if import_statement not in content:
    content = content.replace("import express from 'express';", f"import express from 'express';\n{import_statement}")

rate_limit_setup = """
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', apiLimiter);
"""

if "const apiLimiter = rateLimit" not in content:
    content = content.replace("app.use(express.json());", f"app.use(express.json());\n{rate_limit_setup}")

with open('server.ts', 'w') as f:
    f.write(content)
