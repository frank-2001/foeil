import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Typography } from '../src/utils/theme';
import { Card } from '../src/components/Card';
import { ArrowUpCircle, ArrowDownCircle, Wallet, TrendingUp, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function Dashboard() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Balance Card */}
      <Card style={styles.balanceCard}>
        <Text style={styles.label}>Solde Total</Text>
        <Text style={styles.amount}>4,250.00 $</Text>
        <View style={styles.row}>
          <View style={styles.stat}>
            <ArrowUpCircle color={Colors.success} size={20} />
            <Text style={styles.statValue}>+1,200$</Text>
          </View>
          <View style={styles.stat}>
            <ArrowDownCircle color={Colors.danger} size={20} />
            <Text style={styles.statValue}>-450$</Text>
          </View>
        </View>
      </Card>

      {/* Savings Summary */}
      <View style={styles.row}>
        <Card style={styles.smallCard}>
          <TrendingUp color={Colors.accent} size={24} />
          <Text style={styles.smallLabel}>Épargne</Text>
          <Text style={styles.smallAmount}>2,125$</Text>
        </Card>
        <Card style={styles.smallCard}>
          <Wallet color={Colors.warning} size={24} />
          <Text style={styles.smallLabel}>Dépensable</Text>
          <Text style={styles.smallAmount}>875$</Text>
        </Card>
      </View>

      {/* Projects Quick View */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Projets Prioritaires</Text>
        <TouchableOpacity onPress={() => router.push('/projects')}>
          <Text style={styles.viewAll}>Voir tout</Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity onPress={() => router.push('/projects')}>
        <Card>
          <View style={styles.projectItem}>
            <View>
              <Text style={styles.projectName}>Ouvrir un Bar</Text>
              <Text style={styles.projectMeta}>ROI: 30% • Coût: 5,000$</Text>
            </View>
            <View style={styles.progressBadge}>
              <Text style={styles.progressText}>42%</Text>
            </View>
          </View>
        </Card>
      </TouchableOpacity>

      {/* Recent Activity */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Activité Récente</Text>
        <TouchableOpacity onPress={() => router.push('/transactions')}>
          <Text style={styles.viewAll}>Voir tout</Text>
        </TouchableOpacity>
      </View>

      <Card style={styles.listCard}>
        {[1, 2, 3].map((_, i) => (
          <TouchableOpacity 
            key={i} 
            onPress={() => router.push('/transactions')}
            style={[styles.transactionItem, i === 2 && { borderBottomWidth: 0 }]}
          >
            <View style={styles.transactionIcon}>
              <ArrowUpCircle color={Colors.success} size={24} />
            </View>
            <View style={styles.transactionInfo}>
              <Text style={styles.transactionSubject}>Salaire Freelance</Text>
              <Text style={styles.transactionDate}>Aujourd'hui, 14:30</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.transactionAmount, { color: Colors.success }]}>+500$</Text>
              <ChevronRight color={Colors.textSecondary} size={16} />
            </View>
          </TouchableOpacity>
        ))}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.md,
  },
  balanceCard: {
    backgroundColor: Colors.ink,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  label: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: Spacing.xs,
    flex:1
  },
  amount: {
    fontSize: 40,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 20,
    marginHorizontal: Spacing.xs,
  },
  statValue: {
    color: '#FFF',
    fontSize: 14,
    marginLeft: 6,
    fontWeight: '600',
  },
  smallCard: {
    width: '48%',
    padding: Spacing.md,
  },
  smallLabel: {
    ...Typography.caption,
    marginTop: Spacing.sm,
  },
  smallAmount: {
    ...Typography.number,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.h2,
  },
  viewAll: {
    ...Typography.caption,
    color: Colors.accent,
    fontWeight: '600',
  },
  projectItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  projectName: {
    ...Typography.body,
    fontWeight: '700',
  },
  projectMeta: {
    ...Typography.caption,
  },
  progressBadge: {
    backgroundColor: Colors.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  progressText: {
    fontWeight: '700',
    color: Colors.accent,
  },
  listCard: {
    padding: 0,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  transactionSubject: {
    ...Typography.body,
    fontWeight: '600',
  },
  transactionDate: {
    ...Typography.caption,
  },
  transactionAmount: {
    ...Typography.body,
    fontWeight: '700',
  },
});

