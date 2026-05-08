/**
 * Root client provider — wires up React Query cache, tRPC client
 * with HTTP batch link, and the toast notification system.
 */
"use client";

import { useState, useRef } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { trpc } from "@/lib/trpc/client";
import superjson from "superjson";
import { Toaster } from "sonner";

export default function TRPCProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Stable QueryClient via useState initializer (not useRef).
  // Runs once, persists across re-renders, and is SSR-safe for per-request isolation.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 0, // Data immediately stale — server data from HydrationBoundary prevents flash, refetch runs in background.
            refetchOnWindowFocus: true, // Refetch on tab focus to keep volatile data fresh.
            retry: 1, // Single retry for transient network failures.
          },
          mutations: {
            retry: 0, // Never auto-retry mutations — side effects must not replay silently.
          },
        },
      }),
  );

  const trpcClientRef = useRef(
    trpc.createClient({
      links: [
        // Batches multiple tRPC calls into a single HTTP request.
        // The transformer MUST match the server-side configuration.
        httpBatchLink({
          url: "/api/trpc",
          transformer: superjson,
        }),
      ],
    }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <trpc.Provider
        client={trpcClientRef.current}
        queryClient={queryClient}
      >
        {children}
        {/* sonner Toaster: SSR-safe, richColors enables semantic colors.
            Placed inside provider so toast calls can access the React tree. */}
        <Toaster richColors />
      </trpc.Provider>
    </QueryClientProvider>
  );
}
