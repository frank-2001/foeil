import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Colors, Spacing, Typography } from '../utils/theme';
import { Card } from '../components/Card';
import { Trash2, Clock, Landmark, FileText, Target, AlertCircle } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getDatabase } from '../database/db';
import { useTheme } from '../context/ThemeContext';

const ScreenHeader = ({ title, subtitle, colors }: { title: string, subtitle: string, colors: any }) => (
  <View style={styles.headerContainer}>
    <Text style={[styles.headerSubtitle, { color: colors.accent }]}>{subtitle}</Text>
    <Text style={[styles.headerTitle, { color: colors.ink }]}>{title}</Text>
  </View>
);

export default function TrashScreen() {
  const { colors, isDark } = useTheme();
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
      case 'transactions': return <Clock size={20} stroke={colors.accent} />;
      case 'obligations': return <FileText size={20} stroke={colors.danger} />;
      case 'sources': return <Landmark size={20} stroke={colors.success} />;
      case 'projects': return <Target size={20} stroke={colors.warning} />;
      default: return <AlertCircle size={20} stroke={colors.textSecondary} />;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={trashItems}
        ListHeaderComponent={
          <>
            <ScreenHeader title="Corbeille" subtitle="Journal des suppressions" colors={colors} />
            <View style={[styles.infoBox, { backgroundColor: colors.paper }]}>
              <AlertCircle size={16} stroke={colors.textSecondary} />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>Ces éléments ne peuvent pas être supprimés individuellement. Utilisez la "Réinitialisation Totale" dans votre profil pour tout effacer.</Text>
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
                <View style={[styles.iconBox, { backgroundColor: colors.background }]}>{getIcon(item.source_table)}</View>
                <View style={styles.content}>
                  <Text style={[styles.tableTitle, { color: colors.textSecondary }]}>{item.source_table.toUpperCase()}</Text>
                  <Text style={[styles.itemName, { color: colors.ink }]}>{payload.name || payload.description || `ID: ${item.record_id}`}</Text>
                  <Text style={[styles.dateText, { color: colors.textSecondary }]}>Supprimé le {new Date(item.deleted_at).toLocaleString()}</Text>
                </View>
              </View>
            </Card>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Trash2 size={48} stroke={colors.textSecondary} opacity={0.3} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>La corbeille est vide</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: Spacing.lg, paddingBottom: 100 },
  headerContainer: { marginBottom: 24, marginTop: 10 },
  headerSubtitle: { fontWeight: '700', fontSize: 13, textTransform: 'uppercase' },
  headerTitle: { fontSize: 32, fontWeight: '800' },
  infoBox: { flexDirection: 'row', padding: 12, borderRadius: 12, marginBottom: 20, alignItems: 'center', gap: 10 },
  infoText: { fontSize: 11, flex: 1, fontWeight: '600' },
  trashCard: { padding: 16, marginBottom: 12, borderRadius: 20 },
  row: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  content: { flex: 1 },
  tableTitle: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  itemName: { fontSize: 16, fontWeight: '700', marginVertical: 2 },
  dateText: { fontSize: 12 },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 16, fontSize: 16, fontWeight: '600' }
});
