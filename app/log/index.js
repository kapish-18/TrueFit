// Log Index — Select which workout to log or view log history
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '../../src/theme/theme';
import { useProgramStore } from '../../src/stores/useProgramStore';
import { useWorkoutStore } from '../../src/stores/useWorkoutStore';
import { getWorkoutLogs } from '../../src/db/dao';
import { formatDateReadable, getToday, timeAgo } from '../../src/utils/date';
import EmptyState from '../../src/components/EmptyState';

export default function LogIndex() {
  const router = useRouter();
  const activeProgram = useProgramStore(s => s.activeProgram);
  const activeDays = useProgramStore(s => s.activeDays);
  const startWorkout = useWorkoutStore(s => s.startWorkout);
  const [recentLogs, setRecentLogs] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [deloadInfo, setDeloadInfo] = useState(null);
  const [starting, setStarting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadRecentLogs();
    }, [])
  );

  const loadRecentLogs = async () => {
    const logs = await getWorkoutLogs(20);
    setRecentLogs(logs);

    try {
      const { getFullLogDataByDateRange } = require('../../src/db/dao');
      const { organizeByWeek } = require('../../src/engine/fatigue');
      const { checkDeloadNeeded } = require('../../src/engine/deloadPlanner');
      const { getWeeksAgo, getToday } = require('../../src/utils/date');
      const { useSettingsStore } = require('../../src/stores/useSettingsStore');

      const allLogs = await getFullLogDataByDateRange(getWeeksAgo(12), getToday());
      const buckets = organizeByWeek(allLogs, 12);
      const { useProgramStore } = require('../../src/stores/useProgramStore');
      const deload = checkDeloadNeeded(buckets, useSettingsStore.getState().deloadFrequency, useProgramStore.getState().activeDays?.length || 3);
      setDeloadInfo(deload);
    } catch (e) {
      console.error('Failed to load deload info', e);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRecentLogs();
    setRefreshing(false);
  };

  const doStartWorkout = async (day, isDeload) => {
    setStarting(true);
    try {
      const logId = await startWorkout(activeProgram.id, day.id, day.exercises, isDeload);
      router.push(`/log/${logId}`);
    } finally {
      setStarting(false);
    }
  };

  const handleStartLog = async (day) => {
    if (!activeProgram || starting) return;
    
    if (deloadInfo?.needed) {
      Alert.alert(
        'Deload Recommended',
        'Do you want to apply deload reductions (lower weight and sets) to this workout to give your joints, ligaments, and bones time to catch up?',
        [
          {
            text: 'Normal Workout',
            style: 'cancel',
            onPress: () => doStartWorkout(day, false),
          },
          {
            text: 'Apply Deload',
            style: 'default',
            onPress: () => doStartWorkout(day, true),
          },
        ]
      );
    } else {
      doStartWorkout(day, false);
    }
  };

  if (!activeProgram) {
    return (
      <View style={styles.container}>
        <View style={styles.headerSection}>
          <Text style={styles.title}>Workout Log</Text>
        </View>
        <EmptyState
          icon="clipboard-outline"
          title="No Active Program"
          subtitle="Create and activate a program in the Planner to start logging workouts."
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <Text style={styles.title}>Workout Log</Text>
      <Text style={styles.subtitle}>{formatDateReadable(getToday())}</Text>

      {/* Log a Workout */}
      <Text style={styles.sectionTitle}>Log a Workout</Text>
      <View style={styles.dayGrid}>
        {activeDays.map((day, idx) => (
          <Pressable
            key={day.id}
            style={({ pressed }) => [styles.dayCard, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
            onPress={() => handleStartLog(day)}
          >
            <View style={styles.dayIcon}>
              <Ionicons name="barbell" size={22} color={colors.primary} />
            </View>
            <Text style={styles.dayName}>{day.name}</Text>
            <Text style={styles.dayMeta}>{day.exercises?.length || 0} exercises</Text>
            <View style={styles.logBtnRow}>
              <Ionicons name="add-circle" size={16} color={colors.primary} />
              <Text style={styles.logBtnText}>Log Now</Text>
            </View>
          </Pressable>
        ))}
      </View>

      {/* Recent Logs */}
      {recentLogs.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Recent Logs</Text>
          {recentLogs.map(log => (
            <Pressable
              key={log.id}
              style={({ pressed }) => [styles.logItem, pressed && { opacity: 0.9 }]}
              onPress={() => {
                useWorkoutStore.getState().loadWorkout(log.id);
                router.push(`/log/${log.id}`);
              }}
            >
              <View style={styles.logDate}>
                <Text style={styles.logDay}>{new Date(log.date + 'T00:00:00').getDate()}</Text>
                <Text style={styles.logMonth}>
                  {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][new Date(log.date + 'T00:00:00').getMonth()]}
                </Text>
              </View>
              <View style={styles.logInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.logName}>{log.day_name || 'Workout'}</Text>
                  {log.overall_notes?.includes('[DELOAD]') && (
                    <View style={styles.deloadBadge}>
                      <Text style={styles.deloadBadgeText}>Deload</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.logProgram}>{log.program_name || ''} · {timeAgo(log.date)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
            </Pressable>
          ))}
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
  headerSection: {
    paddingHorizontal: spacing.xl,
    paddingTop: 56,
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
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
    marginTop: spacing.md,
  },
  dayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  dayCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.lg,
    width: '47%',
    ...shadows.sm,
  },
  dayIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  dayName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: 4,
  },
  dayMeta: {
    fontSize: fontSize.xs,
    color: colors.textDim,
    marginBottom: spacing.md,
  },
  logBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  logBtnText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  logDate: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  logDay: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    lineHeight: 20,
  },
  logMonth: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: fontWeight.medium,
    lineHeight: 14,
  },
  logInfo: {
    flex: 1,
  },
  logName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  logProgram: {
    fontSize: fontSize.xs,
    color: colors.textDim,
    marginTop: 2,
  },
  deloadBadge: {
    backgroundColor: colors.primaryBg,
    paddingHorizontal: spacing.sm,
    paddingVertical: 1,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  deloadBadgeText: {
    fontSize: 9,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
});
