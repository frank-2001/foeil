import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Dimensions, Pressable } from 'react-native';
import { Colors, Spacing, Typography, Shadows } from '../utils/theme';
import { Card } from '../components/Card';
import { 
  Heart, 
  Globe, 
  Phone, 
  User, 
  Github, 
  ExternalLink,
  MessageCircle,
  Code2, 
  Cpu, 
  BarChart3, 
  PieChart, 
  Target as TargetIcon,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Zap,
  Layout
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function SupportScreen() {
  const { colors, isDark } = useTheme();
  const openUrl = (url: string) => {
    Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
  };

  const openWhatsApp = () => {
    Linking.openURL('whatsapp://send?phone=243973472538').catch(() => {
      Linking.openURL('https://wa.me/243973472538');
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        contentContainerStyle={styles.content} 
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
      >
        <View style={{ height: 10 }} />
        
        {/* Hero Section */}
        <View style={styles.heroSection}>
           <View style={styles.brandContainer}>
              <View style={[styles.logoOuter, { backgroundColor: colors.paper, borderColor: colors.border }]}>
                <View style={[styles.logoInner, { backgroundColor: colors.accent + '08' }]}>
                  <Cpu stroke={colors.accent} size={40} strokeWidth={2} />
                </View>
              </View>
              <View style={styles.brandTextContainer}>
                <Text style={[styles.appName, { color: colors.ink }]}>FOEIL</Text>
                <View style={styles.tagLine}>
                  <Text style={[styles.version, { color: colors.accent }]}>Version 1.0 Beta</Text>
                  <View style={[styles.dot, { backgroundColor: colors.border }]} />
                  <Text style={[styles.location, { color: colors.textSecondary }]}>Beni, RDC</Text>
                </View>
              </View>
           </View>
        </View>

        {/* Mission & Vision */}
        <View style={styles.missionSection}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Notre Vision</Text>
          <Pressable style={({ pressed }) => [styles.glassCard, { backgroundColor: colors.ink }, pressed && { opacity: 0.95, transform: [{ scale: 0.99 }] }]}>
            <View style={styles.visionHeader}>
              <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#F0F9FF' }]}>
                <Zap color={colors.accent} size={22} fill={colors.accent + '20'} />
              </View>
              <Text style={styles.visionTitle}>L'Indépendance par la Tech</Text>
            </View>
            <Text style={styles.visionText}>
              FOEIL n'est pas qu'une application, c'est un partenaire. En combinant la puissance de l'analyse et la discipline financière, nous bâtissons ensemble un avenir serein.
            </Text>
          </Pressable>
        </View>

        {/* Intelligence Financière */}
        <View style={styles.featureSection}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>L'Intelligence Financière</Text>
          <Card style={[styles.premiumCard, { backgroundColor: colors.paper, borderColor: colors.border }]}>
            <View style={styles.premiumHeader}>
               <BarChart3 stroke={colors.accent} size={28} />
               <View style={styles.premiumHeaderText}>
                  <Text style={[styles.premiumTitle, { color: colors.ink }]}>Reporting Avancé</Text>
                  <Text style={[styles.premiumSubtitle, { color: colors.textSecondary }]}>La clarté au service de vos choix.</Text>
               </View>
            </View>
            
            <View style={styles.featureGrid}>
               <View style={styles.featureItem}>
                  <View style={[styles.featureIcon, { backgroundColor: isDark ? 'rgba(16,185,129,0.1)' : '#ECFDF5' }]}>
                    <PieChart stroke={colors.success} size={20} />
                  </View>
                  <Text style={[styles.featureText, { color: colors.ink }]}>Visibilité totale</Text>
               </View>
               <View style={styles.featureItem}>
                  <View style={[styles.featureIcon, { backgroundColor: isDark ? 'rgba(59,130,246,0.1)' : '#EFF6FF' }]}>
                    <TrendingUp size={20} stroke={isDark ? colors.accent : '#3B82F6'} />
                  </View>
                  <Text style={[styles.featureText, { color: colors.ink }]}>Anticipation</Text>
               </View>
               <View style={styles.featureItem}>
                  <View style={[styles.featureIcon, { backgroundColor: isDark ? 'rgba(245,158,11,0.1)' : '#FFFBEB' }]}>
                    <TargetIcon stroke={colors.warning} size={20} />
                  </View>
                  <Text style={[styles.featureText, { color: colors.ink }]}>Focus Objectifs</Text>
               </View>
            </View>

            <View style={[styles.explanationBox, { backgroundColor: colors.background, borderLeftColor: colors.accent }]}>
               <Text style={[styles.explanationBody, { color: colors.text }]}>
                 Le secret de la croissance réside dans la mesure. En visualisant vos flux, vous passez d'une gestion réactive à une stratégie de prospérité long-terme.
               </Text>
            </View>
          </Card>
        </View>

        {/* Team / Dev info */}
        <View style={styles.devSection}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Conçu avec Passion</Text>
          <View style={[styles.devCard, { backgroundColor: colors.paper, borderColor: colors.border }]}>
            <View style={styles.devRow}>
               <View style={[styles.profileBox, { backgroundColor: colors.accent + '10' }]}>
                 <User stroke={colors.accent} size={30} />
               </View>
               <View style={styles.devInfo}>
                 <Text style={[styles.devName, { color: colors.ink }]}>Frank Makolongo</Text>
                 <Text style={[styles.devTitle, { color: colors.textSecondary }]}>Lead Architect @ LACREA</Text>
               </View>
               <TouchableOpacity onPress={() => openUrl('https://github.com/makolongo')}>
                 <Github color={colors.textSecondary} size={22} />
               </TouchableOpacity>
            </View>
            
            <View style={[styles.devFooter, { borderTopColor: colors.border }]}>
               <Code2 color={colors.ink} size={18} />
               <Text style={[styles.lacreaText, { color: colors.ink }]}>Product of <Text style={styles.bold}>LACREA DEVS</Text></Text>
            </View>
          </View>
        </View>

        {/* Support Actions */}
        <View style={styles.supportSection}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Support & Contact</Text>
          
          <TouchableOpacity 
            style={[styles.modernActionBtn, { backgroundColor: colors.paper, borderColor: colors.border }]} 
            onPress={() => openUrl('https://www.lacrea.dev')}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: isDark ? 'rgba(2,132,199,0.1)' : '#E0F2FE' }]}>
              <Globe stroke="#0284C7" size={24} />
            </View>
            <View style={styles.actionDetails}>
              <Text style={styles.actionHeader}>Site Web</Text>
              <Text style={[styles.actionLink, { color: colors.ink }]}>lacrea.dev</Text>
            </View>
            <ExternalLink stroke={colors.border} size={18} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.modernActionBtn, { backgroundColor: colors.paper, borderColor: colors.border }]} 
            onPress={openWhatsApp}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: isDark ? 'rgba(22,163,74,0.1)' : '#DCFCE7' }]}>
              <MessageCircle stroke="#16A34A" size={24} />
            </View>
            <View style={styles.actionDetails}>
              <Text style={styles.actionHeader}>WhatsApp</Text>
              <Text style={[styles.actionLink, { color: colors.ink }]}>Support Direct</Text>
            </View>
            <ExternalLink stroke={colors.border} size={18} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.modernActionBtn, { backgroundColor: colors.paper, borderColor: colors.border }]} 
            onPress={() => Linking.openURL('tel:+243973472538')}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: isDark ? 'rgba(220,38,38,0.1)' : '#FEE2E2' }]}>
              <Phone stroke="#DC2626" size={24} />
            </View>
            <View style={styles.actionDetails}>
              <Text style={styles.actionHeader}>Téléphone</Text>
              <Text style={[styles.actionLink, { color: colors.ink }]}>Appel Rapide</Text>
            </View>
            <ExternalLink stroke={colors.border} size={18} />
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
           <ShieldCheck color={colors.success} size={16} />
           <Text style={[styles.footerText, { color: colors.textSecondary }]}>
             Développé en RDC pour une excellence panafricaine.
           </Text>
        </View>
        
        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg },
  heroSection: { marginVertical: 32 },
  brandContainer: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  logoOuter: { width: 84, height: 84, borderRadius: 28, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  logoInner: { width: 64, height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  brandTextContainer: { justifyContent: 'center' },
  appName: { fontSize: 34, fontWeight: '900', letterSpacing: -1 },
  tagLine: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: -2 },
  version: { fontSize: 12, fontWeight: '700' },
  dot: { width: 4, height: 4, borderRadius: 2 },
  location: { fontSize: 12, fontWeight: '500' },
  sectionTitle: { fontSize: 14, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16, marginTop: 8 },
  missionSection: { marginBottom: 32 },
  featureSection: { marginBottom: 32 },
  devSection: { marginBottom: 32 },
  supportSection: { marginBottom: 32 },
  glassCard: { padding: 24, borderRadius: 32 },
  visionHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  iconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  visionTitle: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  visionText: { color: 'rgba(255,255,255,0.7)', fontSize: 15, lineHeight: 22, fontWeight: '400' },
  premiumCard: { padding: 24, borderRadius: 32, borderWidth: 1 },
  premiumHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 },
  premiumHeaderText: { flex: 1 },
  premiumTitle: { fontSize: 20, fontWeight: '800' },
  premiumSubtitle: { fontSize: 14, marginTop: 2 },
  featureGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  featureItem: { alignItems: 'center', gap: 10, flex: 1 },
  featureIcon: { width: 52, height: 52, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  featureText: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  explanationBox: { padding: 16, borderRadius: 16, borderLeftWidth: 4 },
  explanationBody: { fontSize: 14, lineHeight: 20, fontStyle: 'normal' },
  devCard: { padding: 20, borderRadius: 24, borderWidth: 1 },
  devRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  profileBox: { width: 60, height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  devInfo: { flex: 1 },
  devName: { fontSize: 18, fontWeight: '800' },
  devTitle: { fontSize: 13, marginTop: 2 },
  devFooter: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 20, paddingTop: 16, borderTopWidth: 1 },
  lacreaText: { fontSize: 14 },
  bold: { fontWeight: '900' },
  modernActionBtn: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 24, marginBottom: 16, borderWidth: 1 },
  actionIconContainer: { width: 52, height: 52, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  actionDetails: { flex: 1 },
  actionHeader: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  actionLink: { fontSize: 16, fontWeight: '800', marginTop: 2 },
  footer: { marginVertical: 40, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  footerText: { fontSize: 13, fontWeight: '500' }
});
