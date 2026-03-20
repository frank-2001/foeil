import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { Colors, Spacing, Typography } from '../utils/theme';
import { Card } from '../components/Card';
import { Cloud, CloudOff, RefreshCcw, CheckCircle2, Server, ShieldCheck } from 'lucide-react-native';
import { SyncService } from '../services/SyncService';
import { getDatabase } from '../database/db';
import { useFocusEffect } from '@react-navigation/native';

const ScreenHeader = ({ title, subtitle }: { title: string, subtitle: string }) => (
  <View style={styles.headerContainer}>
    <Text style={styles.headerSubtitle}>{subtitle}</Text>
    <Text style={styles.headerTitle}>{title}</Text>
  </View>
);

export default function SyncScreen() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      loadPendingCount();
    }, [])
  );

  const loadPendingCount = async () => {
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM sync_queue WHERE status = ?', ['pending']);
    setPendingCount(result?.count || 0);
  };

  const startSync = async () => {
    setIsSyncing(true);
    try {
      await SyncService.sync();
      await loadPendingCount();
    } catch (error) {
      console.error('Manual sync failed:', error);
    } finally {
      // Force a minimum delay for UX
      setTimeout(() => setIsSyncing(false), 3000);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.listContent}>
        <ScreenHeader title="Synchronisation" subtitle="Cloud & Sécurité" />

        <Card style={styles.syncHero}>
          <View style={[styles.cloudIconBox, { backgroundColor: isSyncing ? Colors.accent + '20' : '#FCE8E8' }]}>
            {isSyncing ? (
              <Cloud stroke={Colors.accent} size={64} strokeWidth={1.5} />
            ) : (
              <CloudOff stroke={Colors.danger} size={64} strokeWidth={1.5} />
            )}
          </View>
          <Text style={styles.syncStatusTitle}>
            {isSyncing ? 'Synchronisation en cours...' : 'Mode Hors-Ligne'}
          </Text>
          <Text style={styles.syncStatusDesc}>
            Vos données sont actuellement stockées en sécurité sur votre appareil.
          </Text>
        </Card>

        <View style={styles.statsRow}>
          <Card style={styles.statMini}>
            <View style={[styles.miniIcon, { backgroundColor: '#E0F2FE' }]}>
              <Server stroke="#0284C7" size={20} />
            </View>
            <Text style={styles.miniLabel}>En attente</Text>
            <Text style={styles.miniVal}>{pendingCount} flux</Text>
          </Card>
          <Card style={styles.statMini}>
            <View style={[styles.miniIcon, { backgroundColor: '#F0FDF4' }]}>
              <CheckCircle2 stroke="#16A34A" size={20} />
            </View>
            <Text style={styles.miniLabel}>Dernière synchro</Text>
            <Text style={styles.miniVal}>2 Heures</Text>
          </Card>
        </View>

        <Card style={styles.securityCard}>
          <View style={styles.row}>
            <ShieldCheck stroke={Colors.success} size={28} />
            <View style={styles.flex1}>
              <Text style={styles.securityTitle}>Protection des données</Text>
              <Text style={styles.securityDesc}>Chiffrement AES-256 local et transfert sécurisé SSL.</Text>
            </View>
          </View>
        </Card>

        <TouchableOpacity 
          style={[styles.primaryBtn, isSyncing && { opacity: 0.7 }]} 
          onPress={startSync}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <RefreshCcw stroke="#FFF" size={20} />
              <Text style={styles.primaryBtnText}>Synchroniser maintenant</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.footerInfo}>
          FOEIL utilise une architecture Offline-First pour vous permettre de travailler sans connexion. La synchronisation manuelle est recommandée avant de désinstaller l'application.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  listContent: { padding: Spacing.lg },
  headerContainer: { marginBottom: 24, marginTop: 10 },
  headerSubtitle: { color: Colors.accent, fontWeight: '700', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 },
  headerTitle: { fontSize: 32, fontWeight: '800', color: Colors.ink, marginTop: 4 },
  syncHero: { padding: 40, alignItems: 'center', borderRadius: 32, marginBottom: 24 },
  cloudIconBox: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  syncStatusTitle: { fontSize: 22, fontWeight: '800', color: Colors.text, textAlign: 'center' },
  syncStatusDesc: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginTop: 8, lineHeight: 22, paddingHorizontal: 20 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  statMini: { width: '48%', padding: 16, borderRadius: 20 },
  miniIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  miniLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  miniVal: { fontSize: 16, fontWeight: '800', color: Colors.text, marginTop: 4 },
  securityCard: { padding: 20, borderRadius: 24, backgroundColor: '#FFF', marginBottom: 30 },
  row: { flexDirection: 'row', alignItems: 'center' },
  flex1: { flex: 1, marginLeft: 16 },
  securityTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  securityDesc: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  primaryBtn: { backgroundColor: Colors.ink, height: 60, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800', marginLeft: 12 },
  footerInfo: { fontSize: 12, color: 'rgba(0,0,0,0.3)', textAlign: 'center', marginTop: 30, lineHeight: 18, paddingHorizontal: 20 },
});
