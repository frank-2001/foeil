import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Switch, 
  Alert 
} from 'react-native';
import { Colors, Spacing } from '../utils/theme';
import { Card } from '../components/Card';
import { 
  Palette, 
  Moon, 
  Sun, 
  Monitor, 
  Shield, 
  Bell, 
  Info,
  ChevronRight,
  Download
} from 'lucide-react-native';

import { useTheme } from '../context/ThemeContext';
import { VersionService } from '../services/VersionService';

const ScreenHeader = ({ title, subtitle, colors }: { title: string, subtitle: string, colors: any }) => (
  <View style={styles.headerContainer}>
    <Text style={[styles.headerSubtitle, { color: colors.accent }]}>{subtitle}</Text>
    <Text style={[styles.headerTitle, { color: colors.ink }]}>{title}</Text>
  </View>
);

export default function SettingsScreen() {
  const { colors, isDark, setDarkMode } = useTheme();
  const [notifications, setNotifications] = useState(true);

  const handleCheckUpdates = async () => {
    try {
      const result = await VersionService.checkForUpdates();
      if (result) {
        Alert.alert("Mise à jour requise", "Une mise à jour majeure est disponible. Veuillez relancer l'application pour procéder au téléchargement.");
      } else {
        Alert.alert("Vérification en cours", "Recherche terminée. S'il y a une mise à jour mineure, elle apparaitra en haut de l'écran.");
      }
    } catch (e) {
      Alert.alert("Erreur", "Vérification impossible.");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.listContent}>
        <ScreenHeader title="Paramètres" subtitle="Configuration de l'application" colors={colors} />

        <Text style={styles.sectionTitle}>Apparence</Text>
        <Card style={[styles.settingsCard, { backgroundColor: colors.paper, borderColor: colors.border }]}>
          <TouchableOpacity style={styles.settingRow} onPress={() => setDarkMode(!isDark)}>
            <View style={[styles.iconBox, { backgroundColor: isDark ? colors.accent + '20' : '#E0E7FF' }]}>
              {isDark ? 
               <Moon size={22} stroke={colors.accent} /> : 
               <Sun size={22} stroke="#4F46E5" />
              }
            </View>
            <View style={styles.flex1}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Thème Sombre</Text>
              <Text style={styles.settingDesc}>Activer le mode nuit pour reposer vos yeux</Text>
            </View>
            <Switch 
              value={isDark} 
              onValueChange={setDarkMode}
              trackColor={{ false: '#D1D5DB', true: colors.accent }}
            />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <TouchableOpacity style={styles.settingRow}>
            <View style={[styles.iconBox, { backgroundColor: isDark ? '#334155' : '#FEF3C7' }]}>
              <Monitor size={22} stroke={isDark ? colors.textSecondary : "#D97706"} />
            </View>
            <View style={styles.flex1}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Adaptation Système</Text>
              <Text style={styles.settingDesc}>Suivre les réglages de votre téléphone</Text>
            </View>
            <ChevronRight size={20} stroke={colors.textSecondary} />
          </TouchableOpacity>
        </Card>

        <Text style={styles.sectionTitle}>Notifications</Text>
        <Card style={[styles.settingsCard, { backgroundColor: colors.paper, borderColor: colors.border }]}>
          <View style={styles.settingRow}>
            <View style={[styles.iconBox, { backgroundColor: isDark ? '#065F46' + '20' : '#ECFDF5' }]}>
              <Bell size={22} stroke={isDark ? colors.success : "#059669"} />
            </View>
            <View style={styles.flex1}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Alertes Epargne</Text>
              <Text style={styles.settingDesc}>Recevoir des alertes lors des rentrées</Text>
            </View>
            <Switch 
              value={notifications} 
              onValueChange={setNotifications}
              trackColor={{ false: '#D1D5DB', true: colors.accent }}
            />
          </View>
        </Card>

        <Text style={styles.sectionTitle}>Sécurité & Confidentialité</Text>
        <Card style={[styles.settingsCard, { backgroundColor: colors.paper, borderColor: colors.border }]}>
          <TouchableOpacity style={styles.settingRow}>
            <View style={[styles.iconBox, { backgroundColor: isDark ? colors.danger + '20' : '#FEE2E2' }]}>
              <Shield size={22} stroke={colors.danger} />
            </View>
            <View style={styles.flex1}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Verrouillage App</Text>
              <Text style={styles.settingDesc}>Demander FaceID / Empreinte</Text>
            </View>
            <ChevronRight size={20} stroke={colors.textSecondary} />
          </TouchableOpacity>
        </Card>

        <Text style={styles.sectionTitle}>À propos</Text>
        <Card style={[styles.settingsCard, { backgroundColor: colors.paper, borderColor: colors.border }]}>
          <TouchableOpacity style={styles.settingRow}>
            <View style={[styles.iconBox, { backgroundColor: isDark ? '#334155' : '#F3F4F6' }]}>
              <Info size={22} stroke={colors.ink} />
            </View>
            <View style={styles.flex1}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Version</Text>
              <Text style={styles.settingDesc}>FOEIL Mobile v1.0.4 (Bêta)</Text>
            </View>
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <TouchableOpacity style={styles.settingRow} onPress={handleCheckUpdates}>
            <View style={[styles.iconBox, { backgroundColor: isDark ? colors.accent + '20' : '#E0E7FF' }]}>
              <Download size={22} stroke={colors.accent} />
            </View>
            <View style={styles.flex1}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Rechercher des MAJ</Text>
              <Text style={styles.settingDesc}>Vérifier les nouvelles fonctionnalités OTA</Text>
            </View>
            <ChevronRight size={20} stroke={colors.textSecondary} />
          </TouchableOpacity>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { padding: Spacing.lg, paddingBottom: 100 },
  headerContainer: { marginBottom: 30, marginTop: 10 },
  headerSubtitle: { fontWeight: '700', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 },
  headerTitle: { fontSize: 32, fontWeight: '800', marginTop: 4 },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: Colors.textSecondary, textTransform: 'uppercase', marginBottom: 12, marginLeft: 4, letterSpacing: 0.5 },
  settingsCard: { padding: 4, borderRadius: 28, marginBottom: 24, overflow: 'hidden', borderWidth: 1 },
  settingRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  iconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  flex1: { flex: 1 },
  settingLabel: { fontSize: 16, fontWeight: '700' },
  settingDesc: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  divider: { height: 1, marginHorizontal: 16 },
});
