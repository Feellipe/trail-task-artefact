/**
 * Canonical source for Task data model and validation contracts.
 * Shared between client and server to guarantee end-to-end type safety.
 */
import { z } from "zod";

export interface Task {
  id: string;
  titulo: string;
  // Always `null` (never `undefined`) for consistent type narrowing across layers
  descricao: string | null;
  // ISO 8601 string — NOT a Date object — to prevent hydration mismatches
  createdAt: string;
}

// Output/validation schema used as `.output()` on tRPC procedures
export const taskSchema = z.object({
  id: z.string().uuid(),
  titulo: z.string(),
  descricao: z.string().nullable(),
  createdAt: z.string(),
});

export type TaskOutput = z.infer<typeof taskSchema>;

export const createTaskInputSchema = z.object({
  titulo: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title cannot exceed 200 characters"),
  // nullable() allows `null`, optional() allows omitting the key entirely
  descricao: z
    .string()
    .max(2000, "Description cannot exceed 2000 characters")
    .nullable()
    .optional(),
});

export const updateTaskInputSchema = z.object({
  id: z.string().uuid("Invalid ID format"),
  // optional() enables partial updates — only provided fields are changed
  titulo: z
    .string()
    .min(1, "Title cannot be empty")
    .max(200, "Title cannot exceed 200 characters")
    .optional(),
  // Same nullable+optional chain as create, plus titulo is optional for partial updates
  descricao: z
    .string()
    .max(2000, "Description cannot exceed 2000 characters")
    .nullable()
    .optional(),
});

// Reused for both delete and getById procedures (both accept `{ id: string }`)
export const deleteTaskInputSchema = z.object({
  id: z.string().uuid("Invalid ID format"),
});

export const listTasksInputSchema = z.object({
  // base64-encoded ISO timestamp, decoded server-side for cursor-based pagination
  cursor: z.string().optional(),
  // default 10, max 100 — prevents unbounded queries
  limit: z.number().min(1).max(100).default(10),
});
