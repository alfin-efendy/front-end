import { useContext } from "react";
import { DialogContext } from "@/components/dialog-confirmation";

export function useConfirmation() {
  const ctx = useContext(DialogContext);
  if (!ctx) {
    throw new Error("useConfirmation must be used within a <DialogProvider>");
  }
  return ctx.confirm;
}
