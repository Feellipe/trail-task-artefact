import { t } from "./init";
import { createTRPCContext } from "./context";
import { appRouter } from "./routers/_app";

const createCaller = t.createCallerFactory(appRouter);

export function createServerCaller() {
  return createCaller(createTRPCContext());
}
