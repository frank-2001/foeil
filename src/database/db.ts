import * as SQLite from 'expo-sqlite';
import { CREATE_TABLES_QUERIES } from './schema';
import { SEED_DATA_QUERIES } from './seed';

const DB_NAME = 'foeil.db';

// --- Singleton pattern ---
let _db: SQLite.SQLiteDatabase | null = null;
let _initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export const initDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (_initPromise) return _initPromise;

  _initPromise = (async () => {
    const db = await SQLite.openDatabaseAsync(DB_NAME);
    _db = db;

    try {
      await db.execAsync('PRAGMA foreign_keys = ON;');

      for (const query of CREATE_TABLES_QUERIES) {
        await db.execAsync(query);
      }

      // --- Migration: ensure parent_id exists in projects ---
      const tableInfo = await db.getAllAsync<{name: string}>('PRAGMA table_info(projects)');
      if (!tableInfo.some(col => col.name === 'parent_id')) {
        console.log('Migrating projects table: adding parent_id');
        await db.execAsync('ALTER TABLE projects ADD COLUMN parent_id INTEGER REFERENCES projects(id);');
      }

      // --- Migration: transactions category ---
      const txInfo = await db.getAllAsync<{name: string}>('PRAGMA table_info(transactions)');
      if (!txInfo.some(col => col.name === 'category')) {
        console.log('Migrating transactions table: adding category');
        await db.execAsync('ALTER TABLE transactions ADD COLUMN category TEXT;');
      }

      // --- Migration: savings_balance partitioning ---
      const balInfo = await db.getAllAsync<{name: string}>('PRAGMA table_info(savings_balance)');
      if (!balInfo.some(col => col.name === 'total_essential')) {
        console.log('Migrating savings_balance: updating to 30-30-40 rule');
        // Simple way for dev: drop and recreate or add columns
        // We'll add columns to avoid losing everything
        await db.execAsync('ALTER TABLE savings_balance ADD COLUMN total_essential REAL DEFAULT 0;');
        await db.execAsync('ALTER TABLE savings_balance ADD COLUMN total_personal REAL DEFAULT 0;');
        await db.execAsync('ALTER TABLE savings_balance ADD COLUMN total_investment REAL DEFAULT 0;');
      }

      // --- Migration: savings_tracker partitioning ---
      const trackInfo = await db.getAllAsync<{name: string}>('PRAGMA table_info(savings_tracker)');
      if (!trackInfo.some(col => col.name === 'amount_essential')) {
        await db.execAsync('ALTER TABLE savings_tracker ADD COLUMN amount_essential REAL DEFAULT 0;');
        await db.execAsync('ALTER TABLE savings_tracker ADD COLUMN amount_personal REAL DEFAULT 0;');
        await db.execAsync('ALTER TABLE savings_tracker ADD COLUMN amount_investment REAL DEFAULT 0;');
      }

      // --- Migration: sources category ---
      const srcInfo = await db.getAllAsync<{name: string}>('PRAGMA table_info(sources)');
      if (!srcInfo.some(col => col.name === 'category')) {
        console.log('Migrating sources table: adding category');
        await db.execAsync('ALTER TABLE sources ADD COLUMN category TEXT;');
      }

      // --- Migration: obligations budget_allocation ---
      const oblInfo = await db.getAllAsync<{name: string}>('PRAGMA table_info(obligations)');
      if (!oblInfo.some(col => col.name === 'budget_allocation')) {
        console.log('Migrating obligations table: adding budget_allocation');
        await db.execAsync('ALTER TABLE obligations ADD COLUMN budget_allocation TEXT;');
      }

      // --- SEED : Run only once if empty ---
      const currCount = await db.getFirstAsync<{count: number}>('SELECT COUNT(*) as count FROM currencies');
      if (currCount && currCount.count === 0) {
        console.log('Database empty, seeding data...');
        for (const query of SEED_DATA_QUERIES) {
          await db.execAsync(query);
        }
      }

      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Error initializing database:', error);
      // Reset so a retry is possible
      _initPromise = null;
      _db = null;
      throw error;
    }

    return db;
  })();

  return _initPromise;
};

/**
 * Returns the initialized DB instance.
 * If initDatabase() hasn't been called yet it will call it automatically,
 * so any service method called before the layout useEffect fires will simply
 * wait for initialization rather than crashing.
 */
export const getDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  return initDatabase();
};
