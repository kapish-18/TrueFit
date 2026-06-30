// Toast — Notification system
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, runOnJS } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '../theme/theme';
import { useUIStore } from '../stores/useUIStore';

const TOAST_ICONS = {
  success: { name: 'checkmark-circle', color: colors.success },
  error: { name: 'alert-circle', color: colors.danger },
  warning: { name: 'warning', color: colors.warning },
  info: { name: 'information-circle', color: colors.primary },
  pr: { name: 'trophy', color: colors.gold },
};

function ToastItem({ toast }) {
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);
  const dismissToast = useUIStore(s => s.dismissToast);

  useEffect(() => {
    translateY.value = withTiming(0, { duration: 300 });
    opacity.value = withTiming(1, { duration: 300 });

    // Animate out before removal
    const timer = setTimeout(() => {
      translateY.value = withTiming(-100, { duration: 250 });
      opacity.value = withTiming(0, { duration: 250 });
    }, (toast.duration || 3000) - 300);

    return () => clearTimeout(timer);
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const iconConfig = TOAST_ICONS[toast.type] || TOAST_ICONS.info;

  return (
    <Animated.View style={[styles.toast, animStyle]}>
      <View style={[styles.iconDot, { backgroundColor: iconConfig.color + '20' }]}>
        <Ionicons name={iconConfig.name} size={20} color={iconConfig.color} />
      </View>
      <Text style={styles.toastText} numberOfLines={2}>{toast.message}</Text>
      <Pressable onPress={() => dismissToast(toast.id)} hitSlop={8}>
        <Ionicons name="close" size={18} color={colors.textDim} />
      </Pressable>
    </Animated.View>
  );
}

export default function ToastContainer() {
  const toasts = useUIStore(s => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="box-none">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.md,
  },
  iconDot: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  toastText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: fontWeight.medium,
  },
});
