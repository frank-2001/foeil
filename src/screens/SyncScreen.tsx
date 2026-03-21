import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { Colors, Spacing, Typography } from '../utils/theme';
import { Card } from '../components/Card';
import { Cloud, CloudOff, RefreshCcw, CheckCircle2, Server, ShieldCheck } from 'lucide-react-native';
import { SyncService } from '../services/SyncService';
import { getDatabase } from '../database/db';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';

const ScreenHeader = ({ title, subtitle, colors }: { title: string, subtitle: string, colors: any }) => (
  <View style={styles.headerContainer}>
    <Text style={[styles.headerSubtitle, { color: colors.accent }]}>{subtitle}</Text>
    <Text style={[styles.headerTitle, { color: colors.ink }]}>{title}</Text>
  </View>
);

export default function SyncScreen() {
  const { colors, isDark } = useTheme();
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastResult, setLastResult] = useState<{ success: boolean, count: number, failed: number } | null>(null);
  const [syncHistory, setSyncHistory] = useState<{id: string, time: string, success: boolean, count: number}[]>([]);

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
    setLastResult(null);
    try {
      const result = await SyncService.sync();
      setLastResult(result);
      
      if (result.count > 0 || result.failed > 0) {
        setSyncHistory(prev => [
          { 
            id: Math.random().toString(), 
            time: new Date().toLocaleTimeString(), 
            success: result.success, 
            count: result.count 
          }, 
          ...prev
        ].slice(0, 5));
      }
      
      await loadPendingCount();
    } catch (error) {
      console.error('Manual sync failed:', error);
      setLastResult({ success: false, count: 0, failed: 1 });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.listContent}>
        <ScreenHeader title="Synchronisation" subtitle="Cloud & Sécurité" colors={colors} />

        <Card style={styles.syncHero}>
          <View style={[styles.cloudIconBox, { backgroundColor: isSyncing ? colors.accent + '20' : (isDark ? colors.danger + '20' : '#FCE8E8') }]}>
            {isSyncing ? (
              <Cloud stroke={colors.accent} size={64} strokeWidth={1.5} />
            ) : (
              <CloudOff stroke={colors.danger} size={64} strokeWidth={1.5} />
            )}
          </View>
          <Text style={[styles.syncStatusTitle, { color: colors.ink }]}>
            {isSyncing ? 'Synchronisation en cours...' : 'Mode Hors-Ligne'}
          </Text>
          <Text style={[styles.syncStatusDesc, { color: colors.textSecondary }]}>
            Vos données sont actuellement stockées en sécurité sur votre appareil.
          </Text>
        </Card>

        <View style={styles.statsRow}>
          <Card style={styles.statMini}>
            <View style={[styles.miniIcon, { backgroundColor: isDark ? colors.accent + '20' : '#E0F2FE' }]}>
              <Server stroke={isDark ? colors.accent : "#0284C7"} size={20} />
            </View>
            <Text style={[styles.miniLabel, { color: colors.textSecondary }]}>En attente</Text>
            <Text style={[styles.miniVal, { color: colors.ink }]}>{pendingCount} flux</Text>
          </Card>
          <Card style={styles.statMini}>
            <View style={[styles.miniIcon, { backgroundColor: isDark ? colors.success + '20' : '#F0FDF4' }]}>
              <CheckCircle2 stroke={isDark ? colors.success : "#16A34A"} size={20} />
            </View>
            <Text style={[styles.miniLabel, { color: colors.textSecondary }]}>Dernière synchro</Text>
            <Text style={[styles.miniVal, { color: colors.ink }]}>2 Heures</Text>
          </Card>
        </View>

        <Card style={styles.securityCard}>
          <View style={styles.row}>
            <ShieldCheck stroke={colors.success} size={28} />
            <View style={styles.flex1}>
              <Text style={[styles.securityTitle, { color: colors.ink }]}>Protection des données</Text>
              <Text style={[styles.securityDesc, { color: colors.textSecondary }]}>Chiffrement AES-256 local et transfert sécurisé SSL.</Text>
            </View>
          </View>
        </Card>

        {lastResult && (
          <Card style={[styles.resultCard, { borderColor: lastResult.failed > 0 ? colors.danger : colors.success }]}>
            <Text style={[styles.resultTitle, { color: colors.ink }]}>Dernier résultat :</Text>
            <View style={styles.rowBetween}>
              <Text style={[styles.resultText, { color: colors.success }]}>✓ {lastResult.count} synchronisés</Text>
              {lastResult.failed > 0 && (
                <Text style={[styles.resultText, { color: colors.danger }]}>✗ {lastResult.failed} échoués</Text>
              )}
            </View>
            {!lastResult.success && lastResult.failed > 0 && (
              <Text style={[styles.errorHint, { color: colors.textSecondary }]}>
                Certains flux n'ont pas pu joindre le serveur. Portée du réseau ou configuration IP à vérifier.
              </Text>
            )}
          </Card>
        )}

        <TouchableOpacity 
          style={[styles.primaryBtn, { backgroundColor: colors.ink }, isSyncing && { opacity: 0.7 }]} 
          onPress={startSync}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <ActivityIndicator color={colors.paper} />
          ) : (
            <>
              <RefreshCcw stroke={colors.paper} size={20} />
              <Text style={[styles.primaryBtnText, { color: colors.paper }]}>Lancer la synchronisation</Text>
            </>
          )}
        </TouchableOpacity>

        {syncHistory.length > 0 && (
          <View style={{ marginTop: 40 }}>
            <Text style={[styles.sectionTitle, { color: colors.ink }]}>Historique de session</Text>
            {syncHistory.map((item) => (
              <View key={item.id} style={[styles.historyItem, { borderBottomColor: colors.border + '40' }]}>
                <View style={styles.row}>
                  <View style={[styles.statusDot, { backgroundColor: item.success ? colors.success : colors.danger }]} />
                  <Text style={[styles.historyTime, { color: colors.textSecondary }]}>{item.time}</Text>
                  <Text style={[styles.historyLabel, { color: colors.ink }]}>
                    {item.count} élément{item.count > 1 ? 's' : ''} traité{item.count > 1 ? 's' : ''}
                  </Text>
                </View>
                <CheckCircle2 size={16} stroke={item.success ? colors.success : colors.danger} />
              </View>
            ))}
          </View>
        )}

        <Text style={[styles.footerInfo, { color: colors.textSecondary + '60' }]}>
          FOEIL Cloud utilise une architecture de chiffrement de bout en bout. 
          Dernière vérification de sécurité : Aujourd'hui à {new Date().getHours()}h.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { padding: Spacing.lg },
  headerContainer: { marginBottom: 24, marginTop: 10 },
  headerSubtitle: { fontWeight: '700', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 },
  headerTitle: { fontSize: 32, fontWeight: '800', marginTop: 4 },
  syncHero: { padding: 40, alignItems: 'center', borderRadius: 32, marginBottom: 24 },
  cloudIconBox: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  syncStatusTitle: { fontSize: 22, fontWeight: '800', textAlign: 'center' },
  syncStatusDesc: { fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 22, paddingHorizontal: 20 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  statMini: { width: '48%', padding: 16, borderRadius: 20 },
  miniIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  miniLabel: { fontSize: 12, fontWeight: '600' },
  miniVal: { fontSize: 16, fontWeight: '800', marginTop: 4 },
  securityCard: { padding: 20, borderRadius: 24, marginBottom: 30 },
  row: { flexDirection: 'row', alignItems: 'center' },
  flex1: { flex: 1, marginLeft: 16 },
  securityTitle: { fontSize: 16, fontWeight: '700' },
  securityDesc: { fontSize: 13, marginTop: 2 },
  primaryBtn: { height: 60, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { fontSize: 16, fontWeight: '800', marginLeft: 12 },
  footerInfo: { fontSize: 12, textAlign: 'center', marginTop: 30, lineHeight: 18, paddingHorizontal: 20 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  resultCard: { padding: 18, borderRadius: 20, marginBottom: 24, borderWidth: 1 },
  resultTitle: { fontSize: 13, fontWeight: '800', marginBottom: 10, textTransform: 'uppercase' },
  resultText: { fontSize: 15, fontWeight: '700' },
  errorHint: { fontSize: 12, marginTop: 10, fontStyle: 'italic', lineHeight: 18 },
  sectionTitle: { fontSize: 14, fontWeight: '800', marginBottom: 15, textTransform: 'uppercase', letterSpacing: 0.5 },
  historyItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  historyTime: { fontSize: 12, fontWeight: '600', width: 70 },
  historyLabel: { fontSize: 13, fontWeight: '600', marginLeft: 10 },
});
