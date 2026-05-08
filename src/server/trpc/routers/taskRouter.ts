/**
 * tRPC procedures for task CRUD.
 * Input validation is automatic via Zod schemas.
 * Business logic errors (e.g. NOT_FOUND) are thrown manually.
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { t } from "../init";
import {
  taskSchema,
  createTaskInputSchema,
  updateTaskInputSchema,
  deleteTaskInputSchema,
  listTasksInputSchema,
} from "@/types/task";

export const taskRouter = t.router({
  // Zod validates input -> store creates with UUID + ISO timestamp
  create: t.procedure
    .input(createTaskInputSchema)
    .output(taskSchema)
    .mutation(({ input, ctx }) => {
      return ctx.store.create(input.titulo, input.descricao);
    }),

  list: t.procedure
    .input(listTasksInputSchema)
    // nextCursor is null when there are no more pages
    .output(z.object({
      items: taskSchema.array(),
      nextCursor: z.string().nullable(),
    }))
    .query(({ input, ctx }) => {
      return ctx.store.list(input.cursor, input.limit);
    }),

  update: t.procedure
    .input(updateTaskInputSchema)
    .output(taskSchema)
    .mutation(({ input, ctx }) => {
      // Manual existence check before update — business logic error, not Zod
      const existing = ctx.store.getById(input.id);
      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Task not found. Please verify the identifier and try again.",
        });
      }
      // Separate id from update payload so store.update() receives only mutable fields
      const { id, ...data } = input;
      const updated = ctx.store.update(id, data);
      // Safe non-null assertion — existence is guaranteed by the check above
      return updated!;
    }),

  delete: t.procedure
    .input(deleteTaskInputSchema)
    .output(z.object({ success: z.boolean() }))
    .mutation(({ input, ctx }) => {
      // Same existence-check pattern as update
      const existing = ctx.store.getById(input.id);
      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Task not found",
        });
      }
      ctx.store.delete(input.id);
      return { success: true };
    }),

  // Dev-only utility for populating test data — not part of the public API contract
  seed: t.procedure
    .input(z.object({ count: z.number().min(1).max(500).default(100) }))
    .output(z.object({ created: z.number() }))
    .mutation(({ input, ctx }) => {
      const titles = [
        "Set up project repository",
        "Design database schema",
        "Implement authentication flow",
        "Write unit tests for API",
        "Review pull request",
        "Fix navigation bug",
        "Add error handling",
        "Optimize query performance",
        "Update dependencies",
        "Create deployment pipeline",
        "Refactor user service",
        "Add search functionality",
        "Implement file upload",
        "Write API documentation",
        "Set up monitoring alerts",
        "Design notification system",
        "Migrate legacy endpoints",
        "Add rate limiting",
        "Improve accessibility",
        "Set up staging environment",
      ];
      const descriptions = [
        null,
        "Needs to be completed before the sprint ends.",
        "Review the requirements document for details.",
        "Coordinate with the backend team on this.",
      ];
      for (let i = 0; i < input.count; i++) {
        const titulo = `${titles[i % titles.length]} #${i + 1}`;
        const descricao = descriptions[i % descriptions.length];
        ctx.store.create(titulo, descricao);
      }
      return { created: input.count };
    }),

  // Reuses deleteTaskInputSchema — both procedures accept the same { id: string } shape
  getById: t.procedure
    .input(deleteTaskInputSchema)
    .output(taskSchema)
    .query(({ input, ctx }) => {
      const task = ctx.store.getById(input.id);
      if (!task) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Task not found",
        });
      }
      return task;
    }),
});
