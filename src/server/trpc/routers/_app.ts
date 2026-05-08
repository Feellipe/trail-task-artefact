/**
 * Root router — merges all sub-routers under prefixed keys.
 * Add new routers here as the API grows.
 */
import { t } from "../init";
import { taskRouter } from "./taskRouter";

export const appRouter = t.router({
  task: taskRouter,
});

// Single source of truth for API types.
// The client imports this for end-to-end type inference via createTRPCReact<AppRouter>().
export type AppRouter = typeof appRouter;
