import { t } from "../init";
import { taskRouter } from "./taskRouter";

export const appRouter = t.router({
  task: taskRouter,
});

export type AppRouter = typeof appRouter;
