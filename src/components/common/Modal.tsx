import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
};

/**
 * App modal. Public API unchanged; now built on the Radix dialog primitive,
 * so focus-trap, scroll-lock, and Escape-to-close come for free.
 */
export function Modal({ open, title, onClose, children, footer }: Props) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="font-display text-[26px] font-medium tracking-[-0.01em]">
            {title}
          </DialogTitle>
        </DialogHeader>
        <div>{children}</div>
        {footer && (
          <div className="mt-1 flex flex-wrap justify-end gap-2">{footer}</div>
        )}
      </DialogContent>
    </Dialog>
  );
}
