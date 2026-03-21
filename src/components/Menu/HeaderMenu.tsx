import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  Animated, 
  Dimensions, 
  Platform,
  ScrollView
} from 'react-native';
import { 
  Menu, 
  X, 
  Database, 
  Coins, 
  FileText, 
  Sliders, 
  RefreshCw, 
  ChevronRight,
  User,
  Settings,
  HelpCircle,
  Landmark
} from 'lucide-react-native';
import { Colors, Spacing, Typography } from '../../utils/theme';
import { useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../context/ThemeContext';

const { width, height } = Dimensions.get('window');

export const HeaderMenu = () => {
  const { colors, isDark } = useTheme();
  const [visible, setVisible] = useState(false);
  const navigation = useNavigation<any>();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(height)).current;

  const menuItems = [
    { label: 'Mes Projets', desc: 'Suivi de vos investissements', icon: Landmark, screen: 'Projects', color: colors.accent },
    { label: 'Mes Sources', desc: 'Gérez vos flux entrants et sortants', icon: Database, screen: 'Sources', color: '#4F46E5' },
    { label: 'Mes Devises', desc: 'Configuration multi-monnaies', icon: Coins, screen: 'Currencies', color: '#F59E0B' },
    { label: 'Mes Obligations', desc: 'Suivi des dettes et créances', icon: FileText, screen: 'Obligations', color: '#10B981' },
    { label: 'Synchronisation', desc: 'Cloud et sauvegarde distante', icon: RefreshCw, screen: 'Sync', color: '#3B82F6' },
  ];

  const openMenu = () => {
    setVisible(true);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      })
    ]).start();
  };

  const closeMenu = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 250,
        useNativeDriver: true,
      })
    ]).start(() => setVisible(false));
  };

  const handleNavigate = (screen: string) => {
    closeMenu();
    setTimeout(() => {
      navigation.navigate(screen);
    }, 300);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={openMenu} style={styles.triggerButton}>
        <Menu stroke={colors.ink} size={28} strokeWidth={2.5} />
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent={true}
        onRequestClose={closeMenu}
      >
        <View style={styles.modalContent}>
          <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
            {Platform.OS === 'ios' ? (
              <BlurView intensity={30} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
            ) : (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.7)' }]} />
            )}
          </Animated.View>

          <Animated.View style={[styles.mainMenu, { backgroundColor: colors.paper, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.header}>
              <View>
                <Text style={[styles.greeting, { color: colors.textSecondary }]}>Configuration</Text>
                <Text style={[styles.brandTitle, { color: colors.ink }]}>Menu FOEIL</Text>
              </View>
              <TouchableOpacity onPress={closeMenu} style={[styles.closeButton, { backgroundColor: colors.background }]}>
                <X stroke={colors.ink} size={32} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.itemsScroll}>
              {menuItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.menuItem, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={() => handleNavigate(item.screen)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.iconContainer, { backgroundColor: item.color + '10' }]}>
                    <item.icon stroke={item.color} size={28} strokeWidth={2} />
                  </View>
                  <View style={styles.itemMeta}>
                    <Text style={[styles.itemLabel, { color: colors.ink }]}>{item.label}</Text>
                    <Text style={[styles.itemDesc, { color: colors.textSecondary }]}>{item.desc}</Text>
                  </View>
                  <ChevronRight stroke={colors.textSecondary + '40'} size={20} />
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.footer}>
              <View style={[styles.footerRow, { borderTopColor: colors.border }]}>
                <TouchableOpacity style={[styles.miniBtn, { backgroundColor: colors.background }]} onPress={() => handleNavigate('Profile')}>
                  <User stroke={colors.textSecondary} size={20} />
                  <Text style={[styles.miniBtnText, { color: colors.textSecondary }]}>Profil</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.miniBtn, { backgroundColor: colors.background }]} onPress={() => handleNavigate('Settings')}>
                  <Settings stroke={colors.textSecondary} size={20} />
                  <Text style={[styles.miniBtnText, { color: colors.textSecondary }]}>Paramètres</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.miniBtn, { backgroundColor: colors.background }]} onPress={() => { setVisible(false); navigation.navigate('Support'); }}>
                  <HelpCircle stroke={colors.textSecondary} size={20} />
                  <Text style={[styles.miniBtnText, { color: colors.textSecondary }]}>Support</Text>
                </TouchableOpacity>
              </View>
              <Text style={[styles.version, { color: colors.textSecondary + '40' }]}>FOEIL FinTech — v1.0.0</Text>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginRight: 15,
  },
  triggerButton: {
    padding: 6,
  },
  modalContent: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  mainMenu: {
    height: height * 0.85,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    padding: Spacing.xl,
    paddingTop: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  greeting: {
    fontSize: 16,
    fontWeight: '600',
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  closeButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemsScroll: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 24,
    marginBottom: 12,
    borderWidth: 1,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemMeta: {
    flex: 1,
    marginLeft: 16,
  },
  itemLabel: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  itemDesc: {
    fontSize: 13,
  },
  footer: {
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderTopWidth: 1,
    paddingTop: 24,
  },
  miniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  miniBtnText: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '700',
  },
  version: {
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '600',
  },
});
