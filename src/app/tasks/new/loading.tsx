/** Suspense fallback for the task creation page. */
import TaskFormSkeleton from "@/components/task/TaskFormSkeleton";

export default function Loading() {
  return <TaskFormSkeleton />;
}
