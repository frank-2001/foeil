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

const { width } = Dimensions.get('window');

export default function SupportScreen() {
  const openUrl = (url: string) => {
    Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
  };

  const openWhatsApp = () => {
    Linking.openURL('whatsapp://send?phone=243973472538').catch(() => {
      Linking.openURL('https://wa.me/243973472538');
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.content} 
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
      >
        {/* Sticky Header spacer/anchor if needed, but we'll use it for a custom header if we want */}
        <View style={{ height: 10 }} />
        
        {/* Hero Section */}
        <View style={styles.heroSection}>
           <View style={styles.brandContainer}>
              <View style={styles.logoOuter}>
                <View style={styles.logoInner}>
                  {/* <Image source={require('../assets/logo.png')} style={styles.logo} /> */}
                  <Cpu stroke={Colors.accent} size={40} strokeWidth={2} />
                </View>
              </View>
              <View style={styles.brandTextContainer}>
                <Text style={styles.appName}>FOEIL</Text>
                <View style={styles.tagLine}>
                  <Text style={styles.version}>Version 1.0 Beta</Text>
                  <View style={styles.dot} />
                  <Text style={styles.location}>Beni, RDC</Text>
                </View>
              </View>
           </View>
        </View>

        {/* Mission & Vision */}
        <View style={styles.missionSection}>
          <Text style={styles.sectionTitle}>Notre Vision</Text>
          <Pressable style={({ pressed }) => [styles.glassCard, pressed && { opacity: 0.95, transform: [{ scale: 0.99 }] }]}>
            <View style={styles.visionHeader}>
              <View style={[styles.iconBox, { backgroundColor: '#F0F9FF' }]}>
                <Zap color={Colors.accent} size={22} fill={Colors.accent + '20'} />
              </View>
              <Text style={styles.visionTitle}>L'Indépendance par la Tech</Text>
            </View>
            <Text style={styles.visionText}>
              FOEIL n'est pas qu'une application, c'est un partenaire. En combinant la puissance de l'analyse et la discipline financière, nous bâtissons ensemble un avenir serein.
            </Text>
          </Pressable>
        </View>

        {/* Intelligence Financière - Feature Highlight */}
        <View style={styles.featureSection}>
          <Text style={styles.sectionTitle}>L'Intelligence Financière</Text>
          <Card style={styles.premiumCard}>
            <View style={styles.premiumHeader}>
               <BarChart3 stroke={Colors.accent} size={28} />
               <View style={styles.premiumHeaderText}>
                  <Text style={styles.premiumTitle}>Reporting Avancé</Text>
                  <Text style={styles.premiumSubtitle}>La clarté au service de vos choix.</Text>
               </View>
            </View>
            
            <View style={styles.featureGrid}>
               <View style={styles.featureItem}>
                  <View style={[styles.featureIcon, { backgroundColor: '#ECFDF5' }]}>
                    <PieChart stroke={Colors.success} size={20} />
                  </View>
                  <Text style={styles.featureText}>Visibilité totale</Text>
               </View>
               <View style={styles.featureItem}>
                  <View style={[styles.featureIcon, { backgroundColor: '#EFF6FF' }]}>
                    <TrendingUp size={20} />
                  </View>
                  <Text style={styles.featureText}>Anticipation</Text>
               </View>
               <View style={styles.featureItem}>
                  <View style={[styles.featureIcon, { backgroundColor: '#FFFBEB' }]}>
                    <TargetIcon stroke={Colors.warning} size={20} />
                  </View>
                  <Text style={styles.featureText}>Focus Objectifs</Text>
               </View>
            </View>

            <View style={styles.explanationBox}>
               <Text style={styles.explanationBody}>
                 Le secret de la croissance réside dans la mesure. En visualisant vos flux, vous passez d'une gestion réactive à une stratégie de prospérité long-terme.
               </Text>
            </View>
          </Card>
        </View>

        {/* Team / Dev info */}
        <View style={styles.devSection}>
          <Text style={styles.sectionTitle}>Conçu avec Passion</Text>
          <View style={styles.devCard}>
            <View style={styles.devRow}>
               <View style={styles.profileBox}>
                 <User stroke={Colors.accent} size={30} />
               </View>
               <View style={styles.devInfo}>
                 <Text style={styles.devName}>Frank Makolongo</Text>
                 <Text style={styles.devTitle}>Lead Architect @ LACREA</Text>
               </View>
               <TouchableOpacity onPress={() => openUrl('https://github.com/makolongo')}>
                 <Github color={Colors.textSecondary} size={22} />
               </TouchableOpacity>
            </View>
            
            <View style={styles.devFooter}>
               <Code2 color={Colors.ink} size={18} />
               <Text style={styles.lacreaText}>Product of <Text style={styles.bold}>LACREA DEVS</Text></Text>
            </View>
          </View>
        </View>

        {/* Support Actions */}
        <View style={styles.supportSection}>
          <Text style={styles.sectionTitle}>Support & Contact</Text>
          
          <TouchableOpacity 
            style={styles.modernActionBtn} 
            onPress={() => openUrl('https://www.lacrea.dev')}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: '#E0F2FE' }]}>
              <Globe stroke="#0284C7" size={24} />
            </View>
            <View style={styles.actionDetails}>
              <Text style={styles.actionHeader}>Site Web</Text>
              <Text style={styles.actionLink}>lacrea.dev</Text>
            </View>
            <ExternalLink stroke={Colors.border} size={18} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.modernActionBtn} 
            onPress={openWhatsApp}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: '#DCFCE7' }]}>
              <MessageCircle stroke="#16A34A" size={24} />
            </View>
            <View style={styles.actionDetails}>
              <Text style={styles.actionHeader}>WhatsApp</Text>
              <Text style={styles.actionLink}>Support Direct</Text>
            </View>
            <ExternalLink stroke={Colors.border} size={18} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.modernActionBtn} 
            onPress={() => Linking.openURL('tel:+243973472538')}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: '#FEE2E2' }]}>
              <Phone stroke="#DC2626" size={24} />
            </View>
            <View style={styles.actionDetails}>
              <Text style={styles.actionHeader}>Téléphone</Text>
              <Text style={styles.actionLink}>Appel Rapide</Text>
            </View>
            <ExternalLink stroke={Colors.border} size={18} />
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
           <ShieldCheck color={Colors.success} size={16} />
           <Text style={styles.footerText}>
             Développé en RDC pour une excellence panafricaine.
           </Text>
        </View>
        
        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.background 
  },
  content: { 
    paddingHorizontal: Spacing.lg 
  },
  
  // Hero Section
  heroSection: {
    marginVertical: 32,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  logoOuter: {
    width: 84,
    height: 84,
    borderRadius: 28,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.paper,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  logoInner: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: Colors.accent + '08',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeContainer: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    backgroundColor: '#FFF',
    padding: 6,
    borderRadius: 12,
    ...Shadows.inner,
  },
  brandTextContainer: {
    justifyContent: 'center',
  },
  appName: { 
    fontSize: 34, 
    fontWeight: '900', 
    color: Colors.ink, 
    letterSpacing: -1 
  },
  tagLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: -2,
  },
  version: { 
    fontSize: 12, 
    color: Colors.accent, 
    fontWeight: '700' 
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
  },
  location: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },

  // Sections
  sectionTitle: { 
    fontSize: 14, 
    fontWeight: '800', 
    color: Colors.textSecondary, 
    textTransform: 'uppercase', 
    letterSpacing: 2,
    marginBottom: 16,
    marginTop: 8,
  },
  missionSection: { marginBottom: 32 },
  featureSection: { marginBottom: 32 },
  devSection: { marginBottom: 32 },
  supportSection: { marginBottom: 32 },

  // Glass Card
  glassCard: {
    backgroundColor: Colors.ink,
    padding: 24,
    borderRadius: 32,
    ...Shadows.paper,
  },
  visionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  visionTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },
  visionText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
  },

  // Premium Card
  premiumCard: {
    padding: 24,
    borderRadius: 32,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
    ...Shadows.paper,
  },
  premiumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  premiumHeaderText: {
    flex: 1,
  },
  premiumTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.ink,
  },
  premiumSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  featureGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  featureItem: {
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  featureIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.ink,
    textAlign: 'center',
  },
  explanationBox: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.accent,
  },
  explanationBody: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    fontStyle: 'normal'
  },

  // Dev Card
  devCard: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  devRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  profileBox: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: Colors.accent + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  devInfo: {
    flex: 1,
  },
  devName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.ink,
  },
  devTitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  devFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  lacreaText: {
    fontSize: 14,
    color: Colors.ink,
  },
  bold: {
    fontWeight: '900',
  },

  // Modern Action Button
  modernActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
    ...Shadows.inner,
  },
  actionIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionDetails: {
    flex: 1,
  },
  actionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  actionLink: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.ink,
    marginTop: 2,
  },

  // Footer
  footer: {
    marginVertical: 40,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  footerText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  }
});
