import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Image,
  Alert,
  AppState,
  AppStateStatus,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useTheme } from '../../context/ThemeContext';
import { ShieldCheck, Fingerprint } from 'lucide-react-native';

interface LockScreenProps {
  onUnlock: () => void;
}

export function LockScreen({ onUnlock }: LockScreenProps) {
  const { colors, isDark } = useTheme();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Fade-in on mount
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  // Pulsing animation for the icon
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.12, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 900, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // Auto-trigger auth on mount or when active
  useEffect(() => {
    let isMounted = true;

    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === 'active' && isMounted) {
        authenticate();
      }
    };
    
    const subscription = AppState.addEventListener('change', handleAppState);

    if (AppState.currentState === 'active') {
      authenticate();
    }

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);

  const authenticate = async () => {
    try {
      // 1. Check hardware support
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        // No biometrics hardware — unlock directly (fallback)
        onUnlock();
        return;
      }

      // 2. Check enrolled biometrics
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        // No biometrics enrolled — unlock directly (fallback)
        onUnlock();
        return;
      }

      // 3. Prompt biometric authentication
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Accédez à FOEIL',
        cancelLabel: 'Annuler',
        disableDeviceFallback: false,  // Allow PIN/pattern as fallback
        fallbackLabel: 'Utiliser le code PIN',
      });
      // Alert.alert('result', JSON.stringify(result))
      if (result.success) {
        onUnlock();
      }
      // If cancelled/failed, stay on lock screen (user can retry via button)
    } catch (error) {
      console.error('Auth error:', error);
      // On unexpected error, unlock to avoid blocking the user
      onUnlock();
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
    },
    iconWrapper: {
      width: 96,
      height: 96,
      borderRadius: 28,
      backgroundColor: isDark ? 'rgba(56,189,248,0.12)' : 'rgba(9,132,227,0.1)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 28,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(56,189,248,0.25)' : 'rgba(9,132,227,0.2)',
    },
    title: {
      fontSize: 26,
      fontWeight: '900',
      color: colors.text,
      letterSpacing: -0.5,
      marginBottom: 10,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 15,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 48,
    },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 16,
      paddingHorizontal: 36,
      backgroundColor: colors.accent,
      borderRadius: 999,
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.35,
      shadowRadius: 16,
      elevation: 8,
    },
    buttonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '800',
    },
    footer: {
      position: 'absolute',
      bottom: 40,
      alignItems: 'center',
      flex:1
    },
    footerText: {
      fontSize: 12,
      color: colors.textSecondary,
      opacity: 0.6,
      textAlign:'center',
      flex:1,
      width:100
    },
    appName: {
      fontSize: 18,
      fontWeight: '900',
      color: colors.accent,
      letterSpacing: -0.3,
      marginBottom: 4,
    },
  });

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* App Icon */}
      <Animated.View style={[styles.iconWrapper, { transform: [{ scale: pulseAnim }] }]}>
        <ShieldCheck stroke={colors.accent} size={44} strokeWidth={1.75} />
      </Animated.View>

      <Text style={styles.title}>FOEIL est verrouillé</Text>
      <Text style={styles.subtitle}>
        Utilisez votre empreinte digitale, Face ID{'\n'}ou votre code PIN pour accéder à vos finances.
      </Text>

      {/* Auth Button */}
      <TouchableOpacity style={styles.button} onPress={authenticate} activeOpacity={0.85}>
        <Fingerprint stroke="#fff" size={22} strokeWidth={2} />
        <Text style={styles.buttonText}>Déverrouiller</Text>
      </TouchableOpacity>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.appName}>FOEIL</Text>
        <Text style={styles.footerText}>LACREA DEVS</Text>
      </View>
    </Animated.View>
  );
}
