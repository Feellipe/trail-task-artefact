# Plan 03 -- Inline Code Commenting

**Objective:** Add inline comments to all 35 source files of the TaskArtefact project. Comments must reference the architectural rationale documented in `R&D_TaskArtefact--02.01.md` and explain non-obvious patterns, design decisions, and runtime behaviors that would not be immediately clear from reading the code alone.

**Reference document:** `docs/R&D/R&D_TaskArtefact--02.01.md` (hereafter referred to as "R&D").

---

## Section A: Server Backend Layer (8 files)

Files that define the data model, data storage, tRPC server initialization, context injection, procedure routing, and the server-side caller. These files form the server-side backbone and contain several non-obvious patterns that justify detailed commenting.

---

### A1. `src/types/task.ts` -- Task interface + 5 Zod schemas

**File description:** Defines the `Task` TypeScript interface and five Zod validation schemas (`taskSchema`, `createTaskInputSchema`, `updateTaskInputSchema`, `deleteTaskInputSchema`, `listTasksInputSchema`) plus the inferred `TaskOutput` type.

**R&D reference sections:** 5.2 (Task entity), 5.3 (Zod schemas), 4.1 (tRPC procedures), 9.3 (input validation and security constraints).

**Comments needed:**

| Location | Comment type | What to document |
|---|---|---|
| Module top | Module-level doc | Purpose of this file: canonical source for the Task data model and all validation contracts shared between client and server. |
| `Task` interface | Inline | Explain that `descricao` is `string \| null` (never `undefined`) for type consistency -- see R&D 5.3 type consistency note. `null` means "no description provided", and the key is always present in the serialized object. |
| `createdAt: string` on `Task` | Inline | Explain that this is an ISO 8601 string, NOT a `Date` object, to prevent hydration mismatches across server/client timezone differences. See R&D 5.2 serialization constraint note. |
| `taskSchema` | Inline | Explain this is the output/validation schema for the Task entity. Used as `.output()` on tRPC procedures to validate server responses. |
| `TaskOutput` type | Inline | Explain that `TaskOutput` is inferred from `taskSchema` via `z.infer` and represents the wire-level type that tRPC guarantees. It should match the `Task` interface structurally but is derived from the schema for type-safety. |
| `createTaskInputSchema` -- `descricao` field | Inline | Explain the `nullable().optional()` chain: `nullable()` allows the value `null`, `optional()` allows the key to be omitted entirely from the request body. This distinction matters for creation where the client may omit the field vs. sending `null` explicitly. See R&D 5.3 type consistency note. |
| `updateTaskInputSchema` -- `descricao` field | Inline | Same `nullable().optional()` explanation as above, plus note that `titulo` is also `.optional()` here because partial updates are supported -- only fields present in the payload are changed. |
| `deleteTaskInputSchema` | Inline | Note that this schema is reused for `getById` procedure input (both accept `{ id: string }` with UUID validation). |
| `listTasksInputSchema` -- `cursor` | Inline | Explain that `cursor` is a base64-encoded ISO 8601 timestamp, not an opaque token. Decoded server-side to filter by `createdAt`. See R&D 11.4 cursor-based pagination. |
| `listTasksInputSchema` -- `limit` | Inline | Explain the default of 10 and max of 100 as performance safeguards (R&D 8.1: DOM and transfer size limits). |

---

### A2. `src/server/store/InMemoryTaskStore.ts` -- Map-based store with cursor pagination

**File description:** A class-based in-memory store using `Map<string, Task>` with CRUD methods and cursor-based pagination. Exported as a singleton via a `globalThis` pattern.

**R&D reference sections:** 5.1 (data repository), 5.4 (ER diagram, O(1) lookup guarantees), 11.4 (cursor-based pagination logic), 6.1 (storage trade-off: in-memory Map chosen over database for prototyping).

**Comments needed:**

| Location | Comment type | What to document |
|---|---|---|
| Module top | Module-level doc | Purpose: volatile in-memory data store for prototyping. Data is lost on server restart. Uses `Map<string, Task>` for O(1) lookups by ID. |
| `class InMemoryTaskStore` | Inline | Explain the choice of `Map` over `Array` -- O(1) for get/set/delete vs. O(n) for `Array.find`. See R&D 5.4 ER diagram and R&D 6.1 storage trade-off. |
| `create()` method -- `crypto.randomUUID()` | Inline | Explain that `crypto.randomUUID()` is a built-in Node.js API (no external dependency). See R&D 6.1 ID generation decision. |
| `create()` method -- `descricao: descricao ?? null` | Inline | Explain the nullish coalescing: normalizes `undefined` to `null` so the field is always consistently `null` (never `undefined`). See R&D 5.3 type consistency note. |
| `create()` method -- `new Date().toISOString()` | Inline | Explain ISO 8601 string usage instead of Date objects. See R&D 5.2 serialization constraint. |
| `list()` method -- cursor decode block | Inline | Explain the base64 decode logic: cursor is a base64-encoded ISO timestamp. Tasks with `createdAt < decoded_timestamp` are returned (descending order). The `try/catch` gracefully handles malformed cursors by returning the first page. See R&D 11.4. |
| `list()` method -- sort | Inline | Explain descending sort by `createdAt` (most recent first) using `localeCompare` on ISO strings (lexicographic sort works correctly for ISO 8601). |
| `list()` method -- `nextCursor` calculation | Inline | Explain that `nextCursor` is `null` when there are no more results (items length < limit). Otherwise it is the base64-encoded `createdAt` of the last item in the current page. This is the cursor the client sends for the next page. |
| `globalThis` singleton block (lines 73-81) | Inline | **Critical non-obvious pattern.** Explain: Turbopack HMR in development creates multiple module instances. Without `globalThis`, the store would be re-instantiated on every HMR refresh, losing all data during development. The pattern stores the instance on `globalThis` in non-production environments only. This was discovered as a runtime bug during development. |
| `process.env.NODE_ENV !== "production"` guard | Inline | Explain that the singleton is only attached to `globalThis` in development. In production, a fresh store is always created (no HMR, no need for singleton persistence). |

---

### A3. `src/server/trpc/init.ts` -- tRPC initialization with superjson + Zod error formatter

**File description:** Initializes the tRPC builder `t` with `Context` typing, SuperJSON transformer, and a custom error formatter that flattens Zod errors for client consumption.

**R&D reference sections:** 4.4 (error formatter), 6.1 (SuperJSON transformer choice), 13.1 (superjson dependency).

**Comments needed:**

| Location | Comment type | What to document |
|---|---|---|
| Module top | Module-level doc | Purpose: central tRPC initialization. Exports the `t` object used to create routers, procedures, and the caller factory. Configures transformer and error formatting for the entire API. |
| `transformer: superjson` | Inline | Explain that SuperJSON must be configured on BOTH server (here) and client (in TRPCProvider) to enable serialization of complex types (Date, Map, Set, etc.) across the wire. See R&D 6.1 SuperJSON note. Without matching transformers, the client would receive malformed data. |
| `errorFormatter` function | Inline | Explain the purpose: when Zod validation fails (BAD_REQUEST), the error formatter flattens the Zod error tree into `{ fieldErrors: { fieldName: ["message"] } }` format for easy client consumption. The `zodError` field is attached to `shape.data` so the client can access `error.data.zodError.fieldErrors`. See R&D 4.4. |
| `error.code === "BAD_REQUEST" && error.cause instanceof ZodError` guard | Inline | Explain that the formatter only flattens Zod errors for BAD_REQUEST codes. Other error types (NOT_FOUND, INTERNAL_SERVER_ERROR) receive the default shape with `zodError: null`. This prevents attempting to flatten non-Zod errors. |

---

### A4. `src/server/trpc/context.ts` -- Context factory injecting store

**File description:** Exports `createTRPCContext()` which returns `{ store: inMemoryTaskStore }` and the derived `Context` type.

**R&D reference sections:** 6.2 (tRPC Context as Dependency Injection pattern), 2.1 (component diagram showing context injection).

**Comments needed:**

| Location | Comment type | What to document |
|---|---|---|
| Module top | Module-level doc | Purpose: Dependency Injection container for tRPC procedures. Currently injects the InMemoryTaskStore. This is the extension point for future additions (auth, session, request-scoped data). See R&D 6.2 "tRPC Context (Dependency Injection)". |
| `createTRPCContext()` function | Inline | Explain that this function is called per-request by the tRPC handler (via `createContext: createTRPCContext` in route.ts) and also by the server-side caller in `caller.ts`. The store is a singleton shared across all requests. |
| `export type Context` | Inline | Explain that the Context type is inferred from the return type of `createTRPCContext()` rather than manually defined. This ensures the type stays in sync with the actual context shape. The type is consumed by `init.ts` via `t.context<Context>()`. |

---

### A5. `src/server/trpc/routers/taskRouter.ts` -- 6 CRUD + seed procedures

**File description:** Defines the `taskRouter` with six tRPC procedures: `create`, `list`, `update`, `delete`, `seed`, and `getById`.

**R&D reference sections:** 4.1 (procedure table), 4.2 (contract model), 4.5 (automatic vs. manual validation), 3.3/3.4/3.5 (creation, update, deletion sequence diagrams), 9.3 (input validation constraints).

**Comments needed:**

| Location | Comment type | What to document |
|---|---|---|
| Module top | Module-level doc | Purpose: tRPC procedure definitions for task CRUD operations. Each procedure declares input schema, output schema, and handler. Input validation is automatic via Zod middleware; business logic errors (NOT_FOUND) are thrown manually. See R&D 4.1 and 4.5. |
| `create` procedure | Inline | Explain the flow: Zod validates input automatically -> handler calls `ctx.store.create()` -> store generates UUID and ISO timestamp -> returns validated Task. See R&D 3.3. |
| `list` procedure -- output schema | Inline | Explain that the output schema explicitly defines `{ items: taskSchema.array(), nextCursor: z.string().nullable() }` to guarantee the contract. `nextCursor` is `null` when no more pages exist. |
| `update` procedure -- NOT_FOUND check | Inline | Explain the manual existence check pattern: `getById` first, throw `TRPCError({ code: "NOT_FOUND" })` if absent, then proceed with update. This is a business logic error, not a Zod validation error. See R&D 4.5 "Manual (business logic)". |
| `update` procedure -- `const { id, ...data } = input` | Inline | Explain the destructuring: `id` is separated from the update payload because `store.update()` takes `(id, data)` where `data` contains only the fields to update. |
| `update` procedure -- `return updated!` | Inline | Explain the non-null assertion: after the existence check above, TypeScript still thinks `updated` could be `undefined`. The `!` is safe because we already verified the task exists. |
| `delete` procedure -- NOT_FOUND check | Inline | Same manual existence check pattern as update. Throws before attempting `Map.delete()`. |
| `seed` procedure | Inline | Explain this is a development-only utility for populating test data. Accepts `count` (1-500, default 100). Not documented in the public API contract. |
| `getById` procedure -- reuses `deleteTaskInputSchema` | Inline | Note that `getById` reuses `deleteTaskInputSchema` since both accept `{ id: string }` with UUID validation. This is intentional schema reuse to avoid a separate `getByIdInputSchema` that would be identical. |

---

### A6. `src/server/trpc/routers/_app.ts` -- Merged root router + AppRouter type

**File description:** Merges `taskRouter` under the `"task"` prefix and exports the `AppRouter` type for client-side type inference.

**R&D reference sections:** 4.2 (tRPC contract model showing the router tree), 6.2 (separation of concerns: router / store / schema).

**Comments needed:**

| Location | Comment type | What to document |
|---|---|---|
| Module top | Module-level doc | Purpose: root router that merges all sub-routers. Currently only `taskRouter` under the `"task"` prefix. New routers (e.g., `userRouter`) would be added here. See R&D 4.2 contract model. |
| `export type AppRouter` | Inline | **Critical for type safety.** Explain that `AppRouter` is the single source of truth for the entire API type. The client (`src/lib/trpc/client.ts`) imports this type to get end-to-end type inference via `createTRPCReact<AppRouter>()`. This is how tRPC achieves type safety without code generation -- the type flows from server to client through the shared TypeScript project. |

---

### A7. `src/server/trpc/caller.ts` -- Server-side caller via createCallerFactory

**File description:** Creates a server-side tRPC caller using `createCallerFactory` that Server Components use to invoke procedures directly without HTTP.

**R&D reference sections:** 6.1 (server-side tRPC caller decision), 6.2 (Server-Side tRPC Caller pattern), 3.1 (SSR listing flow showing caller usage).

**Comments needed:**

| Location | Comment type | What to document |
|---|---|---|
| Module top | Module-level doc | Purpose: enables Server Components to call tRPC procedures directly on the server, bypassing HTTP. Used by `page.tsx` (listing) and `edit/page.tsx` (edit) for SSR data fetching. See R&D 6.2 "Server-Side tRPC Caller". |
| `createCallerFactory(appRouter)` | Inline | Explain that `createCallerFactory` receives the merged root router and returns a factory function. The factory takes a context object and returns a fully typed caller. |
| `createServerCaller()` -- `createCaller(createTRPCContext())` | Inline | Explain that the caller receives a fresh context per invocation (with the injected store singleton). The caller respects all tRPC middleware, validation, and error formatting -- it is functionally equivalent to an HTTP request but without the network overhead. |

---

### A8. `src/app/api/trpc/[trpc]/route.ts` -- fetchRequestHandler

**File description:** Next.js App Router route handler that bridges incoming HTTP requests to the tRPC server using `fetchRequestHandler`.

**R&D reference sections:** 2.2 (high-level architecture showing the handler), 4.1 (tRPC procedures), 13.1 (core dependencies).

**Comments needed:**

| Location | Comment type | What to document |
|---|---|---|
| Module top | Module-level doc | Purpose: Next.js App Router catch-all route handler for tRPC. All requests to `/api/trpc/*` are handled here. Uses the fetch-based adapter compatible with Next.js 15 App Router. |
| `fetchRequestHandler` configuration | Inline | Explain the three key config options: `endpoint: "/api/trpc"` must match the client-side `httpBatchLink` URL; `router: appRouter` is the merged root router; `createContext: createTRPCContext` is the context factory called per-request. |
| `export { handler as GET, handler as POST }` | Inline | Explain that both GET (for queries) and POST (for mutations and batched requests) are handled by the same tRPC handler. tRPC uses POST for mutations and batched queries, and GET for individual query requests. |

---

## Section B: tRPC Client Infrastructure + Provider + Hooks (6 files)

Files that configure the tRPC client, React Query provider, and custom hooks. These files bridge the server and the UI and contain critical patterns for cache stability, infinite scroll, and form state management.

---

### B1. `src/lib/trpc/client.ts` -- createTRPCReact client

**File description:** Creates and exports the typed tRPC React client using `createTRPCReact<AppRouter>()`.

**R&D reference sections:** 6.1 (tRPC client decision), 4.2 (contract model), 2.3 (component catalog -- tRPC Client).

**Comments needed:**

| Location | Comment type | What to document |
|---|---|---|
| Module top | Module-level doc | Purpose: typed tRPC React hooks factory. The `trpc` object provides typed hooks (e.g., `trpc.task.list.useInfiniteQuery`, `trpc.task.create.useMutation`) with full end-to-end type inference. |
| `createTRPCReact<AppRouter>()` | Inline | Explain that importing `AppRouter` from the server-side router gives the client full knowledge of all procedures, their input/output types, and whether they are queries or mutations. This is tRPC's core value proposition: type safety without code generation. See R&D 6.1 "API Communication" trade-off. |

---

### B2. `src/lib/utils.ts` -- cn() helper

**File description:** Utility function combining `clsx` and `tailwind-merge` for conditional class name merging.

**R&D reference sections:** 14 (folder structure -- shared utilities).

**Comments needed:**

| Location | Comment type | What to document |
|---|---|---|
| Module top | Module-level doc | Purpose: utility for merging Tailwind CSS classes. `clsx` handles conditional classes; `twMerge` resolves Tailwind class conflicts (e.g., `cn("p-4", "p-6")` results in `"p-6"`). Standard shadcn/ui pattern. |

---

### B3. `src/components/providers/TRPCProvider.tsx` -- QueryClient + httpBatchLink + Toaster

**File description:** Client component that wraps the application with `QueryClientProvider`, tRPC provider, and sonner `Toaster`.

**R&D reference sections:** 8.3 (React Query cache configuration), 6.1 (stable QueryClient via useRef decision -- note: actual implementation uses `useState` with initializer), 12.7 (toast architecture), 6.2 (Hydration-Resistant State pattern), 13.1 (superjson dependency).

**Comments needed:**

| Location | Comment type | What to document |
|---|---|---|
| Module top | Module-level doc | Purpose: root client provider that sets up React Query cache, tRPC client with HTTP batch link, and the toast notification system. This component MUST be a Client Component because it uses React hooks and manages client-side state. |
| `const [queryClient] = useState(() => new QueryClient({...}))` | Inline | **Non-obvious pattern.** Explain that `useState` with an initializer function is used instead of `useRef` or module-level to create a stable `QueryClient` instance that persists across re-renders but is unique per request in SSR. The initializer function runs only once. If a module-level `QueryClient` were used, all users would share the same cache. See R&D 6.2 "Hydration-Resistant State" and R&D 7.1 "QueryClient Stability" failure point. |
| `staleTime: 0` | Inline | Explain that `staleTime: 0` means data is immediately considered stale. Since the data source is volatile (in-memory store), the client always refetches on mount to get the latest state. The SSR data from `HydrationBoundary` prevents a flash because the initial render uses server data, and refetching happens silently in the background. See R&D 8.3 SSR hydration note. |
| `refetchOnWindowFocus: true` | Inline | Explain: when the browser tab regains focus, React Query refetches stale queries. Appropriate for a task management app where data may have changed in another tab or session. |
| `retry: 1` (queries) | Inline | Single retry for transient network failures. See R&D 7.3 retry strategy table. |
| `retry: 0` (mutations) | Inline | Mutations are never retried automatically because they have side effects (create, update, delete). The user must manually retry after seeing the error toast. See R&D 7.3. |
| `trpcClientRef = useRef(...)` | Inline | Explain that the tRPC client is stored in `useRef` for stability. It does not need to be recreated on re-render since its configuration (`httpBatchLink` URL, transformer) is static. |
| `httpBatchLink({ url: "/api/trpc", transformer: superjson })` | Inline | Explain that `httpBatchLink` batches multiple tRPC calls into a single HTTP request for performance. The `transformer: superjson` must match the server-side transformer in `init.ts`. See R&D 6.1 SuperJSON note. Mismatch causes deserialization errors. |
| `<Toaster richColors />` | Inline | Explain that sonner's `Toaster` is placed inside the tRPC Provider (not at layout level) because it needs access to the React tree. `richColors` enables semantic color variants (green for success, red for error). See R&D 12.7 toast architecture. SSR-safe mounting is handled by sonner internally -- no additional `useEffect` or `mounted` guard needed. |

---

### B4. `src/hooks/useInfiniteScroll.ts` -- IntersectionObserver wrapper

**File description:** Custom hook that connects a sentinel element to an `IntersectionObserver` to trigger `fetchNextPage` when the user scrolls near the bottom of the list.

**R&D reference sections:** 11.2 (infinite scroll flow), 11.3 (infinite scroll components table), 11.5 (virtualization path).

**Comments needed:**

| Location | Comment type | What to document |
|---|---|---|
| Module top | Module-level doc | Purpose: reusable hook that wraps the IntersectionObserver API for infinite scroll. Triggers `onIntersect` (which calls `fetchNextPage`) when the sentinel element enters the viewport. See R&D 11.2 and 11.3. |
| `rootMargin: "200px"` | Inline | Explain that the observer triggers 200px before the sentinel actually enters the viewport, providing a preload buffer so the next page starts loading before the user reaches the bottom. This reduces perceived loading time. |
| `threshold: 0` | Inline | Explain that `threshold: 0` means the callback fires as soon as even a single pixel of the sentinel is visible (with the rootMargin buffer). |
| Guard conditions in observer callback | Inline | Explain the three guards: (1) `entry.isIntersecting` -- the element is entering the viewport; (2) `hasNextPage` -- there are more pages to load; (3) `!isFetchingNextPage` -- prevents duplicate requests while a fetch is in progress. |
| `return () => observer.disconnect()` | Inline | Cleanup: disconnect the observer on unmount or when dependencies change to prevent memory leaks and stale observers. |

---

### B5. `src/hooks/useTaskForm.ts` -- Form state management

**File description:** Custom hook that encapsulates form state, client-side Zod validation, mutation calls, and error handling for the create/edit task form.

**R&D reference sections:** 12.4 (form management), 4.4 (error formatter, zodError flattening), 4.5 (automatic vs. manual validation), 6.1 (form state decision: useState chosen over React Hook Form for simplicity).

**Comments needed:**

| Location | Comment type | What to document |
|---|---|---|
| Module top | Module-level doc | Purpose: encapsulates all form logic (state, validation, mutation) for task creation and editing. Dual-mode: when `initialTask` is provided, operates in edit mode; otherwise in create mode. See R&D 12.4. |
| `descricao: descricao \|\| null` in payload | Inline | Explain that an empty string is converted to `null` before sending to the server. This ensures `descricao` is consistently `null` (not `""`) when the user leaves the field empty. See R&D 5.3 type consistency note. |
| `safeParse` (client-side validation) | Inline | Explain the two-layer validation: client-side `safeParse` catches errors before the network request; server-side Zod validation (in tRPC middleware) catches anything the client missed. See R&D 12.4 validation flow (3 layers). |
| `mapFieldErrors` function | Inline | Explain that this maps the Zod flattened error structure (`{ fieldName: ["message"] }`) to the component's `{ fieldName?: "message" }` format by taking only the first error message per field. |
| Error catch block -- `err.data?.zodError?.fieldErrors` | Inline | Explain that server-side Zod errors are returned via the custom error formatter (R&D 4.4). The `zodError` property on `error.data` contains the flattened field errors. This handles the case where server validation catches something client validation missed. |
| `toast.success` / `toast.error` calls | Inline | Explain that feedback is provided via sonner toasts (not inline messages for success). The toast appears in the top-right corner. See R&D 12.6 loading states and visual feedback table. |
| `onSuccess()` callback | Inline | Explain that the parent component provides `onSuccess` (typically `router.push("/")`) to navigate back to the listing after successful creation/update. |

---

### B6. `src/app/globals.css` -- Tailwind imports + CSS variables + keyframes

**File description:** Global CSS file with Tailwind v4 import, CSS custom properties for theming, dark mode media query, and base body styling.

**R&D reference sections:** 13.2 (tailwindcss dependency), 14 (folder structure).

**Comments needed:**

| Location | Comment type | What to document |
|---|---|---|
| Module top | Module-level doc | Purpose: global styles imported by the root layout. Uses Tailwind v4 `@import` syntax. |
| `@import "tailwindcss"` | Inline | Tailwind v4 import syntax (replaces the v3 `@tailwind base/components/utilities` directives). |
| `@theme inline` block | Inline | Explain that `@theme inline` registers custom CSS variables as Tailwind theme values, making them available as utility classes (e.g., `text-foreground`, `bg-background`, `font-sans`). |
| `--font-geist-sans` / `--font-geist-mono` references | Inline | These variables are set by the `Geist` and `Geist_Mono` font loaders in `layout.tsx` via the `variable` prop. The CSS connects them to Tailwind's theme system. |
| `prefers-color-scheme: dark` block | Inline | Dark mode support via media query. Overrides `--background` and `--foreground` for dark color scheme. |
| `body { font-family: Arial, Helvetica, sans-serif; }` | Inline | Fallback font stack. The Geist variable font (set via `font-sans` in the theme) takes precedence when loaded, but Arial/Helvetica provides a safe fallback during initial render. |

---

## Section C: Client Components -- Task UI + Shared UI (9 files)

Files that implement the interactive client-side UI: infinite scroll task list, task cards, date display, forms, delete button, skeleton loaders, spinner, and error display.

---

### C1. `src/components/task/TaskList.tsx` -- Infinite scroll listing

**File description:** Client component that renders the task list using `useInfiniteQuery`, `IntersectionObserver` via `useInfiniteScroll`, and includes a dev-only seed button.

**R&D reference sections:** 11.1 (infinite scroll overview), 11.2 (infinite scroll flow), 11.3 (components), 3.1 (task listing sequence), 12.2 (RSC boundary map), 8.1 (performance -- max 50 pages / 500 items).

**Comments needed:**

| Location | Comment type | What to document |
|---|---|---|
| Module top | Module-level doc | Purpose: main task listing component with infinite scroll. Uses `useInfiniteQuery` for cursor-based pagination and `useInfiniteScroll` hook for triggering page loads. Client Component because it uses hooks, state, and event handlers. See R&D 12.2. |
| `MAX_PAGES = 50` constant | Inline | Explain the page limit guard: caps the DOM at 500 items (50 pages x 10 items) to prevent unbounded DOM growth and performance degradation. See R&D 8.1 "Max DOM Nodes" and R&D 11.3 "Page Limit Guard". |
| `trpc.task.list.useInfiniteQuery(...)` -- `limit: 10` | Inline | Explain that the query input is `{ limit: 10 }`. Note that tRPC v11 reserves `cursor` and `direction` as `ReservedInfiniteQueryKeys` that get stripped from the query key automatically. The cursor is managed by React Query via `getNextPageParam` and `initialCursor`, not passed as explicit input. |
| `getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined` | Inline | Explain that `getNextPageParam` extracts the cursor from the last server response. Returning `undefined` signals "no more pages" to React Query. |
| `initialCursor: undefined` | Inline | tRPC v11 option that sets the initial cursor value before the first fetch. `undefined` means "start from the beginning". |
| `reachedMaxPages` calculation | Inline | Explain that this is a client-side guard independent of `hasNextPage`. Even if the server has more data, the client stops fetching after 50 pages. Displays "End of available history" message. |
| `useInfiniteScroll({ ... })` call | Inline | Explain that `hasNextPage` passed to the hook is gated by `!reachedMaxPages` to prevent the observer from triggering beyond the 50-page limit. |
| `tasks = data?.pages.flatMap((page) => page.items) ?? []` | Inline | Explain that `useInfiniteQuery` returns an array of pages, each containing `{ items, nextCursor }`. `flatMap` merges all pages into a single task array. |
| `seedMutation` -- `process.env.NODE_ENV === "development"` | Inline | Explain that the seed button is only rendered in development mode. This populates the store with test data for manual testing of infinite scroll. |
| `<div ref={sentinelRef} />` | Inline | Explain this is the invisible sentinel element observed by the IntersectionObserver. When it enters the viewport (with 200px rootMargin), the next page is fetched. See R&D 11.3 "Sentinel Element". |

---

### C2. `src/components/task/TaskCard.tsx` -- Card with delete mutation

**File description:** Client component that renders a single task card with title, description, date, edit link, and delete button.

**R&D reference sections:** 12.2 (RSC boundary map), 3.5 (deletion flow), 6.2 (optimistic updates).

**Comments needed:**

| Location | Comment type | What to document |
|---|---|---|
| Module top | Module-level doc | Purpose: renders a single task card. Displays title, optional description, creation date (formatted in local timezone via `TaskCardDate`), edit link, and delete button. Client Component because it contains interactive child components (`DeleteTaskButton`). |
| `"use client"` directive | Inline | Note: despite the card itself being mostly presentational, it is marked as a Client Component because it renders `DeleteTaskButton` which is a Client Component with mutations. In the R&D boundary map (12.2), TaskCard was originally documented as a Server Component, but the implementation requires Client Component status due to the animated delete flow. |
| `task.descricao && (...)` conditional | Inline | Explain that JSX conditional rendering is used (not `task.descricao ?? "No description"`) because `null` values should not display any fallback text. Empty descriptions are simply omitted. |

---

### C3. `src/components/task/TaskCardDate.tsx` -- Date formatting in local timezone

**File description:** Client component that converts the ISO 8601 `createdAt` string to the user's local timezone and displays it.

**R&D reference sections:** 5.2 (serialization constraint -- ISO strings, not Date objects), 6.2 (JSON-Serializable Props Constraint), 12.2 (RSC boundary map -- Client Component to prevent hydration mismatch).

**Comments needed:**

| Location | Comment type | What to document |
|---|---|---|
| Module top | Module-level doc | Purpose: displays the task creation date in the user's local timezone. This is a dedicated Client Component because `toLocaleDateString()` and `toLocaleTimeString()` produce timezone-dependent output that would cause hydration mismatches if rendered on the server. |
| `new Date(createdAt)` | Inline | Explain that the ISO 8601 string received as a prop is converted to a `Date` object HERE in the Client Component, not on the server. This is the key to avoiding hydration mismatches: the server never produces timezone-dependent output. See R&D 5.2 serialization constraint. |
| `<time>` element | Inline | Semantic HTML `<time>` element for accessibility and machine readability. |

---

### C4. `src/components/task/TaskForm.tsx` -- Dual-mode create/edit form

**File description:** Client component that renders the task creation/editing form. Operates in dual mode: create when `initialTask` is omitted, edit when provided.

**R&D reference sections:** 12.4 (form management), 3.3 (creation flow), 3.4 (update flow), 6.1 (form state decision: useState), 12.6 (loading states -- disabled button + spinner during submission).

**Comments needed:**

| Location | Comment type | What to document |
|---|---|---|
| Module top | Module-level doc | Purpose: dual-mode form for creating and editing tasks. Delegates all logic to the `useTaskForm` hook. The form itself is purely presentational. Client Component because it uses `useRouter`, state, and event handlers. |
| `initialTask?: Task` prop | Inline | Explain that when `initialTask` is provided (from the edit page's Server Component), the form pre-fills with existing data. When omitted (from the create page), the form starts empty. The prop is JSON-serializable (Task interface contains only `string` and `string \| null`). See R&D 12.3 serializable props constraint. |
| `onSuccess: () => router.push("/")` | Inline | Explain navigation strategy: after successful mutation, the user is redirected to the listing page. The listing will refetch data because `staleTime: 0` (configured in TRPCProvider). |
| `disabled={isSubmitting}` on submit button | Inline | Explain: prevents duplicate submissions from multiple clicks while the mutation is in progress. See R&D 7.1 "Form Submission" failure point. |

---

### C5. `src/components/task/DeleteTaskButton.tsx` -- Modal + optimistic delete

**File description:** Client component with a delete button, confirmation modal, and optimistic update logic for immediate visual feedback on deletion.

**R&D reference sections:** 3.5 (deletion sequence diagram), 3.6 (deletion step table), 6.2 (optimistic updates pattern), 7.1 (failure points), 12.7 (toast architecture).

**Comments needed:**

| Location | Comment type | What to document |
|---|---|---|
| Module top | Module-level doc | Purpose: delete button with confirmation modal and optimistic update. The mutation uses React Query's `onMutate`/`onError`/`onSettled` lifecycle to provide instant visual feedback (card disappears immediately) with rollback on failure. See R&D 3.5 and 6.2 "Optimistic Updates". |
| `trpc.useUtils()` | Inline | Explain that `useUtils()` provides access to the React Query utility methods for the tRPC client, including `cancel()`, `getInfiniteData()`, `setInfiniteData()`, and `invalidate()`. These are used to manipulate the cache during the optimistic update. |
| `onMutate` callback -- cache cancellation | Inline | **Critical optimistic update step.** Explain that `await utils.task.list.cancel()` cancels any in-flight refetch queries. This prevents the server response from overwriting the optimistic cache update with stale data. |
| `onMutate` -- snapshot | Inline | Explain that `getInfiniteData()` captures the current cache state before modification. This snapshot is returned as context so `onError` can restore it if the mutation fails. |
| `onMutate` -- `setInfiniteData` with filter | Inline | Explain that `setInfiniteData` iterates over all cached pages and removes the deleted task from each page's `items` array using `filter`. This is what makes the card disappear instantly from the UI before the server confirms. |
| `onError` -- `setInfiniteData` with snapshot | Inline | Explain the rollback: if the server returns an error (e.g., NOT_FOUND, network failure), the cache is restored from the snapshot captured in `onMutate`. The card reappears in the list. A toast informs the user. See R&D 3.6 step 7. |
| `onSettled` -- `invalidate()` | Inline | Explain that after the mutation completes (success or error), the list cache is invalidated. This triggers a background refetch to synchronize the client cache with the actual server state. See R&D 3.6 step 8. |
| `onSuccess` -- toast | Inline | Success feedback via sonner toast. |
| Escape key handler (`useEffect`) | Inline | Explain the accessibility pattern: pressing Escape closes the confirmation modal. The `useEffect` attaches the listener only when the modal is open (`isOpen`) and cleans up on close. |
| Modal overlay `onClick={() => setIsOpen(false)}` | Inline | Explain the click-outside-to-close pattern: clicking the backdrop (overlay `div`) closes the modal. `e.stopPropagation()` on the modal content prevents clicks inside the modal from bubbling up and closing it. |

---

### C6. `src/components/task/TaskListSkeleton.tsx` -- Skeleton loader (list)

**File description:** Server Component that renders a skeleton placeholder for the task list during streaming SSR.

**R&D reference sections:** 12.6 (loading states -- skeleton UI), 7.2 (error boundary coverage map), 3.1 (streaming SSR flow -- loading.tsx renders skeleton immediately).

**Comments needed:**

| Location | Comment type | What to document |
|---|---|---|
| Module top | Module-level doc | Purpose: skeleton loader displayed by `loading.tsx` during streaming SSR. Renders 4 animated placeholder cards that match the visual structure of `TaskCard`. No `"use client"` directive needed -- this is a Server Component. See R&D 12.6. |
| `Array.from({ length: 4 })` | Inline | Explain: renders 4 skeleton cards as a reasonable preview of the actual list size (default page is 10 items, 4 skeletons provide visual feedback without excessive space). |

---

### C7. `src/components/task/TaskFormSkeleton.tsx` -- Skeleton loader (form)

**File description:** Server Component that renders a skeleton placeholder for the task form during streaming SSR.

**R&D reference sections:** 12.6 (loading states), 7.2 (error boundary coverage map).

**Comments needed:**

| Location | Comment type | What to document |
|---|---|---|
| Module top | Module-level doc | Purpose: skeleton loader for the form, displayed by `loading.tsx` files in the `tasks/new` and `tasks/[id]/edit` routes during streaming SSR. Mimics the layout of the actual form (heading, input, textarea, button). |

---

### C8. `src/components/ui/Spinner.tsx` -- Loading indicator

**File description:** SVG-based spinner component with CSS `animate-spin` animation.

**R&D reference sections:** 12.6 (loading states -- spinner during mutation and infinite scroll), 12.2 (RSC boundary map -- Server Component compatible).

**Comments needed:**

| Location | Comment type | What to document |
|---|---|---|
| Module top | Module-level doc | Purpose: reusable SVG loading spinner. Uses `animate-spin` (Tailwind utility) for rotation. Compatible with both Server and Client Components (no hooks, no state). Accepts `className` for sizing and color customization. |

---

### C9. `src/components/ui/ErrorMessage.tsx` -- Error + retry

**File description:** Client component that displays an error message with an optional retry button.

**R&D reference sections:** 12.5 (error handling -- query error layer), 7.4 (error handling layers table -- "tRPC Query" row), 12.6 (visual feedback table -- query error).

**Comments needed:**

| Location | Comment type | What to document |
|---|---|---|
| Module top | Module-level doc | Purpose: inline error display with optional retry button. Used by `TaskList` when `useInfiniteQuery` returns an error state. Client Component because the retry button requires an `onClick` handler. See R&D 12.5 and 7.4. |
| `onRetry` callback | Inline | Explain that `onRetry` typically calls `refetch()` from React Query, which re-executes the failed query. The button is only rendered when `onRetry` is provided. |

---

## Section D: App Router Pages and Layouts (12 files)

Files in the `src/app/` directory that define Next.js App Router pages, layouts, error boundaries, loading states, and the catch-all route. These files are the routing backbone and contain key patterns like SSR prefetch with HydrationBoundary, async params, and multi-layer error handling.

---

### D1. `src/app/layout.tsx` -- Root layout

**File description:** Root layout that wraps the entire application with font loaders, TRPCProvider, and imports global CSS.

**R&D reference sections:** 2.2 (high-level architecture), 12.7 (toast architecture -- Toaster placement), 12.2 (RSC boundary map -- Server Component).

**Comments needed:**

| Location | Comment type | What to document |
|---|---|---|
| Module top | Module-level doc | Purpose: root layout for the entire application. Server Component that wraps all pages with font loading (Geist), TRPCProvider (React Query + tRPC), and global CSS. See R&D 2.2 and 12.2. |
| `Geist` / `Geist_Mono` font loaders | Inline | Explain that Next.js font loaders (`next/font/google`) optimize font loading by self-hosting, eliminating external network requests. The `variable` prop sets CSS custom properties (`--font-geist-sans`, `--font-geist-mono`) used in `globals.css` via the `@theme inline` block. |
| `<TRPCProvider>` wrapping | Inline | Explain that the provider wraps `{children}` so all pages and components have access to the tRPC client and React Query. The sonner `<Toaster>` is inside TRPCProvider. See R&D 12.7. |

---

### D2. `src/app/page.tsx` -- SSR prefetch + HydrationBoundary

**File description:** Server Component that is the root page (`/`). Creates a server-side tRPC caller, prefetches the first page of tasks, and wraps the client `TaskList` in a `HydrationBoundary` for SSR.

**R&D reference sections:** 3.1 (task listing sequence), 3.2 (step table), 6.2 (Server-Side tRPC Caller, Hydration-Resistant State, Streaming SSR), 12.1 (SSR strategy), 12.2 (RSC boundary map).

**Comments needed:**

| Location | Comment type | What to document |
|---|---|---|
| Module top | Module-level doc | Purpose: root page (`/`) -- Server Component that prefetches the first page of tasks on the server and streams HTML to the client with pre-populated React Query cache via HydrationBoundary. See R&D 3.1 and 12.1. |
| `async function Home()` | Inline | Explain that this is an `async` Server Component. It can perform async operations (server-side data fetching) because it runs only on the server. No `"use client"` directive. |
| `createServerCaller()` | Inline | Explain that the server-side caller bypasses HTTP entirely. It invokes tRPC procedures directly with the injected context. See R&D 6.2 "Server-Side tRPC Caller". |
| `new QueryClient()` (server-side) | Inline | **Non-obvious.** Explain that this QueryClient is created fresh on every server request (not shared). It is used ONLY for `prefetchInfiniteQuery` and `dehydrate` -- it is never sent to the client. The client gets its own QueryClient from TRPCProvider. |
| `queryKey` array structure | Inline | Explain the tRPC v11 query key format: `[["task", "list"], { input: { limit: 10 }, type: "infinite" }]`. This must match exactly what `useInfiniteQuery` generates on the client for the hydrated data to be recognized. Note that `cursor` and `direction` are NOT in the query key because tRPC v11 strips them as `ReservedInfiniteQueryKeys`. |
| `initialPageParam: undefined` | Inline | Explain that `initialPageParam` is the initial cursor value before the first page fetch. `undefined` means "no cursor" (start from the beginning). This is required by `prefetchInfiniteQuery` in TanStack Query v5. |
| `getNextPageParam` | Inline | Explain that this function extracts the next cursor from the server response. It must match the function used in the client-side `useInfiniteQuery` call in `TaskList.tsx`. |
| `<HydrationBoundary state={dehydrate(queryClient)}>` | Inline | **Critical SSR pattern.** Explain: `dehydrate(queryClient)` serializes the prefetched React Query cache into a plain JavaScript object. `HydrationBoundary` injects this state into the client-side React Query cache on mount, preventing the client from re-fetching data that was already fetched on the server. See R&D 6.2 "Hydration-Resistant State". |

---

### D3. `src/app/loading.tsx` -- Root Suspense fallback

**File description:** Renders `TaskListSkeleton` as the Suspense fallback for the root page during streaming SSR.

**R&D reference sections:** 7.2 (error boundary coverage map), 12.6 (loading states -- streaming SSR skeleton), 3.1 (step 2: skeleton UI streams immediately).

**Comments needed:**

| Location | Comment type | What to document |
|---|---|---|
| Module top | Module-level doc | Purpose: Next.js convention file. Automatically used as the Suspense fallback for the root route segment. Renders immediately while `page.tsx` performs server-side data fetching. See R&D 3.1 step 2. |

---

### D4. `src/app/error.tsx` -- Route error boundary

**File description:** Client Component that catches errors in the root route segment.

**R&D reference sections:** 7.2 (error boundary coverage map), 7.4 (error handling layers -- route segment), 12.5 (error handling -- route level).

**Comments needed:**

| Location | Comment type | What to document |
|---|---|---|
| Module top | Module-level doc | Purpose: Next.js convention file. Error boundary for the root route segment. Catches unexpected errors during rendering or data fetching. Client Component (required by Next.js for error boundaries). See R&D 7.2 and 7.4. |
| `"use client"` directive | Inline | Mandatory: Next.js error boundary files must be Client Components because they use React's error boundary mechanism, which requires client-side hooks (`reset`). |
| `reset()` function | Inline | Explain that `reset()` re-renders the route segment by clearing the error state. The user can retry the failed operation. |

---

### D5. `src/app/global-error.tsx` -- Root layout error boundary

**File description:** Client Component that catches errors in the root layout itself. Contains its own `<html>` and `<body>` tags.

**R&D reference sections:** 7.1 (failure points -- root layout), 7.2 (error boundary coverage map), 7.3 (retry strategies -- root layout crash recovery), 7.4 (error handling layers -- root layout).

**Comments needed:**

| Location | Comment type | What to document |
|---|---|---|
| Module top | Module-level doc | Purpose: Next.js convention file. Catches errors in the root layout (e.g., TRPCProvider initialization failure). Must include its own `<html>` and `<body>` tags because the root layout's HTML shell is unusable when this boundary activates. See R&D 7.1 and 7.2. |
| Own `<html>` and `<body>` tags | Inline | **Non-obvious requirement.** Explain that `global-error.tsx` replaces the entire document when triggered. Since the root layout (which normally provides `<html>`/`<body>`) has crashed, this file must provide its own. Without these tags, the page would render invalid HTML. See R&D 7.1 "Root Layout" failure point. |

---

### D6. `src/app/not-found.tsx` -- 404

**File description:** Server Component that displays the 404 page for unmatched routes.

**R&D reference sections:** 7.3 (retry strategies -- page not found), 7.4 (error handling layers).

**Comments needed:**

| Location | Comment type | What to document |
|---|---|---|
| Module top | Module-level doc | Purpose: Next.js convention file. Renders when a user navigates to a route that does not match any defined page. Server Component (no interactivity needed beyond the Link). See R&D 7.3. |

---

### D7. `src/app/tasks/new/page.tsx` -- Create task page

**File description:** Client Component page that renders the `TaskForm` without initial data (create mode).

**R&D reference sections:** 3.3 (creation flow), 12.1 (SSR strategy -- Client Component, no server data needed), 12.2 (RSC boundary map).

**Comments needed:**

| Location | Comment type | What to document |
|---|---|---|
| Module top | Module-level doc | Purpose: task creation page at `/tasks/new`. Client Component because the form uses `useState`, `useRouter`, and tRPC mutations. No server-side data prefetching is needed for a blank form. See R&D 12.1. |
| `<TaskForm />` without `initialTask` | Inline | Explain that omitting `initialTask` puts the form in create mode (empty fields, calls `task.create` mutation). |

---

### D8. `src/app/tasks/new/loading.tsx` -- Create Suspense fallback

**File description:** Renders `TaskFormSkeleton` as the Suspense fallback for the create page.

**R&D reference sections:** 7.2 (error boundary coverage map), 12.6 (loading states).

**Comments needed:**

| Location | Comment type | What to document |
|---|---|---|
| Module top | Module-level doc | Purpose: Suspense fallback for the `/tasks/new` route segment. See R&D 7.2 and 12.6. |

---

### D9. `src/app/tasks/[id]/edit/page.tsx` -- Edit page (async params)

**File description:** Server Component that fetches task data on the server and passes it as serializable props to the client-side `TaskForm`.

**R&D reference sections:** 3.4 (update flow sequence), 12.1 (SSR strategy -- edit page), 12.8 (Next.js 15 async params), 12.3 (serializable props constraint), 6.2 (JSON-Serializable Props Constraint).

**Comments needed:**

| Location | Comment type | What to document |
|---|---|---|
| Module top | Module-level doc | Purpose: task edit page at `/tasks/[id]/edit`. Server Component that fetches the task on the server via the tRPC caller and passes it as a JSON-serializable prop to the client-side TaskForm. See R&D 3.4 and 12.1. |
| `type Props = { params: Promise<{ id: string }> }` | Inline | **Next.js 15 breaking change.** Explain that in Next.js 15, `params` is a `Promise` that must be awaited. This is a breaking change from Next.js 14 where `params` was a synchronous object. See R&D 12.8. |
| `const { id } = await params` | Inline | Explain: awaiting the `params` Promise destructures the route parameters. The `id` comes from the dynamic route segment `[id]`. |
| `caller.task.getById({ id })` | Inline | Explain: server-side data fetch using the tRPC caller. The task data is fetched before the page renders, ensuring the form is pre-populated on first paint (no loading spinner). |
| `<TaskForm initialTask={task} />` | Inline | Explain: the `task` object crosses the Server-to-Client Component boundary. It MUST be JSON-serializable (only `string`, `string \| null` fields -- no Date objects, no functions). This is enforced by the Task interface design. See R&D 12.3 serializable props constraint. |

---

### D10. `src/app/tasks/[id]/edit/loading.tsx` -- Edit Suspense fallback

**File description:** Renders `TaskFormSkeleton` as the Suspense fallback for the edit page.

**R&D reference sections:** 7.2 (error boundary coverage map), 12.6 (loading states).

**Comments needed:**

| Location | Comment type | What to document |
|---|---|---|
| Module top | Module-level doc | Purpose: Suspense fallback for the `/tasks/[id]/edit` route segment. Displays a skeleton form while the Server Component fetches task data. See R&D 7.2 and 12.6. |

---

### D11. `src/app/tasks/error.tsx` -- Task route error boundary

**File description:** Client Component error boundary for the `/tasks` route group.

**R&D reference sections:** 7.2 (error boundary coverage map -- tasks/ error.tsx), 7.4 (error handling layers -- route segment).

**Comments needed:**

| Location | Comment type | What to document |
|---|---|---|
| Module top | Module-level doc | Purpose: error boundary for the `/tasks` route group (covers `/tasks/new`, `/tasks/[id]/edit`, and any future task routes). Catches errors during SSR data fetching or rendering. See R&D 7.2 and 7.4. |
| Note on duplication | Inline | Note that this error boundary is structurally identical to `app/error.tsx` and `app/tasks/[id]/edit/error.tsx`. They are separate files because Next.js requires error boundaries at each route segment level for proper error isolation. |

---

### D12. `src/app/tasks/[id]/edit/error.tsx` -- Edit error boundary

**File description:** Client Component error boundary specifically for the `/tasks/[id]/edit` route segment.

**R&D reference sections:** 7.2 (error boundary coverage map -- edit error.tsx), 7.4 (error handling layers).

**Comments needed:**

| Location | Comment type | What to document |
|---|---|---|
| Module top | Module-level doc | Purpose: error boundary specific to the edit route segment. Catches errors such as task not found during `caller.task.getById()`. This is more specific than `tasks/error.tsx` and provides targeted error recovery for the edit flow. See R&D 7.2. |
| Relationship to other error boundaries | Inline | Explain the hierarchy: `tasks/[id]/edit/error.tsx` catches edit-specific errors -> `tasks/error.tsx` catches task route group errors -> `app/error.tsx` catches root segment errors -> `global-error.tsx` catches root layout errors. Errors bubble up if not caught at a lower level. See R&D 7.2 coverage map. |

---

## Resolved Decisions

### D1. Comment language: English

All code comments will be written in English.

### D2. Comment style: Simple and concise

Comments should be simple and direct. For trivial files where behavior is obvious (e.g., just exporting something, re-exporting a type), skip the comment entirely. Focus on non-obvious patterns, design decisions, and things a developer wouldn't immediately understand from reading the code alone.

### D3. `getById` reusing `deleteTaskInputSchema`

Comment should call out this intentional schema reuse to avoid confusion.

### D4. Duplicate error boundary files

`tasks/[id]/edit/error.tsx` and `tasks/error.tsx` have identical code. Comments should cross-reference each other and explain the duplication is for Next.js route segment isolation.

### D5. R&D document divergences fixed

The following divergences between the R&D document and actual implementation have been corrected in `R&D_TaskArtefact--02.01.md`:

- **TaskCard component type:** R&D Section 12.2 boundary map now correctly lists TaskCard as a Client Component (renders interactive DeleteTaskButton child).
- **QueryClient stability pattern:** R&D Sections 6.2, 7.1, 8.3 now correctly describe `useState` with initializer (actual implementation) instead of `useRef`.
- **Seed procedure:** R&D Section 4.1 procedure table now includes the `seed` development utility procedure.
- **DeleteTaskButton:** R&D Section 12.2 updated to reflect the split between TaskCard (owns mutation/animation) and DeleteTaskButton (pure UI modal with onConfirm callback).
