/**
 * Typed tRPC React hooks factory.
 *
 * Importing AppRouter from the server gives the client full type knowledge
 * of all procedures — type safety without code generation.
 */
import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@/server/trpc/routers/_app";

export const trpc = createTRPCReact<AppRouter>();
