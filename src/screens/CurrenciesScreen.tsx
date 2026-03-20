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
  Switch
} from 'react-native';
import { Colors, Spacing, Typography } from '../utils/theme';
import { Card } from '../components/Card';
import { 
  ShieldCheck, 
  Plus, 
  X, 
  Check, 
  Trash2, 
  Edit3, 
  RefreshCw,
  Zap,
  DollarSign
} from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { DatabaseService } from '../services/DatabaseService';
import { Currency } from '../database/types';

const ScreenHeader = ({ title, subtitle }: { title: string, subtitle: string }) => (
  <View style={styles.headerContainer}>
    <Text style={styles.headerSubtitle}>{subtitle}</Text>
    <Text style={styles.headerTitle}>{title}</Text>
  </View>
);

export default function CurrenciesScreen() {
  const [loading, setLoading] = useState(true);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  
  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [rate, setRate] = useState('');
  const [isMain, setIsMain] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const data = await DatabaseService.getAllCurrencies();
      setCurrencies(data);
    } catch (error) {
      console.error('Error loading currencies:', error);
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
    if (!code.trim() || !name.trim() || (!isMain && !rate)) {
      Alert.alert('Erreur', 'Le code, le nom et le taux sont requis');
      return;
    }

    try {
      if (editingId) {
        await DatabaseService.updateCurrency(editingId, code, name, parseInput(rate), isMain);
      } else {
        await DatabaseService.addCurrency(code, name, parseInput(rate), isMain);
      }
      setModalVisible(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving currency:', error);
      Alert.alert('Erreur', code.length > 3 ? "Code trop long (max 3)" : "Impossible de sauvegarder la devise");
    }
  };

  const handleDelete = (id: number, isMainCurr: number) => {
    if (isMainCurr) {
      Alert.alert('Action Impossible', 'Vous ne pouvez pas supprimer la devise de référence.');
      return;
    }

    Alert.alert(
      'Supprimer',
      'Voulez-vous vraiment supprimer cette devise ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: async () => {
            try {
              await DatabaseService.deleteCurrency(id);
              loadData();
            } catch (e: any) {
              Alert.alert('Erreur', e.message);
            }
          }
        }
      ]
    );
  };

  const openEdit = (c: Currency) => {
    setEditingId(c.id);
    setCode(c.code);
    setName(c.name);
    setRate(c.exchange_rate_to_main.toString());
    setIsMain(c.is_main === 1);
    setModalVisible(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setCode('');
    setName('');
    setRate('');
    setIsMain(false);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  const mainCurrency = currencies.find(c => c.is_main === 1);
  const otherCurrencies = currencies.filter(c => c.is_main !== 1);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.listContent}>
        <ScreenHeader title="Mes Devises" subtitle="Taux de Change et Référence" />

        {mainCurrency && (
          <Card style={styles.mainCurrencyHero}>
            <View style={styles.heroTop}>
              <Text style={styles.heroLabel}>Devise de Référence</Text>
              <TouchableOpacity onPress={() => openEdit(mainCurrency)}>
                <Edit3 stroke="rgba(255,255,255,0.6)" size={20} />
              </TouchableOpacity>
            </View>
            <Text style={styles.heroCode}>{mainCurrency.code}</Text>
            <Text style={styles.heroName}>{mainCurrency.name}</Text>
            <View style={styles.verifiedBadge}>
              <ShieldCheck stroke="#FFF" size={14} />
              <Text style={styles.verifiedText}>Système de base (Taux : 1.00)</Text>
            </View>
          </Card>
        )}

        <View style={styles.sectionRow}>
          <Text style={styles.sectionHeading}>Autres Devises</Text>
          <RefreshCw stroke={Colors.textSecondary} size={18} />
        </View>

        {otherCurrencies.map((curr) => (
          <Card key={curr.id} style={styles.currencyItem}>
            <View style={styles.row}>
              <View style={styles.symbolCircle}>
                <Text style={styles.symbolText}>{curr.code[0]}</Text>
              </View>
              <View style={styles.flex1}>
                <Text style={styles.currName}>{curr.name} ({curr.code})</Text>
                <Text style={styles.currRate}>1 {mainCurrency?.code} = {curr.exchange_rate_to_main} {curr.code}</Text>
              </View>
              <View style={styles.actionRow}>
                <TouchableOpacity onPress={() => openEdit(curr)} style={styles.actionBtn}>
                  <Edit3 stroke={Colors.textSecondary} size={18} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(curr.id, curr.is_main)} style={[styles.actionBtn, { marginLeft: 8 }]}>
                  <Trash2 stroke={Colors.danger} size={18} />
                </TouchableOpacity>
              </View>
            </View>
          </Card>
        ))}

        {otherCurrencies.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={{ color: Colors.textSecondary }}>Aucune autre devise configurée</Text>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity 
        style={styles.mainFab} 
        onPress={() => { resetForm(); setModalVisible(true); }}
      >
        <Plus stroke="#FFF" size={32} strokeWidth={2.5} />
      </TouchableOpacity>

      {/* Modal Add/Edit Currency */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingId ? 'Modifier' : 'Ajouter'} Devise</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <X stroke={Colors.ink} size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.rowBetween}>
                <View style={[styles.formGroup, { width: '30%' }]}>
                  <Text style={styles.label}>Code</Text>
                  <TextInput 
                    style={styles.input}
                    placeholder="USD"
                    maxLength={3}
                    autoCapitalize="characters"
                    value={code}
                    onChangeText={setCode}
                  />
                </View>
                <View style={[styles.formGroup, { width: '65%' }]}>
                  <Text style={styles.label}>Nom Complet</Text>
                  <TextInput 
                    style={styles.input}
                    placeholder="Dollar Américain"
                    value={name}
                    onChangeText={setName}
                  />
                </View>
              </View>

              {!isMain && (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Taux de d'échange (1 {mainCurrency?.code} = ...)</Text>
                  <View style={styles.rateInputRow}>
                    <Zap stroke={Colors.warning} size={20} style={styles.inputIcon} />
                    <TextInput 
                      style={[styles.input, { flex: 1, paddingLeft: 45 }]}
                      placeholder="0.00"
                      keyboardType="numeric"
                      value={rate}
                      onChangeText={setRate}
                    />
                  </View>
                </View>
              )}

              <View style={styles.isMainRow}>
                <View style={styles.flex1}>
                  <Text style={styles.isMainLabel}>Devise de Référence</Text>
                  <Text style={styles.isMainDesc}>Définit cette devise comme base pour tous les calculs de l'application.</Text>
                </View>
                <Switch 
                  value={isMain} 
                  onValueChange={setIsMain}
                  trackColor={{ false: '#D1D5DB', true: Colors.accent }}
                />
              </View>

              <TouchableOpacity style={styles.submitBtn} onPress={handleSave}>
                <Check stroke="#FFF" size={24} strokeWidth={3} />
                <Text style={styles.submitBtnText}>Enregistrer la Devise</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: Spacing.lg, paddingBottom: 140 },
  headerContainer: { marginBottom: 24, marginTop: 10 },
  headerSubtitle: { color: Colors.accent, fontWeight: '700', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 },
  headerTitle: { fontSize: 32, fontWeight: '800', color: Colors.ink, marginTop: 4 },
  mainCurrencyHero: { backgroundColor: Colors.ink, padding: 32, alignItems: 'center', borderRadius: 32, marginBottom: 30 },
  heroTop: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  heroLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },
  heroCode: { color: '#FFF', fontSize: 64, fontWeight: '900', marginVertical: 4 },
  heroName: { color: '#FFF', fontSize: 18, opacity: 0.8, fontWeight: '600' },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, marginTop: 20 },
  verifiedText: { color: '#FFF', fontSize: 11, marginLeft: 8, fontWeight: '700' },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionHeading: { fontSize: 18, fontWeight: '800', color: Colors.text },
  currencyItem: { padding: 18, marginBottom: 12, borderRadius: 24 },
  row: { flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  flex1: { flex: 1 },
  symbolCircle: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  symbolText: { fontSize: 20, fontWeight: '800', color: Colors.ink },
  currName: { fontSize: 16, fontWeight: '700', color: Colors.text },
  currRate: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  actionRow: { flexDirection: 'row' },
  actionBtn: { padding: 8, backgroundColor: '#F3F4F6', borderRadius: 12 },
  emptyContainer: { padding: 40, alignItems: 'center' },
  mainFab: { position: 'absolute', bottom: 120, right: 30, backgroundColor: Colors.ink, width: 64, height: 64, borderRadius: 22, justifyContent: 'center', alignItems: 'center', elevation: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 30, paddingBottom: 50, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  modalTitle: { fontSize: 24, fontWeight: '900', color: Colors.ink },
  closeBtn: { backgroundColor: '#F3F4F6', padding: 8, borderRadius: 16 },
  formGroup: { marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '800', color: Colors.textSecondary, marginBottom: 10, textTransform: 'uppercase' },
  input: { backgroundColor: '#F9FAFB', borderRadius: 20, padding: 18, fontSize: 16, borderWidth: 1, borderColor: '#F3F4F6', color: Colors.ink, fontWeight: '600' },
  rateInputRow: { justifyContent: 'center' },
  inputIcon: { position: 'absolute', left: 18, zIndex: 1 },
  isMainRow: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#F9FAFB', borderRadius: 24, marginBottom: 30 },
  isMainLabel: { fontSize: 16, fontWeight: '800', color: Colors.ink },
  isMainDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 4, paddingRight: 20 },
  submitBtn: { backgroundColor: Colors.ink, paddingVertical: 20, borderRadius: 24, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  submitBtnText: { color: '#FFF', fontSize: 18, fontWeight: '900', marginLeft: 10 },
});
