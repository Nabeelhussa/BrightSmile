import { env } from './config/env.js';
import { closeDb, getDialect, initDb } from './db/index.js';
import { createSchema } from './db/schema.js';
import { seedDatabase } from './db/seed.js';
import { createApp } from './app.js';

let server;

async function start() {
  await initDb();
  await createSchema();
  const seedResult = await seedDatabase();

  const app = createApp();
  server = app.listen(env.port, () => {
    console.log(
      `[API] BrightSmile Server listening on port ${env.port} (${getDialect()})`
    );
    if (seedResult.seeded) {
      console.log(
        `[DB] Seeded ${seedResult.doctors} doctors and ${seedResult.appointments} appointments.`
      );
    }
  });
}

async function shutdown(signal) {
  console.log(`[API] Received ${signal}. Shutting down gracefully...`);
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await closeDb();
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

start().catch((error) => {
  console.error('[API] Failed to start server:', error);
  process.exit(1);
});
