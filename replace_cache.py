with open('server.ts', 'r') as f:
    content = f.read()

redis_import = "import Redis from 'ioredis';"
if redis_import not in content:
    content = content.replace("import express from 'express';", f"import express from 'express';\n{redis_import}")

redis_setup = """
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', { maxRetriesPerRequest: null });
"""

if "const redis = new Redis(" not in content:
    content = content.replace("const resend =", f"{redis_setup}\nconst resend =")

dashboard_cache_logic = """
app.get('/api/dashboard', authenticateToken, async (req: any, res: any) => {
  try {
    const { timeframe } = req.query;
    const cacheKey = `dashboard:${req.user.id}:${timeframe || 'this_month'}`;
    
    // Try cache first
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      return res.json(JSON.parse(cachedData));
    }

    let startDate = new Date();
    startDate.setDate(1); // Default: this_month
    let endDate = new Date();
    
    if (timeframe === '7d') {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
    } else if (timeframe === '30d') {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
    } else if (timeframe === 'last_month') {
      startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 1, 1);
      endDate = new Date(endDate.getFullYear(), endDate.getMonth(), 0);
    }

    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    // Get budgets
    const { rows: budgets } = await query('SELECT provider_id, monthly_limit_usd, alert_thresholds FROM budgets WHERE user_id = $1', [req.user.id]);
    
    // Get spend per provider
    const { rows: spendData } = await query(`
      SELECT provider_id, project_tag, SUM(cost_usd) as total_spend
      FROM usage_snapshots
      WHERE snapshot_date >= $1 AND snapshot_date <= $2 AND user_id = $3
      GROUP BY provider_id, project_tag
    `, [startStr, endStr, req.user.id]);
    
    // Get daily trend
    const { rows: dailyTrend } = await query(`
      SELECT snapshot_date, provider_id, project_tag, SUM(cost_usd) as cost
      FROM usage_snapshots
      WHERE snapshot_date >= $1 AND snapshot_date <= $2 AND user_id = $3
      GROUP BY snapshot_date, provider_id, project_tag
      ORDER BY snapshot_date ASC
    `, [startStr, endStr, req.user.id]);

    // Get model breakdown
    const { rows: modelBreakdown } = await query(`
      SELECT provider_id, model, project_tag, SUM(cost_usd) as total_cost
      FROM usage_snapshots
      WHERE snapshot_date >= $1 AND snapshot_date <= $2 AND user_id = $3
      GROUP BY provider_id, model, project_tag
      ORDER BY total_cost DESC
    `, [startStr, endStr, req.user.id]);

    const responseData = { budgets, spendData, dailyTrend, modelBreakdown, timeframe: timeframe || 'this_month' };
    
    // Cache for 15 minutes
    await redis.setex(cacheKey, 900, JSON.stringify(responseData));

    res.json(responseData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});
"""

import re
# Regex to match the old app.get('/api/dashboard' ... route
pattern = re.compile(r"app\.get\('/api/dashboard', authenticateToken, async \(req: any, res: any\) => \{.*?\n\}\);\n", re.DOTALL)
content = pattern.sub(dashboard_cache_logic, content)

with open('server.ts', 'w') as f:
    f.write(content)
