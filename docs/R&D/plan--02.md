# Implementation Plan: task-artefact

**Source:** `R&D_TaskArtefact--02.01.md` (v2.0.1)
**Project name:** `task-artefact`
**Date:** 2026-05-06
**Plan version:** v2

---

## Change History

| Version | Date | Summary |
|---------|------|---------|
| v1 | 2026-05-06 | Initial implementation plan with 10 open questions |
| v2 | 2026-05-06 | All open questions resolved; plan steps updated with definitive design decisions |

---

## Target Folder Structure

This is the final state every phase works toward (see Section 14 of the architecture doc):

```
task-artefact/
+-- src/
|   +-- app/
|   |   +-- layout.tsx
|   |   +-- page.tsx
|   |   +-- loading.tsx
|   |   +-- error.tsx
|   |   +-- global-error.tsx
|   |   +-- not-found.tsx
|   |   +-- tasks/
|   |   |   +-- error.tsx
|   |   |   +-- new/
|   |   |   |   +-- page.tsx
|   |   |   |   +-- loading.tsx
|   |   |   +-- [id]/
|   |   |       +-- edit/
|   |   |           +-- page.tsx
|   |   |           +-- loading.tsx
|   |   |           +-- error.tsx
|   |   +-- api/
|   |       +-- trpc/
|   |           +-- [trpc]/
|   |               +-- route.ts
|   +-- components/
|   |   +-- providers/
|   |   |   +-- TRPCProvider.tsx
|   |   +-- task/
|   |   |   +-- TaskList.tsx
|   |   |   +-- TaskCard.tsx
|   |   |   +-- TaskCardDate.tsx
|   |   |   +-- TaskForm.tsx
|   |   |   +-- TaskListSkeleton.tsx
|   |   |   +-- TaskFormSkeleton.tsx
|   |   |   +-- DeleteTaskButton.tsx
|   |   +-- ui/
|   |       +-- Spinner.tsx
|   |       +-- ErrorMessage.tsx
|   +-- server/
|   |   +-- trpc/
|   |   |   +-- init.ts
|   |   |   +-- caller.ts
|   |   |   +-- context.ts
|   |   |   +-- routers/
|   |   |       +-- _app.ts
|   |   |       +-- taskRouter.ts
|   |   +-- store/
|   |       +-- InMemoryTaskStore.ts
|   +-- lib/
|   |   +-- trpc/
|   |   |   +-- client.ts
|   |   +-- utils.ts
|   +-- types/
|   |   +-- task.ts
|   +-- hooks/
|       +-- useTaskForm.ts
|       +-- useInfiniteScroll.ts
+-- public/
+-- next.config.ts
+-- tsconfig.json
+-- package.json
+-- README.md
+-- .gitignore
```

---

## Phase 1: Project Scaffolding and Configuration

**Goal:** Create the Next.js 15 project with all dependencies installed and configuration files in place.

### Step 1.1 -- Initialize the Next.js 15 project

**What:** Create the `task-artefact` directory and scaffold a Next.js 15 project inside it using `create-next-app` with the App Router, TypeScript, and the `src/` directory convention.

**Why:** Section 1.1 and Section 13 specify Next.js v15 with App Router as the framework. The `src/` directory is required by the folder structure in Section 14.

**Key technical considerations:**
- Use `npx create-next-app@15.5.15 task-artefact --typescript --app --src-dir --eslint --tailwind --no-import-alias`.
- Ensure the generated `package.json` includes `next@^15.x`, `react@^19.x`, `react-dom@^19.x`.

**Dependencies:** None.

### Step 1.2 -- Install core dependencies

**What:** Install all packages listed in Section 13.1:
- `@trpc/server@^11.x`
- `@trpc/client@^11.x`
- `@trpc/react-query@^11.x`
- `@tanstack/react-query@^5.x`
- `zod@^3.x`
- `superjson@^2.x`
- `sonner@^1.x`

**Why:** Section 13.1 defines the complete dependency set. These must be present before any backend or frontend code is written.

**Key technical considerations:**
- Verify `@trpc/server`, `@trpc/client`, and `@trpc/react-query` are all on `^11.x` (tRPC v11, not v10).
- Verify `@tanstack/react-query` is `^5.x` (TanStack Query v5, not v4).

**Dependencies:** Step 1.1.

### Step 1.3 -- Install development dependencies

**What:** Ensure dev dependencies from Section 13.2 are present:
- `typescript@^5.x`
- `@types/node@^22.x`
- `@types/react@^19.x`
- `eslint@^9.x`
- `tailwindcss@^4.x`

**Why:** Section 13.2 lists these as required development dependencies. Tailwind CSS is confirmed included via the `--tailwind` flag in Step 1.1.

**Dependencies:** Step 1.1.

### Step 1.4 -- Configure `tsconfig.json`

**What:** Review and adjust the generated `tsconfig.json` to ensure:
- `target` is appropriate (ES2022 or later).
- `moduleResolution` is set to `bundler` (Next.js 15 default).
- Path aliases are configured: `@/*` mapping to `./src/*` (already set up by `create-next-app`). All imports across the project must use the `@/` prefix instead of relative paths.

**Why:** TypeScript configuration must align with Next.js 15 requirements and support clean imports across the project. The `@/` alias avoids brittle relative paths and is the Next.js default convention.

**Dependencies:** Step 1.1.

### Step 1.5 -- Configure `next.config.ts`

**What:** Create/update `next.config.ts` with any necessary settings. At minimum, no special configuration is required beyond defaults, but the file should exist as specified in Section 14.

**Why:** Section 14 lists `next.config.ts` in the folder structure.

**Dependencies:** Step 1.1.


### Phase 1 Verification

- [x] `npm run build` succeeds with no errors on the scaffolded project.
- [x] `npm run dev` starts and `http://localhost:3000` renders the default Next.js page.
- [x] All packages from Sections 13.1 and 13.2 are present in `package.json`.

---

## Phase 2: Types, Validation Schemas, and Data Store

**Goal:** Define the core data types, Zod validation schemas, and the in-memory store. These are foundation pieces with no framework dependencies.

### Step 2.1 -- Create the Task type definition

**What:** Create `src/types/task.ts` defining:

```typescript
export interface Task {
  id: string;           // UUID via crypto.randomUUID()
  titulo: string;       // min 1, max 200
  descricao: string | null;  // nullable, max 2000 when non-null
  createdAt: string;    // ISO 8601 string
}
```

**Why:** Section 5.2 defines the Task entity with these exact fields and types. The `descricao` field is `string | null` (never `undefined`). The `createdAt` field is an ISO 8601 string (not a `Date` object) to ensure safe serialization across the RSC/Client boundary (Section 5.2 serialization constraint).

**Dependencies:** Step 1.1.

### Step 2.2 -- Create Zod validation schemas

**What:** Create Zod schemas in `src/types/task.ts` alongside the `Task` interface. The schemas are:

1. `taskSchema` -- output schema: `{ id: z.string().uuid(), titulo: z.string(), descricao: z.string().nullable(), createdAt: z.string() }`
2. `createTaskInputSchema` -- `{ titulo: z.string().min(1).max(200), descricao: z.string().max(2000).nullable().optional() }`
3. `updateTaskInputSchema` -- `{ id: z.string().uuid(), titulo: z.string().min(1).max(200).optional(), descricao: z.string().max(2000).nullable().optional() }`
4. `deleteTaskInputSchema` -- `{ id: z.string().uuid() }`
5. `listTasksInputSchema` -- `{ cursor: z.string().optional(), limit: z.number().min(1).max(100).default(10) }`

All custom error messages from Section 5.3 must be included verbatim.

**Why:** Section 5.3 specifies exact Zod schemas with precise constraints and error messages. These schemas are used by both tRPC procedures (server-side validation) and the client-side form hook (`useTaskForm`). Co-locating schemas with the `Task` interface in `src/types/task.ts` is the standard tRPC pattern -- both server and client import from the same shared location.

**Key technical considerations:**
- `descricao` uses `.nullable().optional()` on input schemas but only `.nullable()` on the output schema. The key is always present in the output; its value is `null` when absent (Section 5.3 type consistency note).
- The `taskSchema` output schema must infer to match the `Task` interface. Use `z.infer<typeof taskSchema>` to verify alignment.

**Dependencies:** Step 2.1.

### Step 2.3 -- Implement InMemoryTaskStore

**What:** Create `src/server/store/InMemoryTaskStore.ts` implementing:
- Module-scoped singleton `Map<string, Task>`.
- Methods: `create(titulo, descricao)`, `getById(id)`, `update(id, data)`, `delete(id)`, `list(cursor?, limit)`.
- `create` generates `id` via `crypto.randomUUID()` and `createdAt` via `new Date().toISOString()`.
- `create` sets `descricao` to `null` when the argument is `undefined` or not provided (enforce the nullable consistency rule from Section 5.3).
- `list` implements cursor-based pagination per Section 11.4:
  - Decode cursor from base64 to get the ISO timestamp.
  - Filter tasks where `createdAt < decoded_timestamp` (if cursor provided).
  - Sort results by `createdAt` descending (most recent first).
  - Slice to `limit` items.
  - Return `{ items: Task[], nextCursor: base64(lastItem.createdAt) }` or `null` if no more items.
- All Map operations are O(1) except `list` which is O(n log n) due to sorting (Section 8.2).

**Why:** Section 5.1 specifies the in-memory store with `Map<string, Task>`. Section 11.4 specifies the cursor-based pagination algorithm. Section 5.2 specifies ID generation and timestamp format.

**Key technical considerations:**
- The store must be a module-level singleton (not instantiated per request). Export a single instance.
- The `list` method's sort is the only non-O(1) operation; this is acceptable per Section 8.2 because pagination limits results.
- Cursor encoding/decoding uses `Buffer.from(createdAt).toString('base64')` and `Buffer.from(cursor, 'base64').toString('utf-8')`.
- Development console logs for CRUD traceability are recommended by Section 10.2.
- Add a try-catch around the base64 decode in the `list` method; treat a decode failure as "no cursor" (return the first page). No Zod refinement is needed since the cursor is server-generated, not user input.

**Dependencies:** Steps 2.1, 2.2.

### Phase 2 Verification

- [x] TypeScript compiles without errors: `npx tsc --noEmit`.
- [x] The `Task` interface and `z.infer<typeof taskSchema>` are structurally identical.
- [x] `InMemoryTaskStore` can be imported and basic operations work: create returns a task with UUID and ISO timestamp; list returns paginated results; update and delete work correctly.

---

## Phase 3: tRPC Backend (Server-Side)

**Goal:** Build the complete tRPC backend: initialization, context, routers, API route handler, and server-side caller.


### Step 3.1 -- Create tRPC initialization (`init.ts`)

**What:** Create `src/server/trpc/init.ts` containing:
- `initTRPC` function that creates the tRPC instance with:
  - `transformer: superjson` (Section 2.3 Component Catalog, Section 13.1).
  - Custom `errorFormatter` per Section 4.4 that flattens Zod errors via `error.cause.flatten()` when `error.code === 'BAD_REQUEST'` and `error.cause instanceof ZodError`.

**Why:** Section 4.4 specifies the error formatter. SuperJSON is the transformer (Section 13.1). This is the foundation for all tRPC procedures.

**Key technical considerations:**
- Import `ZodError` from `zod`.
- The `errorFormatter` receives `{ shape, error }` and returns the augmented shape with `zodError` in `data`.

**Dependencies:** Step 2.2.

### Step 3.2 -- Create tRPC context (`context.ts`)

**What:** Create `src/server/trpc/context.ts` containing:
- `createTRPCContext` function that accepts an empty or minimal options object and returns `{ store: InMemoryTaskStore }`.
- Import and use the singleton `InMemoryTaskStore`.
- Export a type `Context` for use in router definitions.

**Why:** Section 2.3 describes the context as dependency injection for the store. Section 6.2 describes this as the extension point for future additions (auth, session).

**Key technical considerations:**
- The context is created per-request but the store is a singleton (same instance every time).
- In tRPC v11, context creation follows the `createTRPCContext` pattern.

**Dependencies:** Steps 2.3, 3.1.

### Step 3.3 -- Create the task router (`taskRouter.ts`)

**What:** Create `src/server/trpc/routers/taskRouter.ts` containing a `taskRouter` with five procedures (Section 4.1):

1. **`create`** (Mutation):
   - Input: `createTaskInputSchema`
   - Output: `taskSchema`
   - Calls `ctx.store.create(input.titulo, input.descricao)` and returns the result.
   - Error: `BAD_REQUEST` with message "Task title is required and cannot exceed 200 characters." (handled automatically by Zod).

2. **`list`** (Query):
   - Input: `listTasksInputSchema`
   - Output: `{ items: taskSchema.array(), nextCursor: z.string().nullable() }`
   - Calls `ctx.store.list(input.cursor, input.limit)`.
   - `limit` defaults to 10 via Zod `.default(10)`.

3. **`update`** (Mutation):
   - Input: `updateTaskInputSchema`
   - Output: `taskSchema`
   - Calls `ctx.store.getById(input.id)`. If `undefined`, throw `TRPCError` with code `NOT_FOUND` and message "Task not found. Please verify the identifier and try again." (Section 4.3).
   - Calls `ctx.store.update(input.id, data)` and returns the updated task.

4. **`delete`** (Mutation):
   - Input: `deleteTaskInputSchema`
   - Output: `z.object({ success: z.boolean() })`
   - Calls `ctx.store.getById(input.id)`. If `undefined`, throw `TRPCError` with code `NOT_FOUND`.
   - Calls `ctx.store.delete(input.id)` and returns `{ success: true }`.

5. **`getById`** (Query):
   - Input: `deleteTaskInputSchema` (reuses `{ id: z.string().uuid() }`)
   - Output: `taskSchema`
   - Calls `ctx.store.getById(input.id)`. If `undefined`, throw `TRPCError` with code `NOT_FOUND`.

**Why:** Section 4.1 defines all five procedures with their exact input/output contracts. Section 4.3 defines the error types and messages.

**Key technical considerations:**
- Use `initTRPC.context<Context>().router()` or the equivalent tRPC v11 pattern.
- Import schemas from `@/types/task`.
- All manual errors use `TRPCError` from `@trpc/server`.

**Dependencies:** Steps 3.1, 3.2, 2.3.

### Step 3.4 -- Create the merged root router (`_app.ts`)

**What:** Create `src/server/trpc/routers/_app.ts` containing:
- `appRouter` that merges `taskRouter` under the `task` prefix.
- Export of `AppRouter` type: `export type AppRouter = typeof appRouter`.

**Why:** Section 4.2 defines the contract model with the `task` prefix. The `AppRouter` type export is essential for type-safe client creation (Step 4.1).

**Key technical considerations:**
- Use `initTRPC.router({ task: taskRouter })`.
- The `AppRouter` type must be exported as a type (not a value) for the client to import.

**Dependencies:** Step 3.3.

### Step 3.5 -- Create the tRPC API route handler

**What:** Create `src/app/api/trpc/[trpc]/route.ts` containing:
- `GET` and `POST` handlers using `fetchRequestHandler` from `@trpc/server/adapters/fetch`.
- Pass `endpoint: '/api/trpc'`, `router: appRouter`, `createContext: createTRPCContext`, and the tRPC initialization options (including SuperJSON transformer and error formatter).

**Why:** Section 2.1 shows the App Router handler at `/api/trpc/[trpc]/*`. This is the HTTP endpoint that the tRPC client calls.

**Key technical considerations:**
- In tRPC v11 with Next.js App Router, use `@trpc/server/adapters/fetch` and `fetchRequestHandler`.
- Both `GET` and `POST` must be handled (batching uses POST).
- Import `appRouter` from `@/server/trpc/routers/_app` and `createTRPCContext` from `@/server/trpc/context`.

**Dependencies:** Step 3.4.

### Step 3.6 -- Create the server-side tRPC caller

**What:** Create `src/server/trpc/caller.ts` containing:

```typescript
import { createCallerFactory } from '@trpc/server'
import { createTRPCContext } from './context'
import { createTRPC } from './init'
import { appRouter } from './routers/_app'

const createCaller = createCallerFactory(appRouter)

export function createServerCaller() {
  return createCaller(createTRPCContext({}))
}
```

This factory function creates a per-request tRPC caller. It is used by Server Components to invoke tRPC procedures directly on the server without HTTP.

**Why:** Section 2.3 describes the server-side caller. Section 6.2 describes it as essential for SSR data fetching while respecting the tRPC context and middleware chain. The factory function pattern is forward-compatible with future auth/session context that may vary per request.

**Key technical considerations:**
- Import `createCallerFactory` from `@trpc/server`.
- The factory is called per Server Component request, ensuring a fresh context each time.
- Export is a function (`createServerCaller`), not a pre-created singleton caller instance.

**Dependencies:** Step 3.4.

### Phase 3 Verification

- [x] `npm run build` compiles successfully.
- [x] Manual test: start the dev server, send a `POST` to `http://localhost:3000/api/trpc/task.create` with JSON body `{ "titulo": "Test Task" }` and verify a task is returned with UUID and ISO timestamp.
- [x] Send `GET` to `http://localhost:3000/api/trpc/task.list` and verify the task is returned.
- [x] Verify `delete` and `update` operations work via curl or a REST client.
- [x] Verify `getById` returns the correct task.
- [x] Verify `NOT_FOUND` error is returned for non-existent IDs.

---

## Phase 4: tRPC Client and Providers

**Goal:** Build the client-side tRPC integration: typed client, React Query provider, and root layout.

### Step 4.1 -- Create the typed tRPC client

**What:** Create `src/lib/trpc/client.ts` containing:

```typescript
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@/server/trpc/routers/_app';
export const trpc = createTRPCReact<AppRouter>();
```

**Why:** Section 2.3 describes `createTRPCReact` as the client consumption layer. The `AppRouter` type import ensures end-to-end type safety.

**Dependencies:** Step 3.4.

### Step 4.2 -- Create the TRPCProvider component

**What:** Create `src/components/providers/TRPCProvider.tsx` as a Client Component (`"use client"`) containing:
- A `TRPCProvider` component (or `Providers` component) that:
  - Creates a **stable** `QueryClient` via `useRef` (Section 8.3 -- never re-created per render).
  - Configures `QueryClient` with:
    - `staleTime: 0` (always refetch on mount -- volatile in-memory data).
    - `refetchOnWindowFocus: true`.
    - `retry: 1` for queries, `retry: 0` for mutations.
  - Wraps children in `QueryClientProvider` from `@tanstack/react-query`.
  - Wraps children in `trpc.Provider` from `@trpc/react-query` with `queryClient` and links to the `httpBatchLink` pointing to `/api/trpc`.
  - Includes the `sonner` `<Toaster richColors />` component (Section 12.7 -- placed inside the provider wrapper, SSR-safe without additional mounting logic). Only `richColors` is configured to make success/error toasts visually distinct. All other sonner defaults (position, duration, stacking) are used as-is.
- This must be a Client Component because it uses hooks (`useRef`, React context).

**Why:** Section 8.3 specifies the exact QueryClient configuration. Section 12.7 specifies the toast architecture. Section 2.3 describes the provider stack.

**Key technical considerations:**
- `useRef(new QueryClient({...})).current` pattern prevents re-creation.
- `httpBatchLink` URL: `/api/trpc`.
- SuperJSON transformer must be configured on the client-side tRPC links as well.
- The `sonner` `<Toaster richColors />` goes inside this provider.

**Dependencies:** Steps 4.1, 1.2.

### Step 4.3 -- Create the root layout

**What:** Create `src/app/layout.tsx` as a Server Component containing:
- Standard HTML5 structure (`<html>`, `<body>`).
- Wraps `{children}` in `TRPCProvider`.
- Basic metadata or title.

**Why:** Section 12.2 specifies `layout.tsx` as a Server Component that wraps providers. Section 12.7 specifies Toaster placement inside TRPCProvider.

**Dependencies:** Step 4.2.

### Phase 4 Verification

- [x] `npm run build` succeeds.
- [x] `npm run dev` starts and the root layout renders without errors.
- [x] No console errors related to React Query or tRPC provider initialization.

---

## Phase 5: UI Primitive Components

**Goal:** Build the reusable UI components (spinners, skeletons, error messages) that are used across pages.

### Step 5.1 -- Create `Spinner.tsx`

**What:** Create `src/components/ui/Spinner.tsx` as a Server Component (no hooks). A simple visual loading indicator (CSS animation, SVG spinner, or Tailwind-based).

**Why:** Section 12.2 specifies this as a Server Component. Used in loading states for infinite scroll and mutation indicators.

**Dependencies:** None.

### Step 5.2 -- Create `ErrorMessage.tsx`

**What:** Create `src/components/ui/ErrorMessage.tsx` as a Client Component (`"use client"`). Displays an error message with a "Try Again" button that calls a `refetch()` function passed as a prop.

**Why:** Section 12.2 specifies this as a Client Component. Section 12.5 describes the pattern: `isError` state + retry button calling `refetch()`.

**Dependencies:** None.

### Step 5.3 -- Create `TaskListSkeleton.tsx`

**What:** Create `src/components/task/TaskListSkeleton.tsx` as a Server Component. Renders a skeleton representation of the task list (e.g., 3-5 rectangular placeholders mimicking task cards).

**Why:** Section 12.2 specifies this as a Server Component. Used as the Suspense fallback via `loading.tsx`.

**Dependencies:** None.

### Step 5.4 -- Create `TaskFormSkeleton.tsx`

**What:** Create `src/components/task/TaskFormSkeleton.tsx` as a Server Component. Renders a skeleton representation of the task form (title input, description textarea, submit button placeholders).

**Why:** Section 12.2 specifies this as a Server Component. Used as the Suspense fallback for create and edit pages.

**Dependencies:** None.

### Phase 5 Verification

- [x] All four components render without errors when imported.
- [x] Skeletons visually approximate the layout of their corresponding real components.

---

## Phase 6: Task Display Components

**Goal:** Build the components that display task data: TaskCard, TaskCardDate, and DeleteTaskButton.

### Step 6.1 -- Create `TaskCard.tsx`

**What:** Create `src/components/task/TaskCard.tsx` as a **Client Component** (`"use client"`). Displays:
- `task.titulo` as the card title (React JSX interpolation -- XSS safe per Section 9.3).
- `task.descricao` as description (render only if non-null).
- `task.createdAt` is NOT formatted here -- delegate to `TaskCardDate`.
- An "Edit" link pointing to `/tasks/${task.id}/edit`.
- A `DeleteTaskButton` component (also a Client Component).
- Accepts `task: Task` as a prop.

**Why:** Although TaskCard does not use any hooks directly, it is rendered inside `TaskList` which is a Client Component. Since the parent is already a Client Component, TaskCard gains no Server Component benefits from being a Server Component itself. Marking it as a Client Component with `"use client"` is simpler and avoids any RSC boundary considerations.

**Key technical considerations:**
- Include the `"use client"` directive at the top of the file.
- The `Task` type is serializable (all fields are strings or null), so passing it as a prop is safe (Section 12.3).
- TaskCardDate and DeleteTaskButton are both Client Components, so composition is straightforward.

**Dependencies:** Step 2.1, Step 6.3.

### Step 6.2 -- Create `TaskCardDate.tsx`

**What:** Create `src/components/task/TaskCardDate.tsx` as a Client Component (`"use client"`). Accepts `createdAt: string` (ISO 8601) as a prop and formats it using `new Date(createdAt).toLocaleDateString()` / `toLocaleTimeString()` for the user's local timezone.

**Why:** Section 12.2 specifies this as a Client Component specifically to prevent hydration mismatch caused by timezone differences between server and client (Section 5.2 serialization constraint).

**Dependencies:** None.

### Step 6.3 -- Create `DeleteTaskButton.tsx`

**What:** Create `src/components/task/DeleteTaskButton.tsx` as a Client Component (`"use client"`). Implements:
- A button labeled "Delete" (or with an icon).
- On click: shows a confirmation dialog (`window.confirm()` is simplest; a custom modal is also acceptable).
- On confirm: calls `trpc.task.delete.useMutation()` and passes `{ id: taskId }`.
- `onSuccess`: shows `toast.success("Task deleted successfully")` and triggers `utils.task.list.invalidate()`.
- `onError`: shows `toast.error()` with the server error message.
- While mutation is pending: shows a disabled state / overlay spinner on the card.

Optimistic updates are deferred to a future enhancement. The standard mutation -> invalidate -> refetch flow is sufficient since the in-memory store returns data in <1ms.

**Why:** Section 12.2 specifies this as a Client Component. Section 3.5 describes the delete flow. Section 12.6 describes loading/success/error visual states.

**Key technical considerations:**
- Use `trpc.useUtils()` to get `utils.task.list.invalidate()`.
- The confirmation dialog prevents accidental deletion (Section 3.5, Step 2).

**Dependencies:** Steps 4.1, 4.2.

### Phase 6 Verification

- [x] `TaskCard` renders task data correctly.
- [x] `TaskCardDate` formats the ISO timestamp in the browser's local timezone.
- [x] `DeleteTaskButton` triggers the delete mutation, shows confirmation, and displays toast feedback.

---

## Phase 7: Custom Hooks

**Goal:** Implement the custom hooks for form management and infinite scroll.

### Step 7.1 -- Create `useTaskForm.ts`

**What:** Create `src/hooks/useTaskForm.ts` implementing the `useTaskForm` hook described in Section 12.4. The hook encapsulates:
- State: `{ titulo: string, descricao: string, errors: { titulo?: string, descricao?: string }, isSubmitting: boolean }`.
- Actions: field setters, `validate()` (client-side validation using Zod), `reset()`, `submit()` (calls tRPC mutation).
- Accepts an optional `initialTask?: Task` for edit mode pre-population.
- Accepts `mutationFn` or uses `trpc.task.create.useMutation()` / `trpc.task.update.useMutation()` internally.
- Validation flow (Section 12.4):
  1. Client-side on change: checks title not empty and within limits.
  2. Client-side on submit: validates all fields.
  3. Server-side validation happens automatically via tRPC Zod input schemas.
- On successful submit: `toast.success()`, redirect via `router.push('/')`.
- On error: `toast.error()` with server message; update `errors` state from tRPC's flattened Zod error if available.

**Why:** Section 12.4 defines the form management hook with exact state shape and validation flow.

**Key technical considerations:**
- Use `createTaskInputSchema.safeParse()` and `updateTaskInputSchema.safeParse()` for client-side validation.
- Extract field errors from `result.error.flatten().fieldErrors`.
- For edit mode, the mutation is `task.update`; for create mode, `task.create`.

**Dependencies:** Steps 2.2, 4.1.

### Step 7.2 -- Create `useInfiniteScroll.ts`

**What:** Create `src/hooks/useInfiniteScroll.ts` implementing an IntersectionObserver-based infinite scroll hook. The hook:
- Accepts a `sentinelRef: RefObject<HTMLDivElement>` and a callback `onIntersect: () => void`.
- Uses `useEffect` to create an `IntersectionObserver` that watches the sentinel element.
- Triggers `onIntersect` (which will be `fetchNextPage`) when the sentinel enters the viewport.
- Cleans up the observer on unmount.
- Accepts a `hasNextPage: boolean` guard to stop observing when there is no more data.
- Accepts an `isFetchingNextPage: boolean` guard to prevent duplicate fetches (Section 7.1).

**Why:** Section 11.3 describes the components: IntersectionObserver, sentinel element, useRef + useEffect. Section 11.1 describes the page limit of 50 pages.

**Key technical considerations:**
- The page count limit (50 pages / 500 items) is enforced at the TaskList component level (Step 8.1), not necessarily in this hook. The hook is a generic IntersectionObserver wrapper.

**Dependencies:** None (pure React hooks).

### Phase 7 Verification

- [x] `useTaskForm` manages form state, validates inputs, and integrates with tRPC mutations.
- [x] `useInfiniteScroll` correctly triggers the callback when a sentinel element enters the viewport.
- [x] TypeScript types are correct for both hooks.

---

## Phase 8: Task List Feature (Infinite Scroll + SSR)

**Goal:** Build the complete task listing page with SSR prefetching and client-side infinite scroll.

### Step 8.1 -- Create `TaskList.tsx`

**What:** Create `src/components/task/TaskList.tsx` as a Client Component (`"use client"`). Implements:
- Uses `trpc.task.list.useInfiniteQuery()` with `getNextPageParam` returning the `nextCursor` from the last page.
- Renders all accumulated pages as a flat list of `TaskCard` components.
- A sentinel `<div ref={sentinelRef}>` at the end of the list.
- Uses `useInfiniteScroll` hook connected to `fetchNextPage`.
- Enforces a maximum of 50 pages (Section 11.1): if `data.pages.length >= 50`, stop fetching and display "End of available history".
- Shows a `Spinner` below the last task while `isFetchingNextPage` is true.
- Shows `ErrorMessage` with `refetch()` when `isError` is true.
- Shows "No tasks found" when the list is empty and not loading.

**Why:** Section 12.2 specifies TaskList as a Client Component. Section 11 describes the infinite scroll strategy. Section 3.1 describes the SSR + infinite scroll data flow.

**Key technical considerations:**
- `useInfiniteQuery` initial cursor is `null`.
- `getNextPageParam: (lastPage) => lastPage.nextCursor`.
- Each page's `items` array must be flattened: `data?.pages.flatMap(page => page.items) ?? []`.
- The `trpc.task.list.useInfiniteQuery` call uses the tRPC React Query integration, which automatically handles the infinite query pattern with tRPC v11.

**Dependencies:** Steps 6.1, 7.2, 4.1.

### Step 8.2 -- Create the listing page (`app/page.tsx`)

**What:** Create `src/app/page.tsx` as a Server Component. Implements:
- Creates a server-side tRPC caller via `createServerCaller()` (from `@/server/trpc/caller`).
- Creates a `QueryClient` (server-side instance, not the stable client one).
- Calls `prefetchInfiniteQuery` on `queryClient` for the first page of tasks:

```typescript
await queryClient.prefetchInfiniteQuery({
  queryKey: [['task', 'list'], { input: { cursor: undefined, limit: 10 }, type: 'infinite' }],
  queryFn: ({ pageParam }) => caller.task.list({ cursor: pageParam, limit: 10 }),
  initialPageParam: undefined as string | undefined,
})
```

- Wraps `<TaskList />` in `HydrationBoundary` with `dehydrate(queryClient)`.
- Also renders a link/button to navigate to `/tasks/new` for creating a new task.

The exact key structure should be verified during Phase 8 verification. If hydration mismatch occurs, inspect the auto-generated tRPC key via `console.log` and adjust.

**Why:** Section 12.1 specifies the listing page as a Server Component with prefetch + HydrationBoundary. Section 3.1 describes the complete SSR flow. Section 6.2 describes the Hydration-Resistant State pattern.

**Key technical considerations:**
- Import `HydrationBoundary`, `QueryClient`, `dehydrate` from `@tanstack/react-query`.
- Import `createServerCaller` from `@/server/trpc/caller`.
- The server-side `QueryClient` is created fresh per request (not via useRef -- that is only for the client provider).
- `prefetchInfiniteQuery` is used instead of `prefetchQuery` to match the client-side `useInfiniteQuery` hook. The key structure must include the `type: 'infinite'` discriminator and the `input` shape to match tRPC v11's auto-generated keys.

**Dependencies:** Steps 8.1, 3.6, 4.2.

### Step 8.3 -- Create the listing loading skeleton (`app/loading.tsx`)

**What:** Create `src/app/loading.tsx` as a Server Component that renders `<TaskListSkeleton />`.

**Why:** Section 12.2 specifies this as a Server Component (Suspense fallback). Section 6.2 describes streaming SSR with Suspense.

**Dependencies:** Step 5.3.

### Step 8.4 -- Create error boundaries for listing

**What:** Create:
- `src/app/error.tsx` -- Client Component error boundary for the root segment. Shows an error message and a "Try Again" button using `reset()`.
- `src/app/global-error.tsx` -- Client Component for root layout errors. Must include its own `<html>` and `<body>` tags (Next.js requirement). Shows an error message and a "Reset" button using `reset()`.

**Why:** Section 7.2 defines the error boundary coverage map. Section 12.2 specifies these as Client Components.

**Dependencies:** None.

### Phase 8 Verification

- [x] Navigate to `/`. The skeleton loader appears immediately (streaming SSR).
- [x] After a brief moment, the first page of tasks renders with full HTML (view page source to verify SSR).
- [ ] Scroll to the bottom to trigger infinite scroll loading of the next page.
- [x] If no tasks exist, "No tasks found" message is displayed.
- [x] Navigate to `/tasks/new` via the link on the page.
- [ ] Trigger an error boundary to verify `error.tsx` and `global-error.tsx` render correctly.
- [ ] Verify hydration: the server-prefetched data is picked up by the client-side `useInfiniteQuery` without a duplicate network request. If mismatch occurs, inspect tRPC key via `console.log` and adjust the `queryKey` in Step 8.2.

---

## Phase 9: Task Creation Feature

**Goal:** Build the task creation page and integrate the form.

### Step 9.1 -- Create `TaskForm.tsx`

**What:** Create `src/components/task/TaskForm.tsx` as a Client Component (`"use client"`). Implements:
- A form with two fields: `titulo` (text input) and `descricao` (textarea).
- Uses the `useTaskForm` hook (Step 7.1) for state management, validation, and submission.
- Displays field-level errors below each input (Section 7.4, form field layer).
- Submit button shows disabled state + spinner while `isSubmitting` is true.
- Supports both create and edit modes via the `initialTask` prop.
- On success: toast notification and redirect to `/`.

**Why:** Section 12.2 specifies TaskForm as a Client Component. Section 12.4 describes the form management and validation flow.

**Dependencies:** Steps 7.1, 5.1.

### Step 9.2 -- Create the creation page (`app/tasks/new/page.tsx`)

**What:** Create `src/app/tasks/new/page.tsx` as a Client Component (`"use client"`) that renders `<TaskForm />` without an `initialTask` (create mode).

**Why:** Section 12.2 specifies this as a Client Component. Section 12.1 specifies `/tasks/new` as a Client Component route.

**Dependencies:** Step 9.1.

### Step 9.3 -- Create the creation loading skeleton (`app/tasks/new/loading.tsx`)

**What:** Create `src/app/tasks/new/loading.tsx` as a Server Component that renders `<TaskFormSkeleton />`.

**Why:** Section 12.2 specifies this as a Server Component Suspense fallback.

**Dependencies:** Step 5.4.

### Step 9.4 -- Create the tasks error boundary (`app/tasks/error.tsx`)

**What:** Create `src/app/tasks/error.tsx` as a Client Component error boundary for the tasks route group.

**Why:** Section 7.2 includes `app/tasks/error.tsx` in the error boundary coverage map.

**Dependencies:** None.

### Phase 9 Verification
- [x] Navigate to `/tasks/new`. The creation form renders.
- [x] Submit with an empty title. Client-side validation error "Title is required" appears below the input.
- [x] Submit with a valid title. Task is created, toast "Task created successfully" appears, and the user is redirected to `/`.
- [x] The new task appears in the listing.
- [x] Submit button is disabled while the mutation is in progress.

---

## Phase 10: Task Edit Feature

**Goal:** Build the task edit page with server-side data pre-fetching.

### Step 10.1 -- Create the edit page (`app/tasks/[id]/edit/page.tsx`)

**What:** Create `src/app/tasks/[id]/edit/page.tsx` as a Server Component. Implements:
- Uses Next.js 15 async params: `type Props = { params: Promise<{ id: string }> }` and `const { id } = await params` (Section 12.8).
- Creates a server-side tRPC caller via `createServerCaller()`.
- Calls `caller.task.getById({ id })` to fetch the task data.
- If the task is not found (throws `NOT_FOUND`), the error is caught by the route's `error.tsx`.
- Renders `<TaskForm initialTask={task} />` passing the task as a serializable prop.
- Includes a link back to `/`.

The edit page passes initial task data directly as serializable props to `TaskForm`. No `HydrationBoundary` is needed since the form does not use React Query for initial data loading.

**Why:** Section 12.1 specifies the edit page as a Server Component that awaits async params and fetches task data via the server-side caller. Section 12.3 mandates only serializable props across the RSC boundary. Section 12.8 specifies the Next.js 15 async params pattern. Direct prop passing is the preferred Next.js data pattern for single-item fetches.

**Key technical considerations:**
- The `task` object is already JSON-serializable (all fields are strings or null) -- no special serialization needed.
- The form receives its initial data as a prop, not from React Query hydration, which is the idiomatic Next.js pattern for this case.

**Dependencies:** Steps 3.6, 9.1.

### Step 10.2 -- Create the edit loading skeleton (`app/tasks/[id]/edit/loading.tsx`)

**What:** Create `src/app/tasks/[id]/edit/loading.tsx` as a Server Component that renders `<TaskFormSkeleton />`.

**Why:** Section 12.2 specifies this as a Server Component Suspense fallback.

**Dependencies:** Step 5.4.

### Step 10.3 -- Create the edit error boundary (`app/tasks/[id]/edit/error.tsx`)

**What:** Create `src/app/tasks/[id]/edit/error.tsx` as a Client Component error boundary for the edit route segment.

**Why:** Section 7.2 includes this in the error boundary coverage map.

**Dependencies:** None.

### Phase 10 Verification

- [x] Create a task, then click "Edit" on it. The edit page loads with the form pre-filled with the task's data.
- [x] Edit the title and submit. Toast "Task updated successfully" appears, and the user is redirected to `/`.
- [x] Navigate to `/tasks/non-existent-id/edit`. The error boundary catches the `NOT_FOUND` error and displays a friendly message.
- [x] While the edit page is loading, the skeleton appears.

---

## Phase 11: Remaining Error and Not-Found Pages

**Goal:** Complete all error handling and edge case pages.

### Step 11.1 -- Create `app/not-found.tsx`

**What:** Create `src/app/not-found.tsx` as a Server Component displaying a 404 message with a link back to `/`.

**Why:** Section 7.2 lists this in the error boundary coverage map. Section 12.2 specifies it as a Server Component.

**Dependencies:** None.

### Phase 11 Verification

- [ ] Navigate to a non-existent route (e.g., `/foo`). The `not-found.tsx` page renders.
- [ ] All error boundaries at all levels (root, tasks, edit) render correctly when triggered.

---

## Phase 12: Final Integration, Polish, and README

**Goal:** End-to-end testing, polish, and documentation.

### Step 12.1 -- Create `src/lib/utils.ts`

**What:** Create `src/lib/utils.ts` with any general utility functions needed (e.g., `cn()` for class name merging if using Tailwind, date formatting helpers, etc.).

**Why:** Section 14 lists this file in the folder structure.

**Dependencies:** None.

### Step 12.2 -- End-to-end smoke test

**What:** Manually test the complete user flow:
1. Start the dev server.
2. Navigate to `/` -- see the task list (empty or with existing data).
3. Click "Create Task" -- navigate to `/tasks/new`.
4. Fill in the form and submit -- verify task appears in the list.
5. Click "Edit" on a task -- verify pre-filled form.
6. Update and submit -- verify changes reflect in the list.
7. Click "Delete" on a task -- confirm deletion -- verify removal and toast.
8. Test infinite scroll by creating 15+ tasks and scrolling.
9. Test validation: empty title, title exceeding 200 chars, description exceeding 2000 chars.
10. Test error states: navigate to invalid task ID edit page.
11. Verify `npm run build` succeeds for production.

### Step 12.3 -- Finalize README.md

**What:** Create a comprehensive `README.md` with:
- Project description and purpose.
- Tech stack overview.
- Setup instructions (`npm install`, `npm run dev`).
- API documentation (tRPC procedures).
- Project structure overview.

**Why:** Section 14 lists `README.md`. Standard project documentation.

### Phase 12 Verification

- [ ] All CRUD operations work end-to-end.
- [ ] SSR streaming works (skeleton appears immediately, then content).
- [ ] Infinite scroll loads additional pages on scroll.
- [ ] All toast notifications appear correctly.
- [ ] All error boundaries work.
- [ ] `npm run build` succeeds with no warnings.
- [ ] README is complete and accurate.

---

## Summary of Implementation Order

| Phase | Description | Steps | Depends On |
|-------|-------------|-------|------------|
| 1 | Project Scaffolding | 1.1 - 1.6 | -- |
| 2 | Types, Schemas, Store | 2.1 - 2.3 | Phase 1 |
| 3 | tRPC Backend | 3.1 - 3.6 | Phase 2 |
| 4 | tRPC Client & Providers | 4.1 - 4.3 | Phase 3 |
| 5 | UI Primitive Components | 5.1 - 5.4 | Phase 1 |
| 6 | Task Display Components | 6.1 - 6.3 | Phase 2, Phase 4 |
| 7 | Custom Hooks | 7.1 - 7.2 | Phase 2, Phase 4 |
| 8 | Task List Feature | 8.1 - 8.4 | Phase 6, Phase 7 |
| 9 | Task Creation Feature | 9.1 - 9.4 | Phase 7, Phase 5 |
| 10 | Task Edit Feature | 10.1 - 10.3 | Phase 3, Phase 9 |
| 11 | Error/Not-Found Pages | 11.1 | Phase 8 |
| 12 | Integration & Polish | 12.1 - 12.3 | All |

---

## Resolved Design Decisions

All open questions from the initial plan have been resolved with the guiding principle of keeping the prototype pragmatic while following Next.js 15 best practices.

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| 1 | Zod schema location | `src/types/task.ts` (co-located with types) | Shared by server and client; co-location is the standard tRPC pattern |
| 2 | Path alias convention | `@/` imports | Next.js default; avoids brittle relative paths |
| 3 | Tailwind CSS | Include | Zero-config utilities; faster prototyping than raw CSS |
| 4 | TaskCard component type | Client Component | Parent (TaskList) is already Client Component; no Server Component benefit |
| 5 | Edit page HydrationBoundary | Not needed | Direct serializable prop passing is the preferred Next.js data pattern |
| 6 | Optimistic updates for delete | Defer | In-memory store is instant (<1ms); complexity not justified for prototype |
| 7 | Cursor format validation | Loose `z.string().optional()` | Server-generated, not user input; try-catch on decode is sufficient |
| 8 | Query key matching | `prefetchInfiniteQuery` with explicit tRPC key structure | Verified pattern for tRPC v11; key shape tested during Phase 8 |
| 9 | Server-side caller export | Factory function (`createServerCaller`) | Per-request convention; forward-compatible with future auth/session |
| 10 | sonner toast configuration | Defaults + `richColors` | One-line config; all other defaults work out of the box |

---

### Critical Files for Implementation

- `R&D_TaskArtefact--02.01.md` -- The authoritative architectural document from which all implementation details derive.
- `src/types/task.ts` -- Shared types and Zod schemas used by both server and client.
- `src/server/store/InMemoryTaskStore.ts` -- Core data layer with all CRUD operations and cursor-based pagination logic.
- `src/server/trpc/routers/taskRouter.ts` -- All five tRPC procedures (create, list, update, delete, getById) implementing the API contract.
- `src/server/trpc/caller.ts` -- Server-side tRPC caller factory function, used by Server Components for SSR data fetching.
- `src/components/providers/TRPCProvider.tsx` -- Client-side tRPC + React Query + sonner provider; the bridge between server and client.
- `src/app/page.tsx` -- Server Component implementing SSR prefetch with HydrationBoundary, the most architecturally complex page.
