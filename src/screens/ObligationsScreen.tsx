import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  Modal, 
  TextInput,
  KeyboardAvoidingView,
  Platform,
  FlatList
} from 'react-native';
import { Colors, Spacing, Typography } from '../utils/theme';
import { Card } from '../components/Card';
import { 
  Clock, 
  Plus, 
  X, 
  Check, 
  Trash2, 
  Edit3, 
  History,
  AlertCircle,
  Landmark,
  TrendingDown,
  TrendingUp,
  Target
} from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { DatabaseService } from '../services/DatabaseService';
import { FinancialEngine } from '../services/FinancialEngine';
import { getDatabase } from '../database/db';
import { Obligation, Project, Source } from '../database/types';
import { useTheme } from '../context/ThemeContext';

const ScreenHeader = ({ title, subtitle, colors }: { title: string, subtitle: string, colors: any }) => (
  <View style={styles.headerContainer}>
    <Text style={[styles.headerSubtitle, { color: colors.accent }]}>{subtitle}</Text>
    <Text style={[styles.headerTitle, { color: colors.ink }]}>{title}</Text>
  </View>
);

export default function ObligationsScreen() {
  const { colors, isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [obligations, setObligations] = useState<Obligation[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [mainCurrencyId, setMainCurrencyId] = useState<number | null>(null);
  
  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<'debt' | 'receivable'>('debt');
  const [totalAmount, setTotalAmount] = useState('');
  const [remainingAmount, setRemainingAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [projectId, setProjectId] = useState<number | undefined>(undefined);
  const [sourceId, setSourceId] = useState<number | undefined>(undefined);
  const [budgetAllocation, setBudgetAllocation] = useState<string[]>(['essential']);
  const [skipBalanceImpact, setSkipBalanceImpact] = useState(false);
  
  // History State
  const [historyVisible, setHistoryVisible] = useState(false);
  const [selectedObligation, setSelectedObligation] = useState<Obligation | null>(null);
  const [historyTransactions, setHistoryTransactions] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const [obl, proj, curr, src] = await Promise.all([
        DatabaseService.getAllObligations(),
        DatabaseService.getAllProjects(),
        DatabaseService.getAllCurrencies(),
        DatabaseService.getAllSources()
      ]);
      setObligations(obl);
      setProjects(proj);
      setSources(src);
      setMainCurrencyId(curr.find(c => c.is_main)?.id || curr[0]?.id || null);
    } catch (error) {
      console.error('Error loading obligations:', error);
    } finally {
      setLoading(false);
    }
  };

  const parseInput = (val: string) => {
    const normalized = val.replace(',', '.');
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? 0 : parsed;
  };

  const handleSave = async () => {
    const parsedTotal = parseInput(totalAmount);
    const parsedRemaining = parseInput(remainingAmount || totalAmount);

    if (!name.trim() || parsedTotal <= 0) {
      Alert.alert('Erreur', 'Le nom et un montant total sont requis');
      return;
    }

    try {
      if (editingId) {
        await DatabaseService.updateObligation(
          editingId, 
          name,
          type,
          parsedTotal,
          parsedRemaining, 
          dueDate || new Date().toISOString(), 
          projectId,
          budgetAllocation.join(',')
        );
      } else {
        await FinancialEngine.createObligationWithImpact({
          name,
          type,
          total_amount: parsedTotal,
          remaining_amount: parsedRemaining,
          due_date: dueDate || new Date().toISOString(),
          project_id: projectId,
          budget_allocation: budgetAllocation.join(','),
          currency_id: mainCurrencyId || 1,
          skipBalanceImpact,
          source_id: sourceId
        });
      }
      setModalVisible(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving obligation:', error);
      Alert.alert('Erreur', "Impossible de sauvegarder l'obligation");
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      'Supprimer',
      'Voulez-vous vraiment supprimer cette obligation ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: async () => {
            await DatabaseService.deleteObligation(id);
            loadData();
          }
        }
      ]
    );
  };

  const openEdit = (o: Obligation) => {
    setEditingId(o.id);
    setName(o.name);
    setType(o.type);
    setTotalAmount(o.total_amount.toString());
    setRemainingAmount(o.remaining_amount.toString());
    setDueDate(o.due_date);
    setProjectId(o.project_id);
    setBudgetAllocation(o.budget_allocation ? o.budget_allocation.split(',') : ['essential']);
    setModalVisible(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setType('debt');
    setTotalAmount('');
    setRemainingAmount('');
    setDueDate(new Date().toISOString().split('T')[0]);
    setProjectId(undefined);
    setSourceId(undefined);
    setBudgetAllocation(['essential']);
    setSkipBalanceImpact(false);
  };

  const openHistory = async (o: Obligation) => {
    setSelectedObligation(o);
    const db = await getDatabase();
    const txs = await db.getAllAsync<any>(
      `SELECT t.*, c.code as currency_code 
       FROM transactions t 
       LEFT JOIN currencies c ON t.currency_id = c.id
       WHERE t.obligation_id = ? 
       ORDER BY t.transaction_date DESC`,
      [o.id]
    );
    setHistoryTransactions(txs);
    setHistoryVisible(true);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={obligations}
        ListHeaderComponent={<ScreenHeader title="Mes Obligations" subtitle="Dettes et Créances" colors={colors} />}
        contentContainerStyle={styles.listContent}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => {
          const paidAmount = item.paid_from_transactions || 0;
          const progress = (paidAmount / item.total_amount) * 100;
          const projectName = projects.find(p => p.id === item.project_id)?.name;
          const isSettled = item.remaining_amount <= 0;

          return (
            <Card style={[styles.obligationCard, isSettled && { opacity: 0.8, backgroundColor: colors.background }]}>
              <View style={styles.rowBetween}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <View style={[styles.typeBadge, { backgroundColor: isSettled ? colors.background : (item.type === 'debt' ? colors.danger + '20' : colors.success + '20') }]}>
                    <Text style={{ color: isSettled ? colors.textSecondary : (item.type === 'debt' ? colors.danger : colors.success), fontWeight: '800', fontSize: 10 }}>
                      {item.type === 'debt' ? 'DETTE' : 'CRÉANCE'}
                    </Text>
                  </View>
                  {isSettled && (
                    <View style={[styles.typeBadge, { backgroundColor: colors.success }]}>
                      <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 10 }}>RÉGLÉ</Text>
                    </View>
                  )}
                </View>
                <View style={styles.actionRow}>
                  <TouchableOpacity onPress={() => openHistory(item)} style={[styles.actionBtn, { backgroundColor: colors.background }]}>
                    <History stroke={colors.accent} size={18} />
                  </TouchableOpacity>
                  {isSettled ? (
                    <View style={[styles.actionBtn, { opacity: 0.4, marginLeft: 10, backgroundColor: colors.background }]}>
                      <Edit3 stroke={colors.textSecondary} size={18} />
                    </View>
                  ) : (
                    <TouchableOpacity onPress={() => openEdit(item)} style={[styles.actionBtn, { marginLeft: 10, backgroundColor: colors.background }]}>
                      <Edit3 stroke={colors.textSecondary} size={18} />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={() => handleDelete(item.id)} style={[styles.actionBtn, { marginLeft: 10, backgroundColor: colors.background }]}>
                    <Trash2 stroke={colors.danger} size={18} />
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={[styles.objName, { color: colors.ink }]}>{item.name}</Text>
              {projectName && (
                <View style={styles.projectTag}>
                  <Target size={12} stroke={colors.accent} />
                  <Text style={[styles.projectTagText, { color: colors.accent }]}>{projectName}</Text>
                </View>
              )}

              <View style={styles.catBadgeRow}>
                {(item.budget_allocation || 'essential').split(',').map(cat => (
                  <View key={cat} style={[
                    styles.catBadge,
                    cat === 'essential' && { backgroundColor: colors.accent + '20' },
                    cat === 'personal' && { backgroundColor: colors.warning + '20' },
                    cat === 'investment' && { backgroundColor: colors.success + '20' },
                  ]}>
                    <Text style={[styles.catBadgeText, { color: colors.ink }]}>
                      {cat === 'essential' ? 'Essentiel' : cat === 'personal' ? 'Plaisir' : 'Invest.'}
                    </Text>
                  </View>
                ))}
              </View>
              
              <View style={styles.progContainer}>
                <View style={[styles.progBar, { backgroundColor: colors.background }]}>
                  <View style={[
                    styles.progFill, 
                    { 
                      width: `${progress}%`, 
                      backgroundColor: isSettled ? colors.textSecondary : (item.type === 'debt' ? colors.danger : colors.success) 
                    }
                  ]} />
                </View>
                <View style={[styles.rowBetween, { marginTop: 4 }]}>
                  <View>
                    <Text style={[styles.progLabel, { color: colors.textSecondary }]}>Réglé ({item.transaction_count || 0} op.)</Text>
                    <Text style={[styles.progVal, { color: colors.ink }]}>{paidAmount.toLocaleString()} $</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.progLabel, { color: colors.textSecondary }]}>Solde restant</Text>
                    <Text style={[styles.progVal, { color: isSettled ? colors.success : colors.ink }]}>
                      {isSettled ? 'Complet' : `${item.remaining_amount.toLocaleString()} $`}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.dateBadge}>
                <Clock stroke={colors.textSecondary} size={14} />
                <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>Échéance : {new Date(item.due_date).toLocaleDateString()}</Text>
              </View>
            </Card>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={{ color: colors.textSecondary,textAlign:'center' }}>Aucune obligation enregistrée</Text>
          </View>
        }
      />

      <TouchableOpacity 
        style={[styles.mainFab, { backgroundColor: colors.ink }]} 
        onPress={() => { resetForm(); setModalVisible(true); }}
      >
        <Plus stroke={colors.paper} size={32} strokeWidth={2.5} />
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.paper }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.ink }]}>{editingId ? 'Modifier' : 'Nouvelle'} Obligation</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={[styles.closeBtn, { backgroundColor: colors.background }]}>
                <X stroke={colors.ink} size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Titre de l'obligation</Text>
                <TextInput 
                  style={[styles.input, { backgroundColor: colors.background, color: colors.ink, borderColor: colors.border }]}
                  placeholder="Ex: Prêt banque, Dû par Jean..."
                  placeholderTextColor={colors.textSecondary + '70'}
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Type</Text>
                <View style={[styles.typeSelector, { backgroundColor: colors.background }]}>
                  <TouchableOpacity 
                    style={[styles.typeBtn, type === 'debt' && { backgroundColor: colors.danger }]} 
                    onPress={() => setType('debt')}
                  >
                    <TrendingDown stroke={type === 'debt' ? '#FFF' : colors.textSecondary} size={20} />
                    <Text style={[styles.typeBtnText, { color: colors.textSecondary }, type === 'debt' && { color: '#FFF' }]}>Dette</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.typeBtn, type === 'receivable' && { backgroundColor: colors.success }]} 
                    onPress={() => setType('receivable')}
                  >
                    <TrendingUp stroke={type === 'receivable' ? '#FFF' : colors.textSecondary} size={20} />
                    <Text style={[styles.typeBtnText, { color: colors.textSecondary }, type === 'receivable' && { color: '#FFF' }]}>Créance</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.rowBetween}>
                <View style={[styles.formGroup, { width: '48%' }]}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Montant Total ($)</Text>
                  <TextInput 
                    style={[styles.input, { backgroundColor: colors.background, color: colors.ink, borderColor: colors.border }]}
                    placeholder="0.00"
                    placeholderTextColor={colors.textSecondary + '70'}
                    keyboardType="numeric"
                    value={totalAmount}
                    onChangeText={setTotalAmount}
                  />
                </View>
                <View style={[styles.formGroup, { width: '48%' }]}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Déjà réglé ($)</Text>
                  <TextInput 
                    style={[styles.input, { backgroundColor: colors.background, color: colors.ink, borderColor: colors.border }]}
                    placeholder="0.00"
                    placeholderTextColor={colors.textSecondary + '70'}
                    keyboardType="numeric"
                    value={remainingAmount}
                    onChangeText={setRemainingAmount}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Date d'échéance (YYYY-MM-DD)</Text>
                <TextInput 
                  style={[styles.input, { backgroundColor: colors.background, color: colors.ink, borderColor: colors.border }]}
                  placeholder="2024-12-31"
                  placeholderTextColor={colors.textSecondary + '70'}
                  value={dueDate}
                  onChangeText={setDueDate}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Source / Caisse (Optionnel)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.projectList}>
                  {sources.filter(s => s.type === (type === 'receivable' ? 'income' : 'expense') || s.type === 'both').map(s => (
                    <TouchableOpacity 
                      key={s.id} 
                      style={[styles.projectItem, { backgroundColor: colors.background }, sourceId === s.id && { backgroundColor: colors.accent }]}
                      onPress={() => setSourceId(sourceId === s.id ? undefined : s.id)}
                    >
                      <Text style={[styles.projectItemText, { color: colors.textSecondary }, sourceId === s.id && { color: '#FFF' }]}>{s.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Lier à un projet (Optionnel)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.projectList}>
                  {projects.map(p => (
                    <TouchableOpacity 
                      key={p.id} 
                      style={[styles.projectItem, { backgroundColor: colors.background }, projectId === p.id && { backgroundColor: colors.accent }]}
                      onPress={() => setProjectId(projectId === p.id ? undefined : p.id)}
                    >
                      <Text style={[styles.projectItemText, { color: colors.textSecondary }, projectId === p.id && { color: '#FFF' }]}>{p.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Allocation Budget (Auto 30-30-40)</Text>
                <View style={[styles.categorySelectorSmall, { backgroundColor: colors.background }]}>
                  {['essential', 'personal', 'investment'].map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.catBtnSmall,
                        budgetAllocation.includes(cat) && {
                          backgroundColor:
                            cat === 'essential' ? colors.accent :
                            cat === 'personal' ? colors.warning : colors.success
                        }
                      ]}
                      onPress={() => {
                        setBudgetAllocation(prev => 
                          prev.includes(cat) 
                            ? (prev.length > 1 ? prev.filter(c => c !== cat) : prev)
                            : [...prev, cat]
                        );
                      }}
                    >
                      <Text style={[styles.catBtnTextSmall, { color: colors.textSecondary }, budgetAllocation.includes(cat) && { color: '#FFF' }]}>
                        {cat === 'essential' ? 'Essentiel' : cat === 'personal' ? 'Plaisir' : 'Épargne'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={[styles.hintText, { color: colors.textSecondary }]}>Le remboursement impactera ces budgets au prorata.</Text>
              </View>

              <TouchableOpacity 
                style={[styles.checkboxContainer, { backgroundColor: colors.background, borderColor: colors.border }]} 
                onPress={() => setSkipBalanceImpact(!skipBalanceImpact)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, { borderColor: colors.accent }, skipBalanceImpact && { backgroundColor: colors.accent }]}>
                  {skipBalanceImpact && <Check stroke={colors.paper} size={14} strokeWidth={3} />}
                </View>
                <Text style={[styles.checkboxLabel, { color: colors.ink }]}>Sans impact cash (Achat à crédit / Hors solde)</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.submitBtn, { backgroundColor: colors.ink }]} onPress={handleSave}>
                <Check stroke={colors.paper} size={24} strokeWidth={3} />
                <Text style={[styles.submitBtnText, { color: colors.paper }]}>Enregistrer</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={historyVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.paper, maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.ink }]}>Historique</Text>
                <Text style={{ fontSize: 13, color: colors.textSecondary }}>{selectedObligation?.name}</Text>
              </View>
              <TouchableOpacity onPress={() => setHistoryVisible(false)} style={[styles.closeBtn, { backgroundColor: colors.background }]}>
                <X stroke={colors.ink} size={24} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={historyTransactions}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <View style={[styles.historyItem, { borderBottomColor: colors.border }]}>
                  <View style={[styles.natureDot, { backgroundColor: item.nature === 'virtual' ? colors.accent : colors.success }]} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.historyDesc, { color: colors.ink }]}>{item.description}</Text>
                    <Text style={[styles.historyDate, { color: colors.textSecondary }]}>{new Date(item.transaction_date).toLocaleDateString()}</Text>
                  </View>
                  <Text style={[styles.historyAmount, { color: item.type === 'income' ? colors.success : colors.danger }]}>
                    {item.type === 'income' ? '+' : '-'}{item.amount_original.toLocaleString()} {item.currency_code}
                  </Text>
                </View>
              )}
              ListEmptyComponent={
                <View style={{ padding: 40, alignItems: 'center' }}>
                  <Text style={{ color: colors.textSecondary }}>Aucune transaction trouvée</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  headerContainer: { paddingHorizontal: Spacing.lg, marginBottom: 20, marginTop: 10 },
  headerSubtitle: { fontWeight: '700', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 },
  headerTitle: { fontSize: 32, fontWeight: '800', marginTop: 4 },
  listContent: { paddingHorizontal: Spacing.lg, paddingBottom: 140 },
  obligationCard: { padding: 20, borderRadius: 24, marginBottom: 16 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  actionRow: { flexDirection: 'row' },
  actionBtn: { padding: 8, borderRadius: 12 },
  objName: { fontSize: 20, fontWeight: '800', marginTop: 16 },
  projectTag: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  projectTagText: { fontSize: 13, fontWeight: '600', marginLeft: 4 },
  progContainer: { marginTop: 20 },
  progBar: { height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  progFill: { height: '100%', borderRadius: 3 },
  progLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  progVal: { fontSize: 14, fontWeight: '800' },
  dateBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 20, opacity: 0.7 },
  dateLabel: { fontSize: 12, fontWeight: '600', marginLeft: 6 },
  emptyContainer: { padding: 50, alignItems: 'center' },
  mainFab: { 
    position: 'absolute', 
    bottom: 120, 
    right: 30, 
    width: 64, 
    height: 64, 
    borderRadius: 22, 
    justifyContent: 'center', 
    alignItems: 'center', 
    elevation: 8 
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 30, paddingBottom: 50, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  modalTitle: { fontSize: 24, fontWeight: '900' },
  closeBtn: { padding: 8, borderRadius: 16 },
  formGroup: { marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '800', marginBottom: 10, textTransform: 'uppercase' },
  input: { borderRadius: 20, padding: 18, fontSize: 16, borderWidth: 1, fontWeight: '600' },
  typeSelector: { flexDirection: 'row', borderRadius: 20, padding: 4 },
  typeBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 16, flexDirection: 'row', justifyContent: 'center' },
  typeBtnText: { fontSize: 14, fontWeight: '700', marginLeft: 8 },
  projectList: { flexDirection: 'row' },
  projectItem: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, marginRight: 10 },
  projectItemText: { fontWeight: '700' },
  submitBtn: { paddingVertical: 20, borderRadius: 24, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  submitBtnText: { fontSize: 18, fontWeight: '900', marginLeft: 10 },
  catBadgeRow: { flexDirection: 'row', gap: 6, marginTop: 10 },
  catBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  catBadgeText: { fontSize: 10, fontWeight: '800', opacity: 0.7 },
  categorySelectorSmall: { flexDirection: 'row', gap: 6, padding: 3, borderRadius: 10 },
  catBtnSmall: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
  catBtnTextSmall: { fontSize: 12, fontWeight: '800' },
  hintText: { fontSize: 11, marginTop: 8, fontStyle: 'italic', textAlign: 'center' },
  historyItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1 },
  natureDot: { width: 8, height: 8, borderRadius: 4 },
  historyDesc: { fontSize: 14, fontWeight: '700' },
  historyDate: { fontSize: 11, marginTop: 2 },
  historyAmount: { fontSize: 14, fontWeight: '900' },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 20, alignSelf: 'center', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, marginRight: 10, justifyContent: 'center', alignItems: 'center' },
  checkboxLabel: { fontSize: 14, fontWeight: '700' },
});
