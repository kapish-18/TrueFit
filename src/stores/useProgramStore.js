// Program Store — Zustand
import { create } from 'zustand';
import {
  getAllPrograms, getActiveProgram, getProgramDays,
  getProgramExercises, setActiveProgram as setActiveProgramDB,
  createProgram, deleteProgram, addProgramDay,
  addProgramExercise, updateProgramExercise, deleteProgramExercise,
  updateProgramName, updateProgramDay, deleteProgramDay,
  reorderProgramExercises,
} from '../db/dao';

export const useProgramStore = create((set, get) => ({
  programs: [],
  activeProgram: null,
  activeDays: [],
  isLoading: false,

  loadPrograms: async () => {
    set({ isLoading: true });
    try {
      const programs = await getAllPrograms();
      const active = await getActiveProgram();
      let activeDays = [];

      if (active) {
        const days = await getProgramDays(active.id);
        for (const day of days) {
          day.exercises = await getProgramExercises(day.id);
        }
        activeDays = days;
      }

      set({ programs, activeProgram: active, activeDays, isLoading: false });
    } catch (e) {
      console.error('Failed to load programs:', e);
      set({ isLoading: false });
    }
  },

  createNewProgram: async (name) => {
    const id = await createProgram(name);
    await get().loadPrograms();
    return id;
  },

  setActive: async (programId) => {
    await setActiveProgramDB(programId);
    await get().loadPrograms();
  },

  removeProgram: async (programId) => {
    await deleteProgram(programId);
    await get().loadPrograms();
  },

  renameProgramFn: async (programId, newName) => {
    await updateProgramName(programId, newName);
    await get().loadPrograms();
  },

  addDay: async (programId, name, dayIndex) => {
    const id = await addProgramDay(programId, name, dayIndex);
    await get().loadPrograms();
    return id;
  },

  renameDay: async (dayId, name) => {
    await updateProgramDay(dayId, name);
    await get().loadPrograms();
  },

  removeDay: async (dayId) => {
    await deleteProgramDay(dayId);
    await get().loadPrograms();
  },

  addExercise: async (dayId, exerciseId, data) => {
    const id = await addProgramExercise(dayId, exerciseId, data);
    await get().loadPrograms();
    return id;
  },

  updateExercise: async (exerciseId, data) => {
    await updateProgramExercise(exerciseId, data);
    await get().loadPrograms();
  },

  removeExercise: async (exerciseId) => {
    await deleteProgramExercise(exerciseId);
    await get().loadPrograms();
  },

  reorderExercises: async (dayId, orderedIds) => {
    await reorderProgramExercises(dayId, orderedIds);
    await get().loadPrograms();
  },

  getDayById: (dayId) => {
    return get().activeDays.find(d => d.id === dayId) || null;
  },
}));
