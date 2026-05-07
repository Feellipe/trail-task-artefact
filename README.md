# TaskArtefact

A task management system (CRUD) built with Next.js 15, tRPC v11, and Tailwind CSS v4. Features infinite scroll, server-side rendering, streaming, and comprehensive error boundaries. Uses an in-memory store for zero-dependency prototyping.

## Tech Stack

- **Framework:** Next.js 15 (App Router, Server Components, Turbopack)
- **API Layer:** tRPC v11 with React Query v5
- **Validation:** Zod
- **Serialization:** SuperJSON
- **Styling:** Tailwind CSS v4
- **Notifications:** sonner (toast messages)
- **Language:** TypeScript 5

## Features

- Full CRUD operations for tasks (create, read, update, delete)
- Cursor-based pagination with infinite scroll
- Server-side rendering (SSR) with query prefetching and hydration
- Streaming via React Suspense boundaries with skeleton loaders
- Layered error boundaries (root, layout, and route-specific)
- Optimistic cache invalidation with React Query
- Type-safe end-to-end API via tRPC

## Getting Started

### Prerequisites

- Node.js 18.17 or later

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Production Build

```bash
npm run build
npm run start
```

### Linting

```bash
npm run lint
```

## Project Structure

```
src/
  app/                    # Next.js App Router pages and layouts
    api/trpc/[trpc]/      # tRPC API route handler
    tasks/                # Task-related pages (new, edit)
  components/             # React components
    providers/            # Client-side providers (tRPC, React Query, sonner)
    task/                 # Task-specific components
    ui/                   # Shared UI components
  server/                 # Server-only code
    trpc/                 # tRPC initialization, context, routers
    store/                # In-memory task store
  lib/                    # Shared utilities and client configuration
  types/                  # TypeScript interfaces and Zod schemas
  hooks/                  # Custom React hooks
```

## API Reference

All endpoints are exposed through tRPC under the `task` namespace.

| Procedure | Type | Input | Output | Description |
|-----------|------|-------|--------|-------------|
| `task.create` | Mutation | `{ titulo: string, descricao?: string \| null }` | `Task` | Creates a new task |
| `task.list` | Query | `{ cursor?: string, limit?: number }` | `{ items: Task[], nextCursor: string \| null }` | Lists tasks with cursor pagination |
| `task.update` | Mutation | `{ id: string, titulo?: string, descricao?: string \| null }` | `Task` | Updates an existing task |
| `task.delete` | Mutation | `{ id: string }` | `{ success: boolean }` | Deletes a task by ID |
| `task.getById` | Query | `{ id: string }` | `Task` | Retrieves a single task by ID |

### Task Interface

```typescript
interface Task {
  id: string;            // UUID
  titulo: string;        // max 200 characters
  descricao: string | null;  // max 2000 characters, null when absent
  createdAt: string;     // ISO 8601 datetime
}
```

## Important Notes

- **In-memory store:** All data is stored in memory using a JavaScript `Map`. All data is lost when the server restarts. This project is intended as a prototype and demonstration, not for production use.
- **No authentication:** The application does not include any authentication or authorization mechanisms.
- **Demo project:** TaskArtefact is a reference implementation showcasing the integration of Next.js 15 App Router with tRPC v11, React Query, and Tailwind CSS v4.
