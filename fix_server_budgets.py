with open('server.ts', 'r') as f:
    content = f.read()

old_post = """app.post('/api/budgets', authenticateToken, async (req: any, res: any) => {
  const { provider_id, limit, thresholds } = req.body;
  try {
    await query(`
      INSERT INTO budgets (provider_id, monthly_limit_usd, user_id, alert_thresholds)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, provider_id) DO UPDATE 
      SET monthly_limit_usd = $2, alert_thresholds = $4, updated_at = NOW()
    `, [provider_id, limit, req.user.id, thresholds || [50, 80, 100]]);
    res.json({ success: true });"""

new_post = """app.post('/api/budgets', authenticateToken, async (req: any, res: any) => {
  const { provider_id, limit, thresholds, email_alerts, dashboard_alerts } = req.body;
  try {
    await query(`
      INSERT INTO budgets (provider_id, monthly_limit_usd, user_id, alert_thresholds, email_alerts_enabled, dashboard_alerts_enabled)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (user_id, provider_id) DO UPDATE 
      SET monthly_limit_usd = $2, alert_thresholds = $4, email_alerts_enabled = $5, dashboard_alerts_enabled = $6, updated_at = NOW()
    `, [provider_id, limit, req.user.id, thresholds || [50, 80, 100], email_alerts !== false, dashboard_alerts !== false]);
    res.json({ success: true });"""

if "email_alerts_enabled" not in content and old_post in content:
    content = content.replace(old_post, new_post)
    with open('server.ts', 'w') as f:
        f.write(content)
