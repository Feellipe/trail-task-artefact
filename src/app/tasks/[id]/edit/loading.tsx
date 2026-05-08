/** Suspense fallback for the task edit page. */
import TaskFormSkeleton from "@/components/task/TaskFormSkeleton";

export default function Loading() {
  return <TaskFormSkeleton />;
}
