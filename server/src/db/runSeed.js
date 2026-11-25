import { closeDb, initDb } from './index.js';
import { createSchema } from './schema.js';
import { seedDatabase } from './seed.js';

const force = process.argv.includes('--force');

try {
  await initDb();
  await createSchema();
  const result = await seedDatabase({ force });
  console.log('Seed completed:', result);
} catch (error) {
  console.error('Seed failed:', error);
  process.exitCode = 1;
} finally {
  await closeDb();
}
