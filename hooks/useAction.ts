import { useCallback } from "react";
import { toast } from "sonner";
import { useErrorStore, useLoadingStore } from "@/store/actionStore";

export function useAction() {
  const { isLoading, setLoading } = useLoadingStore();
  const { error, setError } = useErrorStore();

  const run = useCallback(
    async <T>(
      fn: () => Promise<T>,
      toastMessages?: {
        loading?: string;
        success?: string;
        error?: string;
      }
    ): Promise<T | undefined> => {
      setError(null);
      setLoading(true);

      const promise = fn();

    const finalPromise = toast.promise(
      promise,
      {
        loading: toastMessages?.loading ?? "Processing...",
        success: toastMessages?.success ?? "Success!",
        error: (err) => {
          const message = err instanceof Error ? err.message : "Unknown error";
          setError(message);
          return toastMessages?.error ?? message;
        },
        position: "top-right",
      }
    );

      try {
        return await finalPromise.unwrap();
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { isLoading, error, run };
}
