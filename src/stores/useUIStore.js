// UI Store — Zustand
// Manages toasts, modals, and global UI state
import { create } from 'zustand';

let toastCounter = 0;

export const useUIStore = create((set, get) => ({
  // Toast notifications
  toasts: [],

  showToast: (message, type = 'info', duration = 3000) => {
    const id = `toast_${Date.now()}_${toastCounter++}`;
    set(state => ({
      toasts: [...state.toasts, { id, message, type, duration }],
    }));

    // Auto-dismiss
    setTimeout(() => {
      set(state => ({
        toasts: state.toasts.filter(t => t.id !== id),
      }));
    }, duration);

    return id;
  },

  dismissToast: (id) => {
    set(state => ({
      toasts: state.toasts.filter(t => t.id !== id),
    }));
  },

  // Modal state
  activeModal: null,
  modalData: null,

  openModal: (modalName, data = null) => {
    set({ activeModal: modalName, modalData: data });
  },

  closeModal: () => {
    set({ activeModal: null, modalData: null });
  },

  // Loading state
  isAppReady: false,
  setAppReady: (ready) => set({ isAppReady: ready }),
}));
