import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { Colors, Spacing, Typography } from '../utils/theme';
import { Card } from '../components/Card';
import { Plus, Search, Filter, ArrowUpRight, ArrowDownLeft, Calendar, Trash2 } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getDatabase } from '../database/db';
import { FinancialEngine } from '../services/FinancialEngine';
import { Alert } from 'react-native';

const ScreenHeader = ({ title, subtitle }: { title: string, subtitle: string }) => (
  <View style={styles.headerContainer}>
    <Text style={styles.headerSubtitle}>{subtitle}</Text>
    <Text style={styles.headerTitle}>{title}</Text>
  </View>
);

export default function TransactionsScreen() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);

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
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={transactions}
        ListHeaderComponent={
          <>
            <ScreenHeader title="Flux Financier" subtitle="Toutes vos opérations" />
            <View style={styles.searchContainer}>
              <Card style={styles.searchBar}>
                <Search stroke={Colors.textSecondary} size={20} />
                <TextInput 
                  placeholder="Rechercher une opération..." 
                  style={styles.searchInput}
                  placeholderTextColor={Colors.textSecondary}
                />
                <TouchableOpacity style={styles.filterBtn}>
                  <Filter stroke={Colors.accent} size={20} />
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
                  { backgroundColor: item.type === 'income' ? '#E6F4EA' : '#FCE8E8' }
                ]}>
                  {item.nature === 'virtual' ? (
                    <Calendar stroke={item.type === 'income' ? Colors.success : Colors.danger} size={20} />
                  ) : (
                    item.type === 'income' ? 
                      <ArrowUpRight stroke={Colors.success} size={22} /> : 
                      <ArrowDownLeft stroke={Colors.danger} size={22} />
                  )}
                </View>
                
                <View style={styles.contentContainer}>
                  <Text style={styles.itemTitle} numberOfLines={1} ellipsizeMode="tail">
                    {item.description}
                  </Text>
                  <View style={styles.metaRow}>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.itemCategory} numberOfLines={1}>
                        {item.source_name || item.obligation_name || 'Système'}
                      </Text>
                    </View>
                    <Text style={styles.itemDate}>
                      {new Date(item.transaction_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                    </Text>
                  </View>
                  {item.project_name && (
                    <View style={styles.projectBadge}>
                      <Text style={styles.projectBadgeText} numberOfLines={1}>🎯 {item.project_name}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.amountContainer}>
                  <Text style={[
                    styles.itemAmount, 
                    { color: item.type === 'income' ? Colors.success : Colors.ink }
                  ]}>
                    {item.type === 'income' ? '+' : '-'}{item.amount_original.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                  <Text style={styles.currencyCode}>{item.currency_code}</Text>
                  {item.obligation_id && (
                    <View style={styles.obligationIndicator}>
                      <Text style={styles.miniLabel}>Obligation</Text>
                    </View>
                  )}
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Text style={{ color: Colors.textSecondary }}>Aucune transaction trouvée</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { justifyContent: 'center', alignItems: 'center' },
  headerContainer: { marginBottom: 20, marginTop: 10 },
  headerSubtitle: { color: Colors.accent, fontWeight: '700', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 },
  headerTitle: { fontSize: 32, fontWeight: '800', color: Colors.ink, marginTop: 4 },
  listContent: { padding: Spacing.lg, paddingBottom: 140 },
  searchContainer: { marginBottom: 24 },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 20 },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 16, color: Colors.text, fontWeight: '500' },
  filterBtn: { padding: 4 },
  transactionCard: { padding: 12, paddingHorizontal: 16, borderRadius: 24, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center' },
  typeIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  contentContainer: { flex: 1, marginLeft: 16, paddingRight: 8 },
  itemTitle: { fontSize: 16, fontWeight: '700', color: Colors.ink, marginBottom: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  categoryBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginRight: 8, maxWidth: '60%' },
  itemCategory: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary },
  itemDate: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500' },
  projectBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 4, backgroundColor: Colors.accent + '10', alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
  projectBadgeText: { fontSize: 9, fontWeight: '800', color: Colors.accent, textTransform: 'uppercase' },
  amountContainer: { alignItems: 'flex-end', minWidth: 80 },
  itemAmount: { fontSize: 16, fontWeight: '900' },
  currencyCode: { fontSize: 10, fontWeight: '700', color: Colors.textSecondary, marginTop: -2 },
  obligationIndicator: { backgroundColor: Colors.accent + '15', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginTop: 4 },
  miniLabel: { fontSize: 8, fontWeight: '800', color: Colors.accent, textTransform: 'uppercase' },
});
