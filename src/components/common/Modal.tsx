/**
 * Modal - convenience wrapper over the shadcn/ui Dialog primitive. Provides a
 * consistent glass-surface modal API with optional title, description, children,
 * and footer slot.
 * Props: open, onOpenChange, title?, description?, children?, footer?, className?, showClose?
 * Role in architecture: Common UI — every overlay (claim result, review, pairing,
 * QR scan, bot check) is built on top of this component to ensure visual
 * consistency and a11y out of the box.
 */
import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
  showClose = true,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
  showClose?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={className} showClose={showClose}>
        {(title || description) && (
          <DialogHeader className="shrink-0 px-6 pt-6 sm:px-7 sm:pt-7">
            {title && <DialogTitle>{title}</DialogTitle>}
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
        )}
        {children && (
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-6 py-5 sm:px-7">
            {children}
          </div>
        )}
        {footer && (
          <DialogFooter className="shrink-0 border-t border-border px-6 py-4 sm:px-7">
            {footer}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
