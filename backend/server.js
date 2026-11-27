import { config } from './config/env.js';
import { createDatabase } from './db/index.js';
import { createApp } from './app.js';

async function startServer() {
  const db = await createDatabase();
  const app = createApp(db);

  app.listen(config.port, () => {
    console.log(`[NEXUS Super Chatbot] Running on http://localhost:${config.port} (DB: ${db.mode})`);
  });
}

startServer().catch((err) => {
  console.error('[NEXUS Super Chatbot] Failed to start:', err.message);
  process.exit(1);
});
