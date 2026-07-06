import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, fontSize, fontWeight, spacing } from '../theme/theme';

export default function SetRow({ set, index, exerciseId, readOnly, onUpdateSet, onDeleteSet, isLastSet }) {
  const [weight, setWeight] = useState(set.weight ? String(set.weight) : '');
  const [reps, setReps] = useState(set.reps ? String(set.reps) : '');

  // Sync state if props change (e.g. initial load)
  useEffect(() => {
    setWeight(set.weight ? String(set.weight) : '');
    setReps(set.reps ? String(set.reps) : '');
  }, [set.weight, set.reps]);

  return (
    <View style={styles.setRow}>
      <Text style={[styles.setNumber, { flex: 0.5 }]}>{index + 1}</Text>
      <TextInput
        style={[styles.setInput, { flex: 1 }]}
        keyboardType="numeric"
        placeholder="0"
        placeholderTextColor={colors.textDim}
        value={weight}
        editable={!readOnly}
        onChangeText={(text) => {
          const formatted = text.replace(',', '.');
          if (/^\d*\.?\d*$/.test(formatted)) setWeight(formatted);
        }}
        onBlur={() => {
          const finalVal = parseFloat(weight) || 0;
          onUpdateSet?.(exerciseId, set.id, { weight: finalVal });
        }}
      />
      <TextInput
        style={[styles.setInput, { flex: 1 }]}
        keyboardType="number-pad"
        placeholder="0"
        placeholderTextColor={colors.textDim}
        value={reps}
        editable={!readOnly}
        onChangeText={(text) => {
          if (/^\d*$/.test(text)) setReps(text);
        }}
        onBlur={() => {
          const finalVal = parseInt(reps) || 0;
          onUpdateSet?.(exerciseId, set.id, { reps: finalVal });
        }}
      />
      <View style={{ width: 28, alignItems: 'center' }}>
        {!readOnly && onDeleteSet ? (
          <Pressable
            onPress={() => onDeleteSet(exerciseId, set.id)}
            hitSlop={12}
          >
            <Ionicons
              name={parseFloat(weight) > 0 && parseInt(reps) > 0 ? 'checkmark-circle' : 'close-circle-outline'}
              size={18}
              color={parseFloat(weight) > 0 && parseInt(reps) > 0 ? colors.success : colors.textDim}
            />
          </Pressable>
        ) : (
          parseFloat(weight) > 0 && parseInt(reps) > 0 && (
            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
          )
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
