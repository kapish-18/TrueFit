// Edit Program — Add/remove/reorder days and exercises
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '../../src/theme/theme';
import { useProgramStore } from '../../src/stores/useProgramStore';
import { useUIStore } from '../../src/stores/useUIStore';
import { getProgramDays, getProgramExercises } from '../../src/db/dao';
import ExercisePicker from '../../src/components/ExercisePicker';
import ExerciseTargetInputs from '../../src/components/ExerciseTargetInputs';

export default function EditProgram() {
  const { programId } = useLocalSearchParams();
  const router = useRouter();
  const showToast = useUIStore(s => s.showToast);
  const {
    programs, addDay, removeDay, renameDay,
    addExercise, updateExercise, removeExercise, renameProgramFn,
    loadPrograms,
  } = useProgramStore();

  const [program, setProgram] = useState(null);
  const [days, setDays] = useState([]);
  const [editingDayId, setEditingDayId] = useState(null);
  const [editingDayName, setEditingDayName] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [pickerDayId, setPickerDayId] = useState(null);
  const [editingName, setEditingName] = useState(false);
  const [programName, setProgramName] = useState('');
  const [expandedDay, setExpandedDay] = useState(null);

  useEffect(() => {
    loadData();
  }, [programId]);

  const loadData = useCallback(async () => {
    const prog = programs.find(p => p.id === programId);
    setProgram(prog);
    setProgramName(prog?.name || '');

    const daysData = await getProgramDays(programId);
    for (const day of daysData) {
      day.exercises = await getProgramExercises(day.id);
    }
    setDays(daysData);

    if (daysData.length > 0 && !expandedDay) {
      setExpandedDay(daysData[0].id);
    }
  }, [programId, programs]);

  const handleAddDay = async () => {
    const dayIndex = days.length;
    const name = `Day ${dayIndex + 1}`;
    await addDay(programId, name, dayIndex);
    await loadData();
  };

  const handleRenameDay = async (dayId) => {
    if (editingDayName.trim()) {
      await renameDay(dayId, editingDayName.trim());
      await loadData();
    }
    setEditingDayId(null);
  };

  const handleDeleteDay = (dayId, dayName) => {
    Alert.alert('Delete Day', `Delete "${dayName}" and all its exercises?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await removeDay(dayId);
          await loadData();
        },
      },
    ]);
  };

  const handleAddExercise = async (exercise) => {
    if (!pickerDayId) return;
    await addExercise(pickerDayId, exercise.id, {
      target_sets: 3,
      target_reps_min: 6,
      target_reps_max: 12,
      target_weight: 0,
    });
    await loadData();
    showToast(`${exercise.name} added`, 'success');
  };

  const handleUpdateExercise = async (exerciseId, field, value) => {
    await updateExercise(exerciseId, { [field]: value });
    await loadData();
  };

  const handleRemoveExercise = (exerciseId, exerciseName) => {
    Alert.alert('Remove Exercise', `Remove "${exerciseName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await removeExercise(exerciseId);
          await loadData();
        },
      },
    ]);
  };

  const handleRenameProgramFn = async () => {
    if (programName.trim()) {
      await renameProgramFn(programId, programName.trim());
      await loadData();
    }
    setEditingName(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          {editingName ? (
            <TextInput
              style={styles.nameInput}
              value={programName}
              onChangeText={setProgramName}
              onBlur={handleRenameProgramFn}
              onSubmitEditing={handleRenameProgramFn}
              autoFocus
            />
          ) : (
            <Pressable onPress={() => setEditingName(true)}>
              <Text style={styles.programTitle}>{program?.name || 'Program'}</Text>
            </Pressable>
          )}
        </View>

        {/* Days */}
        {days.map((day, dayIdx) => (
          <View key={day.id} style={styles.dayCard}>
            {/* Day Header */}
            <Pressable
              style={styles.dayHeader}
              onPress={() => setExpandedDay(expandedDay === day.id ? null : day.id)}
            >
              <View style={styles.dayHeaderLeft}>
                <Ionicons
                  name={expandedDay === day.id ? 'chevron-down' : 'chevron-forward'}
                  size={18}
                  color={colors.textDim}
                />
                {editingDayId === day.id ? (
                  <TextInput
                    style={styles.dayNameInput}
                    value={editingDayName}
                    onChangeText={setEditingDayName}
                    onBlur={() => handleRenameDay(day.id)}
                    onSubmitEditing={() => handleRenameDay(day.id)}
                    autoFocus
                  />
                ) : (
                  <Pressable
                    onPress={() => { setEditingDayId(day.id); setEditingDayName(day.name); }}
                  >
                    <Text style={styles.dayName}>{day.name}</Text>
                  </Pressable>
                )}
                <Text style={styles.exerciseCount}>
                  {day.exercises?.length || 0} exercises
                </Text>
              </View>
              <Pressable onPress={() => handleDeleteDay(day.id, day.name)} hitSlop={8}>
                <Ionicons name="trash-outline" size={16} color={colors.danger} />
              </Pressable>
            </Pressable>

            {/* Exercises (expanded) */}
            {expandedDay === day.id && (
              <View style={styles.exerciseList}>
                {(day.exercises || []).map((ex, idx) => (
                  <View key={ex.id} style={styles.exerciseItem}>
                    <View style={styles.exerciseHeader}>
                      <View style={styles.exerciseNameRow}>
                        <Text style={styles.exerciseOrder}>{idx + 1}</Text>
                        <View>
                          <Text style={styles.exerciseName}>{ex.exercise_name}</Text>
                          <Text style={styles.exerciseMuscle}>{ex.muscle_group} · {ex.equipment}</Text>
                        </View>
                      </View>
                      <Pressable onPress={() => handleRemoveExercise(ex.id, ex.exercise_name)} hitSlop={8}>
                        <Ionicons name="close-circle" size={20} color={colors.danger + '80'} />
                      </Pressable>
                    </View>

                    {/* Targets */}
                    <ExerciseTargetInputs ex={ex} onUpdate={handleUpdateExercise} />
                  </View>
                ))}

                {/* Add Exercise Button */}
                <Pressable
                  style={styles.addExerciseBtn}
                  onPress={() => { setPickerDayId(day.id); setShowPicker(true); }}
                >
                  <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                  <Text style={styles.addExerciseText}>Add Exercise</Text>
                </Pressable>
              </View>
            )}
          </View>
        ))}

        {/* Add Day */}
        <Pressable style={styles.addDayBtn} onPress={handleAddDay}>
          <Ionicons name="add" size={20} color={colors.primary} />
          <Text style={styles.addDayText}>Add Day</Text>
        </Pressable>

        <View style={{ height: 60 }} />
      </ScrollView>

      <ExercisePicker
        visible={showPicker}
        onSelect={handleAddExercise}
        onClose={() => setShowPicker(false)}
      />
    </View>
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
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  programTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.heavy,
    color: colors.text,
  },
  nameInput: {
    flex: 1,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.heavy,
    color: colors.text,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    paddingVertical: spacing.xs,
  },
  dayCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
  },
  dayHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  dayName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  dayNameInput: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
    minWidth: 100,
    paddingVertical: 0,
  },
  exerciseCount: {
    fontSize: fontSize.xs,
    color: colors.textDim,
  },
  exerciseList: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.md,
  },
  exerciseItem: {
    backgroundColor: colors.bgAlt,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  exerciseNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  exerciseOrder: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    width: 20,
    textAlign: 'center',
  },
  exerciseName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  exerciseMuscle: {
    fontSize: fontSize.xs,
    color: colors.textDim,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  targetsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  targetField: {
    flex: 1,
  },
  targetLabel: {
    fontSize: fontSize.xs,
    color: colors.textDim,
    marginBottom: 4,
    textAlign: 'center',
  },
  targetInput: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    fontSize: fontSize.sm,
    color: colors.text,
    textAlign: 'center',
    fontWeight: fontWeight.medium,
  },
  addExerciseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary + '30',
    borderStyle: 'dashed',
  },
  addExerciseText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  addDayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primary + '30',
    borderStyle: 'dashed',
    marginTop: spacing.sm,
  },
  addDayText: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
});
