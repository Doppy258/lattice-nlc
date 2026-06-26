/**
 * utils - shared utility belt.
 * Exports:
 *   cn(...) — merges conditional class names, deduplicating Tailwind conflicts.
 * Role in architecture: Low-level helper consumed by every component to
 * compose className props safely.
 */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
