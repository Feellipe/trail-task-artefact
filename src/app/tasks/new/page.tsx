/**
 * Task creation page — Client Component (uses useState, useRouter, mutations).
 * No server data is needed for a blank form, so no SSR data fetching here.
 * TaskForm without initialTask prop operates in "create" mode.
 */
"use client";

import TaskForm from "@/components/task/TaskForm";

export default function NewTaskPage() {
  return <TaskForm />;
}
