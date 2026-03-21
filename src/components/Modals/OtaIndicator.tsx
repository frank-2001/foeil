import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import * as Updates from 'expo-updates';
import { useTheme } from '../../context/ThemeContext';
import { DownloadCloud, CheckCircle, AlertTriangle } from 'lucide-react-native';

export function OtaIndicator() {
  const { colors, isDark } = useTheme();
  const { isDownloading, isUpdatePending, downloadError, downloadProgress } = Updates.useUpdates();
  const [visible, setVisible] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    if (isDownloading || isUpdatePending || downloadError) {
      if (!visible) {
        setVisible(true);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    } else {
      if (visible) {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setVisible(false));
      }
    }

    if (isUpdatePending) {
      // Reload shortly after success
      setTimeout(() => {
        Updates.reloadAsync();
      }, 2500);
    }

    if (downloadError) {
      // Hide error after 4 seconds
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setVisible(false));
      }, 4000);
    }
  }, [isDownloading, isUpdatePending, downloadError, visible]);

  if (!visible) return null;

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      top: 50,
      left: 20,
      right: 20,
      backgroundColor: colors.paper,
      borderRadius: 16,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 10,
      elevation: 10,
      zIndex: 10000,
      borderWidth: 1,
      borderColor: colors.border,
    },
    iconWrapper: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isDark ? 'rgba(56,189,248,0.1)' : 'rgba(9,132,227,0.1)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    content: {
      flex: 1,
    },
    title: {
      color: colors.text,
      fontWeight: '700',
      fontSize: 14,
      marginBottom: 2,
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: 12,
    },
    progressWrap: {
      height: 4,
      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
      borderRadius: 2,
      marginTop: 8,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.accent,
    },
  });

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
      <View style={styles.iconWrapper}>
        {isUpdatePending ? (
          <CheckCircle stroke="#10b981" size={20} strokeWidth={2.5} />
        ) : downloadError ? (
          <AlertTriangle stroke="#ef4444" size={20} strokeWidth={2.5} />
        ) : (
          <DownloadCloud stroke={colors.accent} size={20} strokeWidth={2.5} />
        )}
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>
          {isUpdatePending 
            ? 'Mise à jour terminée' 
            : downloadError 
              ? 'Échec de la mise à jour' 
              : 'Mise à jour détectée...'}
        </Text>
        <Text style={styles.subtitle}>
          {isUpdatePending 
            ? 'Redémarrage en cours...' 
            : downloadError 
              ? 'Impossible de télécharger via OTA.' 
              : `Téléchargement ${Math.round((downloadProgress || 0) * 100)}%`}
        </Text>
        {isDownloading && (
          <View style={styles.progressWrap}>
            <View style={[styles.progressFill, { width: `${Math.max(5, (downloadProgress || 0) * 100)}%` }]} />
          </View>
        )}
      </View>
    </Animated.View>
  );
}
