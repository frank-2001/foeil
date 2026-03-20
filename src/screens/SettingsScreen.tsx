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
  ChevronRight
} from 'lucide-react-native';

const ScreenHeader = ({ title, subtitle }: { title: string, subtitle: string }) => (
  <View style={styles.headerContainer}>
    <Text style={styles.headerSubtitle}>{subtitle}</Text>
    <Text style={styles.headerTitle}>{title}</Text>
  </View>
);

export default function SettingsScreen() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.listContent}>
        <ScreenHeader title="Paramètres" subtitle="Configuration de l'application" />

        <Text style={styles.sectionTitle}>Apparence</Text>
        <Card style={styles.settingsCard}>
          <TouchableOpacity style={styles.settingRow} onPress={toggleTheme}>
            <View style={[styles.iconBox, { backgroundColor: '#E0E7FF' }]}>
              <Palette size={22} stroke="#4F46E5" />
            </View>
            <View style={styles.flex1}>
              <Text style={styles.settingLabel}>Thème Sombre</Text>
              <Text style={styles.settingDesc}>Activer le mode nuit pour reposer vos yeux</Text>
            </View>
            <Switch 
              value={isDarkMode} 
              onValueChange={setIsDarkMode}
              trackColor={{ false: '#D1D5DB', true: Colors.accent }}
            />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.settingRow}>
            <View style={[styles.iconBox, { backgroundColor: '#FEF3C7' }]}>
              <Monitor size={22} stroke="#D97706" />
            </View>
            <View style={styles.flex1}>
              <Text style={styles.settingLabel}>Adaptation Système</Text>
              <Text style={styles.settingDesc}>Suivre les réglages de votre téléphone</Text>
            </View>
            <ChevronRight size={20} stroke={Colors.textSecondary} />
          </TouchableOpacity>
        </Card>

        <Text style={styles.sectionTitle}>Notifications</Text>
        <Card style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <View style={[styles.iconBox, { backgroundColor: '#ECFDF5' }]}>
              <Bell size={22} stroke="#059669" />
            </View>
            <View style={styles.flex1}>
              <Text style={styles.settingLabel}>Alertes Epargne</Text>
              <Text style={styles.settingDesc}>Recevoir des alertes lors des rentrées</Text>
            </View>
            <Switch 
              value={notifications} 
              onValueChange={setNotifications}
              trackColor={{ false: '#D1D5DB', true: Colors.accent }}
            />
          </View>
        </Card>

        <Text style={styles.sectionTitle}>Sécurité & Confidentialité</Text>
        <Card style={styles.settingsCard}>
          <TouchableOpacity style={styles.settingRow}>
            <View style={[styles.iconBox, { backgroundColor: '#FEE2E2' }]}>
              <Shield size={22} stroke="#DC2626" />
            </View>
            <View style={styles.flex1}>
              <Text style={styles.settingLabel}>Verrouillage App</Text>
              <Text style={styles.settingDesc}>Demander FaceID / Empreinte</Text>
            </View>
            <ChevronRight size={20} stroke={Colors.textSecondary} />
          </TouchableOpacity>
        </Card>

        <Text style={styles.sectionTitle}>À propos</Text>
        <Card style={styles.settingsCard}>
          <TouchableOpacity style={styles.settingRow}>
            <View style={[styles.iconBox, { backgroundColor: '#F3F4F6' }]}>
              <Info size={22} stroke={Colors.ink} />
            </View>
            <View style={styles.flex1}>
              <Text style={styles.settingLabel}>Version</Text>
              <Text style={styles.settingDesc}>FOEIL Mobile v1.0.4 (Bêta)</Text>
            </View>
          </TouchableOpacity>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  listContent: { padding: Spacing.lg, paddingBottom: 100 },
  headerContainer: { marginBottom: 30, marginTop: 10 },
  headerSubtitle: { color: Colors.accent, fontWeight: '700', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 },
  headerTitle: { fontSize: 32, fontWeight: '800', color: Colors.ink, marginTop: 4 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: Colors.textSecondary, textTransform: 'uppercase', marginBottom: 12, marginLeft: 4, letterSpacing: 0.5 },
  settingsCard: { padding: 4, borderRadius: 24, marginBottom: 24, overflow: 'hidden' },
  settingRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  iconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  flex1: { flex: 1 },
  settingLabel: { fontSize: 16, fontWeight: '700', color: Colors.text },
  settingDesc: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginHorizontal: 16 },
});
