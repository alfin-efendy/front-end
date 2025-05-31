"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  createContext,
  useCallback,
  useState,
  type ReactNode,
} from "react";

type ConfirmationOptions = {
  title?: string;
  description: string;
  textButton?: string;
  isDanger?: boolean;
};

type DialogContextType = {
  confirm: (opts: ConfirmationOptions) => Promise<boolean>;
};

export const DialogContext = createContext<DialogContextType | null>(null);

export function DialogProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmationOptions | null>(null);
  const [resolver, setResolver] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmationOptions): Promise<boolean> => {
    setOptions(opts);
    setIsOpen(true);
    return new Promise((resolve) => {
      setResolver(() => resolve);
    });
  }, []);

  const handleClose = (result: boolean) => {
    setIsOpen(false);
    resolver?.(result);
    setResolver(null);
  };

  return (
    <DialogContext.Provider value={{ confirm }}>
      {children}

      {options && (
        <AlertDialog open={isOpen} onOpenChange={(open) => !open && handleClose(false)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{options.title ?? "Are you sure?"}</AlertDialogTitle>
              <AlertDialogDescription>{options.description}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction asChild>
                <Button
                  variant={options.isDanger ? "destructive" : "default"}
                  onClick={() => handleClose(true)}
                >
                  {options.textButton ?? "Confirm"}
                </Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </DialogContext.Provider>
  );
}
