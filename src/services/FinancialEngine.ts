import { getDatabase } from '../database/db';
import { SavingsBalance } from '../database/types';
import { SyncService } from './SyncService';

export class FinancialEngine {
  static async calculateAndSaveTransaction(data: {
    source_id: number | null;
    project_id?: number;
    obligation_id?: number;
    currency_id: number;
    type: 'income' | 'expense';
    nature: 'cash' | 'virtual';
    amount_original: number;
    description: string;
    category?: 'essential' | 'personal' | 'investment';
    transaction_date: string;
  }) {
    const db = await getDatabase();

    // 1. Get exchange rate
    const currency = await db.getFirstAsync<{ exchange_rate_to_main: number }>(
      'SELECT exchange_rate_to_main FROM currencies WHERE id = ?',
      [data.currency_id]
    );
    const rate = currency?.exchange_rate_to_main || 1;
    const amount_main = data.amount_original / rate;

    // 2. Start transaction
    await db.withTransactionAsync(async () => {
      // 2.a. Create transaction
      const result = await db.runAsync(
        `INSERT INTO transactions (
          source_id, project_id, obligation_id, currency_id, 
          type, nature, amount_original, amount_main_currency, 
          description, category, transaction_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.source_id, 
          data.project_id || null, 
          data.obligation_id || null, 
          data.currency_id,
          data.type,
          data.nature,
          data.amount_original,
          amount_main,
          data.description,
          data.category || null,
          data.transaction_date
        ]
      );

      const transactionId = result.lastInsertRowId;
      
      // Post-Save Sync Queue
      await SyncService.addToQueue('transactions', transactionId, 'create', { ...data, amount_main_currency: amount_main });

      // 2.b. Look for specific obligation budget allocation
      let budgets: ('essential' | 'personal' | 'investment')[] = [];
      if (data.obligation_id) {
        const obl = await db.getFirstAsync<{ budget_allocation: string, remaining_amount: number }>(
          'SELECT budget_allocation, remaining_amount FROM obligations WHERE id = ?',
          [data.obligation_id]
        );
        if (obl) {
          if (obl.budget_allocation) {
            budgets = obl.budget_allocation.split(',').map(s => s.trim()).filter(Boolean) as any;
          }
          // Update remaining amount
          await db.runAsync(
            'UPDATE obligations SET remaining_amount = remaining_amount - ? WHERE id = ?',
            [amount_main, data.obligation_id]
          );
        }
      }

      // 3. Apply 30-30-40 rule or specific allocation
      if (data.type === 'income') {
        if (budgets.length > 0) {
          // Specific allocation chosen at obligation creation
          const share = amount_main / budgets.length;
          for (const b of budgets) {
             const col = b === 'essential' ? 'total_essential' : (b === 'personal' ? 'total_personal' : 'total_investment');
             await db.runAsync(`UPDATE savings_balance SET ${col} = ${col} + ?, last_update = CURRENT_TIMESTAMP`, [share]);
          }
        } else {
          // Standard 30-30-40 rule
          const amountEssential = amount_main * 0.3;
          const amountPersonal = amount_main * 0.3;
          const amountInvestment = amount_main * 0.4;

          // Save to savings_tracker
          await db.runAsync(
            `INSERT INTO savings_tracker (transaction_id, income_amount, amount_essential, amount_personal, amount_investment)
             VALUES (?, ?, ?, ?, ?)`,
            [transactionId, amount_main, amountEssential, amountPersonal, amountInvestment]
          );

          // Update global balance
          await db.runAsync(
            `UPDATE savings_balance SET 
             total_essential = total_essential + ?, 
             total_personal = total_personal + ?,
             total_investment = total_investment + ?,
             last_update = CURRENT_TIMESTAMP`,
            [amountEssential, amountPersonal, amountInvestment]
          );
        }
      } else {
        // --- IMPROVED MULTI-BUDGET DEDUCTION ---
        const balance = await db.getFirstAsync<any>('SELECT * FROM savings_balance LIMIT 1');
        
        // Ensure budgets are parsed and unique
        const cleanBudgets = (data.obligation_id && budgets.length > 0) 
          ? Array.from(new Set(budgets)) 
          : [data.category || 'essential'];

        const budgetCols = cleanBudgets.map(b => 
          b === 'essential' ? 'total_essential' : (b === 'personal' ? 'total_personal' : 'total_investment')
        ) as ("total_essential" | "total_personal" | "total_investment")[];

        const totalAvailable = budgetCols.reduce((sum, col) => sum + (balance[col] || 0), 0);

        if (amount_main > totalAvailable + 0.01) {
          await db.runAsync(
            'INSERT INTO budget_alerts (severity, message) VALUES (?, ?)',
            ['danger', `Échec : ${amount_main.toFixed(0)} requis sur ${cleanBudgets.join('+')} (Dispo: ${totalAvailable.toFixed(0)})`]
          );
          throw new Error('INSUFFICIENT_FUNDS_MIGRATION_REQUIRED');
        }

        let remainingToPay = amount_main;
        let currentBalances = { ...balance };
        let activeCols = [...budgetCols];

        // Loop until paid or impossible
        while (remainingToPay > 0.01 && activeCols.length > 0) {
          const fairShare = remainingToPay / activeCols.length;
          let nextCols: ("total_essential" | "total_personal" | "total_investment")[] = [];
          let totalDeductedThisRound = 0;

          for (const col of activeCols) {
            const avail = currentBalances[col] || 0;
            const toDeduct = Math.min(avail, fairShare);
            
            currentBalances[col] -= toDeduct;
            totalDeductedThisRound += toDeduct;
            
            if (currentBalances[col] > 0.01) {
              nextCols.push(col);
            }
          }
          remainingToPay -= totalDeductedThisRound;
          activeCols = nextCols;
        }

        await db.runAsync(
          `UPDATE savings_balance SET total_essential = ?, total_personal = ?, total_investment = ?, last_update = CURRENT_TIMESTAMP`,
          [currentBalances.total_essential, currentBalances.total_personal, currentBalances.total_investment]
        );
      }
      
      // 4. Add to sync queue
      await db.runAsync(
        `INSERT INTO sync_queue (table_name, record_id, action, payload)
         VALUES (?, ?, ?, ?)`,
        ['transactions', transactionId, 'create', JSON.stringify({ ...data, amount_main_currency: amount_main })]
      );
    });
  }

  static async deleteTransaction(transactionId: number) {
    const db = await getDatabase();

    // 1. Get transaction details
    const tx = await db.getFirstAsync<any>(
      'SELECT * FROM transactions WHERE id = ?',
      [transactionId]
    );

    if (!tx) return;

    await db.withTransactionAsync(async () => {
      const amount = tx.amount_main_currency;

      // 1. Send to Trash (Audit trail)
      await db.runAsync(
        'INSERT INTO trash (source_table, record_id, payload) VALUES (?, ?, ?)',
        ['transactions', transactionId, JSON.stringify(tx)]
      );

      // 2. Revert obligation impact
      if (tx.obligation_id) {
        await db.runAsync(
          'UPDATE obligations SET remaining_amount = remaining_amount + ? WHERE id = ?',
          [amount, tx.obligation_id]
        );
      }

      // 3. Revert budget impact
      if (tx.type === 'income') {
        const tracker = await db.getFirstAsync<any>(
          'SELECT * FROM savings_tracker WHERE transaction_id = ?',
          [transactionId]
        );

        if (tracker) {
          // Standard 30-30-40 reversal
          await db.runAsync(
            `UPDATE savings_balance SET 
             total_essential = total_essential - ?, 
             total_personal = total_personal - ?,
             total_investment = total_investment - ?,
             last_update = CURRENT_TIMESTAMP`,
            [tracker.amount_essential, tracker.amount_personal, tracker.amount_investment]
          );
          await db.runAsync('DELETE FROM savings_tracker WHERE id = ?', [tracker.id]);
        } else if (tx.obligation_id) {
             // Multi-budget reversal for obligation
             const obl = await db.getFirstAsync<{ budget_allocation: string }>(
               'SELECT budget_allocation FROM obligations WHERE id = ?',
               [tx.obligation_id]
             );
             if (obl?.budget_allocation) {
               const budgets = obl.budget_allocation.split(',');
               const share = amount / budgets.length;
               for (const b of budgets) {
                 const col = b === 'essential' ? 'total_essential' : (b === 'personal' ? 'total_personal' : 'total_investment');
                 await db.runAsync(`UPDATE savings_balance SET ${col} = ${col} - ?, last_update = CURRENT_TIMESTAMP`, [share]);
               }
             }
        }
      } else {
        // Expense reversal
        let budgets: string[] = [];
        if (tx.obligation_id) {
          const obl = await db.getFirstAsync<{ budget_allocation: string }>(
            'SELECT budget_allocation FROM obligations WHERE id = ?',
            [tx.obligation_id]
          );
          if (obl?.budget_allocation) {
            budgets = obl.budget_allocation.split(',');
          }
        }

        if (budgets.length > 0) {
          const share = amount / budgets.length;
          for (const b of budgets) {
            const col = b === 'essential' ? 'total_essential' : (b === 'personal' ? 'total_personal' : 'total_investment');
            await db.runAsync(`UPDATE savings_balance SET ${col} = ${col} + ?, last_update = CURRENT_TIMESTAMP`, [share]);
          }
        } else {
          // Standard single category
          const column = tx.category === 'personal' ? 'total_personal' : (tx.category === 'investment' ? 'total_investment' : 'total_essential');
          await db.runAsync(`UPDATE savings_balance SET ${column} = ${column} + ?, last_update = CURRENT_TIMESTAMP`, [amount]);
        }
      }

      // 4. Delete the transaction
      await db.runAsync('DELETE FROM transactions WHERE id = ?', [transactionId]);

      // 5. Add to sync queue
      await db.runAsync(
        'INSERT INTO sync_queue (table_name, record_id, action) VALUES (?, ?, ?)',
        ['transactions', transactionId, 'delete']
      );
    });
  }

  static async createObligationWithImpact(data: {
    name: string;
    type: 'debt' | 'receivable';
    total_amount: number;
    remaining_amount?: number;
    due_date: string;
    project_id?: number;
    budget_allocation: string; 
    currency_id: number;
    skipBalanceImpact?: boolean;
    source_id?: number | null;
  }) {
    const db = await getDatabase();

    // 1. Get main currency amount
    const currency = await db.getFirstAsync<{ exchange_rate_to_main: number }>(
      'SELECT exchange_rate_to_main FROM currencies WHERE id = ?',
      [data.currency_id]
    );
    const rate = currency?.exchange_rate_to_main || 1;
    
    const total_main = data.total_amount / rate;
    const initial_remaining = data.remaining_amount !== undefined ? (data.remaining_amount / rate) : total_main;
    const initial_settled = total_main - initial_remaining;

    let obligationId = 0;
    await db.withTransactionAsync(async () => {
      // 2. Insert obligation with converted amounts
      const result = await db.runAsync(
        'INSERT INTO obligations (name, type, total_amount, remaining_amount, due_date, project_id, budget_allocation) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [data.name, data.type, total_main, initial_remaining, data.due_date, data.project_id || null, data.budget_allocation]
      );
      obligationId = result.lastInsertRowId;

      // 3. Impact balance ONLY by the remaining amount (the amount that enters/exits the system NOW)
      // Note: If it's an "old" debt, the user might not want balance impact at all, 
      // but the core logic of FOEIL for now is that creating an obligation has impact.
      const selectedBudgets = data.budget_allocation.split(',');
      const weights = { essential: 0.3, personal: 0.3, investment: 0.4 };
      
      let totalWeight = 0;
      selectedBudgets.forEach(b => {
        totalWeight += weights[b.trim() as keyof typeof weights] || 0;
      });

      if (totalWeight > 0 && initial_remaining > 0 && !data.skipBalanceImpact) {
        if (data.type === 'receivable') {
          // Multi-budget Deduction for opening receivables
          const balance = await db.getFirstAsync<any>('SELECT * FROM savings_balance LIMIT 1');
          const budgetCols = selectedBudgets.map(b => 
            b.trim() === 'essential' ? 'total_essential' : (b.trim() === 'personal' ? 'total_personal' : 'total_investment')
          ) as ("total_essential" | "total_personal" | "total_investment")[];

          const totalAvailable = budgetCols.reduce((sum, col) => sum + (balance[col] || 0), 0);

          if (initial_remaining > totalAvailable + 0.01) {
            throw new Error('BUDGET_EXCEEDED');
          }

          let remainingToDeduct = initial_remaining;
          let currentBalances = { ...balance };
          let activeCols = [...budgetCols];

          while (remainingToDeduct > 0.01 && activeCols.length > 0) {
            const fairShare = remainingToDeduct / activeCols.length;
            let nextCols: ("total_essential" | "total_personal" | "total_investment")[] = [];
            let deducted = 0;
            for (const col of activeCols) {
              const avail = currentBalances[col] || 0;
              const take = Math.min(avail, fairShare);
              currentBalances[col] -= take;
              deducted += take;
              if (currentBalances[col] > 0.01) nextCols.push(col);
            }
            remainingToDeduct -= deducted;
            activeCols = nextCols;
          }

          await db.runAsync(
            `UPDATE savings_balance SET total_essential = ?, total_personal = ?, total_investment = ?, last_update = CURRENT_TIMESTAMP`,
            [currentBalances.total_essential, currentBalances.total_personal, currentBalances.total_investment]
          );
        } else {
          // Debt creation (income) always allowed
          for (const b of selectedBudgets) {
            const budgetWeight = weights[b as keyof typeof weights] || 0;
            const share = initial_remaining * (budgetWeight / totalWeight);
            const column = b === 'essential' ? 'total_essential' : (b === 'personal' ? 'total_personal' : 'total_investment');
            await db.runAsync(`UPDATE savings_balance SET ${column} = ${column} + ?, last_update = CURRENT_TIMESTAMP`, [share]);
          }
        }
      }

      // 4. Record as system transaction
      await db.runAsync(
        `INSERT INTO transactions (obligation_id, source_id, currency_id, type, nature, amount_original, amount_main_currency, description, transaction_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          obligationId, 
          data.source_id || null,
          data.currency_id, 
          (data.type === 'debt' && !data.skipBalanceImpact) ? 'income' : 'expense', 
          'virtual', 
          data.remaining_amount || data.total_amount, 
          initial_remaining, 
          `Ouverture ${data.type === 'debt' ? 'Dette' : 'Créance'} : ${data.name}`, 
          new Date().toISOString()
        ]
      );
    });
    return obligationId;
  }

  static async getDashboardStats() {
    const db = await getDatabase();
    
    // 1. Basic Balance
    const balance = await db.getFirstAsync<SavingsBalance>('SELECT * FROM savings_balance LIMIT 1');

    // 1b. Currencies
    const currencies = await db.getAllAsync<any>('SELECT * FROM currencies ORDER BY is_main DESC, code ASC');
    
    // 2. Recent Transactions
    const recentTransactions = await db.getAllAsync<any>(
      `SELECT t.*, s.name as source_name, c.code as currency_code
       FROM transactions t 
       LEFT JOIN sources s ON t.source_id = s.id 
       LEFT JOIN currencies c ON t.currency_id = c.id
       ORDER BY t.transaction_date DESC LIMIT 5`
    );

    // 3. Obligations Sums (Computed dynamically from transactions for absolute accuracy)
    const obligations = await db.getFirstAsync<any>(
      `SELECT 
        SUM(CASE WHEN type = 'debt' THEN 
          total_amount - (SELECT COALESCE(SUM(t.amount_main_currency), 0) FROM transactions t WHERE t.obligation_id = o.id AND t.nature != 'virtual')
          ELSE 0 END) as total_debt,
        SUM(CASE WHEN type = 'receivable' THEN 
          total_amount - (SELECT COALESCE(SUM(t.amount_main_currency), 0) FROM transactions t WHERE t.obligation_id = o.id AND t.nature != 'virtual')
          ELSE 0 END) as total_receivable
       FROM obligations o`
    );

    // 4. Most Profitable Source
    const topSource = await db.getFirstAsync<any>(
      `SELECT s.name as source_name, p.name as project_name, SUM(t.amount_main_currency) as total_earned
       FROM transactions t
       JOIN sources s ON t.source_id = s.id
       LEFT JOIN projects p ON s.project_id = p.id
       WHERE t.type = 'income'
       GROUP BY t.source_id
       ORDER BY total_earned DESC
       LIMIT 1`
    );

    // 5. Financial Health (Quota Logic)
    const alertsRecents = await db.getAllAsync<any>('SELECT * FROM budget_alerts WHERE created_at > datetime("now", "-7 days")');
    const warningCount = alertsRecents.filter(a => a.severity === 'warning').length;
    const dangerCount = alertsRecents.filter(a => a.severity === 'danger').length;

    let healthStatus = { label: 'SANTÉ STABLE', color: '#1E8E3E', icon: 'check-circle' };
    if (dangerCount > 0 || warningCount > 5) {
      healthStatus = { label: 'ÉTAT CRITIQUE', color: '#D93025', icon: 'alert-triangle' };
    } else if (warningCount > 2) {
      healthStatus = { label: 'VIGILANCE', color: '#F29900', icon: 'info' };
    }
    return {
      balance: balance || { total_essential: 0, total_personal: 0, total_investment: 0 },
      currencies: currencies || [],
      recentTransactions,
      obligations: obligations || { total_debt: 0, total_receivable: 0 },
      topSource,
      health: {
        ...healthStatus,
        warningCount,
        dangerCount
      },
      weeklyTopIncome: await db.getAllAsync<any>(
        `SELECT s.name, SUM(t.amount_main_currency) as total 
         FROM transactions t 
         JOIN sources s ON t.source_id = s.id 
         WHERE t.type = 'income' AND t.transaction_date >= date('now', '-7 days')
         GROUP BY s.id ORDER BY total DESC LIMIT 3`
      ),
      weeklyTopExpense: await db.getAllAsync<any>(
        `SELECT s.name, SUM(t.amount_main_currency) as total 
         FROM transactions t 
         JOIN sources s ON t.source_id = s.id 
         WHERE t.type = 'expense' AND t.transaction_date >= date('now', '-7 days')
         GROUP BY s.id ORDER BY total DESC LIMIT 3`
      )
    };
  }

  static async migrateBudget(from: string, to: string, amount: number) {
    const db = await getDatabase();
    const fromCol = from === 'essential' ? 'total_essential' : (from === 'personal' ? 'total_personal' : 'total_investment');
    const toCol = to === 'essential' ? 'total_essential' : (to === 'personal' ? 'total_personal' : 'total_investment');

    await db.withTransactionAsync(async () => {
      const balance = await db.getFirstAsync<any>('SELECT * FROM savings_balance LIMIT 1');
      const available = balance[fromCol] || 0;

      if (amount <= 0) throw new Error('MONTANT_INVALIDE');
      if (amount > available) throw new Error('SOLDE_INSUFFISANT');

      await db.runAsync(`UPDATE savings_balance SET ${fromCol} = ${fromCol} - ?, last_update = CURRENT_TIMESTAMP`, [amount]);
      await db.runAsync(`UPDATE savings_balance SET ${toCol} = ${toCol} + ?, last_update = CURRENT_TIMESTAMP`, [amount]);
      
      await db.runAsync(
        'INSERT INTO budget_alerts (severity, message) VALUES (?, ?)',
        ['warning', `Mouvement comptable : ${amount.toFixed(0)} déplacés de ${from} vers ${to}.`]
      );
    });
  }

  static async getGlobalStats(period: 'day' | 'week' | 'month' | 'all' = 'all') {
    const db = await getDatabase();
    
    let dateFilter = '';
    if (period === 'day') dateFilter = "AND t.transaction_date >= date('now', '-1 day')";
    else if (period === 'week') dateFilter = "AND t.transaction_date >= date('now', '-7 days')";
    else if (period === 'month') dateFilter = "AND t.transaction_date >= date('now', '-30 days')";

    // Top Income Sources
    const topIncome = await db.getAllAsync<any>(
      `SELECT s.name, SUM(t.amount_main_currency) as total 
       FROM transactions t 
       JOIN sources s ON t.source_id = s.id 
       WHERE t.type = 'income' ${dateFilter}
       GROUP BY s.id ORDER BY total DESC LIMIT 5`
    );

    // Top Expense Sources
    const topExpense = await db.getAllAsync<any>(
      `SELECT s.name, SUM(t.amount_main_currency) as total 
       FROM transactions t 
       JOIN sources s ON t.source_id = s.id 
       WHERE t.type = 'expense' ${dateFilter}
       GROUP BY s.id ORDER BY total DESC LIMIT 5`
    );

    // Project Performance (Budget impact in period)
    const projectPerformance = await db.getAllAsync<any>(
      `SELECT p.name, p.estimated_cost, 
        (SELECT SUM(amount_main_currency) FROM transactions WHERE project_id = p.id AND type='expense' ${dateFilter.replace('t.', '')}) as current_spend,
        (SELECT SUM(amount_main_currency) FROM transactions WHERE project_id = p.id AND type='income' ${dateFilter.replace('t.', '')}) as current_income
       FROM projects p`
    );

    return { topIncome, topExpense, projectPerformance };
  }

  static async getSourceStats(sourceId: number) {
    const db = await getDatabase();
    const result = await db.getFirstAsync<any>(
      `SELECT 
        SUM(CASE WHEN type='income' THEN amount_main_currency ELSE 0 END) as total_income,
        SUM(CASE WHEN type='expense' THEN amount_main_currency ELSE 0 END) as total_expense,
        COUNT(*) as count
       FROM transactions WHERE source_id = ?`,
      [sourceId]
    );
    return result || { total_income: 0, total_expense: 0, count: 0 };
  }

  static async getProjectStats(projectId: number) {
    const db = await getDatabase();
    const result = await db.getFirstAsync<any>(
      `SELECT 
        p.name, p.estimated_cost, p.expected_roi,
        (SELECT SUM(amount_main_currency) FROM transactions WHERE project_id = ? AND type='income') as total_income,
        (SELECT SUM(amount_main_currency) FROM transactions WHERE project_id = ? AND type='expense') as total_expense
       FROM projects p WHERE p.id = ?`,
      [projectId, projectId, projectId]
    );
    return result;
  }

  static async getDeepInsights(period: 'day' | 'week' | 'month' | 'all' = 'all') {
    const db = await getDatabase();
    
    let dateFilter = '';
    if (period === 'day') dateFilter = "AND t.transaction_date >= date('now', '-1 day')";
    else if (period === 'week') dateFilter = "AND t.transaction_date >= date('now', '-7 days')";
    else if (period === 'month') dateFilter = "AND t.transaction_date >= date('now', '-30 days')";

    // 1. Survival Buffer (Savings / Avg Expense) - Always calculated on total liquid, but burn rate can be period-aware if we wanted. 
    // For now, let's keep buffer on total liquid.
    const balance = await db.getFirstAsync<any>('SELECT * FROM savings_balance LIMIT 1');
    const totalLiquid = (balance.total_essential + balance.total_personal + balance.total_investment) || 0;
    
    const avgExpense = await db.getFirstAsync<any>(
      `SELECT AVG(total_month) as avg 
       FROM (SELECT SUM(amount_main_currency) as total_month 
             FROM transactions WHERE type='expense' 
             GROUP BY strftime('%Y-%m', transaction_date))`
    );
    const monthlyBurn = avgExpense?.avg || 1; // Avoid div by 0
    const survivalMonths = totalLiquid / monthlyBurn;

    // 2. Budget Fidelity (Real use in period)
    const distribution = await db.getAllAsync<any>(
      `SELECT s.category, SUM(t.amount_main_currency) as total 
       FROM transactions t 
       JOIN sources s ON t.source_id = s.id 
       WHERE t.type = 'expense' ${dateFilter}
       GROUP BY s.category`
    );

    // 3. Debt Health
    const obligations = await db.getFirstAsync<any>(
      `SELECT 
        SUM(CASE WHEN type='debt' THEN remaining_amount ELSE 0 END) as total_debt,
        SUM(CASE WHEN type='receivable' THEN remaining_amount ELSE 0 END) as total_receivable
       FROM obligations`
    );

    return { 
      survivalMonths, 
      distribution, 
      obligations,
      totalLiquid,
      monthlyBurn
    };
  }

  static async getProjectDetails(projectId: number) {
    const db = await getDatabase();
    
    // 1. All Transactions for this project
    const transactions = await db.getAllAsync<any>(
      `SELECT t.*, s.name as source_name, c.code as currency_code 
       FROM transactions t 
       LEFT JOIN sources s ON t.source_id = s.id 
       LEFT JOIN currencies c ON t.currency_id = c.id
       WHERE t.project_id = ? 
       ORDER BY t.transaction_date DESC`,
      [projectId]
    );

    // 2. Stats
    const stats = await db.getFirstAsync<any>(
      `SELECT 
        SUM(CASE WHEN type='income' THEN amount_main_currency ELSE 0 END) as total_income,
        SUM(CASE WHEN type='expense' THEN amount_main_currency ELSE 0 END) as total_expense
       FROM transactions WHERE project_id = ?`,
      [projectId]
    );

    // 3. Most frequent expense category
    const topCategory = await db.getFirstAsync<any>(
      `SELECT s.category, COUNT(*) as count 
       FROM transactions t 
       JOIN sources s ON t.source_id = s.id 
       WHERE t.project_id = ? AND t.type='expense' 
       GROUP BY s.category ORDER BY count DESC LIMIT 1`,
      [projectId]
    );

    // 4. Top Income Source
    const topIncomeSource = await db.getFirstAsync<any>(
      `SELECT s.name, SUM(t.amount_main_currency) as total 
       FROM transactions t 
       JOIN sources s ON t.source_id = s.id 
       WHERE t.project_id = ? AND t.type='income' 
       GROUP BY s.id ORDER BY total DESC LIMIT 1`,
      [projectId]
    );

    // 5. Sub-projects
    const subProjects = await db.getAllAsync<any>(
      `SELECT p.*,
        (SELECT SUM(amount_main_currency) FROM transactions WHERE project_id = p.id AND type='income') as total_income,
        (SELECT SUM(amount_main_currency) FROM transactions WHERE project_id = p.id AND type='expense') as total_expense
       FROM projects p WHERE p.parent_id = ?`,
      [projectId]
    );

    return { 
      transactions, 
      stats: stats || { total_income: 0, total_expense: 0 }, 
      topCategory: topCategory?.category || 'N/A',
      topIncomeSource: topIncomeSource?.name || 'N/A',
      subProjects
    };
  }

  static async getSourceDetails(sourceId: number, period: 'day' | 'week' | 'month' | 'all' = 'all') {
    const db = await getDatabase();
    
    let dateFilter = '';
    if (period === 'day') dateFilter = "AND t.transaction_date >= date('now', '-1 day')";
    else if (period === 'week') dateFilter = "AND t.transaction_date >= date('now', '-7 days')";
    else if (period === 'month') dateFilter = "AND t.transaction_date >= date('now', '-30 days')";

    // 1. Transactions
    const transactions = await db.getAllAsync<any>(
      `SELECT t.*, p.name as project_name, c.code as currency_code 
       FROM transactions t 
       LEFT JOIN projects p ON t.project_id = p.id 
       LEFT JOIN currencies c ON t.currency_id = c.id
       WHERE t.source_id = ? ${dateFilter}
       ORDER BY t.transaction_date DESC`,
      [sourceId]
    );

    // 2. Stats
    const stats = await db.getFirstAsync<any>(
      `SELECT 
        SUM(CASE WHEN type='income' THEN amount_main_currency ELSE 0 END) as total_income,
        SUM(CASE WHEN type='expense' THEN amount_main_currency ELSE 0 END) as total_expense
       FROM transactions t WHERE source_id = ? ${dateFilter}`,
      [sourceId]
    );

    // 3. Category distribution
    const distribution = await db.getAllAsync<any>(
      `SELECT s.category, SUM(t.amount_main_currency) as total 
       FROM transactions t 
       JOIN sources s ON t.source_id = s.id 
       WHERE t.source_id = ? AND t.type='expense' ${dateFilter}
       GROUP BY s.category`,
      [sourceId]
    );

    return { 
      transactions, 
      stats: stats || { total_income: 0, total_expense: 0 }, 
      distribution: distribution || []
    };
  }

  static async resetBudgetToStandard() {
    const db = await getDatabase();
    await db.withTransactionAsync(async () => {
      const balance = await db.getFirstAsync<any>('SELECT * FROM savings_balance LIMIT 1');
      if (!balance) return;

      const total = balance.total_essential + balance.total_personal + balance.total_investment;
      const essential = total * 0.3;
      const personal = total * 0.3;
      const investment = total * 0.4;

      await db.runAsync(
        `UPDATE savings_balance SET 
         total_essential = ?, 
         total_personal = ?, 
         total_investment = ?, 
         last_update = CURRENT_TIMESTAMP`,
        [essential, personal, investment]
      );

      await db.runAsync(
        'INSERT INTO budget_alerts (severity, message) VALUES (?, ?)',
        ['info', `Réinitialisation structurelle 30/30/40 appliquée sur un total de ${total.toFixed(0)}.`]
      );
    });
  }
}
