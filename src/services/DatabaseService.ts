import { getDatabase } from '../database/db';
import { Currency, Source, Project, Obligation, Transaction, SavingsBalance } from '../database/types';
import { SEED_DATA_QUERIES } from '../database/seed';
import { SyncService } from './SyncService';

export class DatabaseService {
  static async getAllCurrencies(): Promise<Currency[]> {
    const db = await getDatabase();
    return await db.getAllAsync<Currency>('SELECT * FROM currencies ORDER BY is_main DESC, code ASC');
  }

  static async addCurrency(code: string, name: string, rate: number, isMain: boolean = false): Promise<number> {
    const db = await getDatabase();
    if (isMain) {
      const txCount = await db.getFirstAsync<{count: number}>('SELECT COUNT(*) as count FROM transactions');
      if (txCount && txCount.count > 0) {
        throw new Error('Impossible de changer la devise de base : des transactions existent déjà.');
      }
      await db.runAsync('UPDATE currencies SET is_main = 0');
    }
    const result = await db.runAsync(
      'INSERT INTO currencies (code, name, exchange_rate_to_main, is_main) VALUES (?, ?, ?, ?)',
      [code.toUpperCase(), name, isMain ? 1 : rate, isMain ? 1 : 0]
    );
    const currencyId = result.lastInsertRowId;
    await SyncService.addToQueue('currencies', currencyId, 'create', { code, name, rate, isMain });
    return currencyId;
  }

  static async updateCurrency(id: number, code: string, name: string, rate: number, isMain: boolean): Promise<void> {
    const db = await getDatabase();
    if (isMain) {
      const current = await db.getFirstAsync<Currency>('SELECT is_main FROM currencies WHERE id = ?', [id]);
      if (current && !current.is_main) {
        const txCount = await db.getFirstAsync<{count: number}>('SELECT COUNT(*) as count FROM transactions');
        if (txCount && txCount.count > 0) {
          throw new Error('Impossible de changer la devise de base : des transactions existent déjà.');
        }
        await db.runAsync('UPDATE currencies SET is_main = 0 WHERE id != ?', [id]);
      }
    }
    await db.runAsync(
      'UPDATE currencies SET code = ?, name = ?, exchange_rate_to_main = ?, is_main = ? WHERE id = ?',
      [code.toUpperCase(), name, isMain ? 1 : rate, isMain ? 1 : 0, id]
    );
    await SyncService.addToQueue('currencies', id, 'update', { code, name, rate, isMain });
  }

  static async deleteCurrency(id: number): Promise<void> {
    const db = await getDatabase();
    // Prevent deleting the main currency
    const curr = await db.getFirstAsync<Currency>('SELECT is_main FROM currencies WHERE id = ?', [id]);
    if (curr?.is_main) {
      throw new Error('Cannot delete the main currency');
    }
    await db.runAsync('DELETE FROM currencies WHERE id = ?', [id]);
  }

  static async getAllSources(): Promise<Source[]> {
    const db = await getDatabase();
    return await db.getAllAsync<Source>('SELECT * FROM sources');
  }

  static async getAllProjects(): Promise<Project[]> {
    const db = await getDatabase();
    return await db.getAllAsync<Project>('SELECT * FROM projects');
  }

  static async getAllObligations(): Promise<(Obligation & { paid_from_transactions: number, transaction_count: number })[]> {
    const db = await getDatabase();
    return await db.getAllAsync<Obligation & { paid_from_transactions: number, transaction_count: number }>(
      `SELECT o.*, 
        (SELECT COALESCE(SUM(t.amount_main_currency), 0) 
         FROM transactions t 
         WHERE t.obligation_id = o.id AND t.nature != 'virtual') as paid_from_transactions,
        (SELECT COUNT(*) 
         FROM transactions t 
         WHERE t.obligation_id = o.id AND t.nature != 'virtual') as transaction_count
       FROM obligations o`
    );
  }

  static async addSource(name: string, type: 'income' | 'expense' | 'both', projectId?: number, category?: 'essential' | 'personal' | 'investment'): Promise<number> {
    const db = await getDatabase();
    const result = await db.runAsync(
      'INSERT INTO sources (name, type, project_id, category) VALUES (?, ?, ?, ?)',
      [name, type, projectId || null, category || null]
    );
    const sourceId = result.lastInsertRowId;
    await SyncService.addToQueue('sources', sourceId, 'create', { name, type, projectId, category });
    return sourceId;
  }

  static async updateSource(id: number, name: string, type: 'income' | 'expense' | 'both', projectId?: number, category?: 'essential' | 'personal' | 'investment'): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      'UPDATE sources SET name = ?, type = ?, project_id = ?, category = ? WHERE id = ?',
      [name, type, projectId || null, category || null, id]
    );
    await SyncService.addToQueue('sources', id, 'update', { name, type, projectId, category });
  }

  static async deleteSource(id: number): Promise<void> {
    const db = await getDatabase();
    const record = await db.getFirstAsync<Source>('SELECT * FROM sources WHERE id = ?', [id]);
    if (record) {
      await db.runAsync('INSERT INTO trash (source_table, record_id, payload) VALUES (?, ?, ?)', ['sources', id, JSON.stringify(record)]);
    }
    await db.runAsync('DELETE FROM sources WHERE id = ?', [id]);
  }

  static async addProject(
    name: string, 
    cost?: number, 
    roi?: number, 
    status: 'planning' | 'active' | 'completed' = 'planning',
    parentId?: number
  ): Promise<number> {
    const db = await getDatabase();
    const priority = (cost && roi) ? roi / cost : null;
    const result = await db.runAsync(
      'INSERT INTO projects (name, estimated_cost, expected_roi, status, priority_score, parent_id) VALUES (?, ?, ?, ?, ?, ?)',
      [name, cost || null, roi || null, status, priority, parentId || null]
    );
    const projectIdResult = result.lastInsertRowId;
    await SyncService.addToQueue('projects', projectIdResult, 'create', { name, cost, roi, status, parentId });
    return projectIdResult;
  }

  static async updateProject(
    id: number, 
    name: string, 
    cost?: number, 
    roi?: number, 
    status?: 'planning' | 'active' | 'completed',
    parentId?: number
  ): Promise<void> {
    const db = await getDatabase();
    const priority = (cost && roi) ? roi / cost : null;
    await db.runAsync(
      'UPDATE projects SET name = ?, estimated_cost = ?, expected_roi = ?, status = ?, priority_score = ?, parent_id = ? WHERE id = ?',
      [name, cost || null, roi || null, status || 'planning', priority, parentId || null, id]
    );
    await SyncService.addToQueue('projects', id, 'update', { name, cost, roi, status, parentId });
  }

  static async deleteProject(id: number): Promise<void> {
    const db = await getDatabase();
    const record = await db.getFirstAsync<Project>('SELECT * FROM projects WHERE id = ?', [id]);
    if (record) {
      await db.runAsync('INSERT INTO trash (source_table, record_id, payload) VALUES (?, ?, ?)', ['projects', id, JSON.stringify(record)]);
    }
    await db.runAsync('DELETE FROM projects WHERE id = ?', [id]);
  }

  static async addObligation(
    name: string, 
    type: 'debt' | 'receivable', 
    totalAmount: number, 
    dueDate: string, 
    projectId?: number,
    remainingAmount?: number,
    budgetAllocation?: string
  ): Promise<number> {
    const db = await getDatabase();
    const finalRemaining = remainingAmount !== undefined ? remainingAmount : totalAmount;
    const result = await db.runAsync(
      'INSERT INTO obligations (name, type, total_amount, remaining_amount, due_date, project_id, budget_allocation) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, type, totalAmount, finalRemaining, dueDate, projectId || null, budgetAllocation || null]
    );
    const obligationId = result.lastInsertRowId;
    await SyncService.addToQueue('obligations', obligationId, 'create', { name, type, totalAmount, finalRemaining, dueDate, projectId, budgetAllocation });
    return obligationId;
  }

  static async updateObligation(
    id: number,
    name: string, 
    type: 'debt' | 'receivable', 
    totalAmount: number, 
    remainingAmount: number,
    dueDate: string, 
    projectId?: number,
    budgetAllocation?: string
  ): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      'UPDATE obligations SET name = ?, type = ?, total_amount = ?, remaining_amount = ?, due_date = ?, project_id = ?, budget_allocation = ? WHERE id = ?',
      [name, type, totalAmount, remainingAmount, dueDate, projectId || null, budgetAllocation || null, id]
    );
  }

  static async deleteObligation(id: number): Promise<void> {
    const db = await getDatabase();
    const record = await db.getFirstAsync<Obligation>('SELECT * FROM obligations WHERE id = ?', [id]);
    if (record) {
      await db.runAsync('INSERT INTO trash (source_table, record_id, payload) VALUES (?, ?, ?)', ['obligations', id, JSON.stringify(record)]);
    }
    await db.runAsync('DELETE FROM obligations WHERE id = ?', [id]);
  }

  static async getSavingsBalance(): Promise<SavingsBalance> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<SavingsBalance>('SELECT * FROM savings_balance LIMIT 1');
    if (!result) {
      throw new Error('Savings balance not initialized');
    }
    return result;
  }

  static async clearAllData(): Promise<void> {
    const db = await getDatabase();
    try {
      // Disable constraints
      await db.execAsync('PRAGMA foreign_keys = OFF;');
      
      const tables = [
        'savings_tracker', 'transactions', 'obligations', 
        'sources', 'projects', 'sync_queue', 'trash', 
        'budget_alerts', 'currencies', 'financial_rules', 
        'savings_balance', 'users'
      ];
      
      // Build a single giant query for speed and to avoid transactional locks
      let query = '';
      for (const table of tables) {
        query += `DELETE FROM ${table}; `;
      }
      query += `DELETE FROM sqlite_sequence; `;

      await db.execAsync(query);

      // Re-seed factory defaults
      for (const query of SEED_DATA_QUERIES) {
        await db.execAsync(query);
      }
    } catch (error) {
       console.error("Critical Reset Failure:", error);
       throw error;
    } finally {
      await db.execAsync('PRAGMA foreign_keys = ON;');
    }
  }
}
