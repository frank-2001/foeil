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
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Target,
  History,
  AlertCircle,
  Landmark
} from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { DatabaseService } from '../services/DatabaseService';
import { FinancialEngine } from '../services/FinancialEngine';
import { getDatabase } from '../database/db';
import { Obligation, Project, Source } from '../database/types';

const ScreenHeader = ({ title, subtitle }: { title: string, subtitle: string }) => (
  <View style={styles.headerContainer}>
    <Text style={styles.headerSubtitle}>{subtitle}</Text>
    <Text style={styles.headerTitle}>{title}</Text>
  </View>
);

export default function ObligationsScreen() {
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
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={obligations}
        ListHeaderComponent={<ScreenHeader title="Mes Obligations" subtitle="Dettes et Créances" />}
        contentContainerStyle={styles.listContent}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => {
          const paidAmount = item.paid_from_transactions || 0;
          const progress = (paidAmount / item.total_amount) * 100;
          const projectName = projects.find(p => p.id === item.project_id)?.name;
          const isSettled = item.remaining_amount <= 0;

          return (
            <Card style={[styles.obligationCard, isSettled && styles.settledCard]}>
              <View style={styles.rowBetween}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <View style={[styles.typeBadge, { backgroundColor: isSettled ? '#F3F4F6' : (item.type === 'debt' ? '#FFEBEB' : '#E6F4EA') }]}>
                    <Text style={{ color: isSettled ? Colors.textSecondary : (item.type === 'debt' ? '#D93025' : '#1E8E3E'), fontWeight: '800', fontSize: 10 }}>
                      {item.type === 'debt' ? 'DETTE' : 'CRÉANCE'}
                    </Text>
                  </View>
                  {isSettled && (
                    <View style={[styles.typeBadge, { backgroundColor: Colors.success }]}>
                      <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 10 }}>RÉGLÉ</Text>
                    </View>
                  )}
                </View>
                <View style={styles.actionRow}>
                  <TouchableOpacity onPress={() => openHistory(item)} style={styles.actionBtn}>
                    <History stroke={Colors.accent} size={18} />
                  </TouchableOpacity>
                  {isSettled ? (
                    <View style={[styles.actionBtn, { opacity: 0.4, marginLeft: 10 }]}>
                      <Edit3 stroke={Colors.textSecondary} size={18} />
                    </View>
                  ) : (
                    <TouchableOpacity onPress={() => openEdit(item)} style={[styles.actionBtn, { marginLeft: 10 }]}>
                      <Edit3 stroke={Colors.textSecondary} size={18} />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={() => handleDelete(item.id)} style={[styles.actionBtn, { marginLeft: 10 }]}>
                    <Trash2 stroke={Colors.danger} size={18} />
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.objName}>{item.name}</Text>
              {projectName && (
                <View style={styles.projectTag}>
                  <Target size={12} stroke={Colors.accent} />
                  <Text style={styles.projectTagText}>{projectName}</Text>
                </View>
              )}

              <View style={styles.catBadgeRow}>
                {(item.budget_allocation || 'essential').split(',').map(cat => (
                  <View key={cat} style={[
                    styles.catBadge,
                    cat === 'essential' && styles.catBadgeEssential,
                    cat === 'personal' && styles.catBadgePersonal,
                    cat === 'investment' && styles.catBadgeInvestment,
                  ]}>
                    <Text style={styles.catBadgeText}>
                      {cat === 'essential' ? 'Essentiel' : cat === 'personal' ? 'Plaisir' : 'Invest.'}
                    </Text>
                  </View>
                ))}
              </View>
              
              <View style={styles.progContainer}>
                <View style={styles.progBar}>
                  <View style={[
                    styles.progFill, 
                    { 
                      width: `${progress}%`, 
                      backgroundColor: isSettled ? Colors.textSecondary : (item.type === 'debt' ? Colors.danger : Colors.success) 
                    }
                  ]} />
                </View>
                <View style={[styles.rowBetween, { marginTop: 4 }]}>
                  <View>
                    <Text style={styles.progLabel}>Réglé ({item.transaction_count || 0} op.)</Text>
                    <Text style={styles.progVal}>{paidAmount.toLocaleString()} $</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.progLabel}>Solde restant</Text>
                    <Text style={[styles.progVal, { color: isSettled ? Colors.success : Colors.ink }]}>
                      {isSettled ? 'Complet' : `${item.remaining_amount.toLocaleString()} $`}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.dateBadge}>
                <Clock stroke={Colors.textSecondary} size={14} />
                <Text style={styles.dateLabel}>Échéance : {new Date(item.due_date).toLocaleDateString()}</Text>
              </View>
            </Card>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={{ color: Colors.textSecondary,textAlign:'center' }}>Aucune obligation enregistrée</Text>
          </View>
        }
      />

      <TouchableOpacity 
        style={styles.mainFab} 
        onPress={() => { resetForm(); setModalVisible(true); }}
      >
        <Plus stroke="#FFF" size={32} strokeWidth={2.5} />
      </TouchableOpacity>

      {/* Modal Add/Edit Obligation */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingId ? 'Modifier' : 'Nouvelle'} Obligation</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <X stroke={Colors.ink} size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Titre de l'obligation</Text>
                <TextInput 
                  style={styles.input}
                  placeholder="Ex: Prêt banque, Dû par Jean..."
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Type</Text>
                <View style={styles.typeSelector}>
                  <TouchableOpacity 
                    style={[styles.typeBtn, type === 'debt' && styles.typeBtnActiveDebt]} 
                    onPress={() => setType('debt')}
                  >
                    <TrendingDown stroke={type === 'debt' ? '#FFF' : Colors.textSecondary} size={20} />
                    <Text style={[styles.typeBtnText, type === 'debt' && styles.typeBtnTextActive]}>Dette</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.typeBtn, type === 'receivable' && styles.typeBtnActiveRec]} 
                    onPress={() => setType('receivable')}
                  >
                    <TrendingUp stroke={type === 'receivable' ? '#FFF' : Colors.textSecondary} size={20} />
                    <Text style={[styles.typeBtnText, type === 'receivable' && styles.typeBtnTextActive]}>Créance</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.rowBetween}>
                <View style={[styles.formGroup, { width: '48%' }]}>
                  <Text style={styles.label}>Montant Total ($)</Text>
                  <TextInput 
                    style={styles.input}
                    placeholder="0.00"
                    keyboardType="numeric"
                    value={totalAmount}
                    onChangeText={setTotalAmount}
                  />
                </View>
                <View style={[styles.formGroup, { width: '48%' }]}>
                  <Text style={styles.label}>Déjà réglé ($)</Text>
                  <TextInput 
                    style={styles.input}
                    placeholder="0.00"
                    keyboardType="numeric"
                    value={remainingAmount} // Note: simplified UI using remaining directly or calculation
                    onChangeText={setRemainingAmount}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Date d'échéance (YYYY-MM-DD)</Text>
                <TextInput 
                  style={styles.input}
                  placeholder="2024-12-31"
                  value={dueDate}
                  onChangeText={setDueDate}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Source / Caisse (Optionnel)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.projectList}>
                  {sources.filter(s => s.type === (type === 'receivable' ? 'income' : 'expense') || s.type === 'both').map(s => (
                    <TouchableOpacity 
                      key={s.id} 
                      style={[styles.projectItem, sourceId === s.id && { backgroundColor: Colors.accent }]}
                      onPress={() => setSourceId(sourceId === s.id ? undefined : s.id)}
                    >
                      <Text style={[styles.projectItemText, sourceId === s.id && { color: '#FFF' }]}>{s.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Lier à un projet (Optionnel)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.projectList}>
                  {projects.map(p => (
                    <TouchableOpacity 
                      key={p.id} 
                      style={[styles.projectItem, projectId === p.id && styles.projectItemActive]}
                      onPress={() => setProjectId(projectId === p.id ? undefined : p.id)}
                    >
                      <Text style={[styles.projectItemText, projectId === p.id && styles.projectItemTextActive]}>{p.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Allocation Budget (Auto 30-30-40)</Text>
                <View style={styles.categorySelectorSmall}>
                  {['essential', 'personal', 'investment'].map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.catBtnSmall,
                        budgetAllocation.includes(cat) && {
                          backgroundColor:
                            cat === 'essential' ? Colors.accent :
                            cat === 'personal' ? Colors.warning : Colors.success
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
                      <Text style={[styles.catBtnTextSmall, budgetAllocation.includes(cat) && { color: '#FFF' }]}>
                        {cat === 'essential' ? 'Essentiel' : cat === 'personal' ? 'Plaisir' : 'Épargne'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.hintText}>Le remboursement impactera ces budgets au prorata.</Text>
              </View>

              <TouchableOpacity 
                style={styles.checkboxContainer} 
                onPress={() => setSkipBalanceImpact(!skipBalanceImpact)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, skipBalanceImpact && styles.checkboxActive]}>
                  {skipBalanceImpact && <Check stroke="#FFF" size={14} strokeWidth={3} />}
                </View>
                <Text style={styles.checkboxLabel}>Sans impact cash (Achat à crédit / Hors solde)</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.submitBtn} onPress={handleSave}>
                <Check stroke="#FFF" size={24} strokeWidth={3} />
                <Text style={styles.submitBtnText}>Enregistrer</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal History */}
      <Modal visible={historyVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Historique</Text>
                <Text style={{ fontSize: 13, color: Colors.textSecondary }}>{selectedObligation?.name}</Text>
              </View>
              <TouchableOpacity onPress={() => setHistoryVisible(false)} style={styles.closeBtn}>
                <X stroke={Colors.ink} size={24} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={historyTransactions}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <View style={styles.historyItem}>
                  <View style={[styles.natureDot, { backgroundColor: item.nature === 'virtual' ? Colors.accent : Colors.success }]} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.historyDesc}>{item.description}</Text>
                    <Text style={styles.historyDate}>{new Date(item.transaction_date).toLocaleDateString()}</Text>
                  </View>
                  <Text style={[styles.historyAmount, { color: item.type === 'income' ? Colors.success : Colors.danger }]}>
                    {item.type === 'income' ? '+' : '-'}{item.amount_original.toLocaleString()} {item.currency_code}
                  </Text>
                </View>
              )}
              ListEmptyComponent={
                <View style={{ padding: 40, alignItems: 'center' }}>
                  <Text style={{ color: Colors.textSecondary }}>Aucune transaction trouvée</Text>
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
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { justifyContent: 'center', alignItems: 'center' },
  headerContainer: { paddingHorizontal: Spacing.lg, marginBottom: 20, marginTop: 10 },
  headerSubtitle: { color: Colors.accent, fontWeight: '700', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 },
  headerTitle: { fontSize: 32, fontWeight: '800', color: Colors.ink, marginTop: 4 },
  listContent: { paddingHorizontal: Spacing.lg, paddingBottom: 140 },
  obligationCard: { padding: 20, borderRadius: 24, marginBottom: 16 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  actionRow: { flexDirection: 'row' },
  actionBtn: { padding: 8, backgroundColor: '#F3F4F6', borderRadius: 12 },
  objName: { fontSize: 20, fontWeight: '800', color: Colors.ink, marginTop: 16 },
  projectTag: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  projectTagText: { fontSize: 13, color: Colors.accent, fontWeight: '600', marginLeft: 4 },
  progContainer: { marginTop: 20 },
  progBar: { height: 6, backgroundColor: '#F3F4F6', borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  progFill: { height: '100%', borderRadius: 3 },
  progLabel: { fontSize: 10, color: Colors.textSecondary, fontWeight: '700', textTransform: 'uppercase' },
  progVal: { fontSize: 14, color: Colors.ink, fontWeight: '800' },
  settledCard: { opacity: 0.8, backgroundColor: '#FAFAFA' },
  dateBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 20, opacity: 0.7 },
  dateLabel: { fontSize: 12, fontWeight: '600', marginLeft: 6, color: Colors.textSecondary },
  emptyContainer: { padding: 50, alignItems: 'center' },
  mainFab: { 
    position: 'absolute', 
    bottom: 120, 
    right: 30, 
    backgroundColor: Colors.ink, 
    width: 64, 
    height: 64, 
    borderRadius: 22, 
    justifyContent: 'center', 
    alignItems: 'center', 
    elevation: 8 
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 30, paddingBottom: 50, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  modalTitle: { fontSize: 24, fontWeight: '900', color: Colors.ink },
  closeBtn: { backgroundColor: '#F3F4F6', padding: 8, borderRadius: 16 },
  formGroup: { marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '800', color: Colors.textSecondary, marginBottom: 10, textTransform: 'uppercase' },
  input: { backgroundColor: '#F9FAFB', borderRadius: 20, padding: 18, fontSize: 16, borderWidth: 1, borderColor: '#F3F4F6', color: Colors.ink, fontWeight: '600' },
  typeSelector: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 20, padding: 4 },
  typeBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 16, flexDirection: 'row', justifyContent: 'center' },
  typeBtnActiveDebt: { backgroundColor: Colors.danger },
  typeBtnActiveRec: { backgroundColor: Colors.success },
  typeBtnText: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary, marginLeft: 8 },
  typeBtnTextActive: { color: '#FFF' },
  projectList: { flexDirection: 'row' },
  projectItem: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#F3F4F6', borderRadius: 12, marginRight: 10 },
  projectItemActive: { backgroundColor: Colors.accent },
  projectItemText: { fontWeight: '700', color: Colors.textSecondary },
  projectItemTextActive: { color: '#FFF' },
  submitBtn: { backgroundColor: Colors.ink, paddingVertical: 20, borderRadius: 24, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  submitBtnText: { color: '#FFF', fontSize: 18, fontWeight: '900', marginLeft: 10 },
  catBadgeRow: { flexDirection: 'row', gap: 6, marginTop: 10 },
  catBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  catBadgeEssential: { backgroundColor: Colors.accent + '15' },
  catBadgePersonal: { backgroundColor: Colors.warning + '15' },
  catBadgeInvestment: { backgroundColor: Colors.success + '15' },
  catBadgeText: { fontSize: 10, fontWeight: '800', color: Colors.ink, opacity: 0.7 },
  categorySelectorSmall: { flexDirection: 'row', gap: 6, backgroundColor: '#F3F4F6', padding: 3, borderRadius: 10 },
  catBtnSmall: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
  catBtnTextSmall: { fontSize: 12, fontWeight: '800', color: Colors.textSecondary },
  hintText: { fontSize: 11, color: Colors.textSecondary, marginTop: 8, fontStyle: 'italic', textAlign: 'center' },
  historyItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  natureDot: { width: 8, height: 8, borderRadius: 4 },
  historyDesc: { fontSize: 14, fontWeight: '700', color: Colors.ink },
  historyDate: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  historyAmount: { fontSize: 14, fontWeight: '900' },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 20, alignSelf: 'center', backgroundColor: '#F9FAFB', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#F3F4F6' },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: Colors.accent, marginRight: 10, justifyContent: 'center', alignItems: 'center' },
  checkboxActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  checkboxLabel: { fontSize: 14, fontWeight: '700', color: Colors.ink },
});
