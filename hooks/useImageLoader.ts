import { useEffect, useState } from 'react';
import { useImageCacheStore } from '@/store/imageCacheStore';

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function useImageLoader(url: string) {
  const getImage = useImageCacheStore((s) => s.getImage);
  const setImage = useImageCacheStore((s) => s.setImage);

  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let canceled = false;
    const cached = getImage(url);
    if (cached) {
      setDataUrl(cached);
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to load: ${res.status}`);
        const blob = await res.blob();
        const base64 = await blobToBase64(blob);

        if (!canceled) {
          setDataUrl(base64);
          setImage(url, base64);
        }
      } catch (err: any) {
        if (!canceled) setError(err.message);
      } finally {
        if (!canceled) setLoading(false);
      }
    };

    load();
    return () => {
      canceled = true;
    };
  }, [url]);

  return { dataUrl, loading, error };
}
