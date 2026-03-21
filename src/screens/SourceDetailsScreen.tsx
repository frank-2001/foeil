import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, FlatList } from 'react-native';
import { Colors, Spacing } from '../utils/theme';
import { Card } from '../components/Card';
import { 
  ArrowLeft, 
  ArrowUpRight, 
  ArrowDownRight, 
  TrendingUp, 
  Briefcase,
  Layers,
  FileText
} from 'lucide-react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { FinancialEngine } from '../services/FinancialEngine';
import { useTheme } from '../context/ThemeContext';

export default function SourceDetailsScreen() {
  const { colors, isDark } = useTheme();
  const route = useRoute();
  const navigation = useNavigation<any>();
  const { sourceId, sourceName } = route.params as any;
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'all'>('month');

  useEffect(() => {
    loadDetails();
  }, [sourceId, period]);

  const loadDetails = async () => {
    setLoading(true);
    try {
      const details = await FinancialEngine.getSourceDetails(sourceId, period);
      setData(details);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  const { stats, transactions, distribution } = data;
  const net = stats.total_income - stats.total_expense;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.stickyHeader, { backgroundColor: colors.paper, borderBottomColor: colors.border }]}>
        <View style={styles.rowBetween}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: colors.background }]}>
            <ArrowLeft stroke={colors.ink} size={22} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.ink }]} numberOfLines={1}>{sourceName}</Text>
          <View style={{ width: 44 }} />
        </View>
      </View>

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={
          <View style={styles.content}>
            <View style={styles.periodRow}>
              {[
                { id: 'day', label: '24h' },
                { id: 'week', label: '7j' },
                { id: 'month', label: '30j' },
                { id: 'all', label: 'Tout' }
              ].map((item) => (
                <TouchableOpacity 
                  key={item.id} 
                  onPress={() => setPeriod(item.id as any)}
                  style={[styles.periodChip, { backgroundColor: colors.paper, borderColor: colors.border }, period === item.id && { backgroundColor: colors.accent, borderColor: colors.accent }]}
                >
                  <Text style={[styles.periodText, { color: colors.textSecondary }, period === item.id && { color: '#FFF' }]}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.heroSection}>
              <Text style={[styles.heroSub, { color: colors.textSecondary }]}>Total des Flux ({period === 'all' ? 'Historique' : period === 'month' ? '30 jours' : period === 'week' ? '7 jours' : '24h'})</Text>
              <Text style={[styles.heroVal, { color: net >= 0 ? colors.success : colors.danger }]}>
                {net >= 0 ? '+' : ''}{net.toLocaleString()} $
              </Text>
              <View style={styles.heroStatsRow}>
                <View style={[styles.miniStatBox, { backgroundColor: colors.success + '15' }]}>
                  <Text style={[styles.miniStatVal, { color: colors.success }]}>+{stats.total_income?.toFixed(0)}$</Text>
                  <Text style={[styles.miniStatLabel, { color: colors.textSecondary }]}>Entrées</Text>
                </View>
                <View style={[styles.miniStatBox, { backgroundColor: colors.danger + '15' }]}>
                  <Text style={[styles.miniStatVal, { color: colors.danger }]}>-{stats.total_expense?.toFixed(0)}$</Text>
                  <Text style={[styles.miniStatLabel, { color: colors.textSecondary }]}>Sorties</Text>
                </View>
              </View>
            </View>

            {distribution && distribution.length > 0 && (
              <View style={styles.section}>
                <View style={styles.row}>
                  <Layers size={18} stroke={colors.ink} />
                  <Text style={[styles.sectionTitle, { color: colors.ink }]}>Impact Budgétaire dans la période</Text>
                </View>
                <Card style={[styles.distCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                   {['essential', 'personal', 'investment'].map((cat) => {
                     const totalExp = stats.total_expense || 1;
                     const amt = distribution.find((d: any) => d.category === cat)?.total || 0;
                     const pct = (amt / totalExp) * 100;
                     if (amt === 0) return null;
                     return (
                       <View key={cat} style={styles.distRow}>
                         <View style={styles.rowBetween}>
                           <Text style={[styles.catLabel, { color: colors.ink }]}>{cat.toUpperCase()}</Text>
                           <Text style={[styles.catAmt, { color: colors.textSecondary }]}>{amt.toLocaleString()} $</Text>
                         </View>
                         <View style={[styles.progBg, { backgroundColor: colors.paper }]}>
                            <View style={[styles.progFill, { width: `${pct}%`, backgroundColor: cat === 'essential' ? colors.accent : (cat === 'personal' ? colors.warning : colors.success) }]} />
                         </View>
                       </View>
                     );
                   })}
                </Card>
              </View>
            )}

            <View style={styles.section}>
              <View style={styles.row}>
                <FileText size={18} stroke={colors.ink} />
                <Text style={[styles.sectionTitle, { color: colors.ink }]}>Historique des Flux</Text>
              </View>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.transactionItem, { borderBottomColor: colors.border }]}>
            <View style={[styles.typeIcon, { backgroundColor: item.type === 'income' ? colors.success + '10' : colors.danger + '10' }]}>
              {item.type === 'income' ? <ArrowUpRight size={18} stroke={colors.success} /> : <ArrowDownRight size={18} stroke={colors.danger} />}
            </View>
            <View style={styles.flex1}>
              <View style={styles.rowBetween}>
                <Text style={[styles.itemName, { color: colors.ink }]}>{item.project_name ? `Projet: ${item.project_name}` : 'Flux Libre'}</Text>
                <Text style={[styles.itemDate, { color: colors.textSecondary }]}>{new Date(item.transaction_date).toLocaleDateString()}</Text>
              </View>
              <Text style={[styles.itemComment, { color: colors.textSecondary }]} numberOfLines={1}>{item.comment || 'Sans commentaire'}</Text>
            </View>
            <Text style={[styles.itemAmount, { color: item.type === 'income' ? colors.success : colors.danger }]}>
              {item.type === 'income' ? '+' : '-'}{item.amount_main_currency.toFixed(2)} $
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Aucun flux direct enregistré pour cette source.</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  stickyHeader: { padding: 20, paddingTop: 60, borderBottomWidth: 1 },
  backBtn: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900', flex: 1, textAlign: 'center', marginHorizontal: 10 },
  content: { padding: 20 },
  
  heroSection: { alignItems: 'center', marginBottom: 30 },
  heroSub: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  heroVal: { fontSize: 44, fontWeight: '900', marginVertical: 10 },
  heroStatsRow: { flexDirection: 'row', gap: 15, marginTop: 10 },
  miniStatBox: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 16, alignItems: 'center' },
  miniStatVal: { fontSize: 16, fontWeight: '900' },
  miniStatLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },

  periodRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  periodChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  periodText: { fontSize: 13, fontWeight: '700' },

  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 18, fontWeight: '900', marginLeft: 10 },
  distCard: { padding: 20, borderRadius: 24, marginTop: 15, borderWidth: 1 },
  distRow: { marginBottom: 15 },
  catLabel: { fontSize: 11, fontWeight: '800' },
  catAmt: { fontSize: 13, fontWeight: '700' },
  progBg: { height: 6, borderRadius: 3, marginTop: 10 },
  progFill: { height: '100%', borderRadius: 3 },

  transactionItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 25, paddingVertical: 18, borderBottomWidth: 1 },
  typeIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  flex1: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '800' },
  itemDate: { fontSize: 12, fontWeight: '600' },
  itemComment: { fontSize: 12, marginTop: 3 },
  itemAmount: { fontSize: 16, fontWeight: '900' },
  
  row: { flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { textAlign: 'center', fontWeight: '600' }
});
