import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import pg from 'pg';
import { env } from '../config/env.js';

const { Pool } = pg;

let pool = null;
let sqliteDb = null;
let activeDialect = env.isPostgres ? 'postgres' : 'sqlite';

/**
 * Convert `?` positional placeholders to PostgreSQL `$1, $2, ...` placeholders
 * while ignoring `?` inside single-quoted string literals.
 */
function toPostgresPlaceholders(sql) {
  let index = 0;
  let inSingleQuote = false;
  let out = '';

  for (let i = 0; i < sql.length; i += 1) {
    const ch = sql[i];
    if (ch === "'") {
      if (inSingleQuote && sql[i + 1] === "'") {
        out += "''";
        i += 1;
        continue;
      }
      inSingleQuote = !inSingleQuote;
      out += ch;
    } else if (ch === '?' && !inSingleQuote) {
      index += 1;
      out += `$${index}`;
    } else {
      out += ch;
    }
  }

  return out;
}

/**
 * Initialize the relational database connection (PostgreSQL in production,
 * or Node's built-in SQLite for zero-config local development and testing).
 */
export async function initDb(options = {}) {
  const usePostgres =
    options.databaseUrl !== undefined
      ? Boolean(options.databaseUrl)
      : env.isPostgres;

  if (usePostgres) {
    activeDialect = 'postgres';
    const connectionString = options.databaseUrl || env.databaseUrl;
    const useSsl =
      options.ssl ??
      (env.databaseSsl ||
        connectionString.includes('.render.com') ||
        connectionString.includes('sslmode=require'));

    pool = new Pool({
      connectionString,
      ssl: useSsl ? { rejectUnauthorized: false } : false,
    });
    await pool.query('SELECT 1');
    return;
  }

  activeDialect = 'sqlite';
  const targetPath = options.sqlitePath || env.sqlitePath;
  if (targetPath !== ':memory:') {
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  }
  sqliteDb = new DatabaseSync(targetPath);
  sqliteDb.exec('PRAGMA foreign_keys = ON;');
  if (targetPath !== ':memory:') {
    sqliteDb.exec('PRAGMA journal_mode = WAL;');
  }
}

export function getDialect() {
  return activeDialect;
}

export function boolParam(value) {
  const bool = Boolean(value);
  return activeDialect === 'postgres' ? bool : bool ? 1 : 0;
}

export async function query(sql, params = []) {
  if (activeDialect === 'postgres') {
    const pgSql = toPostgresPlaceholders(sql);
    const result = await pool.query(pgSql, params);
    return { rows: result.rows, rowCount: result.rowCount ?? result.rows.length };
  }

  const normalized = sql.trim().toUpperCase();
  const returnsRows =
    normalized.startsWith('SELECT') ||
    normalized.startsWith('WITH') ||
    normalized.startsWith('PRAGMA') ||
    /\bRETURNING\b/i.test(sql);

  const stmt = sqliteDb.prepare(sql);
  if (returnsRows) {
    const rows = stmt.all(...params);
    return { rows, rowCount: rows.length };
  }

  const info = stmt.run(...params);
  return { rows: [], rowCount: info.changes ?? 0 };
}

export async function queryOne(sql, params = []) {
  const result = await query(sql, params);
  return result.rows[0] ?? null;
}

export async function exec(sql) {
  if (activeDialect === 'postgres') {
    await pool.query(sql);
    return;
  }
  sqliteDb.exec(sql);
}

export async function closeDb() {
  if (pool) {
    await pool.end();
    pool = null;
  }
  if (sqliteDb) {
    sqliteDb.close();
    sqliteDb = null;
  }
}
