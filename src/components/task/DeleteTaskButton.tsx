/**
 * DeleteTaskButton — Client Component
 *
 * Delete button with a confirmation modal. Handles the optimistic
 * update itself: immediately removes the task from the cached
 * infinite-query data, rolls back on error, and invalidates on settle.
 */
"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";
import Spinner from "@/components/ui/Spinner";

export default function DeleteTaskButton({
  taskId,
  taskTitulo,
}: {
  taskId: string;
  taskTitulo: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const utils = trpc.useUtils();
  // Optimistic update: remove task from cache before server responds
  const deleteMutation = trpc.task.delete.useMutation({
    onMutate: async () => {
      await utils.task.list.cancel();
      const snapshot = utils.task.list.getInfiniteData();
      utils.task.list.setInfiniteData(
        { limit: 10 },
        (data) => {
          if (!data) return data;
          return {
            ...data,
            pages: data.pages.map((page) => ({
              ...page,
              items: page.items.filter((task) => task.id !== taskId),
            })),
          };
        },
      );
      return { snapshot };
    },
    onError: (_error, _vars, context) => {
      utils.task.list.setInfiniteData({ limit: 10 }, context?.snapshot);
      toast.error("Failed to delete task");
    },
    onSettled: () => {
      utils.task.list.invalidate();
    },
    onSuccess: () => {
      toast.success("Task deleted successfully");
    },
  });

  // Close modal on Escape key press
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const confirmDelete = () => {
    deleteMutation.mutate({ id: taskId });
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        disabled={deleteMutation.isPending}
        className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
      >
        {deleteMutation.isPending && <Spinner className="h-3.5 w-3.5" />}
        Delete
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setIsOpen(false)} /* backdrop click closes modal */
        >
          <div
            className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()} /* prevent backdrop close on content click */
          >
            <p className="text-sm text-neutral-600">
              You are deleting the task:{" "}
              <span className="font-bold text-neutral-900">{taskTitulo}</span>
            </p>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-md bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
