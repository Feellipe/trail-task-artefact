/**
 * TaskCardDate — Client Component
 *
 * Formats and displays the task creation date in the user's local
 * timezone. Dedicated Client Component so the Date is constructed at
 * render-time on the browser, avoiding hydration mismatches between
 * server and client timezones.
 */
"use client";

export default function TaskCardDate({ createdAt }: { createdAt: string }) {
  // ISO string -> Date is done here (client-side) to respect local timezone
  const date = new Date(createdAt);

  return (
    <time className="text-sm text-neutral-500">
      {date.toLocaleDateString()} {date.toLocaleTimeString()}
    </time>
  );
}
