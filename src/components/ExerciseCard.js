// ExerciseCard — Exercise display with ghost data and recommendations
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fontSize, fontWeight } from '../theme/theme';
import { useSettingsStore } from '../stores/useSettingsStore';
import SetRow from './SetRow';

export default function ExerciseCard({
  exercise,
  ghostData,
  recommendation,
  safetyWarning,
  onUpdateSet,
  onAddSet,
  onDeleteSet,
  onUpdateNotes,
  readOnly = false,
}) {
  const [showNotes, setShowNotes] = useState(false);
  const weightUnit = useSettingsStore(s => s.weightUnit);

  const getRecommendationColor = (type) => {
    switch (type) {
      case 'increase_weight': return colors.success;
      case 'increase_reps': return colors.primary;
      case 'maintain': return colors.warning;
      case 'reduce': return colors.danger;
      case 'deload': return colors.primary;
      default: return colors.textDim;
    }
  };

  const getRecommendationIcon = (type) => {
    switch (type) {
      case 'increase_weight': return 'arrow-up-circle';
      case 'increase_reps': return 'repeat';
      case 'maintain': return 'pause-circle';
      case 'reduce': return 'arrow-down-circle';
      case 'deload': return 'shield-checkmark';
      default: return 'information-circle';
    }
  };

  const isCompleted = exercise.sets?.length > 0 && exercise.sets.every(s => s.weight >= 0 && s.reps > 0);

  return (
    <View style={[styles.card, isCompleted && styles.cardCompleted]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.exerciseName}>{exercise.exercise_name}</Text>
          <View style={styles.badges}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{exercise.muscle_group}</Text>
            </View>
            {exercise.equipment && (
              <View style={[styles.badge, styles.badgeAlt]}>
                <Text style={[styles.badgeText, styles.badgeTextAlt]}>{exercise.equipment}</Text>
              </View>
            )}
          </View>
        </View>
        <Pressable onPress={() => setShowNotes(!showNotes)} hitSlop={8}>
          <Ionicons
            name={showNotes ? 'chatbubble' : 'chatbubble-outline'}
            size={18}
            color={exercise.notes ? colors.primary : colors.textDim}
          />
        </Pressable>
      </View>

      {/* Ghost Data */}
      {ghostData && (
        <View style={styles.ghostRow}>
          <Ionicons name="time-outline" size={14} color={colors.textDim} />
          <Text style={styles.ghostText}>
            Last: {ghostData.sets?.map(s => `${s.weight}×${s.reps}`).join(', ') || 'No data'}
          </Text>
        </View>
      )}

      {/* Safety Warning */}
      {safetyWarning && !safetyWarning.safe && (
        <View style={[styles.warningRow, safetyWarning.level === 'danger' ? styles.warningDanger : styles.warningCaution]}>
          <Ionicons
            name="warning"
            size={16}
            color={safetyWarning.level === 'danger' ? colors.danger : colors.warning}
          />
          <Text style={[styles.warningText, { color: safetyWarning.level === 'danger' ? colors.danger : colors.warning }]}>
            {safetyWarning.message}
          </Text>
        </View>
      )}

      {/* Progressive Overload Recommendation */}
      {recommendation && recommendation.type !== 'first_time' && (
        <View style={[styles.recommendRow, { backgroundColor: getRecommendationColor(recommendation.type) + '10' }]}>
          <Ionicons
            name={getRecommendationIcon(recommendation.type)}
            size={16}
            color={getRecommendationColor(recommendation.type)}
          />
          <Text style={[styles.recommendText, { color: getRecommendationColor(recommendation.type) }]}>
            {recommendation.message}
          </Text>
        </View>
      )}

      {/* Target */}
      <View style={styles.targetRow}>
        <Text style={styles.targetLabel}>Target</Text>
        <Text style={styles.targetValue}>
          {exercise.target_weight > 0 ? `${exercise.target_weight}${weightUnit}` : '—'} × {exercise.target_reps_min}–{exercise.target_reps_max} reps × {exercise.target_sets} sets
        </Text>
      </View>

      {/* Sets */}
      <View style={styles.setsContainer}>
        <View style={styles.setsHeader}>
          <Text style={[styles.setHeaderText, { flex: 0.5 }]}>Set</Text>
          <Text style={[styles.setHeaderText, { flex: 1 }]}>Weight ({weightUnit})</Text>
          <Text style={[styles.setHeaderText, { flex: 1 }]}>Reps</Text>
          <View style={{ width: 28 }} />
        </View>

        {(exercise.sets || []).map((set, index) => (
          <SetRow
            key={set.id}
            set={set}
            index={index}
            exerciseId={exercise.id}
            readOnly={readOnly}
            onUpdateSet={onUpdateSet}
            onDeleteSet={onDeleteSet}
            isLastSet={index === (exercise.sets || []).length - 1}
          />
        ))}

        {!readOnly && (
          <Pressable style={styles.addSetBtn} onPress={() => onAddSet?.(exercise.id)} hitSlop={12}>
            <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
            <Text style={styles.addSetText}>Add Set</Text>
          </Pressable>
        )}
      </View>

      {/* Notes */}
      {showNotes && (
        <View style={styles.notesSection}>
          <TextInput
            style={styles.notesInput}
            placeholder="Exercise notes..."
            placeholderTextColor={colors.textDim}
            value={exercise.notes || ''}
            onChangeText={(text) => onUpdateNotes?.(exercise.id, text)}
            multiline
            editable={!readOnly}
          />
          {ghostData?.notes ? (
            <View style={styles.previousNote}>
              <Ionicons name="document-text-outline" size={12} color={colors.textDim} />
              <Text style={styles.previousNoteText}>Previous: {ghostData.notes}</Text>
            </View>
          ) : null}
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
    marginBottom: spacing.md,
  },
  cardCompleted: {
    borderColor: colors.success,
    backgroundColor: colors.success + '08',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  headerLeft: {
    flex: 1,
    marginRight: spacing.md,
  },
  exerciseName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: 4,
  },
  badges: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  badge: {
    backgroundColor: colors.primaryBg,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  badgeText: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: fontWeight.medium,
    textTransform: 'capitalize',
  },
  badgeAlt: {
    backgroundColor: colors.surfaceAlt,
  },
  badgeTextAlt: {
    color: colors.textSecondary,
  },
  ghostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.bgAlt,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  ghostText: {
    fontSize: fontSize.xs,
    color: colors.textDim,
    flex: 1,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  warningCaution: {
    backgroundColor: colors.warningBg,
  },
  warningDanger: {
    backgroundColor: colors.dangerBg,
  },
  warningText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    flex: 1,
  },
  recommendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  recommendText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    flex: 1,
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  targetLabel: {
    fontSize: fontSize.sm,
    color: colors.textDim,
    fontWeight: fontWeight.medium,
  },
  targetValue: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  setsContainer: {},
  setsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  setHeaderText: {
    fontSize: fontSize.xs,
    color: colors.textDim,
    fontWeight: fontWeight.medium,
    textAlign: 'center',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  setNumber: {
    fontSize: fontSize.sm,
    color: colors.textDim,
    textAlign: 'center',
    fontWeight: fontWeight.semibold,
  },
  setInput: {
    backgroundColor: colors.bgAlt,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text,
    textAlign: 'center',
    fontWeight: fontWeight.medium,
  },
  addSetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  addSetText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  notesSection: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.md,
  },
  notesInput: {
    backgroundColor: colors.bgAlt,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
    fontSize: fontSize.sm,
    color: colors.text,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  previousNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  previousNoteText: {
    fontSize: fontSize.xs,
    color: colors.textDim,
    fontStyle: 'italic',
    flex: 1,
  },
});
