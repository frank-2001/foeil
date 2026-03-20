export interface Currency {
  id: number;
  code: string;
  name: string;
  exchange_rate_to_main: number;
  is_main: number;
}

export interface Source {
  id: number;
  name: string;
  type: 'income' | 'expense' | 'both';
  category?: 'essential' | 'personal' | 'investment';
  project_id?: number;
}

export interface Project {
  id: number;
  name: string;
  estimated_cost?: number;
  expected_roi?: number;
  priority_score?: number;
  status: 'planning' | 'active' | 'completed';
  parent_id?: number;
}

export interface Obligation {
  id: number;
  name: string;
  type: 'debt' | 'receivable';
  total_amount: number;
  remaining_amount: number;
  project_id?: number;
  due_date: string;
  budget_allocation?: string;
  paid_from_transactions?: number;
  transaction_count?: number;
}

export interface Transaction {
  id: number;
  source_id: number;
  project_id?: number;
  obligation_id?: number;
  currency_id: number;
  type: 'income' | 'expense';
  nature: 'cash' | 'virtual';
  amount_original: number;
  amount_main_currency: number;
  description: string;
  category?: 'essential' | 'personal' | 'investment';
  transaction_date: string;
  synced: number;
}

export interface SavingsBalance {
  id: number;
  total_essential: number;
  total_personal: number;
  total_investment: number;
  last_update: string;
}
