/**
 * Form logic for task create/edit.
 * Operates in dual mode: creation when no `initialTask` is provided, edit otherwise.
 */
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";
import type { Task } from "@/types/task";
import {
  createTaskInputSchema,
  updateTaskInputSchema,
} from "@/types/task";

type FieldErrors = { titulo?: string; descricao?: string };

export function useTaskForm({
  initialTask,
  onSuccess,
}: {
  initialTask?: Task;
  onSuccess: () => void;
}) {
  const [titulo, setTitulo] = useState(initialTask?.titulo ?? "");
  const [descricao, setDescricao] = useState(initialTask?.descricao ?? "");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createMutation = trpc.task.create.useMutation();
  const updateMutation = trpc.task.update.useMutation();

  // Maps Zod flattened field errors to the component's { field?: string } format,
  // keeping only the first error per field.
  const mapFieldErrors = (
    fieldErrors: Record<string, string[] | undefined>
  ): FieldErrors => ({
    titulo: fieldErrors.titulo?.[0],
    descricao: fieldErrors.descricao?.[0],
  });

  const handleSubmit = async () => {
    setErrors({});

    // Convert empty string to null so the schema's .nullable() validates correctly.
    const payload = { titulo, descricao: descricao || null };

    const isEdit = !!initialTask;

    // Client-side validation catches errors before any network request.
    const result = isEdit
      ? updateTaskInputSchema.safeParse({ id: initialTask.id, ...payload })
      : createTaskInputSchema.safeParse(payload);

    if (!result.success) {
      setErrors(mapFieldErrors(result.error.flatten().fieldErrors));
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({
          id: initialTask.id,
          ...payload,
        });
      } else {
        await createMutation.mutateAsync(payload);
      }

      toast.success(
        isEdit ? "Task updated successfully" : "Task created successfully"
      );
      // Parent provides navigation (typically router.push("/")).
      onSuccess();
    } catch (error) {
      const err = error as { data?: { zodError?: { fieldErrors: Record<string, string[] | undefined> } }; message?: string };

      // Server-side Zod errors surfaced via the custom error formatter.
      if (err.data?.zodError?.fieldErrors) {
        setErrors(mapFieldErrors(err.data.zodError.fieldErrors));
      }

      toast.error(err.message ?? "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    titulo,
    descricao,
    errors,
    isSubmitting,
    setTitulo,
    setDescricao,
    handleSubmit,
  };
}
