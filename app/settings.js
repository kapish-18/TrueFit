// Settings Screen
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '../src/theme/theme';
import { useSettingsStore } from '../src/stores/useSettingsStore';
import { useUIStore } from '../src/stores/useUIStore';
import { useProgramStore } from '../src/stores/useProgramStore';
import { useWorkoutStore } from '../src/stores/useWorkoutStore';
import { exportAllData } from '../src/db/dao';
import { getDatabase } from '../src/db/database';
import { seedMockData } from '../src/utils/seeder';

export default function SettingsScreen() {
  const { weightUnit, deloadFrequency, setWeightUnit, setDeloadFrequency } = useSettingsStore();
  const showToast = useUIStore(s => s.showToast);
  const { loadPrograms } = useProgramStore();
  const { clearSession } = useWorkoutStore();
  const [exporting, setExporting] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await exportAllData();
      const json = JSON.stringify(data, null, 2);
      await Share.share({
        message: json,
        title: 'TrueFit Data Export',
      });
      showToast('Data exported!', 'success');
    } catch (e) {
      showToast('Export failed', 'error');
    }
    setExporting(false);
  };

  const handleSeedData = async () => {
    if (seeding) return; // Prevent double-tap
    Alert.alert(
      'Generate Mock Data',
      'This will add 8 weeks of simulated workout data to your current program. Existing data will NOT be removed. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Generate',
          onPress: async () => {
            setSeeding(true);
            try {
              await seedMockData();
              await loadPrograms();
              clearSession();
              showToast('8 weeks of data generated!', 'success');
            } catch (e) {
              showToast(e.message || 'Failed to generate data', 'error');
            }
            setSeeding(false);
          },
        },
      ]
    );
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your workout data, programs, PRs, and logs. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Everything',
          style: 'destructive',
          onPress: async () => {
            try {
              const db = await getDatabase();
              await db.execAsync(`
                DELETE FROM log_sets;
                DELETE FROM log_exercises;
                DELETE FROM workout_logs;
                DELETE FROM personal_records;
                DELETE FROM program_exercises;
                DELETE FROM program_days;
                DELETE FROM programs;
              `);
              await loadPrograms();
              clearSession();
              showToast('All data cleared', 'info');
            } catch (e) {
              showToast('Failed to clear data', 'error');
            }
          },
        },
      ]
    );
  };

  const SettingRow = ({ icon, iconColor, title, subtitle, right, onPress }) => (
    <Pressable
      style={({ pressed }) => [styles.settingRow, pressed && onPress && { opacity: 0.9 }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.settingIcon, { backgroundColor: (iconColor || colors.primary) + '18' }]}>
        <Ionicons name={icon} size={18} color={iconColor || colors.primary} />
      </View>
      <View style={styles.settingInfo}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {right}
    </Pressable>
  );

  const TogglePill = ({ options, value, onChange }) => (
    <View style={styles.toggleRow}>
      {options.map(opt => (
        <Pressable
          key={opt.value}
          style={[styles.togglePill, value === opt.value && styles.togglePillActive]}
          onPress={() => onChange(opt.value)}
        >
          <Text style={[styles.toggleText, value === opt.value && styles.toggleTextActive]}>
            {opt.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Settings</Text>

      {/* Preferences */}
      <Text style={styles.sectionTitle}>Preferences</Text>
      <View style={styles.section}>
        <SettingRow
          icon="scale"
          title="Weight Unit"
          subtitle={weightUnit === 'kg' ? 'Kilograms' : 'Pounds'}
          right={
            <TogglePill
              options={[{ label: 'kg', value: 'kg' }, { label: 'lbs', value: 'lbs' }]}
              value={weightUnit}
              onChange={setWeightUnit}
            />
          }
        />

        <SettingRow
          icon="refresh-circle"
          iconColor={colors.warning}
          title="Deload Frequency"
          subtitle={`Every ${deloadFrequency} weeks`}
          right={
            <TogglePill
              options={[
                { label: '4', value: 4 },
                { label: '6', value: 6 },
                { label: '8', value: 8 },
              ]}
              value={deloadFrequency}
              onChange={setDeloadFrequency}
            />
          }
        />
      </View>

      {/* Data Management */}
      <Text style={styles.sectionTitle}>Data</Text>
      <View style={styles.section}>
        <SettingRow
          icon="download-outline"
          iconColor={colors.success}
          title="Export Data"
          subtitle="Export all data as JSON"
          onPress={handleExport}
          right={
            <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
          }
        />

        <SettingRow
          icon="flash-outline"
          iconColor={colors.primary}
          title="Generate Mock Data"
          subtitle="Simulate 8 weeks of past workouts"
          onPress={handleSeedData}
          right={
            <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
          }
        />

        <SettingRow
          icon="trash-outline"
          iconColor={colors.danger}
          title="Clear All Data"
          subtitle="Delete everything permanently"
          onPress={handleClearData}
          right={
            <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
          }
        />
      </View>

      {/* About */}
      <Text style={styles.sectionTitle}>About</Text>
      <View style={styles.section}>
        <SettingRow
          icon="information-circle"
          title="TrueFit"
          subtitle="Intelligent Workout Planner v1.0.0"
        />
        <SettingRow
          icon="code-slash"
          iconColor={colors.purple}
          title="Built with"
          subtitle="React Native · Expo · SQLite · Zustand"
        />
      </View>

      <View style={{ height: 60 }} />
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
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textDim,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.md,
    marginTop: spacing.md,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  settingSubtitle: {
    fontSize: fontSize.xs,
    color: colors.textDim,
    marginTop: 2,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: colors.bgAlt,
    borderRadius: radius.sm,
    padding: 2,
  },
  togglePill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  togglePillActive: {
    backgroundColor: colors.primary,
  },
  toggleText: {
    fontSize: fontSize.sm,
    color: colors.textDim,
    fontWeight: fontWeight.medium,
  },
  toggleTextActive: {
    color: colors.textInverse,
  },
});
