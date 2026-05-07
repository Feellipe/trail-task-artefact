"use client";

import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";
import Spinner from "@/components/ui/Spinner";

export default function DeleteTaskButton({ taskId }: { taskId: string }) {
  const utils = trpc.useUtils();
  const deleteMutation = trpc.task.delete.useMutation({
    onSuccess: () => {
      toast.success("Task deleted successfully");
      utils.task.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
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
