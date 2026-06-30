// Planner Index — Program list and creation
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '../../src/theme/theme';
import { useProgramStore } from '../../src/stores/useProgramStore';
import { SPLIT_TEMPLATES } from '../../src/utils/constants';
import EmptyState from '../../src/components/EmptyState';

export default function PlannerIndex() {
  const router = useRouter();
  const { programs, activeProgram, createNewProgram, setActive, removeProgram, addDay } = useProgramStore();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const handleCreate = async () => {
    if (!newName.trim()) return;

    const programId = await createNewProgram(newName.trim());

    // If a template is selected, create the days
    if (selectedTemplate && selectedTemplate.days.length > 0) {
      for (let i = 0; i < selectedTemplate.days.length; i++) {
        const dayConfig = selectedTemplate.days[i];
        const dayName = typeof dayConfig === 'string' ? dayConfig : dayConfig.name;
        
        const dayId = await addDay(programId, dayName, i);
        
        if (typeof dayConfig === 'object' && dayConfig.defaultExercises) {
          const { addExercise } = useProgramStore.getState();
          for (let j = 0; j < dayConfig.defaultExercises.length; j++) {
            const exId = dayConfig.defaultExercises[j];
            await addExercise(dayId, exId, {
              target_sets: 3,
              target_reps_min: 8,
              target_reps_max: 12,
              target_weight: 0,
            });
          }
        }
      }
    }

    await setActive(programId);
    setShowCreate(false);
    setNewName('');
    setSelectedTemplate(null);
    router.push(`/planner/${programId}`);
  };

  const handleDelete = (programId, programName) => {
    Alert.alert(
      'Delete Program',
      `Are you sure you want to delete "${programName}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => removeProgram(programId),
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Workout Planner</Text>
      <Text style={styles.subtitle}>Create and manage your training programs</Text>

      {/* Create New Program */}
      {!showCreate ? (
        <Pressable style={styles.createBtn} onPress={() => setShowCreate(true)}>
          <View style={styles.createIconWrap}>
            <Ionicons name="add" size={24} color={colors.primary} />
          </View>
          <Text style={styles.createBtnText}>Create New Program</Text>
        </Pressable>
      ) : (
        <View style={styles.createForm}>
          <Text style={styles.formTitle}>New Program</Text>

          <TextInput
            style={styles.nameInput}
            placeholder="Program name..."
            placeholderTextColor={colors.textDim}
            value={newName}
            onChangeText={setNewName}
            autoFocus
          />

          {/* Template Selector */}
          <Text style={styles.templateLabel}>Choose a template</Text>
          <View style={styles.templateGrid}>
            {SPLIT_TEMPLATES.map(t => (
              <Pressable
                key={t.id}
                style={[
                  styles.templateCard,
                  selectedTemplate?.id === t.id && styles.templateCardActive,
                ]}
                onPress={() => {
                  setSelectedTemplate(selectedTemplate?.id === t.id ? null : t);
                  if (!newName.trim()) setNewName(t.name);
                }}
              >
                <Text style={[
                  styles.templateName,
                  selectedTemplate?.id === t.id && styles.templateNameActive,
                ]}>
                  {t.name}
                </Text>
                {t.days.length > 0 && (
                  <Text style={styles.templateDays}>
                    {t.days.length} day{t.days.length !== 1 ? 's' : ''}
                  </Text>
                )}
              </Pressable>
            ))}
          </View>

          <View style={styles.formActions}>
            <Pressable
              style={styles.cancelBtn}
              onPress={() => { setShowCreate(false); setNewName(''); setSelectedTemplate(null); }}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.confirmBtn, !newName.trim() && styles.confirmBtnDisabled]}
              onPress={handleCreate}
              disabled={!newName.trim()}
            >
              <Ionicons name="add" size={18} color={colors.textInverse} />
              <Text style={styles.confirmBtnText}>Create</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Program List */}
      {programs.length > 0 ? (
        <View style={styles.programList}>
          <Text style={styles.sectionTitle}>Your Programs</Text>
          {programs.map(p => (
            <View
              key={p.id}
              style={[
                styles.programCard,
                p.id === activeProgram?.id && styles.programCardActive,
              ]}
            >
              <Pressable
                style={({ pressed }) => [styles.programTapArea, pressed && { opacity: 0.9 }]}
                onPress={() => router.push(`/planner/${p.id}`)}
              >
                <View style={styles.programInfo}>
                  <Text style={styles.programName}>{p.name}</Text>
                  {p.id === activeProgram?.id && (
                    <View style={styles.activeBadge}>
                      <Text style={styles.activeBadgeText}>Active</Text>
                    </View>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textDim} />
              </Pressable>
              <View style={styles.programActions}>
                {p.id !== activeProgram?.id && (
                  <Pressable
                    style={styles.actionBtn}
                    onPress={() => setActive(p.id)}
                    hitSlop={8}
                  >
                    <Ionicons name="checkmark-circle-outline" size={20} color={colors.success} />
                    <Text style={styles.actionLabel}>Activate</Text>
                  </Pressable>
                )}
                <Pressable
                  style={styles.actionBtn}
                  onPress={() => handleDelete(p.id, p.name)}
                  hitSlop={8}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.danger} />
                  <Text style={[styles.actionLabel, { color: colors.danger }]}>Delete</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      ) : !showCreate ? (
        <EmptyState
          icon="calendar-outline"
          title="No Programs Yet"
          subtitle="Create your first workout program to start planning your training."
        />
      ) : null}

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
    marginBottom: spacing.xxl,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primary + '30',
    borderStyle: 'dashed',
    padding: spacing.lg,
    marginBottom: spacing.xxl,
    gap: spacing.md,
  },
  createIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createBtnText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  createForm: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.lg,
    marginBottom: spacing.xxl,
  },
  formTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  nameInput: {
    backgroundColor: colors.bgAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  templateLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.md,
  },
  templateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  templateCard: {
    backgroundColor: colors.bgAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  templateCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryBg,
  },
  templateName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  templateNameActive: {
    color: colors.primary,
  },
  templateDays: {
    fontSize: fontSize.xs,
    color: colors.textDim,
    marginTop: 2,
  },
  formActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  confirmBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnDisabled: {
    opacity: 0.4,
  },
  confirmBtnText: {
    fontSize: fontSize.md,
    color: colors.textInverse,
    fontWeight: fontWeight.semibold,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  programList: {},
  programCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.sm,
  },
  programCardActive: {
    borderColor: colors.primary + '40',
  },
  programTapArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  programInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  programName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  activeBadge: {
    backgroundColor: colors.successBg,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.success + '30',
  },
  activeBadgeText: {
    fontSize: fontSize.xs,
    color: colors.success,
    fontWeight: fontWeight.semibold,
  },
  programActions: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.sm,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: spacing.xs,
  },
  actionLabel: {
    fontSize: fontSize.xs,
    color: colors.success,
    fontWeight: fontWeight.medium,
  },
});
