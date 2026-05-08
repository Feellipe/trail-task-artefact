/**
 * TaskListSkeleton — Server Component
 *
 * Skeleton placeholder rendered during streaming SSR. Shows 4
 * animated pulse cards so the user sees layout before real data arrives.
 */
export default function TaskListSkeleton() {
  return (
    <div className="space-y-3">
      {/* 4 skeleton cards as visual preview */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-lg border border-neutral-200 bg-neutral-100 p-4"
        >
          <div className="mb-2 h-4 w-3/4 rounded bg-neutral-300" />
          <div className="h-3 w-full rounded bg-neutral-200" />
          <div className="mt-2 h-3 w-2/3 rounded bg-neutral-200" />
        </div>
      ))}
    </div>
  );
}
