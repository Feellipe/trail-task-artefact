"use client";

export default function TaskCardDate({ createdAt }: { createdAt: string }) {
  const date = new Date(createdAt);

  return (
    <time className="text-sm text-neutral-500">
      {date.toLocaleDateString()} {date.toLocaleTimeString()}
    </time>
  );
}
