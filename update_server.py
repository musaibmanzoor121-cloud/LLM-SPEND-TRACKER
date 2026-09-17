with open('server.ts', 'r') as f:
    content = f.read()

csv_endpoint = """
/**
 * @openapi
 * /api/reports/csv:
 *   get:
 *     summary: Export monthly usage report as CSV
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: CSV file download
 */
app.get('/api/reports/csv', authenticateToken, async (req: any, res: any) => {
  try {
    const { rows } = await query(`
      SELECT 
        u.provider_id,
        u.model,
        SUM(u.cost_usd) as total_cost,
        SUM(u.input_tokens) as total_input,
        SUM(u.output_tokens) as total_output,
        MAX(b.monthly_limit_usd) as budget_limit
      FROM usage_snapshots u
      LEFT JOIN budgets b ON u.provider_id = b.provider_id AND u.user_id = b.user_id
      WHERE u.user_id = $1 
        AND date_trunc('month', u.snapshot_date) = date_trunc('month', CURRENT_DATE)
      GROUP BY u.provider_id, u.model
      ORDER BY total_cost DESC
    `, [req.user.id]);

    const headers = ['Provider', 'Model', 'Total Cost (USD)', 'Input Tokens', 'Output Tokens', 'Monthly Budget Limit (USD)'];
    const csvRows = [headers.join(',')];

    for (const row of rows) {
      csvRows.push(`${row.provider_id},${row.model || 'unknown'},${Number(row.total_cost).toFixed(4)},${row.total_input},${row.total_output},${row.budget_limit ? Number(row.budget_limit).toFixed(2) : 'N/A'}`);
    }

    res.header('Content-Type', 'text/csv');
    res.attachment('watchdog-monthly-usage.csv');
    return res.send(csvRows.join('\\n'));
  } catch (error) {
    logger.error('CSV Export Error:', error);
    res.status(500).json({ error: 'Failed to generate CSV report' });
  }
});
"""

if "/api/reports/csv" not in content:
    # Insert right before app.get('/api/dashboard', ...)
    content = content.replace("app.get('/api/dashboard', authenticateToken", csv_endpoint + "\napp.get('/api/dashboard', authenticateToken")
    with open('server.ts', 'w') as f:
        f.write(content)
