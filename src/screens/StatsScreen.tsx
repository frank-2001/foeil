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
import { useTheme } from '../context/ThemeContext';

const ScreenHeader = ({ title, subtitle, colors }: { title: string, subtitle: string, colors: any }) => (
  <View style={styles.headerContainer}>
    <Text style={[styles.headerSubtitle, { color: colors.accent }]}>{subtitle}</Text>
    <Text style={[styles.headerTitle, { color: colors.ink }]}>{title}</Text>
  </View>
);

export default function StatsScreen() {
  const { colors, isDark } = useTheme();
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
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  const renderInsights = () => {
    const months = stats.survivalMonths || 0;
    const debt = stats.obligations?.total_debt || 0;
    const rec = stats.obligations?.total_receivable || 0;
    const totalLiquid = stats.totalLiquid || 0;
    const net = totalLiquid - debt + rec;
    
    // Calculate period income vs expense
    const totalIncome = stats.topIncome?.reduce((sum: number, item: any) => sum + (item.total || 0), 0) || 0;
    const totalExpense = stats.topExpense?.reduce((sum: number, item: any) => sum + (item.total || 0), 0) || 0;
    const savingRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome * 100) : 0;

    return (
      <View>
        <Text style={[styles.sectionTitle, { color: colors.ink }]}>Rapport de Performance</Text>
        
        {/* --- KPI GRID --- */}
        <View style={styles.kpiRow}>
          <Card style={[styles.kpiCard, { backgroundColor: colors.paper }]}>
            <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>REVENUS ({period})</Text>
            <Text style={[styles.kpiValue, { color: colors.success }]}>+{totalIncome.toFixed(0)} $</Text>
          </Card>
          <Card style={[styles.kpiCard, { backgroundColor: colors.paper }]}>
            <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>DÉPENSES ({period})</Text>
            <Text style={[styles.kpiValue, { color: colors.danger }]}>-{totalExpense.toFixed(0)} $</Text>
          </Card>
        </View>

        <Card style={styles.insightCard}>
          <View style={styles.row}>
            <View style={[styles.iconBox, { backgroundColor: colors.accent + '15' }]}>
              <ChartIcon size={22} stroke={colors.accent} />
            </View>
            <View style={styles.flex1}>
              <Text style={[styles.insightValue, { color: colors.ink }]}>{savingRate.toFixed(1)}%</Text>
              <Text style={[styles.insightLabel, { color: colors.textSecondary }]}>Capacité d'Épargne Réelle</Text>
            </View>
          </View>
          <Text style={[styles.interpretation, { color: colors.textSecondary }]}>
            {savingRate > 40 ? "Excellent: Vous épargnez une part massive de vos revenus. Votre croissance sera rapide."
              : (savingRate > 15 ? "Sain: Vous respectez une discipline d'épargne robuste."
              : "Attention: Votre capital ne se renouvelle pas assez vite. Réduisez vos charges fixes.")
            }
          </Text>
        </Card>

        <View style={styles.kpiRow}>
          <Card style={[styles.kpiCard, { backgroundColor: colors.paper }]}>
            <View style={styles.rowSmall}>
               <TrendingDown size={14} stroke={colors.danger} />
               <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>DETTES</Text>
            </View>
            <Text style={[styles.kpiValue, { color: colors.ink }]}>{debt.toFixed(0)} $</Text>
          </Card>
          <Card style={[styles.kpiCard, { backgroundColor: colors.paper }]}>
            <View style={styles.rowSmall}>
               <TrendingUp size={14} stroke={colors.success} />
               <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>CRÉANCES</Text>
            </View>
            <Text style={[styles.kpiValue, { color: colors.ink }]}>{rec.toFixed(0)} $</Text>
          </Card>
        </View>

        <Card style={styles.insightCard}>
          <View style={styles.row}>
            <View style={[styles.iconBox, { backgroundColor: colors.success + '15' }]}>
              <Target size={22} stroke={colors.success} />
            </View>
            <View style={styles.flex1}>
              <Text style={[styles.insightValue, { color: colors.ink }]}>{months.toFixed(1)} Mois</Text>
              <Text style={[styles.insightLabel, { color: colors.textSecondary }]}>Indice de Survie (Buffer)</Text>
            </View>
          </View>
          <Text style={[styles.interpretation, { color: colors.textSecondary }]}>
            Basé sur votre moyenne de dépenses mensuelles (${(stats.monthlyBurn || 0).toFixed(0)}/mois), votre réserve actuelle de ${totalLiquid.toFixed(0)}$ vous couvre pendant {months.toFixed(1)} mois.
          </Text>
        </Card>

        <Card style={styles.insightCard}>
          <View style={styles.row}>
            <View style={[styles.iconBox, { backgroundColor: colors.ink + '10' }]}>
              <Briefcase size={22} stroke={colors.ink} />
            </View>
            <View style={styles.flex1}>
              <Text style={[styles.insightValue, { color: colors.ink }]}>{net.toFixed(0)} $</Text>
              <Text style={[styles.insightLabel, { color: colors.textSecondary }]}>Patrimoine Cash Net</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: net > 0 ? colors.success + '20' : colors.danger + '20' }]}>
             <Text style={[styles.statusBadgeText, { color: net > 0 ? colors.success : colors.danger }]}>
                {net >= totalLiquid ? "ACTIF NET POSITIF" : "CAPITAL SOUS PRESSION"}
             </Text>
          </View>
        </Card>

        <Text style={[styles.sectionTitle, { marginTop: 25, color: colors.ink }]}>Respect des Piliers (Dépenses)</Text>
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
                  <Text style={[styles.catName, { color: colors.ink }]}>
                    {cat === 'essential' ? 'Essentiel (30%)' : (cat === 'personal' ? 'Plaisir (30%)' : 'Épargne (40%)')}
                  </Text>
                  <Text style={[styles.pctText, { color: Math.abs(drift) > 10 ? colors.danger : colors.ink }]}>
                    {pctActual.toFixed(1)}%
                  </Text>
                </View>
                <View style={[styles.progressBg, { backgroundColor: colors.background }]}>
                  <View style={[styles.progressFill, { width: `${Math.min(100, pctActual)}%`, backgroundColor: Math.abs(drift) > 10 ? colors.danger : (cat === 'investment' ? colors.success : colors.accent) }]} />
                </View>
                {Math.abs(drift) > 2 && (
                  <Text style={[styles.driftText, { color: drift > 10 ? colors.danger : (drift < -10 ? colors.warning : colors.textSecondary) }]}>
                    {drift > 0 ? `+${drift.toFixed(1)}% au-dessus de la cible` : `${drift.toFixed(1)}% en dessous de la cible`}
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
      <Text style={[styles.sectionTitle, { color: colors.ink }]}>Sources de Revenus (Top 5)</Text>
      {stats.topIncome.map((item: any, i: number) => (
        <Card key={i} style={styles.statCard}>
          <View style={styles.rowBetween}>
            <View style={styles.row}>
              <View style={[styles.iconBox, { backgroundColor: colors.success + '15' }]}>
                <ArrowUpRight stroke={colors.success} size={20} />
              </View>
              <Text style={[styles.sourceName, { color: colors.ink }]}>{item.name}</Text>
            </View>
            <Text style={[styles.amount, { color: colors.success }]}>+{item.total?.toFixed(0)} $</Text>
          </View>
          <View style={[styles.progressBg, { backgroundColor: colors.background }]}>
            <View style={[styles.progressFill, { width: `${Math.min(100, (item.total / (stats.topIncome[0]?.total || 1)) * 100)}%`, backgroundColor: colors.success }]} />
          </View>
        </Card>
      ))}

      <Text style={[styles.sectionTitle, { marginTop: 30, color: colors.ink }]}>Sources de Dépenses (Top 5)</Text>
      {stats.topExpense.map((item: any, i: number) => (
        <Card key={i} style={styles.statCard}>
          <View style={styles.rowBetween}>
            <View style={styles.row}>
              <View style={[styles.iconBox, { backgroundColor: colors.danger + '15' }]}>
                <ArrowDownRight stroke={colors.danger} size={20} />
              </View>
              <Text style={[styles.sourceName, { color: colors.ink }]}>{item.name}</Text>
            </View>
            <Text style={[styles.amount, { color: colors.danger }]}>-{item.total?.toFixed(0)} $</Text>
          </View>
          <View style={[styles.progressBg, { backgroundColor: colors.background }]}>
            <View style={[styles.progressFill, { width: `${Math.min(100, (item.total / (stats.topExpense[0]?.total || 1)) * 100)}%`, backgroundColor: colors.danger }]} />
          </View>
        </Card>
      ))}
    </View>
  );

  const renderProjects = () => (
    <View>
      <Text style={[styles.sectionTitle, { color: colors.ink }]}>Analyse par Projet</Text>
      {stats.projectPerformance.map((p: any, i: number) => {
        const consumed = p.current_spend || 0;
        const budget = p.estimated_cost || 1;
        const progress = Math.min(100, (consumed / budget) * 100);
        return (
          <Card key={i} style={styles.projectCard}>
            <View style={styles.rowBetween}>
              <Text style={[styles.projectName, { color: colors.ink }]}>{p.name}</Text>
              <Text style={[styles.projectBudget, { color: colors.textSecondary }]}>{consumed.toFixed(0)} / {budget.toFixed(0)} $</Text>
            </View>
            <View style={[styles.progressBgLarge, { backgroundColor: colors.background }]}>
              <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: progress > 90 ? colors.danger : (progress > 70 ? colors.warning : colors.accent) }]} />
            </View>
            <View style={styles.rowBetween}>
              <Text style={[styles.miniLabel, { color: colors.textSecondary }]}>Consommé</Text>
              <Text style={[styles.miniLabel, { color: colors.textSecondary }]}>{progress.toFixed(1)}%</Text>
            </View>
            {p.current_income > 0 && (
              <View style={[styles.roiBox, {marginTop: 10, backgroundColor: colors.accent + '10'}]}>
                <TrendingUp size={14} stroke={colors.accent} />
                <Text style={[styles.roiText, { color: colors.accent }]}>Revenus générés: {p.current_income?.toFixed(0)} $</Text>
              </View>
            )}
          </Card>
        );
      })}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title="Analytics" subtitle="Performances Financières" colors={colors} />

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
              style={[styles.periodChip, { backgroundColor: colors.paper, borderColor: colors.border }, period === item.id && { backgroundColor: colors.accent, borderColor: colors.accent }]}
            >
              <Text style={[styles.periodText, { color: colors.textSecondary }, period === item.id && { color: '#FFF' }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.tabRow}>
          <TouchableOpacity 
            onPress={() => setActiveTab('insights')}
            style={[styles.tab, { backgroundColor: colors.paper, borderColor: colors.border }, activeTab === 'insights' && { backgroundColor: colors.ink, borderColor: colors.ink }]}
          >
            <ShieldAlert size={18} stroke={activeTab === 'insights' ? '#FFF' : colors.textSecondary} />
            <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === 'insights' && { color: '#FFF' }]}>Aperçu</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setActiveTab('sources')}
            style={[styles.tab, { backgroundColor: colors.paper, borderColor: colors.border }, activeTab === 'sources' && { backgroundColor: colors.ink, borderColor: colors.ink }]}
          >
            <ChartIcon size={18} stroke={activeTab === 'sources' ? '#FFF' : colors.textSecondary} />
            <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === 'sources' && { color: '#FFF' }]}>Sources</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setActiveTab('projects')}
            style={[styles.tab, { backgroundColor: colors.paper, borderColor: colors.border }, activeTab === 'projects' && { backgroundColor: colors.ink, borderColor: colors.ink }]}
          >
            <Briefcase size={18} stroke={activeTab === 'projects' ? '#FFF' : colors.textSecondary} />
            <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === 'projects' && { color: '#FFF' }]}>Projets</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'insights' ? renderInsights() : (activeTab === 'sources' ? renderSources() : renderProjects())}
        
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: Spacing.lg, paddingBottom: 60 },
  headerContainer: { marginBottom: 30 },
  headerSubtitle: { fontWeight: '700', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 },
  headerTitle: { fontSize: 32, fontWeight: '800' },
  
  periodRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  periodChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  periodText: { fontSize: 13, fontWeight: '700' },

  tabRow: { flexDirection: 'row', gap: 12, marginBottom: 25 },
  tab: { flex: 1, height: 45, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1 },
  tabText: { fontSize: 13, fontWeight: '700' },

  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 15 },
  statCard: { padding: 15, borderRadius: 18, marginBottom: 10 },
  projectCard: { padding: 18, borderRadius: 22, marginBottom: 15 },
  insightCard: { padding: 18, borderRadius: 22, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  flex1: { flex: 1 },
  sourceName: { fontSize: 15, fontWeight: '700' },
  amount: { fontSize: 16, fontWeight: '800' },
  
  insightValue: { fontSize: 22, fontWeight: '900' },
  insightLabel: { fontSize: 12, fontWeight: '600' },
  interpretation: { fontSize: 12, marginTop: 12, lineHeight: 18, fontStyle: 'italic' },
  
  catName: { fontSize: 13, fontWeight: '800' },
  pctText: { fontSize: 14, fontWeight: '900' },
  driftText: { fontSize: 11, fontWeight: '700', marginTop: 6 },
  
  progressBg: { height: 6, borderRadius: 3, marginTop: 12 },
  progressBgLarge: { height: 8, borderRadius: 4, marginVertical: 10 },
  progressFill: { height: '100%', borderRadius: 4 },

  kpiRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  kpiCard: { flex: 1, padding: 15, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  kpiLabel: { fontSize: 10, fontWeight: '800', marginBottom: 4 },
  kpiValue: { fontSize: 18, fontWeight: '900' },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 12 },
  statusBadgeText: { fontSize: 10, fontWeight: '900' },
  rowSmall: { flexDirection: 'row', alignItems: 'center', gap: 6 },

  projectName: { fontSize: 16, fontWeight: '800' },
  projectBudget: { fontSize: 13, fontWeight: '700' },
  miniLabel: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  roiBox: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8, borderRadius: 8 },
  roiText: { fontSize: 11, fontWeight: '700' }
});
