"use client";

import { useRef } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import TaskCard from "@/components/task/TaskCard";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import Spinner from "@/components/ui/Spinner";
import ErrorMessage from "@/components/ui/ErrorMessage";

const MAX_PAGES = 50;

export default function TaskList() {
  const sentinelRef = useRef<HTMLDivElement>(null);

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
        <h1 className="text-2xl font-bold text-neutral-900">Tasks</h1>
        <Link
          href="/tasks/new"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        >
          New Task
        </Link>
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
