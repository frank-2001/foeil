import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { Colors, Spacing } from '../utils/theme';
import { Card } from '../components/Card';
import { AlertTriangle, Info, ShieldAlert, Target, History } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getDatabase } from '../database/db';

const ScreenHeader = ({ title, subtitle }: { title: string, subtitle: string }) => (
  <View style={styles.headerContainer}>
    <Text style={styles.headerSubtitle}>{subtitle}</Text>
    <Text style={styles.headerTitle}>{title}</Text>
  </View>
);

export default function BudgetAlertsScreen() {
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<any[]>([]);

  const loadAlerts = async () => {
    try {
      const db = await getDatabase();
      const data = await db.getAllAsync<any>(
        'SELECT * FROM budget_alerts ORDER BY created_at DESC'
      );
      setAlerts(data);
    } catch (error) {
      console.error('Error loading budget alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadAlerts();
    }, [])
  );

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'danger': return <ShieldAlert size={22} stroke={Colors.danger} />;
      case 'warning': return <AlertTriangle size={22} stroke={Colors.warning} />;
      case 'info': return <Info size={22} stroke={Colors.accent} />;
      default: return <History size={22} stroke={Colors.textSecondary} />;
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
        data={alerts}
        ListHeaderComponent={
          <ScreenHeader title="Dépassements" subtitle="Historique des limites" />
        }
        contentContainerStyle={styles.listContent}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <Card style={[styles.alertCard, { borderLeftColor: item.severity === 'danger' ? Colors.danger : (item.severity === 'warning' ? Colors.warning : Colors.accent) }]}>
            <View style={styles.row}>
              <View style={styles.iconBox}>{getAlertIcon(item.severity)}</View>
              <View style={styles.content}>
                <Text style={styles.message}>{item.message}</Text>
                <Text style={styles.date}>{new Date(item.created_at).toLocaleString()}</Text>
              </View>
            </View>
          </Card>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Target size={48} stroke={Colors.textSecondary} opacity={0.3} />
            <Text style={styles.emptyText}>Aucun dépassement enregistré</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: Spacing.lg },
  headerContainer: { marginBottom: 24 },
  headerSubtitle: { color: Colors.accent, fontWeight: '700', fontSize: 13, textTransform: 'uppercase' },
  headerTitle: { fontSize: 32, fontWeight: '800', color: Colors.ink },
  alertCard: { padding: 16, marginBottom: 12, borderLeftWidth: 4, borderRadius: 12 },
  row: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { marginRight: 15 },
  content: { flex: 1 },
  message: { fontSize: 14, fontWeight: '700', color: Colors.ink, lineHeight: 20 },
  date: { fontSize: 11, color: Colors.textSecondary, marginTop: 4, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 16, fontSize: 16, color: Colors.textSecondary, fontWeight: '600' }
});
