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
import { useTheme } from '../context/ThemeContext';

const ScreenHeader = ({ title, subtitle, colors }: { title: string, subtitle: string, colors: any }) => (
  <View style={styles.headerContainer}>
    <Text style={[styles.headerSubtitle, { color: colors.accent }]}>{subtitle}</Text>
    <Text style={[styles.headerTitle, { color: colors.ink }]}>{title}</Text>
  </View>
);

export default function SourcesScreen() {
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();
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
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={sources}
        ListHeaderComponent={<ScreenHeader title="Mes Sources" subtitle="Gérer vos flux de trésorerie" colors={colors} />}
        contentContainerStyle={styles.listContent}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity 
            activeOpacity={0.7}
            onPress={() => navigation.navigate('SourceDetails', { sourceId: item.id, sourceName: item.name })}
          >
            <Card style={styles.sourceCard}>
              <View style={styles.row}>
                <View style={[styles.iconBox, { backgroundColor: item.type === 'income' ? (colors.success + '15') : (item.type === 'expense' ? (colors.danger + '15') : (colors.accent + '15')) }]}>
                  {item.type === 'income' ? 
                    <ArrowUpRight stroke={colors.success} size={24} /> : 
                    (item.type === 'expense' ? <ArrowDownLeft stroke={colors.danger} size={24} /> : <Zap stroke={colors.accent} size={24} />)
                  }
                </View>
                <View style={styles.flex1}>
                  <Text style={[styles.sourceName, { color: colors.ink }]}>{item.name}</Text>
                  <View style={styles.badgeRow}>
                    <Text style={[styles.sourceType, { color: colors.textSecondary }]}>
                      {item.type === 'income' ? 'Revenu' : (item.type === 'expense' ? 'Dépense' : 'Mixte')}
                    </Text>
                    {item.category && (
                      <View style={[
                        styles.catBadge,
                        item.category === 'essential' && { backgroundColor: colors.accent + '20' },
                        item.category === 'personal' && { backgroundColor: colors.warning + '20' },
                        item.category === 'investment' && { backgroundColor: colors.success + '20' },
                      ]}>
                        <Text style={[styles.catBadgeText, { color: colors.ink }]}>
                          {item.category === 'essential' ? 'Essentiel' : item.category === 'personal' ? 'Plaisir' : 'Invest.'}
                        </Text>
                      </View>
                    )}
                    {item.project_id && <Text style={[styles.sourceType, { color: colors.textSecondary }]}> • Projet</Text>}
                  </View>
                </View>
                <View style={styles.actionRow}>
                  <TouchableOpacity onPress={() => openEdit(item)} style={[styles.actionBtn, { backgroundColor: colors.background }]}>
                    <Edit3 stroke={colors.textSecondary} size={20} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(item.id)} style={[styles.actionBtn, { marginLeft: 10, backgroundColor: colors.background }]}>
                    <Trash2 stroke={colors.danger} size={20} />
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={{ color: colors.textSecondary }}>Aucune source configurée</Text>
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
              <Text style={[styles.modalTitle, { color: colors.ink }]}>{editingId ? 'Modifier la Source' : 'Nouvelle Source'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={[styles.closeBtn, { backgroundColor: colors.background }]}>
                <X stroke={colors.ink} size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Nom de la source</Text>
              <TextInput 
                style={[styles.input, { backgroundColor: colors.background, color: colors.ink, borderColor: colors.border }]}
                placeholder="Ex: Salaire, Loyer, Freelance..."
                placeholderTextColor={colors.textSecondary + '70'}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Lier à un projet (Optionnel)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.projectScroll}>
                <TouchableOpacity 
                  style={[styles.projectBadge, { backgroundColor: colors.background, borderColor: colors.border }, projectId === null && { backgroundColor: colors.ink, borderColor: colors.ink }]}
                  onPress={() => setProjectId(null)}
                >
                  <Text style={[styles.projectBadgeText, { color: colors.textSecondary }, projectId === null && { color: colors.paper }]}>Aucun</Text>
                </TouchableOpacity>
                {projects.map(p => (
                  <TouchableOpacity 
                    key={p.id}
                    style={[styles.projectBadge, { backgroundColor: colors.background, borderColor: colors.border }, projectId === p.id && { backgroundColor: colors.ink, borderColor: colors.ink }]}
                    onPress={() => setProjectId(p.id)}
                  >
                    <Text style={[styles.projectBadgeText, { color: colors.textSecondary }, projectId === p.id && { color: colors.paper }]}>{p.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Type de flux</Text>
              <View style={[styles.typeSelector, { backgroundColor: colors.background }]}>
                <TouchableOpacity 
                  style={[styles.typeBtn, type === 'income' && { backgroundColor: colors.success }]} 
                  onPress={() => setType('income')}
                >
                  <Text style={[styles.typeBtnText, { color: colors.textSecondary }, type === 'income' && { color: colors.paper }]}>Revenu</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.typeBtn, type === 'expense' && { backgroundColor: colors.danger }]} 
                  onPress={() => setType('expense')}
                >
                  <Text style={[styles.typeBtnText, { color: colors.textSecondary }, type === 'expense' && { color: colors.paper }]}>Dépense</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.typeBtn, type === 'both' && { backgroundColor: colors.accent }]} 
                  onPress={() => setType('both')}
                >
                  <Text style={[styles.typeBtnText, { color: colors.textSecondary }, type === 'both' && { color: colors.paper }]}>Mixte</Text>
                </TouchableOpacity>
              </View>
            </View>

            {(type === 'expense' || type === 'both') && (
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Catégorie (30-30-40)</Text>
                <View style={styles.categoryGrid}>
                  <TouchableOpacity 
                    style={[styles.catBtn, { backgroundColor: colors.background }, category === 'essential' && { backgroundColor: colors.accent }]} 
                    onPress={() => setCategory('essential')}
                  >
                    <Text style={[styles.catBtnText, { color: colors.textSecondary }, category === 'essential' && { color: colors.paper }]}>Essentiel</Text>
                    <Text style={[styles.catRate, { color: colors.ink }]}>30%</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.catBtn, { backgroundColor: colors.background }, category === 'personal' && { backgroundColor: colors.warning }]} 
                    onPress={() => setCategory('personal')}
                  >
                    <Text style={[styles.catBtnText, { color: colors.textSecondary }, category === 'personal' && { color: colors.paper }]}>Plaisir</Text>
                    <Text style={[styles.catRate, { color: colors.ink }]}>30%</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.catBtn, { backgroundColor: colors.background }, category === 'investment' && { backgroundColor: colors.success }]} 
                    onPress={() => setCategory('investment')}
                  >
                    <Text style={[styles.catBtnText, { color: colors.textSecondary }, category === 'investment' && { color: colors.paper }]}>Épargne</Text>
                    <Text style={[styles.catRate, { color: colors.ink }]}>40%</Text>
                  </TouchableOpacity>
                </View>
                <Text style={[styles.hintText, { color: colors.textSecondary }]}>Toutes les sorties de cette source puiseront dans ce budget.</Text>
              </View>
            )}

            <TouchableOpacity style={[styles.submitBtn, { backgroundColor: colors.ink }]} onPress={handleAddOrUpdate}>
              <Check stroke={colors.paper} size={24} strokeWidth={3} />
              <Text style={[styles.submitBtnText, { color: colors.paper }]}>Enregistrer</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
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
  sourceCard: { padding: 16, borderRadius: 22, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  flex1: { flex: 1 },
  sourceName: { fontSize: 18, fontWeight: '800' },
  sourceType: { fontSize: 13, marginTop: 2,flex: 1 },
  actionRow: { flexDirection: 'row', alignItems: 'center' },
  actionBtn: { padding: 8, borderRadius: 12},
  mainFab: { 
    position: 'absolute', 
    bottom: 120, 
    right: 30, 
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
  modalContent: { borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 30, paddingBottom: 50 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  modalTitle: { fontSize: 24, fontWeight: '900' },
  closeBtn: { padding: 8, borderRadius: 16 },
  formGroup: { marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '800', marginBottom: 10, textTransform: 'uppercase' },
  input: { borderRadius: 20, padding: 18, fontSize: 16, borderWidth: 1, fontWeight: '600' },
  typeSelector: { flexDirection: 'row', borderRadius: 20, padding: 4 },
  typeBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 16 },
  typeBtnText: { fontSize: 14, fontWeight: '700' },
  submitBtn: { paddingVertical: 20, borderRadius: 24, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 15, elevation: 10 },
  submitBtnText: { fontSize: 18, fontWeight: '900', marginLeft: 10 },
  emptyContainer: { padding: 50, alignItems: 'center' },
  projectScroll: { flexDirection: 'row', marginBottom: 10 },
  projectBadge: { 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 14, 
    marginRight: 10,
    borderWidth: 1,
  },
  projectBadgeText: { fontSize: 13, fontWeight: '700' },
  badgeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 2,flex:1 },
  catBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  catBadgeText: { fontSize: 10, fontWeight: '800', opacity: 0.7 },
  categoryGrid: { flexDirection: 'row', gap: 8, marginTop: 4 },
  catBtn: { flex: 1, paddingVertical: 12, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  catBtnText: { fontSize: 11, fontWeight: '700' },
  catRate: { fontSize: 8, fontWeight: '900', opacity: 0.4, position: 'absolute', top: 4, right: 6 },
  hintText: { fontSize: 11, marginTop: 8, fontStyle: 'italic', textAlign: 'center' },
});
