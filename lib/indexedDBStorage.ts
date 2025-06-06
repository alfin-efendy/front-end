import { createStore, get, set, del } from 'idb-keyval';

const store = createStore('zustand-db', 'image-cache');

export const indexedDBStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const value = await get(name, store);
    return value ?? null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await set(name, value, store);
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name, store);
  },
};