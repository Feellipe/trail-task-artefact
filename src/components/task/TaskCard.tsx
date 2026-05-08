/**
 * TaskCard — Client Component
 *
 * Renders a single task as a card. Marked "use client" because it
 * contains interactive elements (DeleteTaskButton) and could manage
 * local animation state.
 */
"use client";

import Link from "next/link";
import type { Task } from "@/types/task";
import TaskCardDate from "@/components/task/TaskCardDate";
import DeleteTaskButton from "@/components/task/DeleteTaskButton";

export default function TaskCard({ task }: { task: Task }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      <h3 className="text-lg font-semibold text-neutral-900">{task.titulo}</h3>

      {/* Null descriptions render nothing — no fallback text */}
      {task.descricao && (
        <p className="mt-1 text-sm text-neutral-600">{task.descricao}</p>
      )}

      <TaskCardDate createdAt={task.createdAt} />

      <div className="mt-3 flex items-center gap-3">
        <Link
          href={`/tasks/${task.id}/edit`}
          className="rounded-md bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-200"
        >
          Edit
        </Link>
        <DeleteTaskButton taskId={task.id} taskTitulo={task.titulo} />
      </div>
    </div>
  );
}
