import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, StatusBar, RefreshControl, Image } from 'react-native';
import { Colors, Spacing, Typography } from '../utils/theme';
import { Card } from '../components/Card';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Wallet, 
  TrendingUp, 
  ChevronRight,
  Crown,
  ShieldAlert,
  HandCoins,
  Zap,
  TrendingDown,
  Target,
  AlertTriangle,
  BarChart2,
  PieChart
} from 'lucide-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { FinancialEngine } from '../services/FinancialEngine';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [])
  );

  const loadStats = async () => {
    try {
      const data = await FinancialEngine.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadStats();
  }, []);

  if (loading || !stats) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  const { balance, recentTransactions, obligations, topSource } = stats;
  // Partitions
  const essential = balance.total_essential || 0;
  const personal = balance.total_personal || 0;
  const investment = balance.total_investment || 0;
  const total = essential + personal + investment;
  const debt = obligations.total_debt || 0;
  const receivable = obligations.total_receivable || 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={[Colors.accent]} // Android
            tintColor={Colors.accent} // iOS
          />
        }
      >
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.row}>
            {/* <Image 
              source={require('../../assets/IconKitchen-Output/android/res/mipmap-xxxhdpi/ic_launcher.png')} 
              style={{ width: 44, height: 44, marginRight: 12, borderRadius: 10 }} 
              resizeMode="contain"
            /> */}
            <View>
              <Text style={styles.welcomeText}>Bonjour,</Text>
              <Text style={styles.userName}>Votre Dashboard</Text>
            </View>
          </View>
          <View style={styles.row}>
            <TouchableOpacity 
              style={[styles.profileBtn, { marginRight: 12 }]} 
              onPress={() => navigation.navigate('Stats')}
            >
              <BarChart2 stroke={Colors.accent} size={28} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.profileBtn} onPress={() => navigation.navigate('Profile')}>
              <Crown stroke={Colors.warning} size={28} />
            </TouchableOpacity>
          </View>
        </View>

        {/* --- MAIN HERO CARD: TOTAL --- */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.heroIconBox}>
              <Wallet stroke="#FFF" size={24} />
            </View>
            <Text style={styles.heroLabel}>SOLDE TOTAL GLOBAL</Text>
          </View>
          <Text style={styles.heroAmount}>{total.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} $</Text>
          
          <View style={styles.partitionsGrid}>
            <View style={styles.partitionItem}>
              <Text style={styles.partitionLabel}>Essentiel (30%)</Text>
              <Text style={styles.partitionValue}>{essential.toFixed(0)} $</Text>
            </View>
            <View style={styles.partitionSeparator} />
            <View style={styles.partitionItem}>
              <Text style={styles.partitionLabel}>Plaisir (30%)</Text>
              <Text style={styles.partitionValue}>{personal.toFixed(0)} $</Text>
            </View>
            <View style={styles.partitionSeparator} />
            <View style={styles.partitionItem}>
              <Text style={styles.partitionLabel}>Épargne (40%)</Text>
              <Text style={[styles.partitionValue, { color: '#ADFF2F' }]}>{investment.toFixed(0)} $</Text>
            </View>
          </View>
        </View>

        {/* --- FINANCIAL HEALTH / QUOTA --- */}
        <TouchableOpacity 
          activeOpacity={0.8}
          onPress={() => navigation.navigate('BudgetAlerts')}
          style={[styles.healthCard, { backgroundColor: stats.health.color + '08', borderColor: stats.health.color + '20' }]}
        >
            <View style={styles.row}>
              <View style={[styles.healthDot, { backgroundColor: stats.health.color }]} />
              <Text style={[styles.healthTitle, { color: stats.health.color }]}>{stats.health.label}</Text>
            </View>
            <Text style={styles.healthMessage}>
              {stats.health.dangerCount > 0 
                ? `${stats.health.dangerCount} alertes critiques détectées (Défis & Refus).`
                : (stats.health.warningCount > 0 
                    ? `${stats.health.warningCount} alertes ou dépassements de budget.`
                    : 'Gestion exemplaire. Aucun dépassement de budget.') 
              }
            </Text>
        </TouchableOpacity>

        {/* --- PERFORMANCE HIGHLIGHTS --- */}
        <View style={styles.performanceContainer}>
          <View style={styles.perfColumn}>
            <Text style={styles.perfLabel}>Top Revenus 7j</Text>
            {stats.weeklyTopIncome?.map((itm: any, i: number) => (
              <View key={i} style={styles.perfItem}>
                <ArrowUpRight stroke="#0e9f6e" size={14} />
                <Text style={styles.perfName} numberOfLines={1}>{itm.name}</Text>
                <Text style={styles.perfValue}>+{itm.total.toFixed(0)}$</Text>
              </View>
            ))}
          </View>
          <View style={styles.perfDivider} />
          <View style={styles.perfColumn}>
            <Text style={styles.perfLabel}>Top Dépenses 7j</Text>
            {stats.weeklyTopExpense?.map((itm: any, i: number) => (
              <View key={i} style={styles.perfItem}>
                <AlertTriangle stroke="#c81e1e" size={14} />
                <Text style={styles.perfName} numberOfLines={1}>{itm.name}</Text>
                <Text style={styles.perfValue}>-{itm.total.toFixed(0)}$</Text>
              </View>
            ))}
          </View>
        </View>

        {/* --- OBLIGATIONS: DEBT & RECEIVABLE --- */}
        <View style={styles.rowBetween}>
          <Card style={[styles.miniCard, { borderColor: Colors.danger + '20', borderWidth: 1 }]}>
            <View style={[styles.miniIconBox, { backgroundColor: Colors.danger + '10' }]}>
              <TrendingDown stroke={Colors.danger} size={20} />
            </View>
            <Text style={styles.miniLabel}>Dettes (Reste à payer)</Text>
            <Text style={[styles.miniValue, { color: Colors.danger }]}>
              -{(debt ?? 0).toLocaleString('fr-FR')} $
            </Text>
            <View style={styles.warningIndicator}>
               <ShieldAlert stroke={Colors.danger} size={12} />
               <Text style={styles.warningText}>Total dû</Text>
            </View>
          </Card>

          <Card style={[styles.miniCard, { borderColor: Colors.success + '20', borderWidth: 1 }]}>
            <View style={[styles.miniIconBox, { backgroundColor: Colors.success + '10' }]}>
              <HandCoins stroke={Colors.success} size={20} />
            </View>
            <Text style={styles.miniLabel}>Créances</Text>
            <Text style={[styles.miniValue, { color: Colors.success }]}>+{(receivable ?? 0).toLocaleString('fr-FR')} $</Text>
            <View style={styles.successIndicator}>
               <TrendingUp stroke={Colors.success} size={12} />
               <Text style={styles.successText}>À recevoir</Text>
            </View>
          </Card>
        </View>

        {/* --- TOP PERFORMING SOURCE --- */}
        {topSource && (
          <TouchableOpacity style={styles.topSourceCard} activeOpacity={0.9}>
            <View style={styles.topSourceBadge}>
              <Crown stroke="#FFF" size={14} fill="#FFF" />
              <Text style={styles.topSourceBadgeText}>CHAMPION</Text>
            </View>
            <View style={styles.row}>
              <View style={styles.topSourceIcon}>
                 <Target stroke={Colors.accent} size={32} />
              </View>
              <View style={styles.flex1}>
                <Text style={styles.topSourceLabel}>Source la plus rentable</Text>
                <Text style={styles.topSourceName}>{topSource.source_name ?? ''}</Text>
                {topSource.project_name && (
                  <View style={styles.projectTag}>
                    <Text style={styles.projectTagText}>Projet: {topSource.project_name}</Text>
                  </View>
                )}
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.topSourceAmount}>+{(topSource.total_earned ?? 0).toFixed(0)} $</Text>
                <Text style={styles.topSourceSub}>Total cumulé</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Recent Activity */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeading}>Activité Récente</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
            <Text style={styles.viewAllText}>Voir tout</Text>
          </TouchableOpacity>
        </View>

        <Card style={styles.activityCard}>
          {recentTransactions.map((tx: any, i: number) => (
            <TouchableOpacity 
              key={tx.id} 
              onPress={() => navigation.navigate('Transactions')}
              style={[styles.activityItem, i === recentTransactions.length - 1 && { borderBottomWidth: 0 }]}
            >
              <View style={[styles.activityIcon, { backgroundColor: tx.type === 'income' ? '#E1F8EF' : '#FCE8E8' }]}>
                {tx.type === 'income' ? 
                  <ArrowUpRight stroke={Colors.success} size={24} /> : 
                  <ArrowDownLeft stroke={Colors.danger} size={24} />
                }
              </View>
              <View style={styles.flex1}>
                <Text style={styles.activityTitle} numberOfLines={1}>{tx.description ?? ''}</Text>
                <Text style={styles.activityDate}>{tx.source_name ?? 'Autre'}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.activityAmount, { color: tx.type === 'income' ? Colors.success : Colors.text }]}>
                  {tx.type === 'income' ? '+' : '-'}{(tx.amount_original ?? 0).toFixed(0)}$
                </Text>
                <ChevronRight stroke="rgba(0,0,0,0.1)" size={16} />
              </View>
            </TouchableOpacity>
          ))}
          {recentTransactions.length === 0 && (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Text style={{ color: Colors.textSecondary }}>Aucune transaction récente</Text>
            </View>
          )}
        </Card>
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  center: { justifyContent: 'center', alignItems: 'center' },
  content: { padding: Spacing.lg, paddingBottom: 120 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, marginTop: 10 },
  welcomeText: { fontSize: 16, color: Colors.textSecondary, fontWeight: '500' },
  userName: { fontSize: 24, fontWeight: '800', color: Colors.ink },
  profileBtn: { width: 50, height: 50, borderRadius: 15, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  
  heroCard: { 
    backgroundColor: Colors.ink, 
    borderRadius: 35, 
    padding: 30, 
    marginBottom: 24,
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10
  },
  heroHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  heroIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  heroLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  heroAmount: { color: '#FFF', fontSize: 42, fontWeight: '900', marginBottom: 25 },
  heroSecondaryValue: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  partitionsGrid: { 
    flexDirection: 'row', 
    backgroundColor: 'rgba(255,255,255,0.07)', 
    borderRadius: 22, 
    padding: 15, 
    justifyContent: 'space-between',
    marginTop: 10
  },
  partitionItem: { flex: 1, alignItems: 'center' },
  partitionLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: '800', textTransform: 'uppercase', marginBottom: 4 },
  partitionValue: { color: '#FFF', fontSize: 14, fontWeight: '800' },
  partitionSeparator: { width: 1, height: 25, backgroundColor: 'rgba(255,255,255,0.1)', alignSelf: 'center' },

  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  row: { flexDirection: 'row', alignItems: 'center' },
  flex1: { flex: 1 },
  
  performanceContainer: { 
    flexDirection: 'row', 
    backgroundColor: '#FFF', 
    borderRadius: 24, 
    padding: 16, 
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F3F4F6'
  },
  perfColumn: { flex: 1 },
  perfDivider: { width: 1, backgroundColor: '#F3F4F6', marginHorizontal: 12 },
  perfLabel: { fontSize: 11, fontWeight: '800', color: Colors.textSecondary, marginBottom: 10, textTransform: 'uppercase' },
  perfItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 5 },
  perfName: { flex: 1, fontSize: 13, fontWeight: '700', color: Colors.ink },
  perfValue: { fontSize: 12, fontWeight: '700' },
  
  miniCard: { width: '48%', padding: 18, borderRadius: 24, marginBottom: 24 },
  miniIconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  projectBudget: { fontSize: 13, color: Colors.textSecondary, fontWeight: '700' },
  miniLabel: { fontSize: 10, color: Colors.textSecondary, fontWeight: '800', textTransform: 'uppercase' },
  roiBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.accent + '10', padding: 8, borderRadius: 8 },
  miniValue: { fontSize: 19, fontWeight: '800' },
  warningIndicator: { flexDirection: 'row', alignItems: 'center', marginTop: 8, backgroundColor: Colors.danger + '10', alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  warningText: { color: Colors.danger, fontSize: 10, fontWeight: '700', marginLeft: 4 },
  successIndicator: { flexDirection: 'row', alignItems: 'center', marginTop: 8, backgroundColor: Colors.success + '10', alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  successText: { color: Colors.success, fontSize: 10, fontWeight: '700', marginLeft: 4 },

  topSourceCard: { 
    backgroundColor: '#FFF', 
    borderRadius: 24, 
    padding: 20, 
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2
  },
  topSourceBadge: { 
    position: 'absolute', 
    top: -12, 
    left: 20, 
    backgroundColor: Colors.warning, 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 10 
  },
  topSourceBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '900', marginLeft: 5 },
  topSourceIcon: { width: 60, height: 60, borderRadius: 20, backgroundColor: Colors.accent + '10', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  topSourceLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: '700', textTransform: 'uppercase' },
  topSourceName: { fontSize: 18, fontWeight: '800', color: Colors.ink, marginVertical: 2 },
  topSourceAmount: { fontSize: 20, fontWeight: '900', color: Colors.success },
  topSourceSub: { fontSize: 10, color: Colors.textSecondary, fontWeight: '600' },
  projectTag: { backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 4, alignSelf: 'flex-start' },
  projectTagText: { fontSize: 11, color: Colors.accent, fontWeight: '700' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionHeading: { fontSize: 20, fontWeight: '800', color: Colors.ink },
  viewAllText: { color: Colors.accent, fontWeight: '700', fontSize: 14 },
  activityCard: { padding: 0, borderRadius: 28, overflow: 'hidden', borderWidth: 1, borderColor: '#F3F4F6' },
  activityItem: { flexDirection: 'row', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  activityIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  activityTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  activityDate: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  activityAmount: { fontSize: 16, fontWeight: '800', marginRight: 8 },
  
  // Health Card Styles
  healthCard: {
    padding: 16,
    borderRadius: 24,
    borderWidth: 1.5,
    marginBottom: 24,
  },
  healthDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  healthTitle: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  healthMessage: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 8,
    fontWeight: '600',
    lineHeight: 18,
  },
});