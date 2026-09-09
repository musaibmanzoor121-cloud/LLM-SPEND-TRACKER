import sys

with open('server.ts', 'r') as f:
    content = f.read()

with open('temp_target.txt', 'r') as f:
    target = f.read()

replacement = """import { pollingQueue } from './src/db/workers.js';

app.post('/api/cron/trigger-sync', authenticateToken, async (req: any, res: any) => {
  try {
    const { rows: keys } = await query('SELECT id, provider_id, encrypted_key, user_id, label FROM api_credentials WHERE is_active = true AND user_id = $1', [req.user.id]);
    const today = new Date().toISOString().split('T')[0];
    
    const jobs = keys.map(keyRow => ({
      name: 'poll-usage',
      data: {
        keyId: keyRow.id,
        provider_id: keyRow.provider_id,
        encrypted_key: keyRow.encrypted_key,
        user_id: keyRow.user_id,
        label: keyRow.label,
        today
      }
    }));

    if (jobs.length > 0) {
        await pollingQueue.addBulk(jobs);
    }
    res.json({ success: true, message: `Queued ${jobs.length} sync jobs for background processing.` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Setup BullMQ Repeatable Job for daily polling (runs at 11:50 PM every day)
pollingQueue.add('daily-system-sync', { type: 'system-wide' }, {
  repeat: {
    pattern: '50 23 * * *'
  }
});
"""

if target in content:
    new_content = content.replace(target, replacement)
    with open('server.ts', 'w') as f:
        f.write(new_content)
    print("Successfully replaced.")
else:
    print("Target not found.")
