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

export default function ProjectDetailsScreen() {
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
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  const { stats, transactions, topCategory, topIncomeSource, subProjects } = data;
  const net = stats.total_income - stats.total_expense;

  return (
    <View style={styles.container}>
      <View style={styles.stickyHeader}>
        <View style={styles.rowBetween}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft stroke={Colors.ink} size={22} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{projectName}</Text>
          <View style={{ width: 44 }} />
        </View>
      </View>

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={
          <View style={styles.content}>
            <View style={styles.heroSection}>
              <Text style={styles.heroSub}>Balance Globale du Projet</Text>
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

            <View style={styles.insightsRow}>
              <View style={styles.insightBox}>
                <AlertTriangle size={16} stroke={Colors.warning} />
                <View>
                  <Text style={styles.insightValText}>{topCategory.toUpperCase()}</Text>
                  <Text style={styles.insightSubText}>Consommation Max</Text>
                </View>
              </View>
              <View style={styles.insightBox}>
                <Wallet size={16} stroke={Colors.accent} />
                <View>
                  <Text style={styles.insightValText}>{topIncomeSource}</Text>
                  <Text style={styles.insightSubText}>Source Alpha</Text>
                </View>
              </View>
            </View>

            {subProjects && subProjects.length > 0 && (
              <View style={styles.section}>
                <View style={[styles.rowBetween, { marginBottom: 15 }]}>
                  <View style={styles.row}>
                    <Layers size={18} stroke={Colors.ink} />
                    <Text style={styles.sectionTitle}>Sous-Objectifs</Text>
                  </View>
                  <Text style={styles.subCount}>{subProjects.length} projets</Text>
                </View>
                {subProjects.map((p: any) => {
                  const pNet = (p.total_income || 0) - (p.total_expense || 0);
                  const progress = p.estimated_cost ? Math.min(100, ((p.total_expense || 0) / p.estimated_cost) * 100) : 0;
                  return (
                    <TouchableOpacity 
                      key={p.id} 
                      onPress={() => navigation.push('ProjectDetails', { projectId: p.id, projectName: p.name })}
                    >
                      <Card style={styles.subProjectCard}>
                        <View style={styles.rowBetween}>
                          <View style={styles.flex1}>
                            <Text style={styles.subName}>{p.name}</Text>
                            <Text style={styles.subStatus}>{p.status.toUpperCase()}</Text>
                          </View>
                          <View style={styles.subNetBox}>
                            <Text style={[styles.subNetVal, { color: pNet >= 0 ? Colors.success : Colors.danger }]}>
                              {pNet >= 0 ? '+' : ''}{pNet.toFixed(0)} $
                            </Text>
                            <ExternalLink size={14} stroke={Colors.textSecondary} style={{ marginLeft: 6 }} />
                          </View>
                        </View>
                        <View style={styles.progBg}>
                          <View style={[styles.progFill, { width: `${progress}%`, backgroundColor: progress > 90 ? Colors.danger : Colors.accent }]} />
                        </View>
                      </Card>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <View style={styles.section}>
              <View style={styles.row}>
                <FileText size={18} stroke={Colors.ink} />
                <Text style={styles.sectionTitle}>Journal des Flux Directs</Text>
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
              <Text style={styles.itemName}>{item.source_name || 'Direct Input'}</Text>
              <Text style={styles.itemComment} numberOfLines={1}>{item.comment || 'Sans commentaire'}</Text>
            </View>
            <Text style={[styles.itemAmount, { color: item.type === 'income' ? Colors.success : Colors.danger }]}>
              {item.type === 'income' ? '+' : '-'}{item.amount_main_currency.toFixed(2)} $
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Aucun flux direct enregistré pour ce niveau.</Text>
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

  insightsRow: { flexDirection: 'row', gap: 12, marginBottom: 35 },
  insightBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F9FAFB', padding: 15, borderRadius: 20, borderWidth: 1, borderColor: '#F3F4F6' },
  insightValText: { fontSize: 13, fontWeight: '900', color: Colors.ink },
  insightSubText: { fontSize: 10, color: Colors.textSecondary, fontWeight: '700' },

  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: Colors.ink, marginLeft: 10 },
  subCount: { fontSize: 12, color: Colors.textSecondary, fontWeight: '700' },
  
  subProjectCard: { padding: 18, borderRadius: 24, marginBottom: 12, borderWidth: 1, borderColor: '#F3F4F6' },
  subName: { fontSize: 16, fontWeight: '800', color: Colors.ink },
  subStatus: { fontSize: 10, color: Colors.accent, fontWeight: '900', marginTop: 4 },
  subNetBox: { flexDirection: 'row', alignItems: 'center' },
  subNetVal: { fontSize: 16, fontWeight: '900' },
  
  progBg: { height: 6, backgroundColor: '#F3F4F6', borderRadius: 3, marginTop: 15 },
  progFill: { height: '100%', borderRadius: 3 },

  transactionItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 25, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  typeIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  flex1: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '800', color: Colors.ink },
  itemComment: { fontSize: 12, color: Colors.textSecondary, marginTop: 3 },
  itemAmount: { fontSize: 16, fontWeight: '900' },
  
  row: { flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: Colors.textSecondary, textAlign: 'center', fontWeight: '600' }
});
