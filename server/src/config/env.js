import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverRoot = path.resolve(__dirname, '..', '..');

dotenv.config({ path: path.join(serverRoot, '.env') });

const rawDatabaseUrl = process.env.DATABASE_URL?.trim() || '';
const isPostgres =
  rawDatabaseUrl.startsWith('postgres://') ||
  rawDatabaseUrl.startsWith('postgresql://');

export const env = {
  port: Number.parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: rawDatabaseUrl,
  isPostgres,
  databaseSsl: process.env.DATABASE_SSL === 'true',
  sqlitePath: process.env.SQLITE_PATH
    ? path.resolve(serverRoot, process.env.SQLITE_PATH)
    : path.join(serverRoot, 'data', 'dental_clinic.db'),
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
};
