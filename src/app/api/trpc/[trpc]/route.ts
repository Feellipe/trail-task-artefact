/**
 * Catch-all Next.js route handler for /api/trpc/*.
 * Endpoint must match the client-side httpBatchLink URL.
 */
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/trpc/routers/_app";
import { createTRPCContext } from "@/server/trpc/context";

function handler(req: Request) {
  return fetchRequestHandler({
    endpoint: "/api/trpc",  // must match the URL configured in the tRPC client
    req,
    router: appRouter,      // the merged root router
    createContext: createTRPCContext, // fresh context per request
  });
}

// GET for queries, POST for mutations and batched requests
export { handler as GET, handler as POST };
