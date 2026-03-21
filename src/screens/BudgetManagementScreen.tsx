import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Colors, Spacing, Typography } from '../utils/theme';
import { Card } from '../components/Card';
import { 
  ArrowRightLeft, 
  RotateCcw, 
  Wallet, 
  ShieldAlert, 
  CheckCircle2,
  TrendingUp,
  History
} from 'lucide-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { FinancialEngine } from '../services/FinancialEngine';
import { useTheme } from '../context/ThemeContext';

const ScreenHeader = ({ title, subtitle, colors }: { title: string, subtitle: string, colors: any }) => (
  <View style={styles.headerContainer}>
    <Text style={[styles.headerSubtitle, { color: colors.accent }]}>{subtitle}</Text>
    <Text style={[styles.headerTitle, { color: colors.ink }]}>{title}</Text>
  </View>
);

export default function BudgetManagementScreen() {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [balances, setBalances] = useState<any>(null);

  // Manual Migration State
  const [from, setFrom] = useState<'essential' | 'personal' | 'investment'>('personal');
  const [to, setTo] = useState<'essential' | 'personal' | 'investment'>('essential');
  const [amount, setAmount] = useState('');

  const loadData = async () => {
    try {
      const stats = await FinancialEngine.getDashboardStats();
      setBalances(stats.balance);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const handleMigrate = async () => {
    const val = parseFloat(amount.replace(',', '.'));
    if (isNaN(val) || val <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer un montant valide.');
      return;
    }

    if (from === to) {
      Alert.alert('Oups', 'Les budgets de départ et d\'arrivée sont identiques.');
      return;
    }

    try {
      await FinancialEngine.migrateBudget(from, to, val);
      setAmount('');
      loadData();
      Alert.alert('Succès', 'Reallocation effectuée !');
    } catch (e: any) {
      if (e.message === 'SOLDE_INSUFFISANT') {
        Alert.alert('Refusé', 'Le budget de départ n\'a pas assez de fonds.');
      } else if (e.message === 'MONTANT_INVALIDE') {
        Alert.alert('Erreur', 'Veuillez entrer un montant positif.');
      } else {
        Alert.alert('Erreur', 'Impossible de déplacer les fonds.');
      }
    }
  };

  const handleReset = () => {
    Alert.alert(
      '☢️ RE-EQUILIBRAGE STRUCTUREL',
      'Votre solde total sera redistribué : 30% Essentiel, 30% Loisir, 40% Épargne. Continuer ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'RÉINITIALISER (30/30/40)', 
          style: 'destructive',
          onPress: async () => {
            await FinancialEngine.resetBudgetToStandard();
            loadData();
            Alert.alert('Terminé', 'Le budget a été ré-équilibré selon la règle 30/30/40.');
          }
        }
      ]
    );
  };

  if (loading || !balances) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Gestion Budget" subtitle="Réorganisation des piliers" colors={colors} />

        {/* --- CURRENT STATE --- */}
        <View style={styles.stateRow}>
          <Card style={styles.stateCard}>
            <Text style={[styles.stateLabel, { color: colors.textSecondary }]}>Essentiel</Text>
            <Text style={[styles.stateValue, { color: colors.ink }]}>{balances.total_essential?.toFixed(0)} $</Text>
          </Card>
          <Card style={styles.stateCard}>
            <Text style={[styles.stateLabel, { color: colors.textSecondary }]}>Loisir</Text>
            <Text style={[styles.stateValue, { color: colors.ink }]}>{balances.total_personal?.toFixed(0)} $</Text>
          </Card>
          <Card style={styles.stateCard}>
            <Text style={[styles.stateLabel, { color: colors.textSecondary }]}>Épargne</Text>
            <Text style={[styles.stateValue, { color: colors.ink }]}>{balances.total_investment?.toFixed(0)} $</Text>
          </Card>
        </View>

        {/* --- OPTION 1: MANUAL MIGRATION --- */}
        <Card style={styles.mainCard}>
          <View style={styles.cardHeader}>
            <ArrowRightLeft stroke={colors.accent} size={24} />
            <Text style={[styles.cardTitle, { color: colors.ink }]}>Migration Manuelle</Text>
          </View>
          
          <Text style={[styles.label, { color: colors.textSecondary }]}>Transférer de :</Text>
          <View style={styles.pickerRow}>
            {['essential', 'personal', 'investment'].map((cat: any) => (
              <TouchableOpacity 
                key={cat} 
                onPress={() => setFrom(cat)}
                style={[styles.pickerBtn, { backgroundColor: colors.background, borderColor: colors.border }, from === cat && { backgroundColor: colors.accent, borderColor: colors.accent }]}
              >
                <Text style={[styles.pickerBtnText, { color: colors.textSecondary }, from === cat && { color: '#FFF' }]}>
                  {cat === 'essential' ? 'Essentiel' : (cat === 'personal' ? 'Loisir' : 'Épargne')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, { color: colors.textSecondary }]}>Vers :</Text>
          <View style={styles.pickerRow}>
            {['essential', 'personal', 'investment'].map((cat: any) => (
              <TouchableOpacity 
                key={cat} 
                onPress={() => setTo(cat)}
                style={[styles.pickerBtn, { backgroundColor: colors.background, borderColor: colors.border }, to === cat && { backgroundColor: colors.accent, borderColor: colors.accent }]}
              >
                <Text style={[styles.pickerBtnText, { color: colors.textSecondary }, to === cat && { color: '#FFF' }]}>
                  {cat === 'essential' ? 'Essentiel' : (cat === 'personal' ? 'Loisir' : 'Épargne')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, { color: colors.textSecondary }]}>Montant à déplacer ($)</Text>
          <TextInput 
            style={[styles.input, { backgroundColor: colors.background, color: colors.ink }]} 
            placeholder="0.00" 
            placeholderTextColor={colors.textSecondary + '70'}
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />

          <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.ink }]} onPress={handleMigrate}>
            <Text style={styles.primaryBtnText}>Confirmer la Migration</Text>
          </TouchableOpacity>
        </Card>

        {/* --- OPTION 2: RESET 30/30/40 --- */}
        <Card style={[styles.mainCard, { borderColor: colors.warning + '40', borderWidth: 1 }]}>
          <View style={styles.cardHeader}>
            <RotateCcw stroke={colors.warning} size={24} />
            <Text style={[styles.cardTitle, { color: colors.ink }]}>Ré-équilibrage 30/30/40</Text>
          </View>
          <Text style={[styles.descText, { color: colors.textSecondary }]}>
            Utilisez cette option pour restaurer la structure idéale (30% Essentiel, 30% Loisir, 40% Épargne) sur l'ensemble de vos fonds actuels.
          </Text>
          <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.warning }]} onPress={handleReset}>
            <Text style={styles.primaryBtnText}>Appliquer la Règle Standard</Text>
          </TouchableOpacity>
        </Card>

        <TouchableOpacity 
          style={styles.historyLink} 
          onPress={() => navigation.navigate('Trash')}
        >
          <History stroke={colors.textSecondary} size={18} />
          <Text style={[styles.historyLinkText, { color: colors.textSecondary }]}>Voir l'historique des alertes (Corbeille)</Text>
        </TouchableOpacity>
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
  
  stateRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  stateCard: { width: '31%', padding: 12, alignItems: 'center', borderRadius: 16 },
  stateLabel: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  stateValue: { fontSize: 16, fontWeight: '800', marginTop: 4 },

  mainCard: { padding: 20, borderRadius: 28, marginBottom: 20 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 12 },
  cardTitle: { fontSize: 18, fontWeight: '800' },
  label: { fontSize: 13, fontWeight: '700', marginBottom: 10, marginTop: 15 },
  
  pickerRow: { flexDirection: 'row', gap: 8 },
  pickerBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
  pickerBtnText: { fontSize: 11, fontWeight: '800' },
  
  input: { height: 50, borderRadius: 12, paddingHorizontal: 15, fontSize: 18, fontWeight: '700' },
  primaryBtn: { height: 54, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 25 },
  primaryBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  
  descText: { fontSize: 13, lineHeight: 20, marginBottom: 10, fontWeight: '500' },
  historyLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20 },
  historyLinkText: { fontSize: 13, fontWeight: '600' }
});
