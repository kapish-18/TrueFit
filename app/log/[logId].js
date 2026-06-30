// Log Workout — Checklist-style logging with ghost data & recommendations
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { colors, spacing, radius, fontSize, fontWeight } from '../../src/theme/theme';
import { useWorkoutStore } from '../../src/stores/useWorkoutStore';
import { useUIStore } from '../../src/stores/useUIStore';
import ExerciseCard from '../../src/components/ExerciseCard';
import { getLastPerformance } from '../../src/db/dao';
import { getOverloadRecommendation } from '../../src/engine/progressiveOverload';
import { validateWeightJump } from '../../src/engine/jointSafety';
import { getToday } from '../../src/utils/date';

export default function LogWorkout() {
  const { logId } = useLocalSearchParams();
  const router = useRouter();
  const showToast = useUIStore(s => s.showToast);

  const {
    currentLogId, currentDayId, currentLogDate, isDeload, exercises, bodyweight, overallNotes,
    loadWorkout, updateSet, addSet, updateExerciseNotes,
    setBodyweight, setOverallNotes, saveWorkout, deleteCurrentWorkout, clearSession,
    isSaving, newPRs,
  } = useWorkoutStore();

  const [ghostData, setGhostData] = useState({});
  const [recommendations, setRecommendations] = useState({});
  const [safetyWarnings, setSafetyWarnings] = useState({});
  const [saved, setSaved] = useState(false);

  // Determine if this is a read-only historical log (not today's date or already saved previously)
  const readOnly = useMemo(() => {
    if (!currentLogDate) return false;
    return currentLogDate !== getToday();
  }, [currentLogDate]);

  // Strip the internal [DELOAD] tag from the displayed notes
  const displayNotes = useMemo(() => {
    return (overallNotes || '').replace('[DELOAD]', '').trim();
  }, [overallNotes]);

  // When user edits notes, re-inject the [DELOAD] tag if this is a deload workout
  const handleNotesChange = useCallback((text) => {
    if (isDeload) {
      setOverallNotes('[DELOAD]' + (text ? ' ' + text : ''));
    } else {
      setOverallNotes(text);
    }
  }, [isDeload, setOverallNotes]);

  useEffect(() => {
    if (logId && logId !== currentLogId) {
      loadWorkout(logId);
    }
  }, [logId]);

  // Ghost data & recommendation loader
  const loadGhostDataAndRecs = useCallback(async () => {
    const ghost = {};
    const recs = {};

    for (const ex of exercises) {
      const lastPerf = await getLastPerformance(ex.exercise_id, currentLogId, currentDayId, currentLogDate);
      if (lastPerf) {
        ghost[ex.exercise_id] = lastPerf;

        let rec;
        if (isDeload) {
          rec = {
            type: 'deload',
            status: 'warning',
            message: 'Deload Active: Focus on recovery, control, and perfect form.',
            action: 'Recover',
          };
        } else {
          rec = getOverloadRecommendation(lastPerf, {
            target_sets: ex.target_sets,
            target_reps_min: ex.target_reps_min,
            target_reps_max: ex.target_reps_max,
            target_weight: ex.target_weight,
          }, ex.default_increment || 2.5);
        }
        recs[ex.exercise_id] = rec;
      }
    }

    setGhostData(ghost);
    setRecommendations(recs);
  }, [exercises, isDeload, currentLogId, currentDayId, currentLogDate]);

  useEffect(() => {
    if (exercises && exercises.length > 0) {
      loadGhostDataAndRecs();
    }
  }, [loadGhostDataAndRecs]);

  // Check safety warnings when sets are updated
  const handleUpdateSet = useCallback(async (logExerciseId, setId, data) => {
    await updateSet(logExerciseId, setId, data);

    // Check joint safety for weight changes
    if (data.weight !== undefined) {
      const exercise = exercises.find(e => e.id === logExerciseId);
      if (exercise) {
        const ghost = ghostData[exercise.exercise_id];
        if (ghost?.sets?.length > 0) {
          const lastMaxWeight = Math.max(...ghost.sets.map(s => s.weight || 0));
          const warning = validateWeightJump(lastMaxWeight, data.weight, exercise.category);
          if (!warning.safe) {
            setSafetyWarnings(prev => ({ ...prev, [exercise.exercise_id]: warning }));
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          } else {
            setSafetyWarnings(prev => {
              const next = { ...prev };
              delete next[exercise.exercise_id];
              return next;
            });
          }
        }
      }
    }
  }, [exercises, ghostData, updateSet]);

  const handleSave = async () => {
    // Check for incomplete sets
    const incompleteSets = exercises.some(ex =>
      ex.sets?.some(s => (!s.weight || s.weight <= 0) && (!s.reps || s.reps <= 0))
    );

    if (incompleteSets) {
      Alert.alert(
        'Incomplete Sets',
        'Some sets have no weight or reps entered. Save anyway?',
        [
          { text: 'Go Back', style: 'cancel' },
          { text: 'Save Anyway', onPress: performSave },
        ]
      );
    } else {
      performSave();
    }
  };

  const performSave = async () => {
    const prs = await saveWorkout();
    setSaved(true);

    if (prs.length > 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      for (const pr of prs) {
        const prLabel = pr.type === 'weight' ? `${pr.value}kg` :
                        pr.type === 'estimated_1rm' ? `e1RM: ${pr.value}kg` :
                        `${pr.value} reps`;
        showToast(`🏆 New PR! ${pr.exerciseName}: ${prLabel}`, 'pr', 4000);
      }
    } else {
      showToast('Workout saved!', 'success');
    }

    setTimeout(() => router.back(), 500);
  };

  const handleDiscard = () => {
    Alert.alert('Discard Workout', 'Are you sure? All entered data will be lost.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: async () => {
          await deleteCurrentWorkout();
          router.back();
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView 
        contentContainerStyle={styles.content} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{readOnly ? 'Workout Details' : 'Log Workout'}</Text>
            {isDeload && (
              <View style={styles.deloadHeaderBadge}>
                <Ionicons name="shield-checkmark" size={12} color={colors.primary} />
                <Text style={styles.deloadHeaderText}>Deload</Text>
              </View>
            )}
          </View>
          {!readOnly ? (
            <Pressable onPress={handleDiscard} hitSlop={12}>
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
            </Pressable>
          ) : (
            <View style={{ width: 20 }} />
          )}
        </View>

        {/* Read-only banner */}
        {readOnly && (
          <View style={styles.readOnlyBanner}>
            <Ionicons name="lock-closed" size={14} color={colors.textSecondary} />
            <Text style={styles.readOnlyText}>Viewing past workout — read only</Text>
          </View>
        )}

        {/* Exercise Cards */}
        {exercises.map(ex => (
          <ExerciseCard
            key={ex.id}
            exercise={ex}
            ghostData={ghostData[ex.exercise_id]}
            recommendation={recommendations[ex.exercise_id]}
            safetyWarning={safetyWarnings[ex.exercise_id]}
            onUpdateSet={handleUpdateSet}
            onAddSet={addSet}
            onUpdateNotes={updateExerciseNotes}
            readOnly={readOnly}
          />
        ))}

        {/* Bodyweight & Notes (only for editable logs) */}
        {!readOnly && (
          <View style={styles.extraSection}>
            <View style={styles.bodyweightRow}>
              <Text style={styles.extraLabel}>Bodyweight (kg)</Text>
              <TextInput
                style={styles.bodyweightInput}
                keyboardType="numeric"
                placeholder="e.g. 80.5"
                placeholderTextColor={colors.textDim}
                value={bodyweight ? String(bodyweight) : ''}
                onChangeText={(v) => {
                  const formatted = v.replace(',', '.');
                  if (/^\d*\.?\d*$/.test(formatted)) {
                    setBodyweight(formatted);
                  }
                }}
                onBlur={() => setBodyweight(parseFloat(bodyweight) || null)}
              />
            </View>

            <Text style={styles.extraLabel}>Notes</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Overall workout notes..."
              placeholderTextColor={colors.textDim}
              value={displayNotes}
              onChangeText={handleNotesChange}
              multiline
            />
          </View>
        )}

        {/* Save Button (only for editable logs) */}
        {!readOnly && (
          <Pressable
            style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.9 }, isSaving && { opacity: 0.5 }]}
            onPress={handleSave}
            disabled={isSaving || saved}
          >
            <Ionicons name={saved ? 'checkmark-circle' : 'save'} size={20} color={colors.textInverse} />
            <Text style={styles.saveBtnText}>{saved ? 'Saved!' : isSaving ? 'Saving...' : 'Save Workout'}</Text>
          </Pressable>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xxl,
  },
  headerCenter: {
    alignItems: 'center',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  deloadHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryBg,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    marginTop: 4,
  },
  deloadHeaderText: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  readOnlyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  readOnlyText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  extraSection: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  bodyweightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  extraLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.sm,
  },
  bodyweightInput: {
    backgroundColor: colors.bgAlt,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text,
    textAlign: 'center',
    width: 80,
    fontWeight: fontWeight.medium,
  },
  notesInput: {
    backgroundColor: colors.bgAlt,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
    fontSize: fontSize.sm,
    color: colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
  },
  saveBtnText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textInverse,
  },
});
