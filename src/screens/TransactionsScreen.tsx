import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { Colors, Spacing, Typography } from '../utils/theme';
import { Card } from '../components/Card';
import { Plus, Search, Filter, ArrowUpRight, ArrowDownLeft, Calendar, Trash2 } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getDatabase } from '../database/db';
import { FinancialEngine } from '../services/FinancialEngine';
import { Alert } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const ScreenHeader = ({ title, subtitle, colors }: { title: string, subtitle: string, colors: any }) => (
  <View style={styles.headerContainer}>
    <Text style={[styles.headerSubtitle, { color: colors.accent }]}>{subtitle}</Text>
    <Text style={[styles.headerTitle, { color: colors.ink }]}>{title}</Text>
  </View>
);

export default function TransactionsScreen() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const { colors, isDark } = useTheme();

  const handleDelete = (id: number) => {
    Alert.alert(
      'Annuler l\'opération',
      'Voulez-vous vraiment annuler cette transaction ? L\'impact sur vos budgets et vos dettes sera annulé.',
      [
        { text: 'Retour', style: 'cancel' },
        { 
          text: 'Confirmer', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await FinancialEngine.deleteTransaction(id);
              loadTransactions();
            } catch (error) {
              console.error(error);
              Alert.alert('Erreur', 'Impossible d\'annuler la transaction');
            }
          }
        }
      ]
    );
  };

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [])
  );

  const loadTransactions = async () => {
    try {
      const db = await getDatabase();
      const data = await db.getAllAsync<any>(
        `SELECT t.*, s.name as source_name, o.name as obligation_name, p.name as project_name, c.code as currency_code 
         FROM transactions t 
         LEFT JOIN sources s ON t.source_id = s.id 
         LEFT JOIN obligations o ON t.obligation_id = o.id
         LEFT JOIN projects p ON t.project_id = p.id
         LEFT JOIN currencies c ON t.currency_id = c.id
         ORDER BY t.transaction_date DESC`
      );
      setTransactions(data);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
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
        data={transactions}
        ListHeaderComponent={
          <>
            <ScreenHeader title="Flux Financier" subtitle="Toutes vos opérations" colors={colors} />
            <View style={styles.searchContainer}>
              <Card style={[styles.searchBar, { backgroundColor: colors.paper, borderColor: colors.border }]}>
                <Search stroke={colors.textSecondary} size={20} />
                <TextInput 
                  placeholder="Rechercher une opération..." 
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholderTextColor={colors.textSecondary}
                />
                <TouchableOpacity style={styles.filterBtn}>
                  <Filter stroke={colors.accent} size={20} />
                </TouchableOpacity>
              </Card>
            </View>
          </>
        }
        contentContainerStyle={styles.listContent}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity onLongPress={() => handleDelete(item.id)} activeOpacity={0.7}>
            <Card style={styles.transactionCard}>
              <View style={styles.row}>
                <View style={[
                  styles.typeIcon, 
                  { backgroundColor: item.type === 'income' ? (colors.success + '15') : (colors.danger + '15') }
                ]}>
                  {item.nature === 'virtual' ? (
                    <Calendar stroke={item.type === 'income' ? colors.success : colors.danger} size={20} />
                  ) : (
                    item.type === 'income' ? 
                      <ArrowUpRight stroke={colors.success} size={22} /> : 
                      <ArrowDownLeft stroke={colors.danger} size={22} />
                  )}
                </View>
                
                <View style={styles.contentContainer}>
                  <Text style={[styles.itemTitle, { color: colors.ink }]} numberOfLines={1}>
                    {item.description}
                  </Text>
                  <View style={styles.metaRow}>
                    <View style={[styles.categoryBadge, { backgroundColor: colors.background }]}>
                      <Text style={[styles.itemCategory, { color: colors.textSecondary }]} numberOfLines={1}>
                        {item.source_name || item.obligation_name || 'Système'}
                      </Text>
                    </View>
                    <Text style={[styles.itemDate, { color: colors.textSecondary }]}>
                      {new Date(item.transaction_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                    </Text>
                  </View>
                  {item.project_name && (
                    <View style={[styles.projectBadge, { backgroundColor: colors.accent + '15' }]}>
                      <Text style={[styles.projectBadgeText, { color: colors.accent }]} numberOfLines={1}>🎯 {item.project_name}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.amountContainer}>
                  <Text style={[
                    styles.itemAmount, 
                    { color: item.type === 'income' ? colors.success : colors.ink }
                  ]}>
                    {item.type === 'income' ? '+' : '-'}{item.amount_original.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                  <Text style={[styles.currencyCode, { color: colors.textSecondary }]}>{item.currency_code}</Text>
                  {item.obligation_id && (
                    <View style={[styles.obligationIndicator, { backgroundColor: colors.accent + '15' }]}>
                      <Text style={[styles.miniLabel, { color: colors.accent }]}>Obligation</Text>
                    </View>
                  )}
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Text style={{ color: colors.textSecondary }}>Aucune transaction trouvée</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  headerContainer: { marginBottom: 20, marginTop: 10 },
  headerSubtitle: { fontWeight: '700', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 },
  headerTitle: { fontSize: 32, fontWeight: '800', marginTop: 4 },
  listContent: { padding: Spacing.lg, paddingBottom: 140 },
  searchContainer: { marginBottom: 24 },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 20 },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 16, fontWeight: '500' },
  filterBtn: { padding: 4 },
  transactionCard: { padding: 12, paddingHorizontal: 16, borderRadius: 24, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center' },
  typeIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  contentContainer: { flex: 1, marginLeft: 16, paddingRight: 8 },
  itemTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginRight: 8, maxWidth: '60%' },
  itemCategory: { fontSize: 11, fontWeight: '700' },
  itemDate: { fontSize: 11, fontWeight: '500' },
  projectBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 4, alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
  projectBadgeText: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  amountContainer: { alignItems: 'flex-end', minWidth: 80 },
  itemAmount: { fontSize: 16, fontWeight: '900' },
  currencyCode: { fontSize: 10, fontWeight: '700', marginTop: -2 },
  obligationIndicator: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginTop: 4 },
  miniLabel: { fontSize: 8, fontWeight: '800', textTransform: 'uppercase' },
});
