// ExercisePicker — Search and select exercises with muscle group filters
import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, FlatList, Pressable, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fontSize, fontWeight } from '../theme/theme';
import { getAllExercises } from '../db/dao';
import { MUSCLE_GROUPS, MUSCLE_GROUP_LABELS } from '../utils/constants';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ExercisePicker({ visible, onSelect, onClose }) {
  const [exercises, setExercises] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      loadExercises();
      setSearch('');
      setSelectedMuscle(null);
    }
  }, [visible]);

  const loadExercises = async () => {
    const exs = await getAllExercises();
    setExercises(exs);
  };

  const filtered = useMemo(() => {
    let list = exercises;
    if (selectedMuscle) {
      list = list.filter(e => e.muscle_group === selectedMuscle);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(e =>
        e.name.toLowerCase().includes(q) ||
        e.muscle_group.toLowerCase().includes(q) ||
        e.equipment?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [exercises, search, selectedMuscle]);

  const renderExercise = ({ item }) => (
    <Pressable
      style={({ pressed }) => [styles.exerciseItem, pressed && styles.exerciseItemPressed]}
      onPress={() => {
        onSelect(item);
        onClose();
      }}
    >
      <View style={styles.exerciseInfo}>
        <Text style={styles.exerciseName}>{item.name}</Text>
        <View style={styles.exerciseMeta}>
          <Text style={styles.muscleTag}>{MUSCLE_GROUP_LABELS[item.muscle_group] || item.muscle_group}</Text>
          <Text style={styles.equipmentTag}>{item.equipment}</Text>
          <Text style={styles.categoryTag}>{item.category}</Text>
        </View>
      </View>
      <Ionicons name="add-circle" size={24} color={colors.primary} />
    </Pressable>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top + 16, 56) }]}>
          <Text style={styles.title}>Add Exercise</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Ionicons name="close-circle" size={28} color={colors.textSecondary} />
          </Pressable>
        </View>

        {/* Search */}
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color={colors.textDim} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search exercises..."
            placeholderTextColor={colors.textDim}
            value={search}
            onChangeText={setSearch}
            autoFocus
          />
          {search ? (
            <Pressable onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={colors.textDim} />
            </Pressable>
          ) : null}
        </View>

        {/* Muscle group filter pills */}
        <FlatList
          horizontal
          data={[{ id: null, label: 'All' }, ...MUSCLE_GROUPS.map(m => ({ id: m, label: MUSCLE_GROUP_LABELS[m] }))]}
          keyExtractor={item => item.id || 'all'}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <Pressable
              style={[
                styles.filterPill,
                selectedMuscle === item.id && styles.filterPillActive,
              ]}
              onPress={() => setSelectedMuscle(item.id)}
            >
              <Text style={[
                styles.filterPillText,
                selectedMuscle === item.id && styles.filterPillTextActive,
              ]}>
                {item.label}
              </Text>
            </Pressable>
          )}
        />

        {/* Exercise list */}
        <FlatList
          keyboardShouldPersistTaps="handled"
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderExercise}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="barbell-outline" size={48} color={colors.textDim} />
              <Text style={styles.emptyText}>No exercises found</Text>
            </View>
          }
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: spacing.xl,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text,
  },
  filterList: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    gap: spacing.sm,
    alignItems: 'center',
  },
  filterPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  filterPillActive: {
    backgroundColor: colors.primaryBg,
    borderColor: colors.primary,
  },
  filterPillText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  filterPillTextActive: {
    color: colors.primary,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  exerciseItemPressed: {
    backgroundColor: colors.surfaceHover,
  },
  exerciseInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  exerciseName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: 4,
  },
  exerciseMeta: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  muscleTag: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: fontWeight.medium,
    textTransform: 'capitalize',
  },
  equipmentTag: {
    fontSize: fontSize.xs,
    color: colors.textDim,
    textTransform: 'capitalize',
  },
  categoryTag: {
    fontSize: fontSize.xs,
    color: colors.textDim,
    textTransform: 'capitalize',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textDim,
    marginTop: spacing.md,
  },
});
