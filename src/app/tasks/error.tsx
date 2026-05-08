/**
 * Error boundary for the /tasks route group. Catches errors during SSR data
 * fetching (e.g. task list fetch failures).
 *
 * NOTE: Identical to app/error.tsx and edit/error.tsx — separate files are
 * required because Next.js isolates error boundaries per route segment.
 */
"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
      <h2 className="text-xl font-semibold text-neutral-900">
        Something went wrong
      </h2>
      <p className="text-neutral-600">{error.message}</p>
      <button
        onClick={reset}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
      >
        Try Again
      </button>
    </div>
  );
}
