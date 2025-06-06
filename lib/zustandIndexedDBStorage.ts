import { createStore, get, set, del } from 'idb-keyval';
import type { PersistStorage, StorageValue } from 'zustand/middleware';

const store = createStore('zustand-db', 'image-cache');

export const zustandIndexedDBStorage: PersistStorage<any> = {
  getItem: async (name) => {
    const value = await get(name, store);
    if (!value) return null;

    try {
      return JSON.parse(value);
    } catch (err) {
      console.warn('Failed to parse persisted state:', err);
      return null;
    }
  },
  setItem: async (name, value) => {
    await set(name, JSON.stringify(value), store);
  },
  removeItem: async (name) => {
    await del(name, store);
  },
};
