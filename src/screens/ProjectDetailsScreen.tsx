import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, FlatList } from 'react-native';
import { Colors, Spacing } from '../utils/theme';
import { Card } from '../components/Card';
import { 
  ArrowLeft, 
  ArrowUpRight, 
  ArrowDownRight, 
  TrendingUp, 
  AlertTriangle,
  FileText,
  Wallet,
  Layers,
  ExternalLink
} from 'lucide-react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { FinancialEngine } from '../services/FinancialEngine';
import { useTheme } from '../context/ThemeContext';

export default function ProjectDetailsScreen() {
  const { colors, isDark } = useTheme();
  const route = useRoute();
  const navigation = useNavigation<any>();
  const { projectId, projectName } = route.params as any;
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    loadDetails();
  }, [projectId]);

  const loadDetails = async () => {
    setLoading(true);
    try {
      const details = await FinancialEngine.getProjectDetails(projectId);
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

  const { stats, transactions, topCategory, topIncomeSource, subProjects } = data;
  const net = stats.total_income - stats.total_expense;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.stickyHeader, { backgroundColor: colors.paper, borderBottomColor: colors.border }]}>
        <View style={styles.rowBetween}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: colors.background }]}>
            <ArrowLeft stroke={colors.ink} size={22} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.ink }]} numberOfLines={1}>{projectName}</Text>
          <View style={{ width: 44 }} />
        </View>
      </View>

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={
          <View style={styles.content}>
            <View style={styles.heroSection}>
              <Text style={[styles.heroSub, { color: colors.textSecondary }]}>Balance Globale du Projet</Text>
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

            <View style={styles.insightsRow}>
              <View style={[styles.insightBox, { backgroundColor: colors.paper, borderColor: colors.border }]}>
                <AlertTriangle size={16} stroke={colors.warning} />
                <View>
                  <Text style={[styles.insightValText, { color: colors.ink }]}>{topCategory.toUpperCase()}</Text>
                  <Text style={[styles.insightSubText, { color: colors.textSecondary }]}>Consommation Max</Text>
                </View>
              </View>
              <View style={[styles.insightBox, { backgroundColor: colors.paper, borderColor: colors.border }]}>
                <Wallet size={16} stroke={colors.accent} />
                <View>
                  <Text style={[styles.insightValText, { color: colors.ink }]}>{topIncomeSource}</Text>
                  <Text style={[styles.insightSubText, { color: colors.textSecondary }]}>Source Alpha</Text>
                </View>
              </View>
            </View>

            {subProjects && subProjects.length > 0 && (
              <View style={styles.section}>
                <View style={[styles.rowBetween, { marginBottom: 15 }]}>
                  <View style={styles.row}>
                    <Layers size={18} stroke={colors.ink} />
                    <Text style={[styles.sectionTitle, { color: colors.ink }]}>Sous-Objectifs</Text>
                  </View>
                  <Text style={[styles.subCount, { color: colors.textSecondary }]}>{subProjects.length} projets</Text>
                </View>
                {subProjects.map((p: any) => {
                  const pNet = (p.total_income || 0) - (p.total_expense || 0);
                  const progress = p.estimated_cost ? Math.min(100, ((p.total_expense || 0) / p.estimated_cost) * 100) : 0;
                  return (
                    <TouchableOpacity 
                      key={p.id} 
                      onPress={() => navigation.push('ProjectDetails', { projectId: p.id, projectName: p.name })}
                    >
                      <Card style={[styles.subProjectCard, { borderColor: colors.border }]}>
                        <View style={styles.rowBetween}>
                          <View style={styles.flex1}>
                            <Text style={[styles.subName, { color: colors.ink }]}>{p.name}</Text>
                            <Text style={[styles.subStatus, { color: colors.accent }]}>{p.status.toUpperCase()}</Text>
                          </View>
                          <View style={styles.subNetBox}>
                            <Text style={[styles.subNetVal, { color: pNet >= 0 ? colors.success : colors.danger }]}>
                              {pNet >= 0 ? '+' : ''}{pNet.toFixed(0)} $
                            </Text>
                            <ExternalLink size={14} stroke={colors.textSecondary} style={{ marginLeft: 6 }} />
                          </View>
                        </View>
                        <View style={[styles.progBg, { backgroundColor: colors.background }]}>
                          <View style={[styles.progFill, { width: `${progress}%`, backgroundColor: progress > 90 ? colors.danger : colors.accent }]} />
                        </View>
                      </Card>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <View style={styles.section}>
              <View style={styles.row}>
                <FileText size={18} stroke={colors.ink} />
                <Text style={[styles.sectionTitle, { color: colors.ink }]}>Journal des Flux Directs</Text>
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
              <Text style={[styles.itemName, { color: colors.ink }]}>{item.source_name || 'Direct Input'}</Text>
              <Text style={[styles.itemComment, { color: colors.textSecondary }]} numberOfLines={1}>{item.comment || 'Sans commentaire'}</Text>
            </View>
            <Text style={[styles.itemAmount, { color: item.type === 'income' ? colors.success : colors.danger }]}>
              {item.type === 'income' ? '+' : '-'}{item.amount_main_currency.toFixed(2)} $
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Aucun flux direct enregistré pour ce niveau.</Text>
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

  insightsRow: { flexDirection: 'row', gap: 12, marginBottom: 35 },
  insightBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 15, borderRadius: 20, borderWidth: 1 },
  insightValText: { fontSize: 13, fontWeight: '900' },
  insightSubText: { fontSize: 10, fontWeight: '700' },

  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 18, fontWeight: '900', marginLeft: 10 },
  subCount: { fontSize: 12, fontWeight: '700' },
  
  subProjectCard: { padding: 18, borderRadius: 24, marginBottom: 12, borderWidth: 1 },
  subName: { fontSize: 16, fontWeight: '800' },
  subStatus: { fontSize: 10, fontWeight: '900', marginTop: 4 },
  subNetBox: { flexDirection: 'row', alignItems: 'center' },
  subNetVal: { fontSize: 16, fontWeight: '900' },
  
  progBg: { height: 6, borderRadius: 3, marginTop: 15 },
  progFill: { height: '100%', borderRadius: 3 },

  transactionItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 25, paddingVertical: 18, borderBottomWidth: 1 },
  typeIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  flex1: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '800' },
  itemComment: { fontSize: 12, marginTop: 3 },
  itemAmount: { fontSize: 16, fontWeight: '900' },
  
  row: { flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { textAlign: 'center', fontWeight: '600' }
});
