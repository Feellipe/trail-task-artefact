/**
 * Task edit page — Server Component that fetches the task on the server via
 * the tRPC caller (no HTTP round-trip) and passes it as a serializable prop
 * to TaskForm, which operates in "edit" mode when initialTask is provided.
 */
import { createServerCaller } from "@/server/trpc/caller";
import TaskForm from "@/components/task/TaskForm";

// Next.js 15 breaking change: params is now a Promise that must be awaited.
type Props = { params: Promise<{ id: string }> };

export default async function EditTaskPage({ params }: Props) {
  const { id } = await params;

  // Server-side tRPC call — bypasses HTTP entirely.
  const caller = createServerCaller();
  const task = await caller.task.getById({ id });

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      {/* initialTask crosses the RSC boundary, so it must be JSON-serializable. */}
      <TaskForm initialTask={task} />
    </main>
  );
}
