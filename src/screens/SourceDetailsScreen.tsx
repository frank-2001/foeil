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

export default function SourceDetailsScreen() {
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
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  const { stats, transactions, distribution } = data;
  const net = stats.total_income - stats.total_expense;

  return (
    <View style={styles.container}>
      <View style={styles.stickyHeader}>
        <View style={styles.rowBetween}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft stroke={Colors.ink} size={22} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{sourceName}</Text>
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
                  style={[styles.periodChip, period === item.id && styles.activePeriodChip]}
                >
                  <Text style={[styles.periodText, period === item.id && styles.activePeriodText]}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.heroSection}>
              <Text style={styles.heroSub}>Total des Flux ({period === 'all' ? 'Historique' : period === 'month' ? '30 jours' : period === 'week' ? '7 jours' : '24h'})</Text>
              <Text style={[styles.heroVal, { color: net >= 0 ? Colors.success : Colors.danger }]}>
                {net >= 0 ? '+' : ''}{net.toLocaleString()} $
              </Text>
              <View style={styles.heroStatsRow}>
                <View style={[styles.miniStatBox, { backgroundColor: Colors.success + '15' }]}>
                  <Text style={[styles.miniStatVal, { color: Colors.success }]}>+{stats.total_income?.toFixed(0)}$</Text>
                  <Text style={styles.miniStatLabel}>Entrées</Text>
                </View>
                <View style={[styles.miniStatBox, { backgroundColor: Colors.danger + '15' }]}>
                  <Text style={[styles.miniStatVal, { color: Colors.danger }]}>-{stats.total_expense?.toFixed(0)}$</Text>
                  <Text style={styles.miniStatLabel}>Sorties</Text>
                </View>
              </View>
            </View>

            {distribution && distribution.length > 0 && (
              <View style={styles.section}>
                <View style={styles.row}>
                  <Layers size={18} stroke={Colors.ink} />
                  <Text style={styles.sectionTitle}>Impact Budgétaire dans la période</Text>
                </View>
                <Card style={styles.distCard}>
                   {['essential', 'personal', 'investment'].map((cat) => {
                     const totalExp = stats.total_expense || 1;
                     const amt = distribution.find((d: any) => d.category === cat)?.total || 0;
                     const pct = (amt / totalExp) * 100;
                     if (amt === 0) return null;
                     return (
                       <View key={cat} style={styles.distRow}>
                         <View style={styles.rowBetween}>
                           <Text style={styles.catLabel}>{cat.toUpperCase()}</Text>
                           <Text style={styles.catAmt}>{amt.toLocaleString()} $</Text>
                         </View>
                         <View style={styles.progBg}>
                            <View style={[styles.progFill, { width: `${pct}%`, backgroundColor: cat === 'essential' ? Colors.accent : (cat === 'personal' ? Colors.warning : Colors.success) }]} />
                         </View>
                       </View>
                     );
                   })}
                </Card>
              </View>
            )}

            <View style={styles.section}>
              <View style={styles.row}>
                <FileText size={18} stroke={Colors.ink} />
                <Text style={styles.sectionTitle}>Historique des Flux</Text>
              </View>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.transactionItem}>
            <View style={[styles.typeIcon, { backgroundColor: item.type === 'income' ? Colors.success + '10' : Colors.danger + '10' }]}>
              {item.type === 'income' ? <ArrowUpRight size={18} stroke={Colors.success} /> : <ArrowDownRight size={18} stroke={Colors.danger} />}
            </View>
            <View style={styles.flex1}>
              <View style={styles.rowBetween}>
                <Text style={styles.itemName}>{item.project_name ? `Projet: ${item.project_name}` : 'Flux Libre'}</Text>
                <Text style={styles.itemDate}>{new Date(item.transaction_date).toLocaleDateString()}</Text>
              </View>
              <Text style={styles.itemComment} numberOfLines={1}>{item.comment || 'Sans commentaire'}</Text>
            </View>
            <Text style={[styles.itemAmount, { color: item.type === 'income' ? Colors.success : Colors.danger }]}>
              {item.type === 'income' ? '+' : '-'}{item.amount_main_currency.toFixed(2)} $
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Aucun flux direct enregistré pour cette source.</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  stickyHeader: { padding: 20, paddingTop: 60, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  backBtn: { width: 44, height: 44, backgroundColor: '#F3F4F6', borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: Colors.ink, flex: 1, textAlign: 'center', marginHorizontal: 10 },
  content: { padding: 20 },
  
  heroSection: { alignItems: 'center', marginBottom: 30 },
  heroSub: { fontSize: 13, color: Colors.textSecondary, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  heroVal: { fontSize: 44, fontWeight: '900', color: Colors.ink, marginVertical: 10 },
  heroStatsRow: { flexDirection: 'row', gap: 15, marginTop: 10 },
  miniStatBox: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 16, alignItems: 'center' },
  miniStatVal: { fontSize: 16, fontWeight: '900' },
  miniStatLabel: { fontSize: 10, color: Colors.textSecondary, fontWeight: '700', textTransform: 'uppercase' },

  periodRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  periodChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#F3F4F6' },
  activePeriodChip: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  periodText: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  activePeriodText: { color: '#FFF' },

  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: Colors.ink, marginLeft: 10 },
  distCard: { padding: 20, borderRadius: 24, marginTop: 15, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#F3F4F6' },
  distRow: { marginBottom: 15 },
  catLabel: { fontSize: 11, fontWeight: '800', color: Colors.ink },
  catAmt: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  progBg: { height: 6, backgroundColor: '#F3F4F6', borderRadius: 3, marginTop: 10 },
  progFill: { height: '100%', borderRadius: 3 },

  transactionItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 25, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  typeIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  flex1: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '800', color: Colors.ink },
  itemDate: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  itemComment: { fontSize: 12, color: Colors.textSecondary, marginTop: 3 },
  itemAmount: { fontSize: 16, fontWeight: '900' },
  
  row: { flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: Colors.textSecondary, textAlign: 'center', fontWeight: '600' }
});
