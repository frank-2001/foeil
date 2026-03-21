import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing } from '../utils/theme';
import { Card } from '../components/Card';
import { 
  User, 
  LogOut, 
  Trash2, 
  ShieldAlert, 
  Key, 
  History,
  Settings,
  Zap,
  BarChart2
} from 'lucide-react-native';
import { DatabaseService } from '../services/DatabaseService';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';

const ScreenHeader = ({ title, subtitle, colors }: { title: string, subtitle: string, colors: any }) => (
  <View style={styles.headerContainer}>
    <Text style={[styles.headerSubtitle, { color: colors.accent }]}>{subtitle}</Text>
    <Text style={[styles.headerTitle, { color: colors.ink }]}>{title}</Text>
  </View>
);

export default function ProfileScreen() {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<any>();
  const [stats, setStats] = useState({ transactions: 0, projects: 0 });
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [])
  );

  const loadStats = async () => {
    try {
      const db = await DatabaseService.getAllProjects();
      const tx = await DatabaseService.getSavingsBalance(); 
      setStats({ 
        projects: db.length, 
        transactions: 0 // Placeholder
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleFullReset = () => {
    Alert.alert(
      '☢️ RÉINITIALISATION TOTALE',
      'Cette action supprimera toutes vos transactions, projets, sources et épargne de façon IRREVERSIBLE. Êtes-vous certain ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'TOUT SUPPRIMER', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await DatabaseService.clearAllData();
              Alert.alert('Succès', 'Toutes les données locales ont été effacées.');
              loadStats();
            } catch (error) {
              Alert.alert('Erreur', 'Échec de la réinitialisation');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.listContent}>
        <View style={styles.profileHero}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: colors.ink }]}>
               <Image 
                source={require('../../assets/IconKitchen-Output/android/res/mipmap-xxxhdpi/ic_launcher.png')} 
                style={{ width: 80, height: 80, borderRadius: 20 }} 
                resizeMode="contain"
               />
            </View>
            <View style={[styles.badgeContainer, { backgroundColor: colors.accent, borderColor: colors.background }]}>
              <ShieldAlert size={14} stroke="#FFF" />
            </View>
          </View>
          <Text style={[styles.userName, { color: colors.ink }]}>Utilisateur FOEIL</Text>
          <Text style={[styles.userEmail, { color: colors.textSecondary }]}>user@foeil.app</Text>
        </View>

        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <Text style={[styles.statVal, { color: colors.ink }]}>{stats.projects}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Projets</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={[styles.statVal, { color: colors.ink }]}>Bêta</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Version</Text>
          </Card>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Gestion du Compte</Text>
        <Card style={styles.menuCard}>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('BudgetManagement')}>
            <Zap size={20} stroke={colors.accent} />
            <Text style={[styles.menuItemText, { color: colors.text }]}>Réorganiser le Budget</Text>
          </TouchableOpacity>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Trash')}>
            <History size={20} stroke={colors.textSecondary} />
            <Text style={[styles.menuItemText, { color: colors.text }]}>Journal d'Activité (Corbeille)</Text>
          </TouchableOpacity>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('BudgetAlerts')}>
            <ShieldAlert size={20} stroke={colors.danger} />
            <Text style={[styles.menuItemText, { color: colors.text }]}>Dépassements & Alertes</Text>
          </TouchableOpacity>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Stats')}>
            <BarChart2 size={20} stroke={colors.textSecondary} />
            <Text style={[styles.menuItemText, { color: colors.text }]}>Statistiques</Text>
          </TouchableOpacity>
        </Card>

        <Text style={[styles.sectionTitle, { color: colors.danger }]}>Zone de Danger</Text>
        <Card style={[styles.menuCard, { borderColor: colors.danger + '40', borderWidth: 1 }]}>
          <TouchableOpacity style={styles.menuItem} onPress={handleFullReset}>
            <Trash2 size={20} stroke={colors.danger} />
            <Text style={[styles.menuItemText, { color: colors.danger }]}>Réinitialiser toutes les données</Text>
          </TouchableOpacity>
          <View style={[styles.divider, { backgroundColor: colors.danger + '20' }]} />
          <TouchableOpacity style={styles.menuItem}>
            <LogOut size={20} stroke={colors.danger} />
            <Text style={[styles.menuItemText, { color: colors.danger }]}>Se déconnecter</Text>
          </TouchableOpacity>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { padding: Spacing.lg, paddingBottom: 100 },
  headerContainer: { marginBottom: 24, marginTop: 10 },
  headerSubtitle: { fontWeight: '700', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 },
  headerTitle: { fontSize: 32, fontWeight: '800', marginTop: 4 },
  profileHero: { alignItems: 'center', marginVertical: 30 },
  avatarContainer: { position: 'relative' },
  avatar: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 10 },
  badgeContainer: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 3 },
  userName: { fontSize: 22, fontWeight: '900', marginTop: 16 },
  userEmail: { fontSize: 14, marginTop: 4 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  statCard: { width: '47%', padding: 20, alignItems: 'center', borderRadius: 24 },
  statVal: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 12, marginTop: 4, textTransform: 'uppercase' },
  sectionTitle: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', marginBottom: 12, marginLeft: 4, letterSpacing: 1 },
  menuCard: { padding: 4, borderRadius: 24, marginBottom: 24 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 18 },
  menuItemText: { flex: 1, fontSize: 16, fontWeight: '700', marginLeft: 16 },
  divider: { height: 1, marginHorizontal: 16 },
});
