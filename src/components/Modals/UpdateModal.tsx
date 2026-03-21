import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Linking } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { DownloadCloud } from 'lucide-react-native';

interface UpdateModalProps {
  visible: boolean;
  latestVersion: string;
  releaseNotes: string;
  downloadUrl: string;
}

export function UpdateModal({ visible, latestVersion, releaseNotes, downloadUrl }: UpdateModalProps) {
  const { colors, isDark } = useTheme();

  const handleDownload = () => {
    Linking.openURL(downloadUrl).catch((err) =>
      console.error("Impossible d'ouvrir le lien de téléchargement", err)
    );
  };

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    card: {
      width: '100%',
      backgroundColor: colors.background,
      borderRadius: 24,
      padding: 32,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: 0.3,
      shadowRadius: 24,
      elevation: 20,
    },
    iconWrap: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: 'rgba(79,156,249,0.12)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
      borderWidth: 1,
      borderColor: 'rgba(79,156,249,0.3)',
    },
    title: {
      fontSize: 22,
      fontWeight: '900',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 8,
      letterSpacing: -0.5,
    },
    version: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.accent,
      backgroundColor: 'rgba(79,156,249,0.1)',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      marginBottom: 20,
      overflow: 'hidden',
    },
    notes: {
      fontSize: 15,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 32,
    },
    btnPrimary: {
      width: '100%',
      paddingVertical: 16,
      backgroundColor: colors.accent,
      borderRadius: 999,
      alignItems: 'center',
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 8,
    },
    btnPrimaryText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '800',
    },
  });

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <DownloadCloud stroke={colors.accent} size={36} strokeWidth={2} />
          </View>
          
          <Text style={styles.title}>Mise à jour requise</Text>
          <Text style={styles.version}>Version {latestVersion}</Text>
          
          <Text style={styles.notes}>
            {releaseNotes || "Une nouvelle version de FOEIL est disponible. Vous devez la télécharger pour continuer à utiliser l'application sereinement."}
          </Text>

          <TouchableOpacity style={styles.btnPrimary} onPress={handleDownload} activeOpacity={0.8}>
            <Text style={styles.btnPrimaryText}>Installer la mise à jour</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
