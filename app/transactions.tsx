import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Typography } from '../src/utils/theme';
import { Card } from '../src/components/Card';
import { Plus, Search, Filter } from 'lucide-react-native';

export default function Transactions() {
  const dummyData = [
    { id: '1', title: 'Courses Carrefour', amount: -65.40, date: 'Aujourd\'hui', type: 'expense' },
    { id: '2', title: 'Salaire', amount: 2500.00, date: 'Hier', type: 'income' },
    { id: '3', title: 'Restaurant', amount: -42.00, date: '12 Mars', type: 'expense' },
    { id: '4', title: 'Virement Loyer', amount: -800.00, date: '10 Mars', type: 'expense' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Card style={styles.searchBar}>
          <Search color={Colors.textSecondary} size={20} />
          <Text style={styles.searchText}>Rechercher...</Text>
          <Filter color={Colors.textSecondary} size={20} />
        </Card>
      </View>

      <FlatList
        data={dummyData}
        contentContainerStyle={styles.listContent}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.record}>
            <View style={[styles.indicator, { backgroundColor: item.type === 'income' ? Colors.success : Colors.danger }]} />
            <View style={styles.recordInfo}>
              <Text style={styles.recordTitle}>{item.title}</Text>
              <Text style={styles.recordDate}>{item.date}</Text>
            </View>
            <Text style={[styles.recordAmount, { color: item.type === 'income' ? Colors.success : Colors.text }]}>
              {item.type === 'income' ? '+' : ''}{item.amount.toFixed(2)} $
            </Text>
          </View>
        )}
      />

      <TouchableOpacity style={styles.fab}>
        <Plus color="#FFF" size={32} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: Spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 0,
  },
  searchText: {
    flex: 1,
    marginLeft: 10,
    color: Colors.textSecondary,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 100,
  },
  record: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.paper,
    padding: Spacing.md,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  indicator: {
    width: 4,
    height: 30,
    borderRadius: 2,
    marginRight: 12,
  },
  recordInfo: {
    flex: 1,
  },
  recordTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  recordDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  recordAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: Colors.ink,
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
});
