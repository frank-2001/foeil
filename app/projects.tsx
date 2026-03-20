import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Colors, Spacing, Typography } from '../src/utils/theme';
import { Card } from '../src/components/Card';
import { Target, TrendingUp, AlertCircle } from 'lucide-react-native';

export default function Projects() {
  const projects = [
    { id: '1', name: 'Achat Terrain', cost: 15000, saved: 8000, roi: 25, status: 'active' },
    { id: '2', name: 'Nouveau Laptop', cost: 2500, saved: 2500, roi: 0, status: 'completed' },
    { id: '3', name: 'Investissement Crypto', cost: 1000, saved: 200, roi: 50, status: 'planning' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View>
            <Text style={styles.summaryLabel}>Capacité d'Investissement</Text>
            <Text style={styles.summaryValue}>2,450.00 $</Text>
          </View>
          <Target color={Colors.accent} size={40} />
        </View>
      </Card>

      <Text style={styles.sectionTitle}>Mes Objectifs</Text>

      {projects.map((p) => {
        const progress = Math.min((p.saved / p.cost) * 100, 100);
        const isReady = p.saved >= p.cost;

        return (
          <Card key={p.id}>
            <View style={styles.projectHeader}>
              <Text style={styles.projectName}>{p.name}</Text>
              {isReady && p.status !== 'completed' && (
                <View style={styles.readyBadge}>
                  <Text style={styles.readyText}>PRÊT</Text>
                </View>
              )}
            </View>

            <View style={styles.row}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Coût Estimé</Text>
                <Text style={styles.metaValue}>{p.cost} $</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>ROI Attendu</Text>
                <Text style={styles.metaValue}>{p.roi}%</Text>
              </View>
            </View>

            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: isReady ? Colors.success : Colors.accent }]} />
              </View>
              <Text style={styles.progressText}>{progress.toFixed(0)}% financé</Text>
            </View>
          </Card>
        );
      })}

      <Card style={styles.infoCard}>
        <AlertCircle color={Colors.textSecondary} size={20} />
        <Text style={styles.infoText}>
          La priorité de vos projets est calculée automatiquement selon le ROI et le coût.
        </Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.md,
  },
  summaryCard: {
    backgroundColor: Colors.accent,
    padding: Spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: 4,
  },
  summaryValue: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '800',
  },
  sectionTitle: {
    ...Typography.h2,
    marginVertical: Spacing.md,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  projectName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  readyBadge: {
    backgroundColor: Colors.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  readyText: {
    color: Colors.success,
    fontSize: 10,
    fontWeight: '800',
  },
  row: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  metaItem: {
    marginRight: Spacing.xl,
  },
  metaLabel: {
    ...Typography.caption,
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  progressContainer: {
    marginTop: Spacing.sm,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    ...Typography.caption,
    textAlign: 'right',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderStyle: 'dashed',
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  infoText: {
    ...Typography.caption,
    marginLeft: 10,
    flex: 1,
  },
});
