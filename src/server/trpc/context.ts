import { inMemoryTaskStore } from "@/server/store/InMemoryTaskStore";

export function createTRPCContext() {
  return { store: inMemoryTaskStore };
}

export type Context = ReturnType<typeof createTRPCContext>;
