import { create } from 'zustand'

export const useErrorStore = create<{
  error: string | null;
  setError: (val: string | null) => void;
}>((set) => ({
  error: null,
  setError: (val) => set({ error: val }),
}));

export const useLoadingStore = create<{
  isLoading: boolean;
  setLoading: (val: boolean) => void;
}>((set) => ({
  isLoading: false,
  setLoading: (val) => set({ isLoading: val }),
}));