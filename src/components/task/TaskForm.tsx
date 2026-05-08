/**
 * TaskForm — Client Component
 *
 * Dual-mode form: creates a new task when no initialTask is provided,
 * edits an existing one when it is. Delegates all state and mutation
 * logic to the useTaskForm hook.
 */
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTaskForm } from "@/hooks/useTaskForm";
import Spinner from "@/components/ui/Spinner";
import type { Task } from "@/types/task";

// initialTask is a JSON-serializable object that crosses the RSC boundary
export default function TaskForm({ initialTask }: { initialTask?: Task }) {
  const router = useRouter();

  const { titulo, descricao, errors, isSubmitting, setTitulo, setDescricao, handleSubmit } =
    useTaskForm({
      initialTask,
      // Redirect to listing after mutation; listing refetches due to staleTime: 0
      onSuccess: () => router.push("/"),
    });

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <h1 className="mb-6 text-xl font-semibold text-neutral-900">
          {initialTask ? "Edit Task" : "New Task"}
        </h1>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="space-y-4"
        >
          <div>
            <label htmlFor="titulo" className="mb-1 block text-sm font-medium text-neutral-700">
              Title
            </label>
            <input
              id="titulo"
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Task title"
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
            />
            {errors.titulo && (
              <p className="mt-1 text-sm text-red-600">{errors.titulo}</p>
            )}
          </div>

          <div>
            <label htmlFor="descricao" className="mb-1 block text-sm font-medium text-neutral-700">
              Description
            </label>
            <textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Task description (optional)"
              rows={4}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
            />
            {errors.descricao && (
              <p className="mt-1 text-sm text-red-600">{errors.descricao}</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isSubmitting} /* prevents duplicate submissions */
              className="inline-flex items-center gap-2 rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting && <Spinner className="h-4 w-4" />}
              {initialTask ? "Save Changes" : "Create Task"}
            </button>

            <Link
              href="/"
              className="rounded-md px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
