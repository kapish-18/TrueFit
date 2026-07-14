// Analytics Screen — Charts and data visualization
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Dimensions, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { BarChart, LineChart } from 'react-native-gifted-charts';
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '../src/theme/theme';
import { getFullLogDataByDateRange, getPersonalRecords } from '../src/db/dao';
import { organizeByWeek } from '../src/engine/fatigue';
import { analyzeWeeklyVolume, getTotalWeeklyVolume } from '../src/engine/volumeAnalyzer';
import { getVolumeTrend, analyzeConsistency } from '../src/engine/progressAnalyzer';
import { getWeeksAgo, getToday, getWeekStart } from '../src/utils/date';
import VolumeBar from '../src/components/VolumeBar';
import EmptyState from '../src/components/EmptyState';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH - 80;

const TIME_RANGES = [
  { label: '4W', weeks: 4 },
  { label: '8W', weeks: 8 },
  { label: '12W', weeks: 12 },
  { label: 'All', weeks: 52 },
];

export default function AnalyticsScreen() {
  const [range, setRange] = useState(8);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState({
    volumeTrend: [],
    volumeAnalysis: [],
    consistency: null,
    prList: [],
    weeklyWorkouts: [],
  });

  useFocusEffect(
    useCallback(() => {
      loadAnalytics();
    }, [loadAnalytics])
  );

  const loadAnalytics = useCallback(async () => {
    try {
      const startDate = getWeeksAgo(range);
      const today = getToday();

      const logs = await getFullLogDataByDateRange(startDate, today);
      const weeklyBuckets = organizeByWeek(logs, range);

      // Volume trend
      const volumeTrend = getVolumeTrend(weeklyBuckets);

      // Current week volume analysis
      const thisWeekStart = getWeekStart();
      const thisWeekLogs = logs.filter(l => l.date >= thisWeekStart);
      const volumeAnalysis = analyzeWeeklyVolume(thisWeekLogs);

      // Consistency
      const consistency = analyzeConsistency(weeklyBuckets);

      // PRs
      const prList = await getPersonalRecords();

      setData({
        volumeTrend,
        volumeAnalysis: volumeAnalysis.filter(v => v.sets > 0),
        consistency,
        prList: prList.slice(0, 20),
        weeklyWorkouts: consistency?.weeklyWorkouts || [],
      });
    } catch (e) {
      console.error('Analytics load failed:', e);
    }
  }, [range]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  };

  // Chart data transforms
  const volumeChartData = data.volumeTrend.map((v, i) => {
    const value = Math.round(v.totalVolume / 1000);
    return {
      value: value || 0.5, // minimum bar height so 0-volume weeks are visible
      label: `W${i + 1}`,
      frontColor: value > 0 ? colors.primary : colors.border,
      gradientColor: colors.primaryDim,
      topLabelComponent: value > 0 ? () => (
        <Text style={{ fontSize: 9, color: colors.textDim }}>{value}k</Text>
      ) : undefined,
    };
  });

  const workoutFrequencyData = data.weeklyWorkouts.map((w, i) => ({
    value: w.count || 0.3, // minimum bar height for 0-workout weeks
    label: `W${i + 1}`,
    frontColor: w.count >= 3 ? colors.success : w.count >= 1 ? colors.warning : colors.border,
  }));

  const hasData = data.volumeTrend.some(v => v.totalVolume > 0);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <Text style={styles.title}>Analytics</Text>
      <Text style={styles.subtitle}>Training insights and progress</Text>

      {/* Time Range Selector */}
      <View style={styles.rangeRow}>
        {TIME_RANGES.map(r => (
          <Pressable
            key={r.weeks}
            style={[styles.rangePill, range === r.weeks && styles.rangePillActive]}
            onPress={() => setRange(r.weeks)}
          >
            <Text style={[styles.rangePillText, range === r.weeks && styles.rangePillTextActive]}>
              {r.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {!hasData ? (
        <EmptyState
          icon="stats-chart-outline"
          title="No Data Yet"
          subtitle="Log some workouts to see your analytics and progress charts."
        />
      ) : (
        <>
          {/* Volume Over Time */}
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Volume Over Time</Text>
            <Text style={styles.chartSubtitle}>Total volume (kg) per week</Text>
            <View style={styles.chartWrap}>
              <BarChart
                data={volumeChartData}
                width={CHART_WIDTH}
                height={160}
                barWidth={Math.min(24, CHART_WIDTH / (volumeChartData.length * 2))}
                spacing={Math.min(16, CHART_WIDTH / (volumeChartData.length * 3))}
                initialSpacing={10}
                endSpacing={10}
                noOfSections={4}
                barBorderRadius={4}
                yAxisColor={colors.border}
                xAxisColor={colors.border}
                yAxisTextStyle={{ color: colors.textDim, fontSize: 10 }}
                xAxisLabelTextStyle={{ color: colors.textDim, fontSize: 9 }}
                isAnimated
                animationDuration={600}
                hideRules
                backgroundColor="transparent"
              />
            </View>
          </View>

          {/* Workout Frequency */}
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Workout Frequency</Text>
            <Text style={styles.chartSubtitle}>Workouts per week</Text>
            <View style={styles.chartWrap}>
              <BarChart
                data={workoutFrequencyData}
                width={CHART_WIDTH}
                height={120}
                barWidth={Math.min(24, CHART_WIDTH / (workoutFrequencyData.length * 2))}
                spacing={Math.min(16, CHART_WIDTH / (workoutFrequencyData.length * 3))}
                initialSpacing={10}
                endSpacing={10}
                noOfSections={3}
                maxValue={7}
                barBorderRadius={4}
                yAxisColor={colors.border}
                xAxisColor={colors.border}
                yAxisTextStyle={{ color: colors.textDim, fontSize: 10 }}
                xAxisLabelTextStyle={{ color: colors.textDim, fontSize: 9 }}
                isAnimated
                hideRules
                backgroundColor="transparent"
              />
            </View>
          </View>

          {/* Consistency Stats */}
          {data.consistency && (
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Consistency</Text>
              <View style={styles.consistencyGrid}>
                <View style={styles.consistencyItem}>
                  <Text style={styles.consistencyValue}>{data.consistency.currentStreak}</Text>
                  <Text style={styles.consistencyLabel}>Week Streak</Text>
                </View>
                <View style={styles.consistencyItem}>
                  <Text style={styles.consistencyValue}>{data.consistency.consistency}%</Text>
                  <Text style={styles.consistencyLabel}>Consistency</Text>
                </View>
                <View style={styles.consistencyItem}>
                  <Text style={styles.consistencyValue}>{data.consistency.avgWorkouts}</Text>
                  <Text style={styles.consistencyLabel}>Avg/Week</Text>
                </View>
                <View style={styles.consistencyItem}>
                  <Text style={styles.consistencyValue}>{data.consistency.totalWorkouts}</Text>
                  <Text style={styles.consistencyLabel}>Total</Text>
                </View>
              </View>
            </View>
          )}

          {/* Volume Distribution */}
          {data.volumeAnalysis.length > 0 && (
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Muscle Volume Distribution</Text>
              <Text style={styles.chartSubtitle}>This week's sets per muscle group</Text>
              <View style={{ marginTop: spacing.md }}>
                {data.volumeAnalysis.map(v => (
                  <VolumeBar
                    key={v.muscleGroup}
                    label={v.label}
                    sets={v.sets}
                    optimalMin={v.optimalMin}
                    optimalMax={v.optimalMax}
                    status={v.status}
                    statusColor={v.statusColor}
                  />
                ))}
              </View>
            </View>
          )}

          {/* PR Timeline */}
          {data.prList.length > 0 && (
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>PR Timeline 🏆</Text>
              {data.prList.slice(0, 10).map((pr, i) => (
                <View key={pr.id || i} style={styles.prRow}>
                  <View style={styles.prDot} />
                  <View style={styles.prInfo}>
                    <Text style={styles.prName}>{pr.exercise_name}</Text>
                    <Text style={styles.prDetail}>
                      {pr.type === 'weight' ? `${pr.value}kg × ${pr.reps}` :
                       pr.type === 'estimated_1rm' ? `e1RM: ${pr.value}kg` :
                       `${pr.value} reps`}
                    </Text>
                  </View>
                  <Text style={styles.prDate}>{pr.date}</Text>
                </View>
              ))}
            </View>
          )}
        </>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: 56,
    paddingBottom: 20,
  },
  title: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.heavy,
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  rangeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xxl,
  },
  rangePill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rangePillActive: {
    backgroundColor: colors.primaryBg,
    borderColor: colors.primary,
  },
  rangePillText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  rangePillTextActive: {
    color: colors.primary,
  },
  chartCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  chartTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: 4,
  },
  chartSubtitle: {
    fontSize: fontSize.xs,
    color: colors.textDim,
    marginBottom: spacing.md,
  },
  chartWrap: {
    alignItems: 'center',
    marginLeft: -spacing.md,
  },
  consistencyGrid: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  consistencyItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    backgroundColor: colors.bgAlt,
    borderRadius: radius.md,
    marginHorizontal: 2,
  },
  consistencyValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  consistencyLabel: {
    fontSize: fontSize.xs,
    color: colors.textDim,
    marginTop: 4,
  },
  prRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  prDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gold,
    marginRight: spacing.md,
  },
  prInfo: {
    flex: 1,
  },
  prName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  prDetail: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  prDate: {
    fontSize: fontSize.xs,
    color: colors.textDim,
  },
});
