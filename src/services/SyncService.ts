import { Alert } from 'react-native';
import { getDatabase } from '../database/db';

const DEV_API = 'http://10.39.169.186:8000/api';
const PROD_API = 'https://foeil.lacrea.dev/api';
const API_BASE_URL = PROD_API;

/**
 * Table sync order: parent tables must be synced before child tables
 * to avoid foreign key constraint violations on the API side.
 */
const TABLE_SYNC_ORDER: Record<string, number> = {
  currencies: 0,
  projects: 1,
  sources: 2,
  obligations: 3,
  financial_rules: 4,
  transactions: 5,
  savings_tracker: 6,
  savings_balance: 7,
};

export class SyncService {
  /**
   * Ajoute une action à la file d'attente de synchronisation
   */
  static async addToQueue(tableName: string, recordId: number, action: 'create' | 'update' | 'delete', payload: any) {
    const db = await getDatabase();
    await db.runAsync(
      'INSERT INTO sync_queue (table_name, record_id, action, payload) VALUES (?, ?, ?, ?)',
      [tableName, recordId, action, JSON.stringify(payload)]
    );
  }

  /**
   * Returns the number of items pending synchronisation
   */
  static async pendingCount(): Promise<number> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM sync_queue WHERE status = 'pending'"
    );
    return result?.count ?? 0;
  }

  /**
   * Synchronise toutes les actions en attente
   * Items are sorted by table dependency order so parent records (currencies, sources...)
   * are always sent before child records (transactions...).
   */
  static async sync() {
    const db = await getDatabase();
    const queue = await db.getAllAsync<{
      id: number;
      table_name: string;
      record_id: number;
      action: string;
      payload: string;
    }>('SELECT * FROM sync_queue WHERE status = ? ORDER BY created_at ASC', ['pending']);

    if (queue.length === 0) return { success: true, count: 0, failed: 0 };

    // Sort by table dependency order, then by created_at (already sorted above)
    const sortedQueue = [...queue].sort((a, b) => {
      const orderA = TABLE_SYNC_ORDER[a.table_name] ?? 99;
      const orderB = TABLE_SYNC_ORDER[b.table_name] ?? 99;
      return orderA - orderB;
    });

    console.log(`Synchronisation de ${sortedQueue.length} éléments...`);

    let successCount = 0;
    let failCount = 0;

    for (const item of sortedQueue) {
      try {
        const payload = JSON.parse(item.payload);
        
        const response = await fetch(`${API_BASE_URL}/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // 'Authorization': `Bearer ${userToken}` 
          },
          body: JSON.stringify({
            table: item.table_name,
            record_id: item.record_id,
            action: item.action,
            data: payload
          }),
        });

        if (response.ok) {
          // Marquer comme synchronisé et supprimer de la queue
          await db.runAsync('DELETE FROM sync_queue WHERE id = ?', [item.id]);
          
          // Mettre à jour le flag 'synced' dans la table d'origine si applicable
          if (item.table_name === 'transactions') {
            await db.runAsync('UPDATE transactions SET synced = 1 WHERE id = ?', [item.record_id]);
          }
          
          successCount++;
        } else {
          // Parse the JSON error body to get the 'message' property from the server
          let errorMsg = `Status ${response.status}`;
          try {
            const errorData = await response.json();
            if (errorData.message) errorMsg = errorData.message;
          } catch (e) {
            // Keep status if json parsing fails
          }
          Alert.alert('Echec', `Sync fail for item ${item.id} (${item.table_name}): ${errorMsg}`);
          console.warn(`Sync fail for item ${item.id} (${item.table_name}): ${errorMsg}`);
          failCount++;
          // await db.runAsync('UPDATE sync_queue SET status = ? WHERE id = ?', ['failed', item.id]);
        }
      } catch (error) {
        console.error(`Erreur réseau pour l'item ${item.id}  url ${API_BASE_URL}:`, error);
        failCount++;
      }
    }

    return { 
      success: failCount === 0, 
      count: successCount,
      failed: failCount
    };
  }

  /**
   * Récupère les données distantes (optionnel, pour initialisation)
   */
  static async pull() {
    // Logique pour récupérer les données du serveur vers le mobile
    // Non implémenté par défaut dans le plan d'architecture
  }
}
