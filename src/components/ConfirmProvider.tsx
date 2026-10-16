import * as React from "react";
import { AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = React.createContext<ConfirmFn | null>(null);

export function useConfirm() {
  const context = React.useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used inside a ConfirmProvider");
  }
  return context;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [options, setOptions] = React.useState<ConfirmOptions | null>(null);
  const resolver = React.useRef<((value: boolean) => void) | null>(null);

  const confirm = React.useCallback<ConfirmFn>((next) => {
    setOptions(next);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const settle = React.useCallback((value: boolean) => {
    resolver.current?.(value);
    resolver.current = null;
    setOpen(false);
  }, []);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AlertDialog
        open={open}
        onOpenChange={(next) => {
          if (!next) settle(false);
        }}
      >
        <AlertDialogContent
          {...(options?.description ? {} : { "aria-describedby": undefined })}
          className="max-w-md gap-5 rounded-3xl border border-[var(--gold-soft)] bg-popover/95 p-7 shadow-[0_30px_80px_-30px_var(--gold-glow)] backdrop-blur-xl sm:rounded-3xl"
        >
          <AlertDialogHeader className="gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-full border border-[var(--gold-soft)] bg-primary/10 text-primary">
              <AlertTriangle className="h-6 w-6" />
            </span>
            <AlertDialogTitle className="font-display text-2xl text-foreground">
              {options?.title}
            </AlertDialogTitle>
            {options?.description ? (
              <AlertDialogDescription className="text-sm leading-6 text-muted-foreground">
                {options.description}
              </AlertDialogDescription>
            ) : null}
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-3">
            <Button
              variant="goldOutline"
              className="rounded-full sm:min-w-28"
              onClick={() => settle(false)}
            >
              {options?.cancelLabel ?? "Cancel"}
            </Button>
            <Button
              variant={options?.destructive ? "destructive" : "gold"}
              className="rounded-full sm:min-w-28"
              onClick={() => settle(true)}
            >
              {options?.confirmLabel ?? "Confirm"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  );
}
