/**
 * Dependency injection container for tRPC procedures.
 * Extension point for future auth/session middleware.
 */
import { inMemoryTaskStore } from "@/server/store/InMemoryTaskStore";

// Called per-request by the route handler and by the server-side caller.
// The store itself is a singleton, so all callers share the same data.
export function createTRPCContext() {
  return { store: inMemoryTaskStore };
}

// Context type inferred from return type — stays in sync automatically
export type Context = ReturnType<typeof createTRPCContext>;
