// Settings Store — Zustand
import { create } from 'zustand';
import { getAllSettings, setSetting } from '../db/dao';

export const useSettingsStore = create((set, get) => ({
  weightUnit: 'kg',
  deloadFrequency: 6,
  fatigueThreshold: 70,
  isLoaded: false,

  loadSettings: async () => {
    try {
      const settings = await getAllSettings();
      set({
        weightUnit: settings.weight_unit || 'kg',
        deloadFrequency: parseInt(settings.deload_frequency) || 6,
        fatigueThreshold: parseInt(settings.fatigue_threshold) || 70,
        isLoaded: true,
      });
    } catch (e) {
      console.error('Failed to load settings:', e);
      set({ isLoaded: true });
    }
  },

  setWeightUnit: async (unit) => {
    await setSetting('weight_unit', unit);
    set({ weightUnit: unit });
  },

  setDeloadFrequency: async (weeks) => {
    await setSetting('deload_frequency', String(weeks));
    set({ deloadFrequency: weeks });
  },

  setFatigueThreshold: async (threshold) => {
    await setSetting('fatigue_threshold', String(threshold));
    set({ fatigueThreshold: threshold });
  },
}));
