/**
 * TaskFormSkeleton — Server Component
 *
 * Skeleton placeholder for task form pages during streaming SSR.
 * Mimics the form layout (heading, input, textarea, button).
 */
export default function TaskFormSkeleton() {
  return (
    <div className="animate-pulse space-y-4 rounded-lg border border-neutral-200 bg-neutral-50 p-6">
      <div className="h-4 w-1/3 rounded bg-neutral-300" />
      <div className="h-10 w-full rounded bg-neutral-200" />
      <div className="h-24 w-full rounded bg-neutral-200" />
      <div className="h-10 w-32 rounded bg-neutral-200" />
    </div>
  );
}
