import { z } from "zod";

export interface Task {
  id: string;
  titulo: string;
  descricao: string | null;
  createdAt: string;
}

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
  descricao: z
    .string()
    .max(2000, "Description cannot exceed 2000 characters")
    .nullable()
    .optional(),
});

export const updateTaskInputSchema = z.object({
  id: z.string().uuid("Invalid ID format"),
  titulo: z
    .string()
    .min(1, "Title cannot be empty")
    .max(200, "Title cannot exceed 200 characters")
    .optional(),
  descricao: z
    .string()
    .max(2000, "Description cannot exceed 2000 characters")
    .nullable()
    .optional(),
});

export const deleteTaskInputSchema = z.object({
  id: z.string().uuid("Invalid ID format"),
});

export const listTasksInputSchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().min(1).max(100).default(10),
});
