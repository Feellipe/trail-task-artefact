"use client";

import { useRef } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";
import TaskCard from "@/components/task/TaskCard";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import Spinner from "@/components/ui/Spinner";
import ErrorMessage from "@/components/ui/ErrorMessage";

const MAX_PAGES = 50;

export default function TaskList() {
  const sentinelRef = useRef<HTMLDivElement>(null);

  const seedMutation = trpc.task.seed.useMutation({
    onSuccess: (data) => {
      toast.success(`Seeded ${data.created} tasks`);
      refetch();
    },
  });

  const {
    data,
    isError,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = trpc.task.list.useInfiniteQuery(
    {
      limit: 10,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      initialCursor: undefined,
    },
  );

  const reachedMaxPages = data ? data.pages.length >= MAX_PAGES : false;

  useInfiniteScroll({
    sentinelRef,
    onIntersect: fetchNextPage,
    hasNextPage: hasNextPage && !reachedMaxPages,
    isFetchingNextPage,
  });

  if (isError) {
    return (
      <ErrorMessage message="Failed to load tasks" onRetry={() => refetch()} />
    );
  }

  const tasks = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-400">Tasks</h1>
        <div className="flex items-center gap-2">
          {process.env.NODE_ENV === "development" && (
            <button
              onClick={() => seedMutation.mutate({ count: 100 })}
              disabled={seedMutation.isPending}
              className="rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-50"
            >
              {seedMutation.isPending ? "Seeding..." : "Seed 100 Tasks"}
            </button>
          )}
          <Link
            href="/tasks/new"
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
          >
            New Task
          </Link>
        </div>
      </div>

      {tasks.length === 0 && !isLoading && (
        <p className="text-neutral-500">No tasks found</p>
      )}

      <div className="space-y-3">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>

      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <Spinner className="h-6 w-6 text-neutral-400" />
        </div>
      )}

      {reachedMaxPages && !hasNextPage && tasks.length > 0 && (
        <p className="py-2 text-center text-sm text-neutral-500">
          End of available history
        </p>
      )}

      <div ref={sentinelRef} />
    </div>
  );
}
