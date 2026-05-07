import { createServerCaller } from "@/server/trpc/caller";
import TaskForm from "@/components/task/TaskForm";

type Props = { params: Promise<{ id: string }> };

export default async function EditTaskPage({ params }: Props) {
  const { id } = await params;

  const caller = createServerCaller();
  const task = await caller.task.getById({ id });

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <TaskForm initialTask={task} />
    </main>
  );
}
