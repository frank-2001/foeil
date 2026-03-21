import React, { useState, useCallback, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions, 
  ActivityIndicator, 
  StatusBar, 
  RefreshControl, 
  Image 
} from 'react-native';
import { Colors, Spacing, Typography } from '../utils/theme';
import { Card } from '../components/Card';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  TrendingUp, 
  ChevronRight,
  Crown,
  ShieldAlert,
  HandCoins,
  Zap,
  TrendingDown,
  Target,
  BarChart2,
  PieChart,
  User,
  RefreshCw
} from 'lucide-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { FinancialEngine } from '../services/FinancialEngine';
import { formatCompactNumber } from '../utils/formatters';
import { useTheme } from '../context/ThemeContext';
import { SyncService } from '../services/SyncService';

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20, paddingBottom: 120 },
  
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 24, 
    marginTop: 10 
  },
  headerProfileRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarCircle: { 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  welcomeText: { fontSize: 13, fontWeight: '600' },
  userName: { fontSize: 18, fontWeight: '800' },
  headerActions: { flexDirection: 'row', gap: 10 },
  actionCircleBtn: { 
    width: 42, 
    height: 42, 
    borderRadius: 21, 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1
  },
  syncBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  syncBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
  },
  
  healthCard: {
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 20
  },
  healthHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  healthIndicatorLine: { width: 4, height: 16, borderRadius: 2 },
  healthTitle: { fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
  healthMessage: { fontSize: 12, fontWeight: '600', lineHeight: 18 },

  balancesContainer: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  balanceCard: { 
    flex: 1, 
    padding: 14, 
    borderRadius: 24, 
    alignItems: 'center',
    minHeight: 140
  },
  balanceIconBox: { marginBottom: 10 },
  balanceLabel: { 
    fontSize: 9, 
    fontWeight: '900', 
    letterSpacing: 1, 
    marginBottom: 10,
    textTransform: 'uppercase'
  },
  balanceBody: { alignItems: 'center' },
  mainBalanceValue: { fontSize: 17, fontWeight: '900' },
  mainBalanceCode: { fontSize: 10, fontWeight: '700' },
  secondaryBalanceValue: { fontSize: 10, fontWeight: '700', marginTop: 2 },

  performanceCard: { 
    flexDirection: 'row', 
    borderRadius: 28, 
    padding: 20, 
    marginBottom: 20,
    borderWidth: 1
  },
  perfColumn: { flex: 1 },
  perfHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 15 },
  perfDot: { width: 6, height: 6, borderRadius: 3 },
  perfLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  perfRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  perfName: { fontSize: 13, fontWeight: '700', flex: 1, marginRight: 4 },
  perfValue: { fontSize: 12, fontWeight: '800' },
  perfLineDivider: { width: 1, marginHorizontal: 16 },

  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  row: { flexDirection: 'row', alignItems: 'center' },
  flex1: { flex: 1 },
  
  miniCard: { width: '48%', padding: 20, borderRadius: 28, marginBottom: 20, borderWidth: 1 },
  miniIconBox: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  miniLabel: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase', marginBottom: 4 },
  miniValue: { fontSize: 18, fontWeight: '900' },
  indicatorItem: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 5 },
  indicatorText: { fontSize: 10, fontWeight: '700' },

  topSourceCard: { 
    borderRadius: 28, 
    padding: 20, 
    marginBottom: 24,
    borderWidth: 1
  },
  topSourceBadge: { 
    position: 'absolute', 
    top: -10, 
    left: 20, 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  topSourceBadgeText: { color: '#FFF', fontSize: 9, fontWeight: '900' },
  topSourceContent: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  topSourceIcon: { width: 56, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  topSourceLabel: { fontSize: 10, fontWeight: '800' },
  topSourceName: { fontSize: 17, fontWeight: '800', marginVertical: 2 },
  topSourceValue: { fontSize: 19, fontWeight: '900' },
  projectTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginTop: 4, alignSelf: 'flex-start' },
  projectTagText: { fontSize: 10, fontWeight: '700' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionHeading: { fontSize: 19, fontWeight: '800' },
  viewAllText: { fontWeight: '700', fontSize: 13 },
  activityCard: { borderRadius: 28, overflow: 'hidden', borderWidth: 1 },
  activityItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  activityIcon: { width: 42, height: 42, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  activityTitle: { fontSize: 14, fontWeight: '700' },
  activityDate: { fontSize: 11, marginTop: 2 },
  activityAmount: { fontSize: 15, fontWeight: '900' },
});

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [unsyncedCount, setUnsyncedCount] = useState(0);
   const { colors, isDark, refreshKey } = useTheme();

  useFocusEffect(
    useCallback(() => {
      loadStats();
      SyncService.pendingCount().then(setUnsyncedCount);
    }, [refreshKey])
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
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  const { balance, recentTransactions, obligations, topSource } = stats;
  const debt = obligations.total_debt || 0;
  const receivable = obligations.total_receivable || 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={[colors.accent]} 
            tintColor={colors.accent} 
          />
        }
      >
        
        {/* --- ENHANCED HEADER --- */}
        <View style={styles.header}>
          <View style={styles.headerProfileRow}>
             <View style={[styles.avatarCircle, { backgroundColor: colors.accent + '15' }]}>
                <User color={colors.accent} size={24} />
             </View>
             <View>
                <Text style={[styles.welcomeText, { color: colors.textSecondary }]}>Bonjour,</Text>
                <Text style={[styles.userName, { color: colors.ink }]}>Votre Dashboard</Text>
             </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={[styles.actionCircleBtn, { backgroundColor: colors.paper, borderColor: colors.border }]} 
              onPress={() => navigation.navigate('Stats')}
            >
              <BarChart2 stroke={colors.ink} size={22} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionCircleBtn, { backgroundColor: colors.paper, borderColor: unsyncedCount > 0 ? colors.warning : colors.border }]}
              onPress={() => navigation.navigate('Sync')}
            >
              <RefreshCw stroke={unsyncedCount > 0 ? colors.warning : colors.ink} size={20} />
              {unsyncedCount > 0 && (
                <View style={[styles.syncBadge, { backgroundColor: colors.warning }]}>
                  <Text style={styles.syncBadgeText}>{unsyncedCount > 99 ? '99+' : unsyncedCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* --- FINANCIAL HEALTH --- */}
        <TouchableOpacity 
          activeOpacity={0.8}
          onPress={() => navigation.navigate('BudgetAlerts')}
          style={[styles.healthCard, { backgroundColor: isDark ? colors.paper : (stats.health.color + '05'), borderColor: colors.border }]}
        >
            <View style={styles.healthHeader}>
              <View style={[styles.healthIndicatorLine, { backgroundColor: stats.health.color }]} />
              <Text style={[styles.healthTitle, { color: stats.health.color }]}>{stats.health.label}</Text>
            </View>
            <Text style={[styles.healthMessage, { color: colors.textSecondary }]}>
              {stats.health.dangerCount > 0 
                ? `${stats.health.dangerCount} alertes critiques détectées (Défis & Refus).`
                : (stats.health.warningCount > 0 
                    ? `${stats.health.warningCount} alertes ou dépassements de budget.`
                    : 'Gestion exemplaire. Aucun dépassement de budget.') 
              }
            </Text>
        </TouchableOpacity>

        {/* --- BALANCES GRID --- */}
        <View style={styles.balancesContainer}>
          {[
            { key: 'total_essential', label: 'ESSENTIEL', icon: <Zap size={18} color={colors.accent} />, color: colors.accent },
            { key: 'total_personal', label: 'PLAISIR', icon: <HandCoins size={18} color={colors.warning} />, color: colors.warning },
            { key: 'total_investment', label: 'ÉPARGNE', icon: <TrendingUp size={18} color={colors.success} />, color: colors.success }
          ].map((type) => (
            <Card key={type.key} style={[styles.balanceCard, { backgroundColor: colors.paper, borderTopColor: type.color, borderTopWidth: 4 }]}>
              <View style={styles.balanceIconBox}>
                  {type.icon}
              </View>
              <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>{type.label}</Text>
              
              <View style={styles.balanceBody}>
                {stats.currencies.map((curr: any) => {
                  const val = (balance[type.key] || 0) * (curr.exchange_rate_to_main || 1);
                  if (curr.is_main) {
                    return (
                      <Text key={curr.id} style={[styles.mainBalanceValue, { color: colors.ink }]}>
                        {formatCompactNumber(val)}
                        <Text style={[styles.mainBalanceCode, { color: colors.textSecondary }]}> {curr.code}</Text>
                      </Text>
                    );
                  }
                  return (
                    <Text key={curr.id} style={[styles.secondaryBalanceValue, { color: colors.textSecondary }]}>
                      {formatCompactNumber(val)} {curr.code}
                    </Text>
                  );
                })}
              </View>
            </Card>
          ))}
        </View>

        {/* --- PERFORMANCE HIGHLIGHTS --- */}
        <View style={[styles.performanceCard, { backgroundColor: colors.paper, borderColor: colors.border }]}>
          <View style={styles.perfColumn}>
            <View style={styles.perfHeader}>
               <View style={[styles.perfDot, { backgroundColor: colors.success }]} />
               <Text style={[styles.perfLabel, { color: colors.textSecondary }]}>TOP REVENUS 7J</Text>
            </View>
            {stats.weeklyTopIncome?.map((itm: any, i: number) => (
              <View key={i} style={styles.perfRow}>
                <Text style={[styles.perfName, { color: colors.ink }]} numberOfLines={1}>{itm.name}</Text>
                <Text style={[styles.perfValue, { color: colors.success }]}>+{formatCompactNumber(itm.total)}$</Text>
              </View>
            ))}
          </View>
          <View style={[styles.perfLineDivider, { backgroundColor: colors.border }]} />
          <View style={styles.perfColumn}>
            <View style={styles.perfHeader}>
               <View style={[styles.perfDot, { backgroundColor: colors.danger }]} />
               <Text style={[styles.perfLabel, { color: colors.textSecondary }]}>TOP DÉPENSES 7J</Text>
            </View>
            {stats.weeklyTopExpense?.map((itm: any, i: number) => (
              <View key={i} style={styles.perfRow}>
                <Text style={[styles.perfName, { color: colors.ink }]} numberOfLines={1}>{itm.name}</Text>
                <Text style={[styles.perfValue, { color: colors.danger }]}>-{formatCompactNumber(itm.total)}$</Text>
              </View>
            ))}
          </View>
        </View>

        {/* --- OBLIGATIONS --- */}
        <View style={styles.rowBetween}>
          <Card style={[styles.miniCard, { backgroundColor: colors.paper, borderColor: colors.border, borderBottomColor: colors.danger, borderBottomWidth: 3 }]}>
            <View style={[styles.miniIconBox, { backgroundColor: colors.danger + '10' }]}>
              <TrendingDown stroke={colors.danger} size={20} />
            </View>
            <Text style={[styles.miniLabel, { color: colors.textSecondary }]}>Dettes (Restant)</Text>
            <Text style={[styles.miniValue, { color: colors.danger }]}>
              -{formatCompactNumber(debt ?? 0)} $
            </Text>
            <View style={styles.indicatorItem}>
               <ShieldAlert stroke={colors.danger} size={11} />
               <Text style={[styles.indicatorText, { color: colors.danger }]}>Total dû</Text>
            </View>
          </Card>

          <Card style={[styles.miniCard, { backgroundColor: colors.paper, borderColor: colors.border, borderBottomColor: colors.success, borderBottomWidth: 3 }]}>
            <View style={[styles.miniIconBox, { backgroundColor: colors.success + '10' }]}>
              <HandCoins stroke={colors.success} size={20} />
            </View>
            <Text style={[styles.miniLabel, { color: colors.textSecondary }]}>Créances</Text>
            <Text style={[styles.miniValue, { color: colors.success }]}>+{formatCompactNumber(receivable ?? 0)} $</Text>
            <View style={styles.indicatorItem}>
               <TrendingUp stroke={colors.success} size={11} />
               <Text style={[styles.indicatorText, { color: colors.success }]}>À recevoir</Text>
            </View>
          </Card>
        </View>

        {/* --- CHAMPION SOURCE --- */}
        {topSource && (
          <TouchableOpacity style={[styles.topSourceCard, { backgroundColor: colors.paper, borderColor: colors.border }]} activeOpacity={0.9}>
            <View style={[styles.topSourceBadge, { backgroundColor: colors.warning }]}>
              <Crown stroke="#FFF" size={12} fill="#FFF" />
              <Text style={styles.topSourceBadgeText}>CHAMPION</Text>
            </View>
            <View style={styles.topSourceContent}>
              <View style={[styles.topSourceIcon, { backgroundColor: colors.accent + '10' }]}>
                 <Target stroke={colors.accent} size={28} />
              </View>
              <View style={styles.flex1}>
                <Text style={[styles.topSourceLabel, { color: colors.textSecondary }]}>Source la plus rentable</Text>
                <Text style={[styles.topSourceName, { color: colors.ink }]} numberOfLines={1}>{topSource.source_name ?? ''}</Text>
                {topSource.project_name && (
                  <View style={[styles.projectTag, { backgroundColor: colors.background }]}>
                    <Text style={[styles.projectTagText, { color: colors.accent }]}>{topSource.project_name}</Text>
                  </View>
                )}
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.topSourceValue, { color: colors.success }]}>+{formatCompactNumber(topSource.total_earned ?? 0)} $</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Recent Activity */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionHeading, { color: colors.ink }]}>Activité Récente</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
            <Text style={[styles.viewAllText, { color: colors.accent }]}>Voir tout</Text>
          </TouchableOpacity>
        </View>

        <Card style={[styles.activityCard, { backgroundColor: colors.paper, borderColor: colors.border }]}>
          {recentTransactions.map((tx: any, i: number) => (
            <TouchableOpacity 
              key={tx.id} 
              onPress={() => navigation.navigate('Transactions')}
              style={[styles.activityItem, { borderBottomColor: colors.border }, i === recentTransactions.length - 1 && { borderBottomWidth: 0 }]}
            >
              <View style={[styles.activityIcon, { backgroundColor: tx.type === 'income' ? (colors.success + '15') : (colors.danger + '15') }]}>
                {tx.type === 'income' ? 
                  <ArrowUpRight stroke={colors.success} size={24} /> : 
                  <ArrowDownLeft stroke={colors.danger} size={24} />
                }
              </View>
              <View style={styles.flex1}>
                <Text style={[styles.activityTitle, { color: colors.text }]} numberOfLines={1}>{tx.description ?? ''}</Text>
                <Text style={[styles.activityDate, { color: colors.textSecondary }]}>{tx.source_name ?? 'Autre'}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.activityAmount, { color: tx.type === 'income' ? colors.success : colors.text }]}>
                  {tx.type === 'income' ? '+' : '-'}{formatCompactNumber(tx.amount_original ?? 0)} {tx.currency_code}
                </Text>
                <ChevronRight stroke={colors.textSecondary + '40'} size={16} />
              </View>
            </TouchableOpacity>
          ))}
          {recentTransactions.length === 0 && (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Text style={{ color: colors.textSecondary }}>Aucune transaction récente</Text>
            </View>
          )}
        </Card>
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}