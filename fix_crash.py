with open('server.ts', 'r') as f:
    content = f.read()

global_handler = """
// Prevent Redis connection errors from crashing the app in development
process.on('uncaughtException', (err: any) => {
  if (err.code === 'ECONNREFUSED' && err.port === 6379) {
    console.warn('Ignored uncaught Redis connection error');
  } else {
    console.error('Uncaught Exception:', err);
    process.exit(1);
  }
});
process.on('unhandledRejection', (reason: any) => {
  if (reason && reason.code === 'ECONNREFUSED' && reason.port === 6379) {
    console.warn('Ignored unhandled Redis connection rejection');
  } else {
    console.error('Unhandled Rejection:', reason);
  }
});
"""

if "process.on('uncaughtException'" not in content:
    content = content.replace("const app = express();", f"{global_handler}\nconst app = express();")

with open('server.ts', 'w') as f:
    f.write(content)
