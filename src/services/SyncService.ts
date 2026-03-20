import { getDatabase } from '../database/db';

const API_BASE_URL = 'https://foeil.lacrea.dev/api';

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
   * Synchronise toutes les actions en attente
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

    if (queue.length === 0) return { success: true, count: 0 };

    console.log(`Synchronisation de ${queue.length} éléments...`);

    let successCount = 0;
    let failCount = 0;

    for (const item of queue) {
      try {
        const payload = JSON.parse(item.payload);
        
        // On simule/prépare l'appel API
        // Dans un cas réel, on ajouterait un Header Authorization
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
          // Marquer comme synchronisé et supprimer de la queue (ou mettre à jour le status)
          await db.runAsync('DELETE FROM sync_queue WHERE id = ?', [item.id]);
          
          // Mettre à jour le flag 'synced' dans la table d'origine si applicable
          if (item.table_name === 'transactions') {
            await db.runAsync('UPDATE transactions SET synced = 1 WHERE id = ?', [item.record_id]);
          }
          
          successCount++;
        } else {
          console.warn(`Échec sync item ${item.id}: ${response.status}`);
          failCount++;
          await db.runAsync('UPDATE sync_queue SET status = ? WHERE id = ?', ['failed', item.id]);
        }
      } catch (error) {
        console.error(`Erreur réseau pour l'item ${item.id}:`, error);
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
