/**
 * Enables Server Components to call tRPC procedures directly
 * without going through an HTTP round-trip.
 */
import { t } from "./init";
import { createTRPCContext } from "./context";
import { appRouter } from "./routers/_app";

// Receives the merged root router and returns a factory function
const createCaller = t.createCallerFactory(appRouter);

// Each call gets a fresh context with the injected store singleton
export function createServerCaller() {
  return createCaller(createTRPCContext());
}
