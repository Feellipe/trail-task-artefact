import { Task } from "@/types/task";

interface ListResult {
  items: Task[];
  nextCursor: string | null;
}

class InMemoryTaskStore {
  private store = new Map<string, Task>();

  create(titulo: string, descricao?: string | null): Task {
    const task: Task = {
      id: crypto.randomUUID(),
      titulo,
      descricao: descricao ?? null,
      createdAt: new Date().toISOString(),
    };
    this.store.set(task.id, task);
    console.log(`[store] created task id=${task.id} titulo="${task.titulo}"`);
    return task;
  }

  getById(id: string): Task | undefined {
    const task = this.store.get(id);
    console.log(`[store] getById id=${id} => ${task ? "found" : "not found"}`);
    return task;
  }

  update(id: string, data: Partial<Pick<Task, "titulo" | "descricao">>): Task | undefined {
    const existing = this.store.get(id);
    if (!existing) {
      console.log(`[store] update id=${id} => not found`);
      return undefined;
    }

    if (data.titulo !== undefined) existing.titulo = data.titulo;
    if (data.descricao !== undefined) existing.descricao = data.descricao;

    console.log(`[store] updated task id=${id} titulo="${existing.titulo}"`);
    return existing;
  }

  delete(id: string): boolean {
    const deleted = this.store.delete(id);
    console.log(`[store] deleted task id=${id} => ${deleted ? "success" : "not found"}`);
    return deleted;
  }

  list(cursor?: string, limit: number = 10): ListResult {
    let tasks = Array.from(this.store.values());

    if (cursor) {
      try {
        const decoded = Buffer.from(cursor, "base64").toString("utf-8");
        tasks = tasks.filter((t) => t.createdAt < decoded);
      } catch {
        // cursor invalido — retorna primeira pagina
      }
    }

    tasks.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const items = tasks.slice(0, limit);
    const nextCursor =
      items.length === limit && items[limit - 1]
        ? Buffer.from(items[limit - 1].createdAt).toString("base64")
        : null;

    console.log(`[store] list cursor=${cursor ?? "none"} limit=${limit} => ${items.length} items, nextCursor=${nextCursor ?? "none"}`);
    return { items, nextCursor };
  }
}

export const inMemoryTaskStore = new InMemoryTaskStore();
