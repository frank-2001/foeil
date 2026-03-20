import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  Dimensions, 
  KeyboardAvoidingView, 
  Platform,
  Alert
} from 'react-native';
import { Colors, Spacing, Typography } from '../../utils/theme';
import { useNavigation } from '@react-navigation/native';
import { 
  X, 
  ChevronDown, 
  CreditCard, 
  Banknote, 
  Landmark, 
  Target, 
  FileText,
  Plus,
  Check,
  Shield,
  Heart,
  TrendingUp as TrendingIcon
} from 'lucide-react-native';
import { DatabaseService } from '../../services/DatabaseService';
import { FinancialEngine } from '../../services/FinancialEngine';
import { Currency, Source, Project, Obligation } from '../../database/types';

const { width, height } = Dimensions.get('window');

interface TransactionModalProps {
  visible: boolean;
  onClose: () => void;
  type?: 'income' | 'expense';
}

export const TransactionModal = ({ visible, onClose, type: initialType = 'expense' }: TransactionModalProps) => {
  const navigation = useNavigation<any>();
  const [type, setType] = useState<'income' | 'expense'>(initialType);
  const [nature, setNature] = useState<'cash' | 'virtual'>('cash');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  // Form selections
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null);
  
  const [sources, setSources] = useState<Source[]>([]);
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const [obligations, setObligations] = useState<Obligation[]>([]);
  const [selectedObligation, setSelectedObligation] = useState<Obligation | null>(null);

  // Selector visibility
  const [pickerType, setPickerType] = useState<'currency' | 'source' | 'project' | 'obligation' | null>(null);

  // Quick Add Modal States
  const [showAddCurrency, setShowAddCurrency] = useState(false);
  const [showAddProject, setShowAddProject] = useState(false);
  const [showAddSource, setShowAddSource] = useState(false);
  const [showAddObligation, setShowAddObligation] = useState(false);

  // Quick Add Form States
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newRate, setNewRate] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newIsBoth, setNewIsBoth] = useState(false);
  const [newObligationType, setNewObligationType] = useState<'debt' | 'receivable'>('debt');
  const [newObligationDueDate, setNewObligationDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [newObligationSettledAmount, setNewObligationSettledAmount] = useState('');
  const [newSourceCategory, setNewSourceCategory] = useState<'essential' | 'personal' | 'investment'>('essential');
  const [newObligationAllocation, setNewObligationAllocation] = useState<string[]>(['essential']);
  const [newObligationSkipImpact, setNewObligationSkipImpact] = useState(false);

  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible]);

  const loadData = async () => {
    try {
      const [curr, src, proj, obl] = await Promise.all([
        DatabaseService.getAllCurrencies(),
        DatabaseService.getAllSources(),
        DatabaseService.getAllProjects(),
        DatabaseService.getAllObligations()
      ]);
      setCurrencies(curr);
      setSources(src);
      setProjects(proj);
      setObligations(obl);

      // Defaults
      if (curr.length > 0) setSelectedCurrency(curr.find(c => c.is_main) || curr[0]);
      setSelectedSource(null);
    } catch (error) {
      console.error('Error loading modal data:', error);
    }
  };

  const handleSubmit = async () => {
    const isObligationPayment = selectedObligation !== null;
    if (!amount || !selectedCurrency || (!selectedSource && !isObligationPayment)) {
      Alert.alert('Erreur', 'Veuillez remplir les champs obligatoires (Montant, Devise, Source)');
      return;
    }

    try {
      const originalAmount = parseFloat(amount);

      await FinancialEngine.calculateAndSaveTransaction({
        source_id: selectedSource?.id || null, // null if it's a pure obligation payment without specific source
        currency_id: selectedCurrency.id,
        project_id: selectedProject?.id,
        obligation_id: selectedObligation?.id,
        type,
        nature,
        amount_original: originalAmount,
        description: description || 'Transaction sans titre',
        category: selectedSource?.category || 'essential',
        transaction_date: new Date().toISOString()
      });
      
      Alert.alert('Succès', 'Transaction enregistrée avec succès !');
      onClose();
      // Reset form
      setAmount('');
      setDescription('');
    } catch (error: any) {
      if (error.message === 'BUDGET_EXCEEDED') {
        Alert.alert(
          'Budget insuffisant',
          'Le solde de ce budget est trop bas pour cette dépense.',
          [
            { text: 'Annuler', style: 'cancel' },
            { 
              text: 'Gérer le Budget', 
              onPress: () => {
                onClose();
                navigation.navigate('BudgetManagement');
              } 
            }
          ]
        );
      } else {
        console.error('Submit error:', error);
        Alert.alert('Erreur', "Impossible d'enregistrer la transaction");
      }
    }
  };

  const handleQuickAddEntity = async (entityType: 'currency' | 'project' | 'source' | 'obligation') => {
    try {
      let newId: number | null = null;
      if (entityType === 'currency') {
        if (!newCode || !newName || !newRate) return;
        newId = await DatabaseService.addCurrency(newCode, newName, parseFloat(newRate));
        setShowAddCurrency(false);
      } else if (entityType === 'project') {
        if (!newName) return;
        newId = await DatabaseService.addProject(newName, newAmount ? parseFloat(newAmount) : undefined, 0, 'planning');
        setShowAddProject(false);
      } else if (entityType === 'source') {
        if (!newName) return;
        const sourceType = newIsBoth ? 'both' : (type === 'income' ? 'income' : 'expense');
        const srcCat = (sourceType === 'expense' || sourceType === 'both') ? newSourceCategory : undefined;
        newId = await DatabaseService.addSource(newName, sourceType, selectedProject?.id, srcCat);
        setShowAddSource(false);
      } else if (entityType === 'obligation') {
        if (!newName || !newAmount) return;
        const total = parseFloat(newAmount);
        const settled = parseFloat(newObligationSettledAmount || '0');
        const remaining = total - settled;
        newId = await FinancialEngine.createObligationWithImpact({
          name: newName, 
          type: newObligationType, 
          total_amount: total, 
          remaining_amount: remaining >= 0 ? remaining : 0,
          due_date: newObligationDueDate || new Date().toISOString(), 
          project_id: selectedProject?.id,
          budget_allocation: newObligationAllocation.join(','),
          currency_id: selectedCurrency?.id || 1,
          skipBalanceImpact: newObligationSkipImpact
        });
        setShowAddObligation(false);
      }
      
      // Clean up and refresh
      setNewName(''); setNewCode(''); setNewRate(''); setNewAmount('');
      setNewIsBoth(false);
      setNewObligationType('debt');
      setNewObligationDueDate(new Date().toISOString().split('T')[0]);
      setNewObligationSettledAmount('');
      setNewObligationAllocation(['essential']);
      
      // Load and Auto-select
      const [curr, src, proj, obl] = await Promise.all([
        DatabaseService.getAllCurrencies(),
        DatabaseService.getAllSources(),
        DatabaseService.getAllProjects(),
        DatabaseService.getAllObligations()
      ]);
      setCurrencies(curr);
      setSources(src);
      setProjects(proj);
      setObligations(obl);

      if (newId) {
        if (entityType === 'currency') setSelectedCurrency(curr.find(c => c.id === newId) || null);
        if (entityType === 'source') setSelectedSource(src.find(s => s.id === newId) || null);
        if (entityType === 'project') setSelectedProject(proj.find(p => p.id === newId) || null);
        if (entityType === 'obligation') setSelectedObligation(obl.find(o => o.id === newId) || null);
      }
    } catch (e) {
      Alert.alert('Erreur', "Impossible d'ajouter l'élément");
    }
  };

  const renderPicker = () => {
    let data : any[] = [];
    let title = "";
    let onSelect = (item: any) => {};
    let selectedId = -1;

    switch(pickerType) {
      case 'currency':
        data = currencies;
        title = "Devise";
        onSelect = (item) => setSelectedCurrency(item);
        selectedId = selectedCurrency?.id || -1;
        break;
      case 'source': {
        // Filter by transaction type AND project link
        const typeCompatible = sources.filter(s => s.type === type || s.type === 'both');
        
        data = selectedProject
          ? typeCompatible.filter(s => s.project_id === selectedProject.id)
          : typeCompatible.filter(s => s.project_id === null);

        title = selectedProject
          ? `Sources — ${selectedProject.name}`
          : (type === 'income' ? 'Source de revenu' : 'Source de dépense');
        onSelect = (item) => {
          // Always select the source itself
          setSelectedSource(item);
          // If the source belongs to a project, auto-select that project too
          if (item.project_id) {
            const project = projects.find(p => p.id === item.project_id);
            if (project) setSelectedProject(project);
          }
        };
        selectedId = selectedSource?.id || -1;
        break;
      }
      case 'project':
        data = projects;
        title = "Projet";
        onSelect = (item) => {
          setSelectedProject(item);
          // Auto-reset source if it doesn't match the new project project_id
          if (item && selectedSource?.project_id && selectedSource.project_id !== item.id) {
            setSelectedSource(null);
          }
        };
        selectedId = selectedProject?.id || -1;
        break;
      case 'obligation':
        // Filter obligations by type: Income -> Receivables, Expense -> Debts
        data = obligations.filter(o => {
          if (type === 'income') return o.type === 'receivable';
          if (type === 'expense') return o.type === 'debt';
          return true;
        });
        title = type === 'income' ? "Remboursement de Créance" : "Remboursement de Dette";
        onSelect = (item) => {
          setSelectedObligation(item);
          if (item.project_id) {
            const project = projects.find(p => p.id === item.project_id);
            if (project) setSelectedProject(project);
          }
        };
        selectedId = selectedObligation?.id || -1;
        break;
    }

    if (!pickerType) return null;

    return (
      <Modal visible={pickerType !== null} transparent animationType="fade">
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerContent}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>{title}</Text>
              <View style={styles.row}>
                <TouchableOpacity 
                   onPress={() => {
                     if (pickerType === 'currency') setShowAddCurrency(true);
                     if (pickerType === 'project') setShowAddProject(true);
                     if (pickerType === 'source') setShowAddSource(true);
                     if (pickerType === 'obligation') {
                      setNewObligationType(type === 'income' ? 'receivable' : 'debt');
                      setNewObligationSkipImpact(false);
                      setShowAddObligation(true);
                    }
                   }}
                   style={styles.quickAddBtn}
                >
                  <Plus stroke={Colors.accent} size={20} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setPickerType(null)} style={{ marginLeft: 10 }}>
                  <X stroke={Colors.ink} size={24} />
                </TouchableOpacity>
              </View>
            </View>
            <ScrollView style={{ maxHeight: 350 }}>
              {data.map(item => (
                <TouchableOpacity 
                  key={item.id} 
                  style={[styles.pickerItem, selectedId === item.id && styles.pickerItemActive]}
                  onPress={() => { onSelect(item); setPickerType(null); }}
                >
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text 
                      style={[styles.pickerItemText, selectedId === item.id && styles.pickerItemTextActive]}
                      numberOfLines={1}
                      ellipsizeMode="middle"
                    >
                      {item.code || item.name} {item.code ? `- ${item.name}` : ''}
                    </Text>
                    <View style={styles.itemBadgeRow}>
                      {item.project_id && <Text style={styles.itemBadge}>Lié au projet</Text>}
                      {pickerType === 'source' && (
                        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                          <Text style={[
                            styles.sourceTypeBadge,
                            item.type === 'income' && styles.sourceTypeBadgeIncome,
                            item.type === 'expense' && styles.sourceTypeBadgeExpense,
                            item.type === 'both' && styles.sourceTypeBadgeBoth,
                          ]}>
                            {item.type === 'income' ? 'Revenu' : item.type === 'expense' ? 'Dépense' : 'Mixte'}
                          </Text>
                          {item.category && (
                            <View style={[
                              styles.sourceCatBadge,
                              item.category === 'essential' && { backgroundColor: Colors.accent + '15' },
                              item.category === 'personal' && { backgroundColor: Colors.warning + '15' },
                              item.category === 'investment' && { backgroundColor: Colors.success + '15' }
                            ]}>
                               <Text style={[
                                 styles.sourceCatBadgeText,
                                 item.category === 'essential' && { color: Colors.accent },
                                 item.category === 'personal' && { color: Colors.warning },
                                 item.category === 'investment' && { color: Colors.success }
                               ]}>
                                 {item.category === 'essential' ? 'Essentiel' : item.category === 'personal' ? 'Plaisir' : 'Épargne'}
                               </Text>
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  </View>
                  {selectedId === item.id && <Check stroke={Colors.accent} size={20} />}
                </TouchableOpacity>
              ))}
              {data.length === 0 && <Text style={styles.emptyText}>Aucune donnée disponible</Text>}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.dismissArea} activeOpacity={1} onPress={onClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
          keyboardVerticalOffset={0}
        >
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Nouvelle Transaction</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X stroke={Colors.ink} size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
            <View style={styles.typeSelector}>
              <TouchableOpacity 
                style={[styles.typeBtn, type === 'income' && styles.typeBtnActiveIncome]} 
                onPress={() => {
                  setType('income');
                  // Reset source if incompatible with income
                  if (selectedSource && selectedSource.type === 'expense') setSelectedSource(null);
                  // Reset obligation if incompatible with income (should be receivable)
                  if (selectedObligation && selectedObligation.type === 'debt') setSelectedObligation(null);
                }}
              >
                <Text style={[styles.typeBtnText, type === 'income' && styles.typeBtnTextActive]}>Revenu</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.typeBtn, type === 'expense' && styles.typeBtnActiveExpense]} 
                onPress={() => {
                  setType('expense');
                  // Reset source if incompatible with expense
                  if (selectedSource && selectedSource.type === 'income') setSelectedSource(null);
                  // Reset obligation if incompatible with expense (should be debt)
                  if (selectedObligation && selectedObligation.type === 'receivable') setSelectedObligation(null);
                }}
              >
                <Text style={[styles.typeBtnText, type === 'expense' && styles.typeBtnTextActive]}>Dépense</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Montant et Devise</Text>
              <View style={styles.amountInputRow}>
                <TextInput 
                  style={styles.amountInput}
                  placeholder="0.00"
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                  placeholderTextColor="rgba(0,0,0,0.2)"
                />
                <TouchableOpacity style={styles.currencySelector} onPress={() => setPickerType('currency')}>
                  <Text style={styles.currencyCode}>{selectedCurrency?.code || '...'}</Text>
                  <ChevronDown size={16} stroke={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
              {selectedCurrency && !selectedCurrency.is_main && amount && (
                <View style={styles.conversionRow}>
                  <Text style={styles.conversionText}>
                    ≈ {(parseFloat(amount) / selectedCurrency.exchange_rate_to_main).toFixed(2)} {currencies.find(c => c.is_main)?.code || 'Base'} 
                    <Text style={styles.conversionRate}> (1 {currencies.find(c => c.is_main)?.code} = {selectedCurrency.exchange_rate_to_main} {selectedCurrency.code})</Text>
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Projet lié (Optionnel)</Text>
              <TouchableOpacity style={styles.pickerBtn} onPress={() => setPickerType('project')}>
                <View style={[styles.row, { flex: 1 }]}>
                  <Target stroke={Colors.success} size={20} />
                  <Text style={styles.pickerText} numberOfLines={1}>{selectedProject ? selectedProject.name : 'Aucun projet lié'}</Text>
                </View>
                {selectedProject && <TouchableOpacity onPress={() => setSelectedProject(null)}><X size={16} stroke={Colors.danger} /></TouchableOpacity>}
                <ChevronDown stroke={Colors.textSecondary} size={20} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nature des fonds</Text>
              <View style={styles.natureRow}>
                <TouchableOpacity 
                  style={[styles.natureBtn, nature === 'cash' && styles.natureBtnActive]} 
                  onPress={() => setNature('cash')}
                >
                  <Banknote stroke={nature === 'cash' ? Colors.accent : Colors.textSecondary} size={20} />
                  <Text style={[styles.natureBtnText, nature === 'cash' && styles.natureBtnTextActive]}>Cash</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.natureBtn, nature === 'virtual' && styles.natureBtnActive]} 
                  onPress={() => setNature('virtual')}
                >
                  <CreditCard stroke={nature === 'virtual' ? Colors.accent : Colors.textSecondary} size={20} />
                  <Text style={[styles.natureBtnText, nature === 'virtual' && styles.natureBtnTextActive]}>Virtuel</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.sourceLabelRow}>
                <Text style={[styles.label, { marginBottom: 0 }]}>Source / Origine</Text>
                {selectedProject && (
                  <View style={styles.projectSourceTag}>
                    <Target stroke={Colors.success} size={12} />
                    <Text style={styles.projectSourceTagText}>{selectedProject.name}</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity style={styles.pickerBtn} onPress={() => setPickerType('source')}>
                <View style={[styles.row, { flex: 1 }]}>
                  <Landmark stroke={Colors.accent} size={20} />
                  <Text style={styles.pickerText} numberOfLines={1}>{selectedSource ? selectedSource.name : 'Sélectionner une source'}</Text>
                </View>
                <ChevronDown stroke={Colors.textSecondary} size={20} />
              </TouchableOpacity>
              {selectedProject && !selectedSource && (() => {
                const hasProjectSources = sources.some(
                  s => s.project_id === selectedProject.id && (s.type === type || s.type === 'both')
                );
                return hasProjectSources
                  ? <Text style={styles.warningText}>⚠️ Choisissez une source liée à «{selectedProject.name}».</Text>
                  : <Text style={styles.warningText}>⚠️ Aucune source pour ce projet — appuyez sur + pour en créer une.</Text>;
              })()}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Obligation liée (Optionnel)</Text>
              <TouchableOpacity style={styles.pickerBtn} onPress={() => setPickerType('obligation')}>
                <View style={[styles.row, { flex: 1 }]}>
                  <FileText stroke={Colors.danger} size={20} />
                  <Text style={styles.pickerText} numberOfLines={1}>{selectedObligation ? selectedObligation.name : 'Aucun lien obligation'}</Text>
                </View>
                {selectedObligation && <TouchableOpacity onPress={() => setSelectedObligation(null)}><X size={16} stroke={Colors.danger} /></TouchableOpacity>}
                <ChevronDown stroke={Colors.textSecondary} size={20} />
              </TouchableOpacity>
            </View>


            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput 
                style={styles.textArea}
                placeholder="Ex: Prime du mois, Achat groupe, etc."
                multiline
                numberOfLines={3}
                value={description}
                onChangeText={setDescription}
                placeholderTextColor="rgba(0,0,0,0.2)"
              />
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
              <Text style={styles.submitBtnText}>Enregistrer la transaction</Text>
            </TouchableOpacity>
            
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
        </KeyboardAvoidingView>
        {renderPicker()}

        {/* --- Quick Add Modals --- */}
        <QuickAddModal 
          visible={showAddCurrency} 
          onClose={() => setShowAddCurrency(false)}
          title="Nouvelle Devise"
          onSubmit={() => handleQuickAddEntity('currency')}
        >
          <TextInput style={styles.qInput} placeholder="Code (ex: EUR)" maxLength={3} value={newCode} onChangeText={setNewCode} />
          <TextInput style={styles.qInput} placeholder="Nom Complet" value={newName} onChangeText={setNewName} />
          <TextInput style={styles.qInput} placeholder="Taux (1 Base = X Devise)" keyboardType="numeric" value={newRate} onChangeText={setNewRate} />
        </QuickAddModal>

        <QuickAddModal 
          visible={showAddProject} 
          onClose={() => setShowAddProject(false)}
          title="Nouveau Projet"
          onSubmit={() => handleQuickAddEntity('project')}
        >
          <TextInput style={styles.qInput} placeholder="Nom du projet" value={newName} onChangeText={setNewName} />
          <TextInput style={styles.qInput} placeholder="Coût estimé" keyboardType="numeric" value={newAmount} onChangeText={setNewAmount} />
        </QuickAddModal>

        <QuickAddModal 
          visible={showAddSource} 
          onClose={() => setShowAddSource(false)}
          title="Nouvelle Source"
          onSubmit={() => handleQuickAddEntity('source')}
        >
          <TextInput style={styles.qInput} placeholder="Nom (ex: Bonus, Freelance...)" value={newName} onChangeText={setNewName} />
          
          <TouchableOpacity 
            style={styles.checkboxContainer} 
            onPress={() => setNewIsBoth(!newIsBoth)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, newIsBoth && styles.checkboxActive]}>
              {newIsBoth && <Check stroke="#FFF" size={14} strokeWidth={3} />}
            </View>
            <Text style={styles.checkboxLabel}>Mixte (Revenu & Dépense)</Text>
          </TouchableOpacity>

          {/* Category selection for expense/mixed sources */}
          {(newIsBoth || type === 'expense') && (
            <View style={{ marginBottom: 20 }}>
              <Text style={styles.labelSmall}>Budget de dépense lié</Text>
              <View style={styles.categorySelectorSmall}>
                <TouchableOpacity 
                  style={[styles.catBtnSmall, newSourceCategory === 'essential' && { backgroundColor: Colors.accent }]}
                  onPress={() => setNewSourceCategory('essential')}
                >
                  <Text style={[styles.catBtnTextSmall, newSourceCategory === 'essential' && { color: '#FFF' }]}>Essentiel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.catBtnSmall, newSourceCategory === 'personal' && { backgroundColor: Colors.warning }]}
                  onPress={() => setNewSourceCategory('personal')}
                >
                  <Text style={[styles.catBtnTextSmall, newSourceCategory === 'personal' && { color: '#FFF' }]}>Plaisir</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.catBtnSmall, newSourceCategory === 'investment' && { backgroundColor: Colors.success }]}
                  onPress={() => setNewSourceCategory('investment')}
                >
                  <Text style={[styles.catBtnTextSmall, newSourceCategory === 'investment' && { color: '#FFF' }]}>Épargne</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <Text style={styles.qHint}>Sera liée au projet actuel si sélectionné.</Text>
        </QuickAddModal>

        <QuickAddModal 
          visible={showAddObligation} 
          onClose={() => setShowAddObligation(false)}
          title="Nouvelle Obligation"
          onSubmit={() => handleQuickAddEntity('obligation')}
        >
          <TextInput style={styles.qInput} placeholder="Titre (ex: Prêt à Jean)" value={newName} onChangeText={setNewName} />
          
          <View style={styles.typeSelectorSmall}>
            <TouchableOpacity 
              style={[styles.typeBtnSmall, newObligationType === 'debt' && styles.typeBtnActiveDebt]} 
              onPress={() => setNewObligationType('debt')}
            >
              <Text style={[styles.typeBtnTextSmall, newObligationType === 'debt' && styles.typeBtnTextActive]}>Dette</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.typeBtnSmall, newObligationType === 'receivable' && styles.typeBtnActiveRec]} 
              onPress={() => setNewObligationType('receivable')}
            >
              <Text style={[styles.typeBtnTextSmall, newObligationType === 'receivable' && styles.typeBtnTextActive]}>Créance</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.checkboxContainer} 
            onPress={() => setNewObligationSkipImpact(!newObligationSkipImpact)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, newObligationSkipImpact && styles.checkboxActive]}>
              {newObligationSkipImpact && <Check stroke="#FFF" size={14} strokeWidth={3} />}
            </View>
            <Text style={styles.checkboxLabel}>Sans impact cash (Achat à crédit)</Text>
          </TouchableOpacity>

          <View style={{ marginBottom: 15 }}>
            <Text style={styles.labelSmall}>Allocation Budget (30-30-40)</Text>
            <View style={styles.categorySelectorSmall}>
              {(['essential', 'personal', 'investment'] as const).map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.catBtnSmall,
                    newObligationAllocation.includes(cat) && {
                      backgroundColor:
                        cat === 'essential' ? Colors.accent :
                        cat === 'personal' ? Colors.warning : Colors.success
                    }
                  ]}
                  onPress={() => {
                    setNewObligationAllocation(prev => 
                      prev.includes(cat) 
                        ? (prev.length > 1 ? prev.filter(c => c !== cat) : prev)
                        : [...prev, cat]
                    );
                  }}
                >
                  <Text style={[styles.catBtnTextSmall, newObligationAllocation.includes(cat) && { color: '#FFF' }]}>
                    {cat === 'essential' ? 'Essentiel' : cat === 'personal' ? 'Plaisir' : 'Épargne'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.row}>
            <TextInput 
              style={[styles.qInput, { flex: 1, marginRight: 10 }]} 
              placeholder="Montant Total" 
              keyboardType="numeric" 
              value={newAmount} 
              onChangeText={setNewAmount} 
            />
            <TextInput 
              style={[styles.qInput, { flex: 1 }]} 
              placeholder="Déjà réglé" 
              keyboardType="numeric" 
              value={newObligationSettledAmount} 
              onChangeText={setNewObligationSettledAmount} 
            />
          </View>

          <TextInput 
             style={styles.qInput} 
             placeholder="Date d'échéance (YYYY-MM-DD)" 
             value={newObligationDueDate} 
             onChangeText={setNewObligationDueDate} 
          />
          
          <Text style={styles.qHint}>Sera liée au projet actuel si sélectionné.</Text>
        </QuickAddModal>
      </View>
    </Modal>
  );
};

const QuickAddModal = ({ visible, onClose, title, onSubmit, children }: any) => (
  <Modal visible={visible} transparent animationType="fade">
    <View style={styles.pickerOverlay}>
      <View style={styles.pickerContent}>
        <View style={styles.pickerHeader}>
          <Text style={styles.pickerTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose}><X stroke={Colors.ink} size={24} /></TouchableOpacity>
        </View>
        {children}
        <TouchableOpacity style={styles.qSubmit} onPress={onSubmit}>
          <Text style={styles.qSubmitText}>Ajouter</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  flex1: { flex: 1 },
  dismissArea: { flex: 1 },
  modalContent: { backgroundColor: '#FFF', maxHeight: height * 0.9, borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: Spacing.xl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { ...Typography.h2, fontSize: 22 },
  closeBtn: { backgroundColor: '#F3F4F6', padding: 10, borderRadius: 20 },
  form: { paddingBottom: 20 },
  typeSelector: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 20, padding: 4, marginBottom: 24 },
  typeBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 16 },
  typeBtnActiveExpense: { backgroundColor: Colors.danger },
  typeBtnActiveIncome: { backgroundColor: Colors.success },
  typeBtnText: { fontSize: 15, fontWeight: '700', color: Colors.textSecondary },
  typeBtnTextActive: { color: '#FFF' },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '700', color: Colors.ink, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  amountInputRow: { flexDirection: 'row', alignItems: 'baseline', borderBottomWidth: 2, borderBottomColor: '#F3F4F6', paddingBottom: 8 },
  amountInput: { fontSize: 48, fontWeight: '900', color: Colors.ink, flex: 1 },
  currencySelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  currencyCode: { fontSize: 20, fontWeight: '800', color: Colors.ink, marginRight: 6 },
  conversionRow: { marginTop: 8, paddingHorizontal: 4 },
  conversionText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  conversionRate: { fontSize: 11, fontStyle: 'italic', opacity: 0.7 },
  natureRow: { flexDirection: 'row', justifyContent: 'space-between' },
  natureBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#F3F4F6', paddingVertical: 14, paddingHorizontal: 20, borderRadius: 18, width: '48%', justifyContent: 'center' },
  natureBtnActive: { borderColor: Colors.accent, backgroundColor: Colors.accent + '05' },
  natureBtnText: { marginLeft: 10, fontSize: 15, fontWeight: '700', color: Colors.textSecondary },
  natureBtnTextActive: { color: Colors.accent },
  pickerBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F9FAFB', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: '#F3F4F6', marginBottom: 6 },
  sourceLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  projectSourceTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.success + '15', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, gap: 4 },
  projectSourceTagText: { fontSize: 11, color: Colors.success, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center' },
  pickerText: { marginLeft: 12, fontSize: 15, color: Colors.text, fontWeight: '700', flex: 1 },
  warningText: { fontSize: 11, color: Colors.warning, marginLeft: 10, fontWeight: '600' },
  itemBadge: { fontSize: 10, color: Colors.accent, fontWeight: '700', marginTop: 2 },
  itemBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  sourceTypeBadge: { fontSize: 10, fontWeight: '700', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, overflow: 'hidden' },
  sourceTypeBadgeIncome: { backgroundColor: Colors.success + '20', color: Colors.success },
  sourceTypeBadgeExpense: { backgroundColor: Colors.danger + '20', color: Colors.danger },
  sourceTypeBadgeBoth: { backgroundColor: Colors.accent + '20', color: Colors.accent },
  quickAddBtn: { backgroundColor: Colors.accent + '15', padding: 8, borderRadius: 12 },
  qInput: { backgroundColor: '#F9FAFB', borderRadius: 16, padding: 14, marginBottom: 15, fontSize: 15, borderWidth: 1, borderColor: '#F3F4F6', color: Colors.ink },
  qSubmit: { backgroundColor: Colors.ink, padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 5 },
  qSubmitText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
  qHint: { fontSize: 12, color: Colors.textSecondary, marginBottom: 15, textAlign: 'center' },
  typeSelectorSmall: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 12, padding: 3, marginBottom: 15 },
  typeBtnSmall: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  typeBtnActiveDebt: { backgroundColor: Colors.danger },
  typeBtnActiveRec: { backgroundColor: Colors.success },
  typeBtnTextSmall: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, alignSelf: 'center', backgroundColor: '#F9FAFB', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#F3F4F6' },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: Colors.accent, marginRight: 10, justifyContent: 'center', alignItems: 'center' },
  checkboxActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  checkboxLabel: { fontSize: 14, fontWeight: '700', color: Colors.ink },
  textArea: { backgroundColor: '#F9FAFB', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#F3F4F6', fontSize: 15, color: Colors.text, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: Colors.ink, paddingVertical: 20, borderRadius: 24, alignItems: 'center', marginTop: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 10 },
  submitBtnText: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  pickerContent: { width: width * 0.85, backgroundColor: '#FFF', borderRadius: 24, padding: 25 },
  pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  pickerTitle: { fontSize: 18, fontWeight: '900', color: Colors.ink },
  pickerItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pickerItemActive: { backgroundColor: Colors.accent + '05' },
  pickerItemText: { fontSize: 16, color: Colors.text, fontWeight: '500' },
  pickerItemTextActive: { color: Colors.accent, fontWeight: '800' },
  emptyText: { textAlign: 'center', marginVertical: 20, color: Colors.textSecondary },
  categorySelector: { flexDirection: 'row', gap: 8 },
  categoryBtn: { flex: 1, backgroundColor: '#F3F4F6', paddingVertical: 12, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  categoryBtnActiveEssential: { backgroundColor: Colors.accent },
  categoryBtnActivePersonal: { backgroundColor: Colors.warning },
  categoryBtnActiveInvestment: { backgroundColor: Colors.success },
  categoryBtnText: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, marginTop: 4 },
  categoryBtnTextActive: { color: '#FFF' },
  categoryRate: { fontSize: 9, fontWeight: '900', position: 'absolute', top: 5, right: 8, opacity: 0.5, color: Colors.ink },
  sourceCatBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 5 },
  sourceCatBadgeText: { fontSize: 9, fontWeight: '800' },
  labelSmall: { fontSize: 11, fontWeight: '800', color: Colors.textSecondary, marginBottom: 8, textTransform: 'uppercase' },
  categorySelectorSmall: { flexDirection: 'row', gap: 6, backgroundColor: '#F3F4F6', padding: 3, borderRadius: 10 },
  catBtnSmall: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  catBtnTextSmall: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary },
});
