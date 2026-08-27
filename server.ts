import express from 'express';
import path from 'path';
import cron from 'node-cron';
import { createServer as createViteServer } from 'vite';
import { query, initDb } from './src/db/index.js';
import { encrypt, decrypt } from './src/lib/encryption.js';
import { fetchOpenAIUsage } from './src/lib/providers/openai.js';
import { fetchAnthropicUsage } from './src/lib/providers/anthropic.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key');

const app = express();
app.use(express.json());

const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-prod';

// Auth Middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: 'Forbidden' });
    req.user = user;
    next();
  });
};

// API Routes
app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
  try {
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await query('INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email', [email, hash]);
    const user = rows[0];
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token });
  } catch (error: any) {
    if (error.code === '23505') return res.status(400).json({ error: 'Email already in use' });
    res.status(500).json({ error: 'Failed to register' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const { rows } = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
    
    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });
    
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: 'Failed to login' });
  }
});

app.put('/api/account/password', authenticateToken, async (req: any, res: any) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const { rows } = await query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    
    const match = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!match) return res.status(401).json({ error: 'Incorrect current password' });
    
    const hash = await bcrypt.hash(newPassword, 10);
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.user.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update password' });
  }
});

app.delete('/api/account', authenticateToken, async (req: any, res: any) => {
  try {
    await query('DELETE FROM usage_snapshots WHERE user_id = $1', [req.user.id]);
    await query('DELETE FROM api_credentials WHERE user_id = $1', [req.user.id]);
    await query('DELETE FROM budgets WHERE user_id = $1', [req.user.id]);
    await query('DELETE FROM alerts_sent WHERE user_id = $1', [req.user.id]);
    await query('DELETE FROM users WHERE id = $1', [req.user.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to delete account', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/keys', authenticateToken, async (req: any, res: any) => {
  try {
    const { rows } = await query('SELECT id, provider_id, label, is_active, created_at FROM api_credentials WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch keys' });
  }
});

app.post('/api/keys', authenticateToken, async (req: any, res: any) => {
  const { provider_id, key, label } = req.body;
  if (!provider_id || !key) return res.status(400).json({ error: 'Missing required fields' });
  
  try {
    const encrypted_key = encrypt(key);
    await query(
      'INSERT INTO api_credentials (provider_id, encrypted_key, label, user_id) VALUES ($1, $2, $3, $4)',
      [provider_id, encrypted_key, label || '', req.user.id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to save key' });
  }
});

app.delete('/api/keys/:id', authenticateToken, async (req: any, res: any) => {
  try {
    await query('DELETE FROM api_credentials WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete key' });
  }
});

app.get('/api/dashboard', authenticateToken, async (req: any, res: any) => {
  try {
    const { timeframe } = req.query;
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

    res.json({ budgets, spendData, dailyTrend, modelBreakdown, timeframe: timeframe || 'this_month' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

app.post('/api/budgets', authenticateToken, async (req: any, res: any) => {
  const { provider_id, limit, thresholds } = req.body;
  try {
    await query(`
      INSERT INTO budgets (provider_id, monthly_limit_usd, user_id, alert_thresholds)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, provider_id) DO UPDATE 
      SET monthly_limit_usd = $2, alert_thresholds = $4, updated_at = NOW()
    `, [provider_id, limit, req.user.id, thresholds || [50, 80, 100]]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save budget' });
  }
});

app.get('/api/cron/poll-usage', async (req, res) => {
  // Can be secured via headers in production
  
  try {
    const { rows: keys } = await query('SELECT id, provider_id, encrypted_key, user_id FROM api_credentials WHERE is_active = true');
    const today = new Date().toISOString().split('T')[0];
    const results = [];

    for (const keyRow of keys) {
      if (!keyRow.user_id) continue;

      try {
        const apiKey = decrypt(keyRow.encrypted_key);
        let usage = null;
        
        if (keyRow.provider_id === 'openai') {
          usage = await fetchOpenAIUsage(apiKey, today);
        } else if (keyRow.provider_id === 'anthropic') {
          usage = await fetchAnthropicUsage(apiKey, today);
        }

        if (usage) {
          await query(`
            INSERT INTO usage_snapshots (user_id, provider_id, snapshot_date, cost_usd, input_tokens, output_tokens, raw_response, model, project_tag)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (user_id, provider_id, snapshot_date, model, project_tag) DO UPDATE
            SET cost_usd = EXCLUDED.cost_usd, input_tokens = EXCLUDED.input_tokens, output_tokens = EXCLUDED.output_tokens, raw_response = EXCLUDED.raw_response, fetched_at = NOW()
          `, [
            keyRow.user_id, keyRow.provider_id, today, usage.cost_usd, 
            usage.input_tokens || 0, usage.output_tokens || 0, 
            usage.raw_response,
            usage.model || 'default',
            keyRow.label || 'default'
          ]);
          results.push({ provider: keyRow.provider_id, user_id: keyRow.user_id, status: 'success', cost: usage.cost_usd });
        }
      } catch (err: any) {
        console.error(`Error polling ${keyRow.provider_id} for user ${keyRow.user_id}:`, err);
        results.push({ provider: keyRow.provider_id, user_id: keyRow.user_id, status: 'error', error: err.message });
      }
    }
    
    // Evaluate Budget Alerts
    try {
      const { rows: budgets } = await query('SELECT user_id, provider_id, monthly_limit_usd, alert_thresholds FROM budgets');
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
      const currentMonth = startOfMonth.substring(0, 7);

      for (const budget of budgets) {
        const { rows: spendRes } = await query(`
          SELECT SUM(cost_usd) as total 
          FROM usage_snapshots 
          WHERE user_id = $1 AND provider_id = $2 AND snapshot_date >= $3
        `, [budget.user_id, budget.provider_id, startOfMonth]);
        
        const totalSpend = Number(spendRes[0]?.total || 0);
        const limit = Number(budget.monthly_limit_usd);
        const thresholds = budget.alert_thresholds || [50, 80, 100];

        for (const thresholdPercent of thresholds) {
          const alertThreshold = limit * (thresholdPercent / 100);

          if (totalSpend >= alertThreshold) {
            // Check if alert already sent for this specific percentage threshold
            const { rows: sent } = await query(`
              SELECT id FROM alerts_sent 
              WHERE user_id = $1 AND provider_id = $2 AND month = $3 AND alert_type = $4
            `, [budget.user_id, budget.provider_id, currentMonth, `threshold_${thresholdPercent}`]);

            if (sent.length === 0) {
              const { rows: users } = await query('SELECT email FROM users WHERE id = $1', [budget.user_id]);
              if (users[0]?.email && process.env.RESEND_API_KEY) {
                await resend.emails.send({
                  from: 'Watchdog Alerts <onboarding@resend.dev>',
                  to: users[0].email,
                  subject: `[Watchdog] ${budget.provider_id} Budget Alert (${thresholdPercent}%)`,
                  html: `<p>Your ${budget.provider_id} spend has reached <strong>$${totalSpend.toFixed(2)}</strong>, which is over your alert threshold of ${thresholdPercent}% of your $${limit.toFixed(2)} monthly budget.</p>`
                });
                
                await query(`
                  INSERT INTO alerts_sent (user_id, provider_id, alert_type, month)
                  VALUES ($1, $2, $3, $4)
                `, [budget.user_id, budget.provider_id, `threshold_${thresholdPercent}`, currentMonth]);
                console.log(`Alert sent to ${users[0].email} for ${budget.provider_id} at ${thresholdPercent}%`);
              }
            }
          }
        }
      }
    } catch (alertError) {
      console.error('Error processing alerts:', alertError);
    }

    res.json({ success: true, results });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Setup Cron Job for daily polling (runs at 11:50 PM every day)
cron.schedule('50 23 * * *', async () => {
  console.log('Running daily usage poll cron job...');
  try {
    await fetch('http://localhost:3000/api/cron/poll-usage');
  } catch (e) {
    console.error('Cron job fetch failed:', e);
  }
});

async function startServer() {
  await initDb();

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
