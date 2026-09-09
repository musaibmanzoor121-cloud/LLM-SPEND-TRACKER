with open('server.ts', 'r') as f:
    content = f.read()

import re

old_redis_setup = "const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', { maxRetriesPerRequest: null });"
new_redis_setup = """
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', { 
  maxRetriesPerRequest: null,
  retryStrategy(times) {
    if (times > 3) return null; // Stop retrying after 3 attempts
    return Math.min(times * 50, 2000);
  }
});
redis.on('error', (err) => {
  console.warn('Redis cache connection error (running without cache):', err.message);
});
"""

if old_redis_setup in content:
    content = content.replace(old_redis_setup, new_redis_setup)

# Fix cache usage
old_cache_get = """    // Try cache first
    const cachedData = await redis.get(cacheKey);"""

new_cache_get = """    // Try cache first if redis is available
    let cachedData = null;
    if (redis.status === 'ready') {
      try { cachedData = await redis.get(cacheKey); } catch (e) {}
    }"""

if old_cache_get in content:
    content = content.replace(old_cache_get, new_cache_get)

old_cache_set = "await redis.setex(cacheKey, 900, JSON.stringify(responseData));"
new_cache_set = """if (redis.status === 'ready') {
      try { await redis.setex(cacheKey, 900, JSON.stringify(responseData)); } catch (e) {}
    }"""

if old_cache_set in content:
    content = content.replace(old_cache_set, new_cache_set)

# Fix bullmq queue addition gracefully
old_queue_add = "await pollingQueue.addBulk(jobs);"
new_queue_add = """try { await pollingQueue.addBulk(jobs); } catch (e) { console.warn('Redis unavailable, job not queued'); }"""
if old_queue_add in content:
    content = content.replace(old_queue_add, new_queue_add)

with open('server.ts', 'w') as f:
    f.write(content)

with open('src/db/workers.ts', 'r') as f:
    workers = f.read()

old_worker_redis = "const connection = new Redis(redisUrl, { maxRetriesPerRequest: null });"
new_worker_redis = """const connection = new Redis(redisUrl, { 
  maxRetriesPerRequest: null,
  retryStrategy(times) {
    if (times > 3) return null;
    return Math.min(times * 50, 2000);
  }
});
connection.on('error', (err) => {
  console.warn('BullMQ Redis connection error (background workers disabled):', err.message);
});
"""

if old_worker_redis in workers:
    workers = workers.replace(old_worker_redis, new_worker_redis)
    with open('src/db/workers.ts', 'w') as f:
        f.write(workers)

