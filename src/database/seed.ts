export const SEED_DATA_QUERIES = [
  // Devises initiales
  `INSERT OR IGNORE INTO currencies (code, name, exchange_rate_to_main, is_main) VALUES ('USD', 'Dollar Américain', 1.0, 1);`,
  `INSERT OR IGNORE INTO currencies (code, name, exchange_rate_to_main, is_main) VALUES ('EUR', 'Euro', 0.92, 0);`,
  `INSERT OR IGNORE INTO currencies (code, name, exchange_rate_to_main, is_main) VALUES ('CDF', 'Franc Congolais', 2800.0, 0);`,
  
  // Sources initiales
  `INSERT OR IGNORE INTO sources (name, type) VALUES ('Salaire', 'income');`,
  `INSERT OR IGNORE INTO sources (name, type) VALUES ('Freelance', 'income');`,
  `INSERT OR IGNORE INTO sources (name, type) VALUES ('Alimentation', 'expense');`,
  `INSERT OR IGNORE INTO sources (name, type) VALUES ('Loyer', 'expense');`,
  
  // Règle financière initiale (50% d'épargne)
  `INSERT OR IGNORE INTO financial_rules (saving_rate) VALUES (0.5);`,
  
  // Solde initial
  `INSERT OR IGNORE INTO savings_balance (total_essential, total_personal, total_investment) VALUES (0.0, 0.0, 0.0);`,

  // Projets initiaux
  `INSERT OR IGNORE INTO projects (name, estimated_cost, expected_roi, status, priority_score) VALUES ('Achat Terrain', 15000, 25, 'active', 0.1);`,
  `INSERT OR IGNORE INTO projects (name, estimated_cost, expected_roi, status, priority_score) VALUES ('Nouveau Laptop', 2500, 0, 'completed', 0.0);`,
  `INSERT OR IGNORE INTO projects (name, estimated_cost, expected_roi, status, priority_score) VALUES ('Crypto Fund', 1000, 50, 'planning', 0.5);`
];
