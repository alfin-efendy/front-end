import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { zustandIndexedDBStorage } from '@/lib/zustandIndexedDBStorage';

type ImageCacheStore = {
  images: Record<string, string>; // url -> base64 data
  setImage: (url: string, base64: string) => void;
  getImage: (url: string) => string | undefined;
};

export const useImageCacheStore = create(
  persist<ImageCacheStore>(
    (set, get) => ({
      images: {},
      setImage: (url, base64) => set((s) => ({
        images: { ...s.images, [url]: base64 }
      })),
      getImage: (url) => get().images[url],
    }),
    {
      name: 'image-cache',
      storage: zustandIndexedDBStorage,
    }
  )
);
