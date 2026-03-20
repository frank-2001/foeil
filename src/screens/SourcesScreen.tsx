import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ScrollView,
  TouchableOpacity, 
  Alert, 
  Modal, 
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Colors, Spacing, Typography } from '../utils/theme';
import { Card } from '../components/Card';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus, 
  Trash2, 
  Edit3, 
  X, 
  Check,
  Zap
} from 'lucide-react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { DatabaseService } from '../services/DatabaseService';
import { Source, Project } from '../database/types';
import { FinancialEngine } from '../services/FinancialEngine';

const ScreenHeader = ({ title, subtitle }: { title: string, subtitle: string }) => (
  <View style={styles.headerContainer}>
    <Text style={styles.headerSubtitle}>{subtitle}</Text>
    <Text style={styles.headerTitle}>{title}</Text>
  </View>
);

export default function SourcesScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [sources, setSources] = useState<Source[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Form State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<'income' | 'expense' | 'both'>('income');
  const [category, setCategory] = useState<'essential' | 'personal' | 'investment'>('essential');
  const [projectId, setProjectId] = useState<number | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadSources();
    }, [])
  );

  const loadSources = async () => {
    try {
      const [sourceData, projectData] = await Promise.all([
        await DatabaseService.getAllSources(),
        await DatabaseService.getAllProjects()
      ]);
      setSources(sourceData);
      setProjects(projectData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddOrUpdate = async () => {
    if (!name.trim()) {
      Alert.alert('Erreur', 'Le nom de la source est requis');
      return;
    }

    try {
      const srcCat = (type === 'expense' || type === 'both') ? category : undefined;
      if (editingId) {
        await DatabaseService.updateSource(editingId, name, type, projectId || undefined, srcCat);
      } else {
        await DatabaseService.addSource(name, type, projectId || undefined, srcCat);
      }
      setModalVisible(false);
      resetForm();
      loadSources();
    } catch (error) {
      console.error('Error saving source:', error);
      Alert.alert('Erreur', 'Impossible d\'enregistrer la source');
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      'Supprimer',
      'Êtes-vous sûr de vouloir supprimer cette source ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: async () => {
            try {
              await DatabaseService.deleteSource(id);
              loadSources();
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Erreur', 'Impossible de supprimer cette source');
            }
          }
        }
      ]
    );
  };

  const openEdit = (source: Source) => {
    setEditingId(source.id);
    setName(source.name);
    setType(source.type);
    setCategory(source.category || 'essential');
    setProjectId(source.project_id || null);
    setModalVisible(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setType('income');
    setCategory('essential');
    setProjectId(null);
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
        data={sources}
        ListHeaderComponent={<ScreenHeader title="Mes Sources" subtitle="Gérer vos flux de trésorerie" />}
        contentContainerStyle={styles.listContent}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity 
            activeOpacity={0.7}
            onPress={() => navigation.navigate('SourceDetails', { sourceId: item.id, sourceName: item.name })}
          >
            <Card style={styles.sourceCard}>
              <View style={styles.row}>
                <View style={[styles.iconBox, { backgroundColor: item.type === 'income' ? '#E1F8EF' : (item.type === 'expense' ? '#FCE8E8' : '#EEF2FF') }]}>
                  {item.type === 'income' ? 
                    <ArrowUpRight stroke={Colors.success} size={24} /> : 
                    (item.type === 'expense' ? <ArrowDownLeft stroke={Colors.danger} size={24} /> : <Zap stroke={Colors.accent} size={24} />)
                  }
                </View>
                <View style={styles.flex1}>
                  <Text style={styles.sourceName}>{item.name}</Text>
                  <View style={styles.badgeRow}>
                    <Text style={styles.sourceType}>
                      {item.type === 'income' ? 'Revenu' : (item.type === 'expense' ? 'Dépense' : 'Mixte')}
                    </Text>
                    {item.category && (
                      <View style={[
                        styles.catBadge,
                        item.category === 'essential' && styles.catBadgeEssential,
                        item.category === 'personal' && styles.catBadgePersonal,
                        item.category === 'investment' && styles.catBadgeInvestment,
                      ]}>
                        <Text style={styles.catBadgeText}>
                          {item.category === 'essential' ? 'Essentiel' : item.category === 'personal' ? 'Plaisir' : 'Invest.'}
                        </Text>
                      </View>
                    )}
                    {item.project_id && <Text style={styles.sourceType}> • Projet</Text>}
                  </View>
                </View>
                <View style={styles.actionRow}>
                  <TouchableOpacity onPress={() => openEdit(item)} style={styles.actionBtn}>
                    <Edit3 stroke={Colors.textSecondary} size={20} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(item.id)} style={[styles.actionBtn, { marginLeft: 10 }]}>
                    <Trash2 stroke={Colors.danger} size={20} />
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={{ color: Colors.textSecondary }}>Aucune source configurée</Text>
          </View>
        }
      />

      <TouchableOpacity 
        style={styles.mainFab} 
        onPress={() => { resetForm(); setModalVisible(true); }}
      >
        <Plus stroke="#FFF" size={32} strokeWidth={2.5} />
      </TouchableOpacity>

      {/* Add / Edit Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingId ? 'Modifier la Source' : 'Nouvelle Source'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <X stroke={Colors.ink} size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Nom de la source</Text>
              <TextInput 
                style={styles.input}
                placeholder="Ex: Salaire, Loyer, Freelance..."
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Lier à un projet (Optionnel)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.projectScroll}>
                <TouchableOpacity 
                  style={[styles.projectBadge, projectId === null && styles.projectBadgeActive]}
                  onPress={() => setProjectId(null)}
                >
                  <Text style={[styles.projectBadgeText, projectId === null && styles.projectBadgeTextActive]}>Aucun</Text>
                </TouchableOpacity>
                {projects.map(p => (
                  <TouchableOpacity 
                    key={p.id}
                    style={[styles.projectBadge, projectId === p.id && styles.projectBadgeActive]}
                    onPress={() => setProjectId(p.id)}
                  >
                    <Text style={[styles.projectBadgeText, projectId === p.id && styles.projectBadgeTextActive]}>{p.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Type de flux</Text>
              <View style={styles.typeSelector}>
                <TouchableOpacity 
                  style={[styles.typeBtn, type === 'income' && styles.typeBtnActiveIncome]} 
                  onPress={() => setType('income')}
                >
                  <Text style={[styles.typeBtnText, type === 'income' && styles.typeBtnTextActive]}>Revenu</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.typeBtn, type === 'expense' && styles.typeBtnActiveExpense]} 
                  onPress={() => setType('expense')}
                >
                  <Text style={[styles.typeBtnText, type === 'expense' && styles.typeBtnTextActive]}>Dépense</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.typeBtn, type === 'both' && styles.typeBtnActiveBoth]} 
                  onPress={() => setType('both')}
                >
                  <Text style={[styles.typeBtnText, type === 'both' && styles.typeBtnTextActive]}>Mixte</Text>
                </TouchableOpacity>
              </View>
            </View>

            {(type === 'expense' || type === 'both') && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Catégorie (30-30-40)</Text>
                <View style={styles.categoryGrid}>
                  <TouchableOpacity 
                    style={[styles.catBtn, category === 'essential' && styles.catBtnActiveEssential]} 
                    onPress={() => setCategory('essential')}
                  >
                    <Text style={[styles.catBtnText, category === 'essential' && styles.catBtnTextActive]}>Essentiel</Text>
                    <Text style={styles.catRate}>30%</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.catBtn, category === 'personal' && styles.catBtnActivePersonal]} 
                    onPress={() => setCategory('personal')}
                  >
                    <Text style={[styles.catBtnText, category === 'personal' && styles.catBtnTextActive]}>Plaisir</Text>
                    <Text style={styles.catRate}>30%</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.catBtn, category === 'investment' && styles.catBtnActiveInvestment]} 
                    onPress={() => setCategory('investment')}
                  >
                    <Text style={[styles.catBtnText, category === 'investment' && styles.catBtnTextActive]}>Épargne</Text>
                    <Text style={styles.catRate}>40%</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.hintText}>Toutes les sorties de cette source puiseront dans ce budget.</Text>
              </View>
            )}

            <TouchableOpacity style={styles.submitBtn} onPress={handleAddOrUpdate}>
              <Check stroke="#FFF" size={24} strokeWidth={3} />
              <Text style={styles.submitBtnText}>Enregistrer</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
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
  sourceCard: { padding: 16, borderRadius: 22, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  flex1: { flex: 1 },
  sourceName: { fontSize: 18, fontWeight: '800', color: Colors.ink },
  sourceType: { fontSize: 13, color: Colors.textSecondary, marginTop: 2,flex: 1 },
  actionRow: { flexDirection: 'row', alignItems: 'center' },
  actionBtn: { padding: 8, backgroundColor: '#F3F4F6', borderRadius: 12},
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8 
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 30, paddingBottom: 50 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  modalTitle: { fontSize: 24, fontWeight: '900', color: Colors.ink },
  closeBtn: { backgroundColor: '#F3F4F6', padding: 8, borderRadius: 16 },
  formGroup: { marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '800', color: Colors.textSecondary, marginBottom: 10, textTransform: 'uppercase' },
  input: { backgroundColor: '#F9FAFB', borderRadius: 20, padding: 18, fontSize: 16, borderWidth: 1, borderColor: '#F3F4F6', color: Colors.ink, fontWeight: '600' },
  typeSelector: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 20, padding: 4 },
  typeBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 16 },
  typeBtnActiveIncome: { backgroundColor: Colors.success },
  typeBtnActiveExpense: { backgroundColor: Colors.danger },
  typeBtnActiveBoth: { backgroundColor: Colors.accent },
  typeBtnText: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary },
  typeBtnTextActive: { color: '#FFF' },
  submitBtn: { backgroundColor: Colors.ink, paddingVertical: 20, borderRadius: 24, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 15, elevation: 10 },
  submitBtnText: { color: '#FFF', fontSize: 18, fontWeight: '900', marginLeft: 10 },
  emptyContainer: { padding: 50, alignItems: 'center' },
  projectScroll: { flexDirection: 'row', marginBottom: 10 },
  projectBadge: { 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 14, 
    backgroundColor: '#F3F4F6', 
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  projectBadgeActive: { backgroundColor: Colors.ink, borderColor: Colors.ink },
  projectBadgeText: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  projectBadgeTextActive: { color: '#FFF' },
  badgeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 2,flex:1 },
  catBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  catBadgeEssential: { backgroundColor: Colors.accent + '15' },
  catBadgePersonal: { backgroundColor: Colors.warning + '15' },
  catBadgeInvestment: { backgroundColor: Colors.success + '15' },
  catBadgeText: { fontSize: 10, fontWeight: '800', color: Colors.ink, opacity: 0.7 },
  categoryGrid: { flexDirection: 'row', gap: 8, marginTop: 4 },
  catBtn: { flex: 1, backgroundColor: '#F3F4F6', paddingVertical: 12, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  catBtnActiveEssential: { backgroundColor: Colors.accent },
  catBtnActivePersonal: { backgroundColor: Colors.warning },
  catBtnActiveInvestment: { backgroundColor: Colors.success },
  catBtnText: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary },
  catBtnTextActive: { color: '#FFF' },
  catRate: { fontSize: 8, fontWeight: '900', color: Colors.ink, opacity: 0.4, position: 'absolute', top: 4, right: 6 },
  hintText: { fontSize: 11, color: Colors.textSecondary, marginTop: 8, fontStyle: 'italic', textAlign: 'center' },
});
