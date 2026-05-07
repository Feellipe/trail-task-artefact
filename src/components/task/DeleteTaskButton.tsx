"use client";

import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";
import Spinner from "@/components/ui/Spinner";

export default function DeleteTaskButton({ taskId }: { taskId: string }) {
  const utils = trpc.useUtils();
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

  const handleDelete = () => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    deleteMutation.mutate({ id: taskId });
  };

  return (
    <button
      onClick={handleDelete}
      disabled={deleteMutation.isPending}
      className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
    >
      {deleteMutation.isPending && <Spinner className="h-3.5 w-3.5" />}
      Delete
    </button>
  );
}
