import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Dimensions } from 'react-native';
import { Colors, Spacing } from '../utils/theme';
import { Card } from '../components/Card';
import { 
  TrendingUp, 
  TrendingDown, 
  Briefcase, 
  PieChart as ChartIcon, 
  ArrowUpRight,
  ArrowDownRight,
  Target,
  ShieldAlert
} from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { FinancialEngine } from '../services/FinancialEngine';

const ScreenHeader = ({ title, subtitle }: { title: string, subtitle: string }) => (
  <View style={styles.headerContainer}>
    <Text style={styles.headerSubtitle}>{subtitle}</Text>
    <Text style={styles.headerTitle}>{title}</Text>
  </View>
);

export default function StatsScreen() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'insights' | 'sources' | 'projects'>('insights');
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'all'>('month');

  const loadStats = async (p: 'day' | 'week' | 'month' | 'all' = period) => {
    try {
      const [global, deep] = await Promise.all([
        FinancialEngine.getGlobalStats(p),
        FinancialEngine.getDeepInsights(p)
      ]);
      setStats({ ...global, ...deep });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { loadStats(); }, [period]));

  const changePeriod = (p: any) => {
    setPeriod(p);
  };

  if (loading || !stats) {
    return <View style={styles.center}><ActivityIndicator color={Colors.accent} size="large" /></View>;
  }

  const renderInsights = () => {
    const months = stats.survivalMonths || 0;
    const debt = stats.obligations?.total_debt || 0;
    const rec = stats.obligations?.total_receivable || 0;
    const net = stats.totalLiquid - debt + rec;

    return (
      <View>
        <Text style={styles.sectionTitle}>Analyse Stratégique</Text>
        
        <Card style={styles.insightCard}>
          <View style={styles.row}>
            <View style={[styles.iconBox, { backgroundColor: Colors.success + '15' }]}>
              <Target size={22} stroke={Colors.success} />
            </View>
            <View style={styles.flex1}>
              <Text style={styles.insightValue}>{months.toFixed(1)} Mois</Text>
              <Text style={styles.insightLabel}>Autonomie Financière (Buffer)</Text>
            </View>
          </View>
          <Text style={styles.interpretation}>
            {months > 6 ? "Position Solide: Vous pouvez maintenir votre niveau de vie actuel pendant plus de 6 mois sans revenus." 
              : (months > 2 ? "Position Stable: Votre réserve couvre vos besoins immédiats mais reste fragile."
              : "Alerte: Votre buffer est trop faible. Augmentez votre épargne de précaution.")
            }
          </Text>
        </Card>

        <Card style={styles.insightCard}>
          <View style={styles.row}>
            <View style={[styles.iconBox, { backgroundColor: Colors.accent + '15' }]}>
              <TrendingUp size={22} stroke={Colors.accent} />
            </View>
            <View style={styles.flex1}>
              <Text style={styles.insightValue}>{net.toFixed(0)} $</Text>
              <Text style={styles.insightLabel}>Patrimoine Net Estimé (Cash + Oblig.)</Text>
            </View>
          </View>
          <Text style={styles.interpretation}>
            Ratio Dettes/Créances: {((debt/(rec||1))*100).toFixed(0)}%. 
            {debt > rec ? " Votre niveau d'endettement est supérieur à vos créances. Priorisez le remboursement." : " Vos actifs (créances) couvrent vos dettes. C'est un indicateur de bonne santé."}
          </Text>
        </Card>

        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Réalité vs Objectif (Dépenses)</Text>
        <Card style={styles.statCard}>
          {['essential', 'personal', 'investment'].map((cat) => {
            const actual = stats.distribution?.find((d: any) => d.category === cat)?.total || 0;
            const totalExp = stats.distribution?.reduce((sum: number, d: any) => sum + d.total, 0) || 1;
            const pctActual = (actual / totalExp) * 100;
            const target = cat === 'investment' ? 40 : 30;
            const drift = pctActual - target;

            return (
              <View key={cat} style={{ marginBottom: 15 }}>
                <View style={styles.rowBetween}>
                  <Text style={styles.catName}>{cat.toUpperCase()}</Text>
                  <Text style={styles.pctText}>{pctActual.toFixed(1)}% <Text style={{fontSize: 10, color: Colors.textSecondary}}>(Cible: {target}%)</Text></Text>
                </View>
                <View style={styles.progressBg}>
                  <View style={[styles.progressFill, { width: `${pctActual}%`, backgroundColor: Math.abs(drift) > 10 ? Colors.danger : Colors.accent }]} />
                </View>
                {Math.abs(drift) > 5 && (
                  <Text style={[styles.driftText, { color: drift > 0 ? Colors.danger : Colors.success }]}>
                    {drift > 0 ? `Surconsommation de ${drift.toFixed(1)}%` : `Sous-budget de ${Math.abs(drift).toFixed(1)}%`}
                  </Text>
                )}
              </View>
            );
          })}
        </Card>
      </View>
    );
  };

  const renderSources = () => (
    <View>
      <Text style={styles.sectionTitle}>Sources de Revenus (Top 5)</Text>
      {stats.topIncome.map((item: any, i: number) => (
        <Card key={i} style={styles.statCard}>
          <View style={styles.rowBetween}>
            <View style={styles.row}>
              <View style={[styles.iconBox, { backgroundColor: '#def7ec' }]}>
                <ArrowUpRight stroke="#0e9f6e" size={20} />
              </View>
              <Text style={styles.sourceName}>{item.name}</Text>
            </View>
            <Text style={[styles.amount, { color: '#0e9f6e' }]}>+{item.total?.toFixed(0)} $</Text>
          </View>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${Math.min(100, (item.total / (stats.topIncome[0]?.total || 1)) * 100)}%`, backgroundColor: '#0e9f6e' }]} />
          </View>
        </Card>
      ))}

      <Text style={[styles.sectionTitle, { marginTop: 30 }]}>Sources de Dépenses (Top 5)</Text>
      {stats.topExpense.map((item: any, i: number) => (
        <Card key={i} style={styles.statCard}>
          <View style={styles.rowBetween}>
            <View style={styles.row}>
              <View style={[styles.iconBox, { backgroundColor: '#fde8e8' }]}>
                <ArrowDownRight stroke="#c81e1e" size={20} />
              </View>
              <Text style={styles.sourceName}>{item.name}</Text>
            </View>
            <Text style={[styles.amount, { color: '#c81e1e' }]}>-{item.total?.toFixed(0)} $</Text>
          </View>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${Math.min(100, (item.total / (stats.topExpense[0]?.total || 1)) * 100)}%`, backgroundColor: '#c81e1e' }]} />
          </View>
        </Card>
      ))}
    </View>
  );

  const renderProjects = () => (
    <View>
      <Text style={styles.sectionTitle}>Analyse par Projet</Text>
      {stats.projectPerformance.map((p: any, i: number) => {
        const consumed = p.current_spend || 0;
        const budget = p.estimated_cost || 1;
        const progress = Math.min(100, (consumed / budget) * 100);
        return (
          <Card key={i} style={styles.projectCard}>
            <View style={styles.rowBetween}>
              <Text style={styles.projectName}>{p.name}</Text>
              <Text style={styles.projectBudget}>{consumed.toFixed(0)} / {budget.toFixed(0)} $</Text>
            </View>
            <View style={styles.progressBgLarge}>
              <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: progress > 90 ? Colors.danger : (progress > 70 ? Colors.warning : Colors.accent) }]} />
            </View>
            <View style={styles.rowBetween}>
              <Text style={styles.miniLabel}>Consommé</Text>
              <Text style={styles.miniLabel}>{progress.toFixed(1)}%</Text>
            </View>
            {p.current_income > 0 && (
              <View style={[styles.roiBox, {marginTop: 10}]}>
                <TrendingUp size={14} stroke={Colors.accent} />
                <Text style={styles.roiText}>Revenus générés: {p.current_income?.toFixed(0)} $</Text>
              </View>
            )}
          </Card>
        );
      })}
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title="Analytics" subtitle="Performances Financières" />

        <View style={styles.periodRow}>
          {[
            { id: 'day', label: '24h' },
            { id: 'week', label: '7j' },
            { id: 'month', label: '30j' },
            { id: 'all', label: 'Tout' }
          ].map((item) => (
            <TouchableOpacity 
              key={item.id} 
              onPress={() => changePeriod(item.id as any)}
              style={[styles.periodChip, period === item.id && styles.activePeriodChip]}
            >
              <Text style={[styles.periodText, period === item.id && styles.activePeriodText]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.tabRow}>
          <TouchableOpacity 
            onPress={() => setActiveTab('insights')}
            style={[styles.tab, activeTab === 'insights' && styles.activeTab]}
          >
            <ShieldAlert size={18} stroke={activeTab === 'insights' ? '#FFF' : Colors.textSecondary} />
            <Text style={[styles.tabText, activeTab === 'insights' && styles.activeTabText]}>Aperçu</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setActiveTab('sources')}
            style={[styles.tab, activeTab === 'sources' && styles.activeTab]}
          >
            <ChartIcon size={18} stroke={activeTab === 'sources' ? '#FFF' : Colors.textSecondary} />
            <Text style={[styles.tabText, activeTab === 'sources' && styles.activeTabText]}>Sources</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setActiveTab('projects')}
            style={[styles.tab, activeTab === 'projects' && styles.activeTab]}
          >
            <Briefcase size={18} stroke={activeTab === 'projects' ? '#FFF' : Colors.textSecondary} />
            <Text style={[styles.tabText, activeTab === 'projects' && styles.activeTabText]}>Projets</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'insights' ? renderInsights() : (activeTab === 'sources' ? renderSources() : renderProjects())}
        
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: Spacing.lg, paddingBottom: 60 },
  headerContainer: { marginBottom: 30 },
  headerSubtitle: { color: Colors.accent, fontWeight: '700', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 },
  headerTitle: { fontSize: 32, fontWeight: '800', color: Colors.ink },
  
  periodRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  periodChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB' },
  activePeriodChip: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  periodText: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  activePeriodText: { color: '#FFF' },

  tabRow: { flexDirection: 'row', gap: 12, marginBottom: 25 },
  tab: { flex: 1, height: 45, backgroundColor: '#FFF', borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  activeTab: { backgroundColor: Colors.ink, borderColor: Colors.ink },
  tabText: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  activeTabText: { color: '#FFF' },

  sectionTitle: { fontSize: 18, fontWeight: '800', color: Colors.ink, marginBottom: 15 },
  statCard: { padding: 15, borderRadius: 18, marginBottom: 10 },
  projectCard: { padding: 18, borderRadius: 22, marginBottom: 15 },
  insightCard: { padding: 18, borderRadius: 22, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  flex1: { flex: 1 },
  sourceName: { fontSize: 15, fontWeight: '700', color: Colors.ink },
  amount: { fontSize: 16, fontWeight: '800' },
  
  insightValue: { fontSize: 22, fontWeight: '900', color: Colors.ink },
  insightLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  interpretation: { fontSize: 12, color: Colors.textSecondary, marginTop: 12, lineHeight: 18, fontStyle: 'italic' },
  
  catName: { fontSize: 13, fontWeight: '800', color: Colors.ink },
  pctText: { fontSize: 14, fontWeight: '900', color: Colors.accent },
  driftText: { fontSize: 11, fontWeight: '700', marginTop: 6 },
  
  progressBg: { height: 4, backgroundColor: '#f3f4f6', borderRadius: 2, marginTop: 12 },
  progressBgLarge: { height: 8, backgroundColor: '#f3f4f6', borderRadius: 4, marginVertical: 10 },
  progressFill: { height: '100%', borderRadius: 4 },

  projectName: { fontSize: 16, fontWeight: '800', color: Colors.ink },
  projectBudget: { fontSize: 13, color: Colors.textSecondary, fontWeight: '700' },
  miniLabel: { fontSize: 10, color: Colors.textSecondary, fontWeight: '800', textTransform: 'uppercase' },
  roiBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.accent + '10', padding: 8, borderRadius: 8 },
  roiText: { fontSize: 11, fontWeight: '700', color: Colors.accent }
});
