import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Colors, Spacing, Typography } from '../utils/theme';
import { Card } from '../components/Card';
import { Trash2, Clock, Landmark, FileText, Target, AlertCircle } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getDatabase } from '../database/db';

const ScreenHeader = ({ title, subtitle }: { title: string, subtitle: string }) => (
  <View style={styles.headerContainer}>
    <Text style={styles.headerSubtitle}>{subtitle}</Text>
    <Text style={styles.headerTitle}>{title}</Text>
  </View>
);

export default function TrashScreen() {
  const [loading, setLoading] = useState(true);
  const [trashItems, setTrashItems] = useState<any[]>([]);

  const loadTrash = async () => {
    try {
      const db = await getDatabase();
      const data = await db.getAllAsync<any>(
        'SELECT * FROM trash ORDER BY deleted_at DESC'
      );
      setTrashItems(data);
    } catch (error) {
      console.error('Error loading trash:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadTrash();
    }, [])
  );

  const getIcon = (table: string) => {
    switch (table) {
      case 'transactions': return <Clock size={20} stroke={Colors.accent} />;
      case 'obligations': return <FileText size={20} stroke={Colors.danger} />;
      case 'sources': return <Landmark size={20} stroke={Colors.success} />;
      case 'projects': return <Target size={20} stroke={Colors.warning} />;
      default: return <AlertCircle size={20} stroke={Colors.textSecondary} />;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={trashItems}
        ListHeaderComponent={
          <>
            <ScreenHeader title="Corbeille" subtitle="Journal des suppressions" />
            <View style={styles.infoBox}>
              <AlertCircle size={16} stroke={Colors.textSecondary} />
              <Text style={styles.infoText}>Ces éléments ne peuvent pas être supprimés individuellement. Utilisez la "Réinitialisation Totale" dans votre profil pour tout effacer.</Text>
            </View>
          </>
        }
        contentContainerStyle={styles.listContent}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => {
          const payload = JSON.parse(item.payload);
          return (
            <Card style={styles.trashCard}>
              <View style={styles.row}>
                <View style={styles.iconBox}>{getIcon(item.source_table)}</View>
                <View style={styles.content}>
                  <Text style={styles.tableTitle}>{item.source_table.toUpperCase()}</Text>
                  <Text style={styles.itemName}>{payload.name || payload.description || `ID: ${item.record_id}`}</Text>
                  <Text style={styles.dateText}>Supprimé le {new Date(item.deleted_at).toLocaleString()}</Text>
                </View>
              </View>
            </Card>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Trash2 size={48} stroke={Colors.textSecondary} opacity={0.3} />
            <Text style={styles.emptyText}>La corbeille est vide</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: Spacing.lg, paddingBottom: 100 },
  headerContainer: { marginBottom: 24 },
  headerSubtitle: { color: Colors.accent, fontWeight: '700', fontSize: 13, textTransform: 'uppercase' },
  headerTitle: { fontSize: 32, fontWeight: '800', color: Colors.ink },
  infoBox: { flexDirection: 'row', backgroundColor: '#F3F4F6', padding: 12, borderRadius: 12, marginBottom: 20, alignItems: 'center', gap: 10 },
  infoText: { fontSize: 11, color: Colors.textSecondary, flex: 1, fontWeight: '600' },
  trashCard: { padding: 16, marginBottom: 12, borderRadius: 20 },
  row: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  content: { flex: 1 },
  tableTitle: { fontSize: 10, fontWeight: '800', color: Colors.textSecondary, letterSpacing: 1 },
  itemName: { fontSize: 16, fontWeight: '700', color: Colors.ink, marginVertical: 2 },
  dateText: { fontSize: 12, color: Colors.textSecondary },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 16, fontSize: 16, color: Colors.textSecondary, fontWeight: '600' }
});
