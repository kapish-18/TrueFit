// Dashboard Screen
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '../src/theme/theme';
import { useProgramStore } from '../src/stores/useProgramStore';
import { useSettingsStore } from '../src/stores/useSettingsStore';
import StatCard from '../src/components/StatCard';
import FatigueGauge from '../src/components/FatigueGauge';
import WeeklyReportCard from '../src/components/WeeklyReportCard';
import VolumeBar from '../src/components/VolumeBar';
import EmptyState from '../src/components/EmptyState';
import { getFullLogDataByDateRange, getRecentPRs, getWeeklyWorkoutCount, getWorkoutLogs } from '../src/db/dao';
import { calculateFatigueScore, organizeByWeek } from '../src/engine/fatigue';
import { checkDeloadNeeded } from '../src/engine/deloadPlanner';
import { analyzeWeeklyVolume, getMuscleImbalances, getTotalWeeklyVolume } from '../src/engine/volumeAnalyzer';
import { analyzeConsistency } from '../src/engine/progressAnalyzer';
import { generateWeeklyReport } from '../src/engine/weeklyReport';
import { getWeekStart, getToday, getWeeksAgo, formatDateReadable } from '../src/utils/date';

export default function DashboardScreen() {
  const router = useRouter();
  const activeProgram = useProgramStore(s => s.activeProgram);
  const activeDays = useProgramStore(s => s.activeDays);
  const deloadFrequency = useSettingsStore(s => s.deloadFrequency);

  const [refreshing, setRefreshing] = useState(false);
  const [dashData, setDashData] = useState({
    fatigue: { score: 0, level: 'Low', color: colors.success },
    deload: null,
    weeklyVolume: { totalSets: 0, totalVolume: 0 },
    consistency: { currentStreak: 0, avgWorkouts: 0 },
    recentPRs: [],
    imbalances: null,
    weeklyReport: null,
    todayWorkout: null,
    volumeAnalysis: [],
  });

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard])
  );

  const loadDashboard = useCallback(async () => {
    try {
      const weekStart = getWeekStart();
      const today = getToday();
      const twelveWeeksAgo = getWeeksAgo(12);
      const lastWeekStart = getWeeksAgo(1);

      // Load all data
      const allLogs = await getFullLogDataByDateRange(twelveWeeksAgo, today);
      const thisWeekLogs = allLogs.filter(l => l.date >= weekStart);
      const lastWeekLogs = allLogs.filter(l => l.date >= lastWeekStart && l.date < weekStart);

      // Fatigue
      const weeklyBuckets = organizeByWeek(allLogs, 12);
      const fatigue = calculateFatigueScore(weeklyBuckets);

      // Deload
      const deload = checkDeloadNeeded(weeklyBuckets, deloadFrequency, activeDays?.length || 3);

      // Volume
      const weeklyVolume = getTotalWeeklyVolume(thisWeekLogs);
      const volumeAnalysis = analyzeWeeklyVolume(thisWeekLogs);
      const imbalances = getMuscleImbalances(volumeAnalysis);

      // Consistency
      const consistency = analyzeConsistency(weeklyBuckets);

      // PRs
      const recentPRs = await getRecentPRs(3);

      // Weekly report
      const weeklyReport = generateWeeklyReport(thisWeekLogs, lastWeekLogs, fatigue.score);

      // Next workout (sequential tracking)
      let nextWorkout = null;
      let daysSinceLast = 0;

      if (activeProgram && activeDays.length > 0) {
        // Find the last completed log for this program
        const recentLogs = await getWorkoutLogs(20);
        const programLogs = recentLogs.filter(l => l.program_id === activeProgram.id);
        
        nextWorkout = activeDays[0]; // Default to first day

        if (programLogs.length > 0) {
          const lastCompletedDayId = programLogs[0].day_id;
          const lastIndex = activeDays.findIndex(d => d.id === lastCompletedDayId);
          
          if (lastIndex !== -1) {
            // Loop sequentially to the next day
            const nextIndex = (lastIndex + 1) % activeDays.length;
            nextWorkout = activeDays[nextIndex];
          }

          const lastDate = new Date(programLogs[0].date);
          const todayDate = new Date(getToday());
          daysSinceLast = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));
        }
      }

      setDashData({
        fatigue,
        deload,
        weeklyVolume,
        consistency,
        recentPRs,
        imbalances,
        weeklyReport,
        todayWorkout: nextWorkout,
        daysSinceLast,
        volumeAnalysis: volumeAnalysis.filter(v => v.sets > 0).slice(0, 6),
      });
    } catch (e) {
      console.error('Dashboard load failed:', e);
    }
  }, [activeProgram, activeDays, deloadFrequency]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  }, [loadDashboard]);

  if (!activeProgram) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerSection}>
          <Text style={styles.greeting}>TrueFit</Text>
          <Text style={styles.date}>{formatDateReadable(getToday())}</Text>
        </View>
        <EmptyState
          icon="barbell-outline"
          title="No Active Program"
          subtitle="Create a workout program to get started with intelligent tracking, progressive overload recommendations, and fatigue management."
          actionLabel="Create Program"
          onAction={() => router.push('/planner')}
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.headerSection}>
        <View>
          <Text style={styles.greeting}>TrueFit</Text>
          <Text style={styles.date}>{formatDateReadable(getToday())}</Text>
        </View>
        <View style={styles.programBadge}>
          <Ionicons name="fitness" size={14} color={colors.primary} />
          <Text style={styles.programName}>{activeProgram.name}</Text>
        </View>
      </View>

      {/* Today's Workout Card */}
      {dashData.todayWorkout && (
        <Pressable
          style={({ pressed }) => [styles.todayCard, pressed && { opacity: 0.9 }]}
          onPress={() => router.push('/log')}
        >
          <View style={styles.todayHeader}>
            <View style={styles.todayBadge}>
              <Ionicons name="calendar" size={16} color={colors.primary} />
              <Text style={styles.todayLabel}>Next Workout</Text>
            </View>
            {dashData.daysSinceLast >= 3 && (
              <View style={styles.missedBadge}>
                <Ionicons name="time" size={12} color={colors.danger} />
                <Text style={styles.missedText}>{dashData.daysSinceLast} days missed</Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
          </View>
          <Text style={styles.todayName}>{dashData.todayWorkout.name}</Text>
          <Text style={styles.todayExercises}>
            {dashData.todayWorkout.exercises?.length || 0} exercises
          </Text>
        </Pressable>
      )}

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard
          title="Weekly Volume"
          value={`${Math.round(dashData.weeklyVolume.totalVolume / 1000)}k`}
          subtitle={`${useSettingsStore.getState().weightUnit} total`}
          icon="barbell"
          iconColor={colors.primary}
        />
        <StatCard
          title="Consistency"
          value={`${dashData.consistency.currentStreak}w`}
          subtitle="streak"
          icon="flame"
          iconColor={colors.warning}
        />
      </View>

      <View style={styles.statsGrid}>
        <StatCard
          title="Weekly Sets"
          value={dashData.weeklyVolume.totalSets}
          icon="layers"
          iconColor={colors.purple}
        />
        <StatCard
          title="Avg/Week"
          value={dashData.consistency.avgWorkouts}
          subtitle="workouts"
          icon="calendar"
          iconColor={colors.success}
        />
      </View>

      {/* Fatigue & Deload Row */}
      <View style={styles.fatigueSection}>
        <View style={styles.fatigueCard}>
          <Text style={styles.sectionTitle}>Fatigue</Text>
          <View style={styles.gaugeCenter}>
            <FatigueGauge
              score={dashData.fatigue.score}
              level={dashData.fatigue.level}
              color={dashData.fatigue.color}
            />
          </View>
          <Text style={styles.fatigueAdvice}>{dashData.fatigue.recommendation}</Text>
        </View>

        {dashData.deload && (
          <View style={[styles.deloadCard, dashData.deload.needed && styles.deloadCardActive]}>
            <Ionicons
              name={dashData.deload.needed ? 'alert-circle' : 'shield-checkmark'}
              size={20}
              color={dashData.deload.needed ? colors.warning : colors.success}
            />
            <Text style={styles.deloadTitle}>
              {dashData.deload.needed ? 'Deload Recommended' : 'Deload Status'}
            </Text>
            <Text style={styles.deloadMessage}>{dashData.deload.message}</Text>
          </View>
        )}
      </View>

      {/* Recent PRs */}
      {dashData.recentPRs.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent PRs 🏆</Text>
          {dashData.recentPRs.map((pr, i) => (
            <View key={pr.id || i} style={styles.prItem}>
              <View style={styles.prIcon}>
                <Ionicons name="trophy" size={16} color={colors.gold} />
              </View>
              <View style={styles.prInfo}>
                <Text style={styles.prName}>{pr.exercise_name}</Text>
                <Text style={styles.prDetail}>
                  {pr.type === 'weight' ? `${pr.value}kg` :
                   pr.type === 'estimated_1rm' ? `e1RM: ${pr.value}kg` :
                   `${pr.value} reps`}
                </Text>
              </View>
              <Text style={styles.prDate}>{pr.date}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Volume Analysis */}
      {dashData.volumeAnalysis.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Muscle Volume (This Week)</Text>
          {dashData.volumeAnalysis.map((v, i) => (
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
      )}

      {/* Weekly Report */}
      {dashData.weeklyReport && dashData.weeklyReport.workoutsCompleted > 0 && (
        <View style={styles.section}>
          <WeeklyReportCard report={dashData.weeklyReport} />
        </View>
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
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xxl,
  },
  greeting: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.heavy,
    color: colors.text,
  },
  date: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  programBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primaryBg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  programName: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  todayCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primary + '30',
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  todayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  todayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  todayLabel: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  missedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.danger + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    gap: 4,
    marginRight: 'auto',
    marginLeft: spacing.md,
  },
  missedText: {
    fontSize: fontSize.xs,
    color: colors.danger,
    fontWeight: fontWeight.medium,
  },
  todayName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: 4,
  },
  todayExercises: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  fatigueSection: {
    marginBottom: spacing.lg,
  },
  fatigueCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  gaugeCenter: {
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  fatigueAdvice: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  deloadCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  deloadCardActive: {
    borderColor: colors.warning + '50',
    backgroundColor: colors.warningBg,
  },
  deloadTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  deloadMessage: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  prItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  prIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.gold + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  prInfo: {
    flex: 1,
  },
  prName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
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
