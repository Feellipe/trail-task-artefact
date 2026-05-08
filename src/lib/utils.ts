/**
 * Merges Tailwind CSS classes.
 * `clsx` handles conditionals, `twMerge` resolves conflicting utilities.
 */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
