import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Colors, Spacing, Typography } from '../src/utils/theme';
import { Card } from '../src/components/Card';
import { CloudOff, RefreshCcw, CheckCircle2 } from 'lucide-react-native';

export default function Sync() {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 2000);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <CloudOff color={Colors.textSecondary} size={80} strokeWidth={1.5} />
        </View>

        <Text style={styles.title}>Mode Hors-Ligne</Text>
        <Text style={styles.description}>
          Vos données sont enregistrées localement sur votre téléphone. Connectez-vous à Internet pour synchroniser avec le serveur.
        </Text>

        <Card style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>En attente</Text>
            <Text style={styles.statusValue}>12 transactions</Text>
          </View>
          <View style={[styles.statusRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
            <Text style={styles.statusLabel}>Dernière synchro</Text>
            <Text style={styles.statusValue}>Il y a 2 heures</Text>
          </View>
        </Card>

        <TouchableOpacity 
          style={[styles.syncButton, isSyncing && styles.syncButtonDisabled]} 
          onPress={handleSync}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <RefreshCcw color="#FFF" size={20} />
              <Text style={styles.syncButtonText}>Synchroniser maintenant</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.infoBox}>
          <CheckCircle2 color={Colors.success} size={18} />
          <Text style={styles.infoText}>Vos données sont sécurisées localement.</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: Spacing.xl,
    opacity: 0.5,
  },
  title: {
    ...Typography.h1,
    marginBottom: Spacing.sm,
  },
  description: {
    ...Typography.body,
    textAlign: 'center',
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
  },
  statusCard: {
    width: '100%',
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: Spacing.md,
    marginBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  statusLabel: {
    color: Colors.textSecondary,
    fontSize: 16,
  },
  statusValue: {
    fontWeight: '700',
    color: Colors.text,
    fontSize: 16,
  },
  syncButton: {
    backgroundColor: Colors.ink,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 32,
    width: '100%',
    justifyContent: 'center',
  },
  syncButtonDisabled: {
    opacity: 0.7,
  },
  syncButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 12,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  infoText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 8,
  },
});
