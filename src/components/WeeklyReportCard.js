// WeeklyReportCard — Summary card with highlights, warnings, recommendations
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '../theme/theme';

export default function WeeklyReportCard({ report }) {
  if (!report) return null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="analytics" size={20} color={colors.primary} />
        <Text style={styles.title}>Weekly Report</Text>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{report.workoutsCompleted}</Text>
          <Text style={styles.statLabel}>Workouts</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{report.totalSets}</Text>
          <Text style={styles.statLabel}>Sets</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{Math.round(report.totalVolume / 1000)}k</Text>
          <Text style={styles.statLabel}>Volume (kg)</Text>
        </View>
      </View>

      {/* Highlights */}
      {report.highlights?.length > 0 && (
        <View style={styles.section}>
          {report.highlights.map((h, i) => (
            <View key={i} style={styles.lineItem}>
              <Text style={styles.lineIcon}>{h.icon}</Text>
              <Text style={styles.lineText}>{h.text}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Warnings */}
      {report.warnings?.length > 0 && (
        <View style={[styles.section, styles.warningSection]}>
          {report.warnings.map((w, i) => (
            <View key={i} style={styles.lineItem}>
              <Text style={styles.lineIcon}>{w.icon}</Text>
              <Text style={[styles.lineText, styles.warningText]}>{w.text}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Recommendations */}
      {report.recommendations?.length > 0 && (
        <View style={styles.recommendSection}>
          <Ionicons name="bulb" size={14} color={colors.primary} />
          <Text style={styles.recommendText}>
            {report.recommendations[0]}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.lg,
    ...shadows.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgAlt,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textDim,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border,
  },
  section: {
    marginBottom: spacing.md,
  },
  warningSection: {
    backgroundColor: colors.warningBg,
    borderRadius: radius.sm,
    padding: spacing.sm,
  },
  lineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  lineIcon: {
    fontSize: fontSize.md,
    lineHeight: 20,
  },
  lineText: {
    fontSize: fontSize.sm,
    color: colors.text,
    flex: 1,
    lineHeight: 20,
  },
  warningText: {
    color: colors.warning,
  },
  recommendSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.primaryBg,
    borderRadius: radius.sm,
    padding: spacing.md,
  },
  recommendText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    flex: 1,
    fontWeight: fontWeight.medium,
    lineHeight: 20,
  },
});
