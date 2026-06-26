/**
 * shadcn/ui Toaster — app-wide toast surface using the `sonner` library.
 * Mounted once near the root of the component tree; any module can
 * trigger toasts by importing `toast` from `sonner`.
 */
import * as React from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

/**
 * App-wide toast surface. Styled to the Lattice token system; mounted once near
 * the root so any module can call `toast()` from sonner.
 */
function Toaster(props: ToasterProps) {
  return (
    <Sonner
      className="toaster group"
      position="top-center"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "16px",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:border-border group-[.toaster]:bg-popover group-[.toaster]:text-popover-foreground group-[.toaster]:shadow-lift group-[.toaster]:rounded-2xl",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
