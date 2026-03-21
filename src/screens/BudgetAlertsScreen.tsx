import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { Colors, Spacing } from '../utils/theme';
import { Card } from '../components/Card';
import { AlertTriangle, Info, ShieldAlert, Target, History } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getDatabase } from '../database/db';
import { useTheme } from '../context/ThemeContext';

const ScreenHeader = ({ title, subtitle, colors }: { title: string, subtitle: string, colors: any }) => (
  <View style={styles.headerContainer}>
    <Text style={[styles.headerSubtitle, { color: colors.accent }]}>{subtitle}</Text>
    <Text style={[styles.headerTitle, { color: colors.ink }]}>{title}</Text>
  </View>
);

export default function BudgetAlertsScreen() {
  const { colors, isDark } = useTheme();
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
      case 'danger': return <ShieldAlert size={22} stroke={colors.danger} />;
      case 'warning': return <AlertTriangle size={22} stroke={colors.warning} />;
      case 'info': return <Info size={22} stroke={colors.accent} />;
      default: return <History size={22} stroke={colors.textSecondary} />;
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
        data={alerts}
        ListHeaderComponent={
          <ScreenHeader title="Dépassements" subtitle="Historique des limites" colors={colors} />
        }
        contentContainerStyle={styles.listContent}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <Card style={[styles.alertCard, { borderLeftColor: item.severity === 'danger' ? colors.danger : (item.severity === 'warning' ? colors.warning : colors.accent) }]}>
            <View style={styles.row}>
              <View style={styles.iconBox}>{getAlertIcon(item.severity)}</View>
              <View style={styles.content}>
                <Text style={[styles.message, { color: colors.ink }]}>{item.message}</Text>
                <Text style={[styles.date, { color: colors.textSecondary }]}>{new Date(item.created_at).toLocaleString()}</Text>
              </View>
            </View>
          </Card>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Target size={48} stroke={colors.textSecondary} opacity={0.3} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Aucun dépassement enregistré</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: Spacing.lg },
  headerContainer: { marginBottom: 24, marginTop: 10 },
  headerSubtitle: { fontWeight: '700', fontSize: 13, textTransform: 'uppercase' },
  headerTitle: { fontSize: 32, fontWeight: '800' },
  alertCard: { padding: 16, marginBottom: 12, borderLeftWidth: 4, borderRadius: 12 },
  row: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { marginRight: 15 },
  content: { flex: 1 },
  message: { fontSize: 14, fontWeight: '700', lineHeight: 20 },
  date: { fontSize: 11, marginTop: 4, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 16, fontSize: 16, fontWeight: '600' }
});
