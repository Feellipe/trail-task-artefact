import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import { createServerCaller } from "@/server/trpc/caller";
import type { TaskOutput } from "@/types/task";
import TaskList from "@/components/task/TaskList";

type TaskListPage = {
  items: TaskOutput[];
  nextCursor: string | null;
};

export default async function Home() {
  const caller = createServerCaller();

  const queryClient = new QueryClient();

  await queryClient.prefetchInfiniteQuery({
    queryKey: [
      ["task", "list"],
      { input: { limit: 10 }, type: "infinite" },
    ],
    queryFn: ({ pageParam }) =>
      caller.task.list({ cursor: pageParam, limit: 10 }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: TaskListPage) => lastPage.nextCursor ?? undefined,
  });

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <HydrationBoundary state={dehydrate(queryClient)}>
        <TaskList />
      </HydrationBoundary>
    </main>
  );
}
