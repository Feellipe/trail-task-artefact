/**
 * Central tRPC initialization.
 * Exports `t` for use in routers and the caller factory.
 */
import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import type { Context } from "./context";

export const t = initTRPC
  .context<Context>()
  .create({
    // Must match the client-side transformer in TRPCProvider for serialization
    transformer: superjson,
    // Flattens Zod errors into { fieldErrors: { fieldName: ["message"] } }
    // accessible via shape.data.zodError on the client
    errorFormatter({ shape, error }) {
      return {
        ...shape,
        data: {
          ...shape.data,
          // Only flatten when it is actually a Zod validation error
          zodError:
            error.code === "BAD_REQUEST" &&
            error.cause instanceof ZodError
              ? error.cause.flatten()
              : null,
        },
      };
    },
  });
