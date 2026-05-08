/** Suspense fallback for the root route — renders immediately while page.tsx streams data. */
import TaskListSkeleton from "@/components/task/TaskListSkeleton";

export default function Loading() {
  return <TaskListSkeleton />;
}
