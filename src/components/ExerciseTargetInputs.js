import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors, radius, fontSize, fontWeight, spacing } from '../theme/theme';

export default function ExerciseTargetInputs({ ex, onUpdate }) {
  const [sets, setSets] = useState(ex.target_sets ? String(ex.target_sets) : '');
  const [repsMin, setRepsMin] = useState(ex.target_reps_min ? String(ex.target_reps_min) : '');
  const [repsMax, setRepsMax] = useState(ex.target_reps_max ? String(ex.target_reps_max) : '');
  const [weight, setWeight] = useState(ex.target_weight ? String(ex.target_weight) : '');

  useEffect(() => {
    setSets(ex.target_sets ? String(ex.target_sets) : '');
    setRepsMin(ex.target_reps_min ? String(ex.target_reps_min) : '');
    setRepsMax(ex.target_reps_max ? String(ex.target_reps_max) : '');
    setWeight(ex.target_weight ? String(ex.target_weight) : '');
  }, [ex.target_sets, ex.target_reps_min, ex.target_reps_max, ex.target_weight]);

  return (
    <View style={styles.targetsRow}>
      <View style={styles.targetField}>
        <Text style={styles.targetLabel}>Sets</Text>
        <TextInput
          style={styles.targetInput}
          keyboardType="number-pad"
          value={sets}
          onChangeText={(v) => { if (/^\d*$/.test(v)) setSets(v); }}
          onBlur={() => onUpdate(ex.id, 'target_sets', parseInt(sets) || 0)}
        />
      </View>
      <View style={styles.targetField}>
        <Text style={styles.targetLabel}>Reps Min</Text>
        <TextInput
          style={styles.targetInput}
          keyboardType="number-pad"
          value={repsMin}
          onChangeText={(v) => { if (/^\d*$/.test(v)) setRepsMin(v); }}
          onBlur={() => onUpdate(ex.id, 'target_reps_min', parseInt(repsMin) || 0)}
        />
      </View>
      <View style={styles.targetField}>
        <Text style={styles.targetLabel}>Reps Max</Text>
        <TextInput
          style={styles.targetInput}
          keyboardType="number-pad"
          value={repsMax}
          onChangeText={(v) => { if (/^\d*$/.test(v)) setRepsMax(v); }}
          onBlur={() => onUpdate(ex.id, 'target_reps_max', parseInt(repsMax) || 0)}
        />
      </View>
      <View style={styles.targetField}>
        <Text style={styles.targetLabel}>Weight</Text>
        <TextInput
          style={styles.targetInput}
          keyboardType="numeric"
          value={weight}
          onChangeText={(v) => {
            const formatted = v.replace(',', '.');
            if (/^\d*\.?\d*$/.test(formatted)) setWeight(formatted);
          }}
          onBlur={() => onUpdate(ex.id, 'target_weight', parseFloat(weight) || 0)}
          placeholder="kg"
          placeholderTextColor={colors.textDim}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
