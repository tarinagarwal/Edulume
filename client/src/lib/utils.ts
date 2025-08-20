// src/lib/utils.ts
import { clsx } from "clsx";

export function cn(...inputs: (string | undefined | null | false)[]) {
  return clsx(inputs);
}
