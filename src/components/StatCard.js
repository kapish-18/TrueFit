// StatCard — Small metric card for dashboard
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '../theme/theme';

export default function StatCard({ title, value, subtitle, icon, iconColor, trend, compact }) {
  const trendColor = trend === 'up' ? colors.success
    : trend === 'down' ? colors.danger
    : colors.textDim;

  const trendIcon = trend === 'up' ? 'trending-up'
    : trend === 'down' ? 'trending-down'
    : null;

  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      <View style={styles.header}>
        {icon && (
          <View style={[styles.iconWrap, { backgroundColor: (iconColor || colors.primary) + '18' }]}>
            <Ionicons name={icon} size={compact ? 16 : 18} color={iconColor || colors.primary} />
          </View>
        )}
        {trendIcon && (
          <Ionicons name={trendIcon} size={14} color={trendColor} style={styles.trendIcon} />
        )}
      </View>
      <Text style={[styles.value, compact && styles.valueCompact]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.title} numberOfLines={1}>{title}</Text>
      {subtitle && (
        <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
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
    flex: 1,
    minWidth: 140,
    ...shadows.sm,
  },
  cardCompact: {
    padding: spacing.md,
    minWidth: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendIcon: {
    marginLeft: 'auto',
  },
  value: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: 2,
  },
  valueCompact: {
    fontSize: fontSize.xl,
  },
  title: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  subtitle: {
    fontSize: fontSize.xs,
    color: colors.textDim,
    marginTop: 2,
  },
});
