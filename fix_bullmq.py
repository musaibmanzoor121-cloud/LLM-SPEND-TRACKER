with open('src/db/workers.ts', 'r') as f:
    content = f.read()

workers_fix = """
pollingQueue.on('error', (err) => console.warn('pollingQueue error:', err.message));
alertsQueue.on('error', (err) => console.warn('alertsQueue error:', err.message));
pollingWorker.on('error', (err) => console.warn('pollingWorker error:', err.message));
alertsWorker.on('error', (err) => console.warn('alertsWorker error:', err.message));
"""

if "pollingQueue.on('error'" not in content:
    content = content + "\n" + workers_fix

with open('src/db/workers.ts', 'w') as f:
    f.write(content)
