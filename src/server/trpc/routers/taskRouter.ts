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
  create: t.procedure
    .input(createTaskInputSchema)
    .output(taskSchema)
    .mutation(({ input, ctx }) => {
      return ctx.store.create(input.titulo, input.descricao);
    }),

  list: t.procedure
    .input(listTasksInputSchema)
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
      const existing = ctx.store.getById(input.id);
      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Task not found. Please verify the identifier and try again.",
        });
      }
      const { id, ...data } = input;
      const updated = ctx.store.update(id, data);
      return updated!;
    }),

  delete: t.procedure
    .input(deleteTaskInputSchema)
    .output(z.object({ success: z.boolean() }))
    .mutation(({ input, ctx }) => {
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
