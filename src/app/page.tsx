/**
 * Root page — Server Component that prefetches the first page of tasks on the
 * server and streams HTML with a pre-populated React Query cache via
 * HydrationBoundary, so the client never re-fetches on mount.
 */
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import { createServerCaller } from "@/server/trpc/caller";
import type { TaskOutput } from "@/types/task";
import TaskList from "@/components/task/TaskList";

type TaskListPage = {
  items: TaskOutput[];
  nextCursor: string | null;
};

// Async Server Component — runs only on the server, never ships to the client.
export default async function Home() {
  // Bypass HTTP entirely; invokes tRPC procedures directly on the server.
  const caller = createServerCaller();

  // Fresh QueryClient per request — used ONLY for prefetch + dehydrate.
  // This instance is never sent to the client.
  const queryClient = new QueryClient();

  await queryClient.prefetchInfiniteQuery({
    // queryKey format must match the client-side useInfiniteQuery exactly.
    // cursor and direction are NOT in the key — tRPC v11 reserves those via
    // ReservedInfiniteQueryKeys and injects them automatically.
    queryKey: [
      ["task", "list"],
      { input: { limit: 10 }, type: "infinite" },
    ],
    queryFn: ({ pageParam }) =>
      caller.task.list({ cursor: pageParam, limit: 10 }),
    // undefined = initial cursor before the first fetch.
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: TaskListPage) => lastPage.nextCursor ?? undefined,
  });

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      {/* Serializes the prefetched cache into the HTML payload. React Query
          on the client hydrates from this, preventing an extra network request. */}
      <HydrationBoundary state={dehydrate(queryClient)}>
        <TaskList />
      </HydrationBoundary>
    </main>
  );
}
