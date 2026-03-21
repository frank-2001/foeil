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
  Platform
} from 'react-native';
import { Colors, Spacing, Typography } from '../utils/theme';
import { Card } from '../components/Card';
import { 
  Target, 
  TrendingUp, 
  AlertCircle, 
  Plus, 
  ChevronRight, 
  Calculator,
  X,
  Check,
  Trash2,
  Edit3,
  BarChart3,
  Search
} from 'lucide-react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { DatabaseService } from '../services/DatabaseService';
import { Project } from '../database/types';
import { FinancialEngine } from '../services/FinancialEngine';
import { useTheme } from '../context/ThemeContext';

const ScreenHeader = ({ title, subtitle, colors }: { title: string, subtitle: string, colors: any }) => (
  <View style={styles.headerContainer}>
    <Text style={[styles.headerSubtitle, { color: colors.accent }]}>{subtitle}</Text>
    <Text style={[styles.headerTitle, { color: colors.ink }]}>{title}</Text>
  </View>
);

export default function ProjectsScreen() {
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [balance, setBalance] = useState({ total_essential: 0, total_personal: 0, total_investment: 0 });
  
  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [cost, setCost] = useState('');
  const [roi, setRoi] = useState('');
  const [status, setStatus] = useState<'planning' | 'active' | 'completed'>('planning');
  const [parentId, setParentId] = useState<number | null>(null);
  
  const [isCostUnknown, setIsCostUnknown] = useState(false);
  const [isRoiUnknown, setIsRoiUnknown] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const [proj, bal] = await Promise.all([
        DatabaseService.getAllProjects(),
        DatabaseService.getSavingsBalance()
      ]);
      setProjects(proj.sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0)));
      setBalance(bal);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const parseInput = (val: string) => {
    if (!val || val.trim() === '') return undefined;
    const normalized = val.replace(',', '.');
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? undefined : parsed;
  };

  const handleSave = async () => {
    const parsedCost = isCostUnknown ? undefined : parseInput(cost);
    const parsedRoi = isRoiUnknown ? undefined : parseInput(roi);

    if (!name.trim()) {
      Alert.alert('Erreur', 'Le nom du projet est requis');
      return;
    }

    try {
      if (editingId) {
        await DatabaseService.updateProject(editingId, name, parsedCost, parsedRoi, status, parentId || undefined);
      } else {
        await DatabaseService.addProject(name, parsedCost, parsedRoi, status, parentId || undefined);
      }
      setModalVisible(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving project:', error);
      Alert.alert('Erreur', "Impossible de sauvegarder le projet.");
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      'Supprimer',
      'Voulez-vous vraiment supprimer ce projet ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive', 
          onPress: async () => {
            await DatabaseService.deleteProject(id);
            loadData();
          }
        }
      ]
    );
  };

  const openEdit = (p: Project) => {
    setEditingId(p.id);
    setName(p.name);
    setCost(p.estimated_cost?.toString() || '');
    setRoi(p.expected_roi?.toString() || '');
    setIsCostUnknown(!p.estimated_cost);
    setIsRoiUnknown(p.expected_roi === undefined || p.expected_roi === null);
    setStatus(p.status);
    setParentId(p.parent_id || null);
    setModalVisible(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setCost('');
    setRoi('');
    setStatus('planning');
    setParentId(null);
    setIsCostUnknown(false);
    setIsRoiUnknown(false);
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
      <ScrollView contentContainerStyle={styles.listContent}>
        <ScreenHeader title="Projets" subtitle="Investissements et Objectifs" colors={colors} />

        <View style={[styles.searchContainer, { backgroundColor: colors.paper, borderColor: colors.border }]}>
          <Search stroke={colors.textSecondary} size={20} />
          <TextInput 
            style={[styles.searchInput, { color: colors.ink }]}
            placeholder="Rechercher un projet..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.textSecondary + '70'}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X stroke={colors.textSecondary} size={18} />
            </TouchableOpacity>
          )}
        </View>

        <Card style={[styles.summaryHero, { backgroundColor: colors.accent }]}>
          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.heroLabel}>Capacité d'Investissement</Text>
              <Text style={styles.heroValue}>{balance.total_investment.toFixed(2)} $</Text>
            </View>
            <View style={styles.heroIconBox}>
              <Calculator stroke="#FFF" size={32} />
            </View>
          </View>
          <View style={styles.heroFooter}>
            <TrendingUp stroke="#ADFF2F" size={16} />
            <Text style={styles.heroFooterText}>Basé sur vos 40% d'épargne investissement</Text>
          </View>
        </Card>

        <Text style={[styles.sectionHeading, { color: colors.text }]}>Priorité d'Investissement</Text>

        {projects
          .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
          .map((p) => {
          const isSubProject = !!p.parent_id;
          const parentProject = isSubProject ? projects.find(prev => prev.id === p.parent_id) : null;
          
          const estimatedCost = p.estimated_cost || 0;
          const progress = estimatedCost > 0 ? Math.min((balance.total_investment / estimatedCost) * 100, 100) : 0;
          const isReady = estimatedCost > 0 && balance.total_investment >= estimatedCost;
          const isIndeterminate = !p.estimated_cost;

          return (
            <TouchableOpacity 
              key={p.id} 
              activeOpacity={0.7}
              onPress={() => navigation.navigate('ProjectDetails', { projectId: p.id, projectName: p.name })}
            >
              <Card style={[styles.projectCard, isSubProject && { borderLeftColor: colors.accent, borderLeftWidth: 4, marginLeft: 20 }]}>
                <View style={styles.projectHeader}>
                  <View style={styles.flex1}>
                    <View style={styles.row}>
                      <Text style={[styles.projectName, { color: colors.text }]}>{p.name}</Text>
                      {isSubProject && (
                        <View style={[styles.objectiveBadge, { backgroundColor: colors.accent + '15' }]}>
                          <Text style={[styles.objectiveBadgeText, { color: colors.accent }]}>Objectif</Text>
                        </View>
                      )}
                    </View>
                    {parentProject && <Text style={[styles.parentLink, { color: colors.textSecondary }]}>Partie de: {parentProject.name}</Text>}
                    <View style={styles.statusRow}>
                      <Text style={[styles.statusText, { color: isIndeterminate ? colors.textSecondary : (isReady ? colors.success : colors.accent) }]}>
                        {isIndeterminate ? 'Chiffrage en attente' : (isReady ? 'Financé' : (p.status === 'planning' ? 'En attente' : 'En progression'))}
                      </Text>
                      {p.expected_roi !== undefined && (
                        <>
                          <Text style={[styles.dot, { color: colors.textSecondary }]}> • </Text>
                          <Text style={[styles.roiText, { color: colors.textSecondary }]}>ROI: {p.expected_roi}%</Text>
                        </>
                      )}
                      {p.priority_score !== null && p.priority_score !== undefined && (
                        <>
                          <Text style={[styles.dot, { color: colors.textSecondary }]}> • </Text>
                          <Text style={[styles.priorityLabel, { color: colors.warning }]}>Score: {p.priority_score.toFixed(2)}</Text>
                        </>
                      )}
                    </View>
                  </View>
                  <View style={styles.actionRow}>
                    <TouchableOpacity onPress={() => openEdit(p)} style={[styles.actionBtn, { backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1 }]}>
                      <Edit3 stroke={colors.textSecondary} size={18} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(p.id)} style={[styles.actionBtn, { marginLeft: 8, backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1 }]}>
                      <Trash2 stroke={colors.danger} size={18} />
                    </TouchableOpacity>
                  </View>
                </View>

                {!isIndeterminate && (
                  <View style={styles.progContainer}>
                    <View style={[styles.progBar, { backgroundColor: colors.background }]}>
                      <View style={[styles.progFill, { width: `${progress}%`, backgroundColor: isReady ? colors.success : colors.accent }]} />
                    </View>
                    <View style={styles.rowBetween}>
                      <Text style={[styles.progVal, { color: colors.textSecondary }]}>{balance.total_investment.toFixed(0)} $ / {estimatedCost} $</Text>
                      <Text style={[styles.progPct, { color: isReady ? colors.success : colors.accent }]}>{progress.toFixed(0)}%</Text>
                    </View>
                  </View>
                )}
              </Card>
            </TouchableOpacity>
          );
        })}

        {projects.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={{ color: colors.textSecondary }}>Aucun projet configuré</Text>
          </View>
        )}

        <View style={[styles.infoTip, { backgroundColor: colors.ink + '05' }]}>
          <AlertCircle stroke={colors.textSecondary} size={20} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Les projets sont classés par score de priorité (ROI / Coût) pour maximiser le rendement de votre épargne.
          </Text>
        </View>
      </ScrollView>

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
              <Text style={[styles.modalTitle, { color: colors.ink }]}>{editingId ? 'Modifier Projet' : 'Nouveau Projet'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={[styles.closeBtn, { backgroundColor: colors.background }]}>
                <X stroke={colors.ink} size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Nom du projet</Text>
                <TextInput 
                  style={[styles.input, { backgroundColor: colors.background, color: colors.ink, borderColor: colors.border }]}
                  placeholder="Ex: Immobilier, Crypto, Business..."
                  placeholderTextColor={colors.textSecondary + '70'}
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={styles.rowBetween}>
                <View style={[styles.formGroup, { width: '48%' }]}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Coût Estimé ($)</Text>
                  <TextInput 
                    style={[styles.input, { backgroundColor: colors.background, color: colors.ink, borderColor: colors.border }, isCostUnknown && styles.inputDisabled]}
                    placeholder="0.00"
                    placeholderTextColor={colors.textSecondary + '70'}
                    keyboardType="numeric"
                    value={cost}
                    onChangeText={setCost}
                    editable={!isCostUnknown}
                  />
                  <TouchableOpacity 
                    style={styles.formCheckbox} 
                    onPress={() => setIsCostUnknown(!isCostUnknown)}
                  >
                    <View style={[styles.miniBox, { borderColor: colors.accent }, isCostUnknown && { backgroundColor: colors.accent }]}>
                      {isCostUnknown && <Check stroke={colors.paper} size={10} strokeWidth={4} />}
                    </View>
                    <Text style={[styles.formCheckboxLabel, { color: colors.textSecondary }]}>Non défini</Text>
                  </TouchableOpacity>
                </View>
                <View style={[styles.formGroup, { width: '48%' }]}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>ROI Attendu (%)</Text>
                  <TextInput 
                    style={[styles.input, { backgroundColor: colors.background, color: colors.ink, borderColor: colors.border }, isRoiUnknown && styles.inputDisabled]}
                    placeholder="0"
                    placeholderTextColor={colors.textSecondary + '70'}
                    keyboardType="numeric"
                    value={roi}
                    onChangeText={setRoi}
                    editable={!isRoiUnknown}
                  />
                  <TouchableOpacity 
                    style={styles.formCheckbox} 
                    onPress={() => setIsRoiUnknown(!isRoiUnknown)}
                  >
                    <View style={[styles.miniBox, { borderColor: colors.accent }, isRoiUnknown && { backgroundColor: colors.accent }]}>
                      {isRoiUnknown && <Check stroke={colors.paper} size={10} strokeWidth={4} />}
                    </View>
                    <Text style={[styles.formCheckboxLabel, { color: colors.textSecondary }]}>Inconnu</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Status et Parent</Text>
                <View style={[styles.statusSelector, { backgroundColor: colors.background, marginBottom: 15 }]}>
                  {(['planning', 'active', 'completed'] as const).map((s) => (
                    <TouchableOpacity 
                      key={s}
                      style={[styles.statusBtn, status === s && { backgroundColor: colors.accent }]}
                      onPress={() => setStatus(s)}
                    >
                      <Text style={[styles.statusBtnText, { color: colors.textSecondary }, status === s && { color: colors.paper }]}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                <Text style={[styles.label, { color: colors.textSecondary }]}>Projet Parent / Dossier (Optionnel)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.parentSelector}>
                    <TouchableOpacity 
                      style={[styles.parentTag, { backgroundColor: colors.background, borderColor: colors.border }, parentId === null && { backgroundColor: colors.ink, borderColor: colors.ink }]}
                      onPress={() => setParentId(null)}
                    >
                      <Text style={[styles.parentTagText, { color: colors.textSecondary }, parentId === null && { color: colors.paper, fontWeight: '700' }]}>Aucun (Racine)</Text>
                    </TouchableOpacity>
                  {projects.filter(p => p.id !== editingId && !p.parent_id).map(p => (
                      <TouchableOpacity 
                        key={p.id}
                        style={[styles.parentTag, { backgroundColor: colors.background, borderColor: colors.border }, parentId === p.id && { backgroundColor: colors.ink, borderColor: colors.ink }]}
                        onPress={() => setParentId(p.id)}
                      >
                        <Text style={[styles.parentTagText, { color: colors.textSecondary }, parentId === p.id && { color: colors.paper, fontWeight: '700' }]}>{p.name}</Text>
                      </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={[styles.previewBox, { backgroundColor: colors.accent + '10' }]}>
                <BarChart3 stroke={colors.accent} size={20} />
                <Text style={[styles.previewText, { color: colors.text }]}>
                  Score de priorité : <Text style={{fontWeight: '800'}}>
                    {(!isRoiUnknown && !isCostUnknown && parseInput(roi) !== undefined && parseInput(cost) !== undefined) 
                      ? (parseInput(roi)! / (parseInput(cost)! || 1)).toFixed(3) 
                      : 'N/A'
                    }
                  </Text>
                </Text>
              </View>

              <TouchableOpacity style={[styles.submitBtn, { backgroundColor: colors.ink }]} onPress={handleSave}>
                <Check stroke={colors.paper} size={24} strokeWidth={3} />
                <Text style={[styles.submitBtnText, { color: colors.paper }]}>Enregistrer</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: Spacing.lg, paddingBottom: 140 },
  headerContainer: { marginBottom: 24, marginTop: 10 },
  headerSubtitle: { fontWeight: '700', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 },
  headerTitle: { fontSize: 32, fontWeight: '800', marginTop: 4 },
  summaryHero: { padding: 24, borderRadius: 28, marginBottom: 30 },
  heroLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600', textTransform: 'uppercase' },
  heroValue: { color: '#FFF', fontSize: 32, fontWeight: '900', marginTop: 4 },
  heroIconBox: { width: 60, height: 60, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  heroFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  heroFooterText: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600', marginLeft: 8 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  flex1: { flex: 1 },
  actionRow: { flexDirection: 'row' },
  actionBtn: { padding: 8, borderRadius: 12 },
  sectionHeading: { fontSize: 18, fontWeight: '800', marginBottom: 16 },
  projectCard: { padding: 20, borderRadius: 24, marginBottom: 16 },
  projectHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  projectName: { fontSize: 18, fontWeight: '800' },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  statusText: { fontSize: 12, fontWeight: '700' },
  dot: { marginHorizontal: 4 },
  roiText: { fontSize: 12, fontWeight: '600' },
  priorityLabel: { fontSize: 12, fontWeight: '800' },
  progContainer: { marginTop: 20 },
  progBar: { height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 10 },
  progFill: { height: '100%', borderRadius: 4 },
  progVal: { fontSize: 12, fontWeight: '600' },
  progPct: { fontSize: 14, fontWeight: '800' },
  infoTip: { flexDirection: 'row', padding: 20, borderRadius: 20, alignItems: 'center', marginTop: 10 },
  infoText: { flex: 1, marginLeft: 16, fontSize: 12, lineHeight: 18 },
  emptyContainer: { padding: 40, alignItems: 'center' },
  mainFab: { position: 'absolute', bottom: 120, right: 30, width: 64, height: 64, borderRadius: 22, justifyContent: 'center', alignItems: 'center', elevation: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 30, paddingBottom: 50, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  modalTitle: { fontSize: 24, fontWeight: '900' },
  closeBtn: { padding: 8, borderRadius: 16 },
  formGroup: { marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '800', marginBottom: 10, textTransform: 'uppercase' },
  input: { borderRadius: 20, padding: 18, fontSize: 16, borderWidth: 1, fontWeight: '600' },
  statusSelector: { flexDirection: 'row', borderRadius: 20, padding: 4 },
  statusBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 16 },
  statusBtnText: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  previewBox: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 16, marginBottom: 30 },
  previewText: { marginLeft: 12, fontSize: 14 },
  submitBtn: { paddingVertical: 20, borderRadius: 24, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  submitBtnText: { fontSize: 18, fontWeight: '900', marginLeft: 10 },
  row: { flexDirection: 'row', alignItems: 'center' },
  objectiveBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginLeft: 10 },
  objectiveBadgeText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  parentLink: { fontSize: 11, marginBottom: 4, fontStyle: 'italic' },
  parentSelector: { flexDirection: 'row', marginTop: 5 },
  parentTag: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, marginRight: 8, borderWidth: 1 },
  parentTagText: { fontSize: 13, fontWeight: '600' },
  formCheckbox: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  miniBox: { width: 18, height: 18, borderRadius: 4, borderWidth: 2, marginRight: 8, justifyContent: 'center', alignItems: 'center' },
  formCheckboxLabel: { fontSize: 12, fontWeight: '600' },
  inputDisabled: { opacity: 0.5 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 12 : 2, marginBottom: 20, borderWidth: 1 },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 15, fontWeight: '600' },
});
