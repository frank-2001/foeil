export const CREATE_TABLES_QUERIES = [
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE,
    password TEXT,
    main_currency_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );`,
  `CREATE TABLE IF NOT EXISTS currencies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE,
    name TEXT,
    exchange_rate_to_main REAL,
    is_main INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );`,
  `CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    estimated_cost REAL,
    expected_roi REAL,
    priority_score REAL,
    status TEXT, -- planning, active, completed
    parent_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES projects (id)
  );`,
  `CREATE TABLE IF NOT EXISTS sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER,
    name TEXT,
    type TEXT, -- income, expense, both
    category TEXT, -- essential, personal, investment
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects (id)
  );`,
  `CREATE TABLE IF NOT EXISTS obligations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    type TEXT, -- debt, receivable
    total_amount REAL,
    remaining_amount REAL,
    project_id INTEGER,
    due_date DATETIME,
    budget_allocation TEXT, -- comma separated: 'essential,personal'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects (id)
  );`,
  `CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id INTEGER,
    project_id INTEGER,
    obligation_id INTEGER,
    currency_id INTEGER,
    type TEXT, -- income, expense
    nature TEXT, -- cash, virtual
    amount_original REAL,
    amount_main_currency REAL,
    description TEXT,
    category TEXT, -- essential, personal, investment
    transaction_date DATETIME,
    synced INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (source_id) REFERENCES sources (id),
    FOREIGN KEY (project_id) REFERENCES projects (id),
    FOREIGN KEY (obligation_id) REFERENCES obligations (id),
    FOREIGN KEY (currency_id) REFERENCES currencies (id)
  );`,
  `CREATE TABLE IF NOT EXISTS financial_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    saving_rate REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );`,
  `CREATE TABLE IF NOT EXISTS savings_tracker (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id INTEGER,
    income_amount REAL,
    amount_essential REAL,
    amount_personal REAL,
    amount_investment REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES transactions (id)
  );`,
  `CREATE TABLE IF NOT EXISTS savings_balance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    total_essential REAL DEFAULT 0,
    total_personal REAL DEFAULT 0,
    total_investment REAL DEFAULT 0,
    last_update DATETIME DEFAULT CURRENT_TIMESTAMP
  );`,
  `CREATE TABLE IF NOT EXISTS sync_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name TEXT,
    record_id INTEGER,
    action TEXT, -- create, update, delete
    payload TEXT, -- JSON data
    status TEXT DEFAULT 'pending', -- pending, synced, failed
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );`,
  `CREATE TABLE IF NOT EXISTS trash (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_table TEXT,
    record_id INTEGER,
    payload TEXT, -- Original Record JSON
    deleted_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );`,
  `CREATE TABLE IF NOT EXISTS budget_alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id INTEGER,
    severity TEXT, -- info, warning, danger
    message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES transactions (id)
  );`
];
