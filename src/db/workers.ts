/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { logger } from '../lib/logger.js';
import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import { query } from './index.js';
import { decrypt } from '../lib/encryption.js';
import { fetchOpenAIUsage } from '../lib/providers/openai.js';
import { fetchAnthropicUsage } from '../lib/providers/anthropic.js';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key');

// Core execution logic for polling an individual provider credential
export async function processPollJob(data: any) {
  const { provider_id, encrypted_key, user_id, label, today } = data;
  
  logger.info(`Polling ${provider_id} for user ${user_id}`);
  
  try {
    const apiKey = decrypt(encrypted_key);
    let usage = null;
    
    if (provider_id === 'openai') {
      usage = await fetchOpenAIUsage(apiKey, today);
    } else if (provider_id === 'anthropic') {
      usage = await fetchAnthropicUsage(apiKey, today);
    }

    if (usage) {
      await query(`
        INSERT INTO usage_snapshots (user_id, provider_id, snapshot_date, cost_usd, input_tokens, output_tokens, raw_response, model, project_tag)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (user_id, provider_id, snapshot_date, model, project_tag) DO UPDATE
        SET cost_usd = EXCLUDED.cost_usd, input_tokens = EXCLUDED.input_tokens, output_tokens = EXCLUDED.output_tokens, raw_response = EXCLUDED.raw_response, fetched_at = NOW()
      `, [
        user_id, provider_id, today, usage.cost_usd, 
        usage.input_tokens || 0, usage.output_tokens || 0, 
        usage.raw_response,
        usage.model || 'default',
        label || 'default'
      ]);
      
      // Trigger budget alert evaluation for this user and provider
      await alertsQueue.add('evaluate-alerts', { user_id, provider_id });
      
      return { status: 'success', cost: usage.cost_usd };
    }
  } catch (err: any) {
    logger.error(`Error polling ${provider_id} for user ${user_id}:`, err);
    throw err;
  }
}

// Core execution logic for budget threshold alerts
export async function processAlertJob(data: any) {
  const { user_id, provider_id } = data;
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const currentMonth = startOfMonth.substring(0, 7);

  const { rows: budgets } = await query(
    'SELECT monthly_limit_usd, alert_thresholds FROM budgets WHERE user_id = $1 AND provider_id = $2',
    [user_id, provider_id]
  );
  
  if (budgets.length === 0) return;
  const budget = budgets[0];

  const { rows: spendRes } = await query(`
    SELECT SUM(cost_usd) as total 
    FROM usage_snapshots 
    WHERE user_id = $1 AND provider_id = $2 AND snapshot_date >= $3
  `, [user_id, provider_id, startOfMonth]);
  
  const totalSpend = Number(spendRes[0]?.total || 0);
  const limit = Number(budget.monthly_limit_usd);
  const thresholds = budget.alert_thresholds || [50, 80, 100];

  for (const thresholdPercent of thresholds) {
    const alertThreshold = limit * (thresholdPercent / 100);
    if (totalSpend >= alertThreshold) {
      const { rows: sent } = await query(`
        SELECT id FROM alerts_sent 
        WHERE user_id = $1 AND provider_id = $2 AND month = $3 AND alert_type = $4
      `, [user_id, provider_id, currentMonth, `threshold_${thresholdPercent}`]);

      if (sent.length === 0) {
        const { rows: users } = await query('SELECT email FROM users WHERE id = $1', [user_id]);
        if (users[0]?.email && process.env.RESEND_API_KEY) {
          await resend.emails.send({
            from: 'Watchdog Alerts <onboarding@resend.dev>',
            to: users[0].email,
            subject: `[Watchdog] ${provider_id} Budget Alert (${thresholdPercent}%)`,
            html: `<p>Your ${provider_id} spend has reached <strong>$${totalSpend.toFixed(2)}</strong>, which is over your alert threshold of ${thresholdPercent}% of your $${limit.toFixed(2)} monthly budget.</p>`
          });
          
          await query(`
            INSERT INTO alerts_sent (user_id, provider_id, alert_type, month)
            VALUES ($1, $2, $3, $4)
          `, [user_id, provider_id, `threshold_${thresholdPercent}`, currentMonth]);
          
          logger.info(`Alert sent to ${users[0].email} for ${provider_id} at ${thresholdPercent}%`);
        }
      }
    }
  }
}

// Check if external Redis is explicitly configured
const isRedisConfigured = Boolean(process.env.REDIS_URL && process.env.REDIS_URL.trim().length > 0);

export let pollingQueue: any;
export let alertsQueue: any;
export let pollingWorker: any = null;
export let alertsWorker: any = null;

if (isRedisConfigured) {
  const connection = new Redis(process.env.REDIS_URL!, { 
    maxRetriesPerRequest: null,
    retryStrategy(times) {
      if (times > 3) return null;
      return Math.min(times * 100, 2000);
    }
  });

  connection.on('error', (err) => {
    logger.debug('BullMQ Redis connection error (background workers fallback to in-memory):', err.message);
  });

  pollingQueue = new Queue('usage-polling', { connection });
  alertsQueue = new Queue('budget-alerts', { connection });

  pollingWorker = new Worker('usage-polling', async job => {
    return processPollJob(job.data);
  }, { connection });

  alertsWorker = new Worker('budget-alerts', async job => {
    return processAlertJob(job.data);
  }, { connection });

  pollingQueue.on('error', (err: any) => logger.debug('pollingQueue error:', err?.message));
  alertsQueue.on('error', (err: any) => logger.debug('alertsQueue error:', err?.message));
  pollingWorker.on('error', (err: any) => logger.debug('pollingWorker error:', err?.message));
  alertsWorker.on('error', (err: any) => logger.debug('alertsWorker error:', err?.message));
} else {
  // Graceful in-memory queue adapter when REDIS_URL is not provided
  pollingQueue = {
    add: async (name: string, data: any, opts?: any) => {
      setImmediate(() => {
        processPollJob(data).catch(err => {
          logger.warn('In-memory polling job error:', err?.message || err);
        });
      });
      return { id: `mem-poll-${Date.now()}` };
    },
    addBulk: async (jobs: Array<{ name: string; data: any }>) => {
      setImmediate(async () => {
        for (const job of jobs) {
          try {
            await processPollJob(job.data);
          } catch (err: any) {
            logger.warn('In-memory bulk polling job error:', err?.message || err);
          }
        }
      });
      return jobs.map((_, idx) => ({ id: `mem-bulk-${Date.now()}-${idx}` }));
    },
    on: () => pollingQueue,
  };

  alertsQueue = {
    add: async (name: string, data: any) => {
      setImmediate(() => {
        processAlertJob(data).catch(err => {
          logger.warn('In-memory alert job error:', err?.message || err);
        });
      });
      return { id: `mem-alert-${Date.now()}` };
    },
    on: () => alertsQueue,
  };
}
