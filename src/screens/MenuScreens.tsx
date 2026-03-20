import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Colors, Spacing, Typography } from '../utils/theme';
import { Card } from '../components/Card';
import { 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  TrendingUp, 
  Wallet, 
  Clock,
  ShieldCheck,
  Zap,
  CheckCircle2
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

// --- REUSABLE PREMIUM HEADER ---
const ScreenHeader = ({ title, subtitle }: { title: string, subtitle: string }) => (
  <View style={styles.headerContainer}>
    <Text style={styles.headerSubtitle}>{subtitle}</Text>
    <Text style={styles.headerTitle}>{title}</Text>
  </View>
);

// --- SYSTÈME D'ÉPARGNE ---
export const SavingsSettingsScreen = () => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.listContent}>
      <ScreenHeader title="Discipline" subtitle="Configuration de l'épargne" />
      
      <Card style={styles.savingsHero}>
        <TrendingUp stroke="#FFF" size={48} />
        <Text style={styles.savingsRate}>50%</Text>
        <Text style={styles.savingsLabel}>Taux d'épargne automatique</Text>
        <View style={styles.heroLine} />
        <Text style={styles.savingsDesc}>
          Chaque dollar entrant est divisé : 0.50$ pour vos projets, 0.50$ pour vos besoins.
        </Text>
      </Card>

      <View style={styles.tipCard}>
        <CheckCircle2 stroke={Colors.accent} size={24} />
        <View style={styles.flex1}>
          <Text style={styles.tipTitle}>Pourquoi 50% ?</Text>
          <Text style={styles.tipText}>Cette règle accélère votre liberté financière en isolant systématiquement votre capital d'investissement.</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.primaryBtn}>
        <Text style={styles.primaryBtnText}>Ajuster le Taux</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  listContent: { padding: Spacing.lg, paddingBottom: 100 },
  headerContainer: { marginBottom: 24, marginTop: 10 },
  headerSubtitle: { color: Colors.accent, fontWeight: '700', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 },
  headerTitle: { fontSize: 32, fontWeight: '800', color: Colors.ink, marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  flex1: { flex: 1 },
  mainCurrencyHero: { backgroundColor: Colors.ink, padding: 32, alignItems: 'center', borderRadius: 28, marginBottom: 30 },
  heroLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },
  heroCode: { color: '#FFF', fontSize: 56, fontWeight: '900', marginVertical: 8 },
  heroName: { color: '#FFF', fontSize: 16, opacity: 0.8 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginTop: 16 },
  verifiedText: { color: '#FFF', fontSize: 11, marginLeft: 6, fontWeight: '600' },
  sectionHeading: { fontSize: 18, fontWeight: '800', color: Colors.text, marginBottom: 16 },
  currencyItem: { padding: 16, marginBottom: 12, borderRadius: 20 },
  symbolCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  symbolText: { fontSize: 18, fontWeight: '700', color: Colors.ink },
  currName: { fontSize: 16, fontWeight: '700', color: Colors.text },
  currRate: { fontSize: 13, color: Colors.textSecondary },
  obligationCard: { padding: 20, marginBottom: 16, borderRadius: 24 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  dateBadge: { flexDirection: 'row', alignItems: 'center', opacity: 0.6 },
  dateLabel: { fontSize: 11, fontWeight: '600', marginLeft: 4, color: Colors.textSecondary },
  objName: { fontSize: 20, fontWeight: '800', color: Colors.text, marginTop: 16, marginBottom: 20 },
  progContainer: { marginTop: 10 },
  progBar: { height: 8, backgroundColor: '#F3F4F6', borderRadius: 4, overflow: 'hidden', marginBottom: 10 },
  progFill: { height: '100%', borderRadius: 4 },
  progVal: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  savingsHero: { backgroundColor: Colors.accent, padding: 40, alignItems: 'center', borderRadius: 32, marginBottom: 24 },
  savingsRate: { color: '#FFF', fontSize: 72, fontWeight: '900', marginVertical: 10 },
  savingsLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '700', textTransform: 'uppercase' },
  heroLine: { width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2, marginVertical: 20 },
  savingsDesc: { color: '#FFF', fontSize: 14, textAlign: 'center', lineHeight: 22, opacity: 0.9 },
  tipCard: { flexDirection: 'row', backgroundColor: '#FFF', padding: 20, borderRadius: 20, borderLeftWidth: 4, borderLeftColor: Colors.accent, alignItems: 'center', marginBottom: 30 },
  tipTitle: { fontSize: 16, fontWeight: '800', color: Colors.text, marginLeft: 16, marginBottom: 4 },
  tipText: { fontSize: 13, color: Colors.textSecondary, marginLeft: 16, lineHeight: 18 },
  primaryBtn: { backgroundColor: Colors.ink, paddingVertical: 18, borderRadius: 20, alignItems: 'center' },
  primaryBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});
