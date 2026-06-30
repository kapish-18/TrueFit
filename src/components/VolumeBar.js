// VolumeBar — Horizontal bar showing sets per muscle group with optimal range
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius, fontSize, fontWeight } from '../theme/theme';

export default function VolumeBar({ label, sets, optimalMin, optimalMax, status, statusColor }) {
  const maxBarSets = Math.max(optimalMax * 1.5, sets, 30);
  const barWidth = Math.min(100, (sets / maxBarSets) * 100);
  const optimalStart = (optimalMin / maxBarSets) * 100;
  const optimalWidth = ((optimalMax - optimalMin) / maxBarSets) * 100;

  const barColor = statusColor === 'success' ? colors.success
    : statusColor === 'warning' ? colors.warning
    : statusColor === 'danger' ? colors.danger
    : colors.textDim;

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.rightInfo}>
          <Text style={[styles.setsText, { color: barColor }]}>{sets} sets</Text>
          <Text style={styles.statusText}>{status}</Text>
        </View>
      </View>

      <View style={styles.barTrack}>
        {/* Optimal range indicator */}
        <View style={[styles.optimalRange, { left: `${optimalStart}%`, width: `${optimalWidth}%` }]} />

        {/* Actual volume bar */}
        <View style={[styles.bar, { width: `${barWidth}%`, backgroundColor: barColor }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: fontWeight.medium,
  },
  rightInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  setsText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  statusText: {
    fontSize: fontSize.xs,
    color: colors.textDim,
  },
  barTrack: {
    height: 8,
    backgroundColor: colors.bgAlt,
    borderRadius: radius.full,
    overflow: 'hidden',
    position: 'relative',
  },
  optimalRange: {
    position: 'absolute',
    top: 0,
    height: '100%',
    backgroundColor: colors.success + '15',
    borderRadius: radius.full,
  },
  bar: {
    height: '100%',
    borderRadius: radius.full,
  },
});
