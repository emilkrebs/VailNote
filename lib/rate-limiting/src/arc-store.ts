// deno-lint-ignore-file require-await
import { ArcEntry } from "./arc-rate-limiter.ts";

/** Interface for the ARC store */
export interface ArcStore {
  /** Retrieve an entry by token */
  get(token: string): Promise<ArcEntry | undefined>;
  /** Set or update an entry by token */
  set(token: string, entry: ArcEntry): Promise<void>;
  /** Delete an entry by token */
  delete(token: string): Promise<void>;

  /**
   * Get all entries in the store
   * @example
   * for await (const [token, entry] of store.entries()) {
   *   console.log(token, entry);
   * }
   */
  entries?(): AsyncIterable<[string, ArcEntry]>;
}

/** In-memory implementation for the Anonymous Rate-Limited Credentials (ARC) system store
 * @example
 * const store = new InMemoryArcStore();
 * await store.set("token1", { count: 1, resetTime: Date.now() + 10000, blocked: false });
 * const entry = await store.get("token1");
 * console.log(entry);
 */
export class InMemoryArcStore implements ArcStore {
  private store = new Map<string, ArcEntry>();

  async get(token: string): Promise<ArcEntry | undefined> {
    return this.store.get(token);
  }
  async set(token: string, entry: ArcEntry): Promise<void> {
    this.store.set(token, entry);
  }
  async delete(token: string): Promise<void> {
    this.store.delete(token);
  }

  async *entries(): AsyncIterable<[string, ArcEntry]> {
    for (const e of this.store.entries()) yield e;
  }
}

export class DenoKVArcStore implements ArcStore {
  private kv?: Deno.Kv;

  async init(path?: string): Promise<DenoKVArcStore> {
    this.kv = await Deno.openKv(path || undefined);
    return this;
  }

  async close(): Promise<void> {
    if (this.kv) {
      await this.kv.close();
    }
  }

  private getKey(token: string): [string, string] {
    return ["arc-rate-limiter", token];
  }

  async get(token: string): Promise<ArcEntry | undefined> {
    if (!this.kv) {
      throw new Error("Deno KV not initialized");
    }
    const result = await this.kv.get<ArcEntry>(this.getKey(token));
    return result.value ?? undefined;
  }

  async set(token: string, entry: ArcEntry): Promise<void> {
    if (!this.kv) {
      throw new Error("Deno KV not initialized");
    }
    await this.kv.set(this.getKey(token), entry);
  }

  async delete(token: string): Promise<void> {
    if (!this.kv) {
      throw new Error("Deno KV not initialized");
    }
    await this.kv.delete(this.getKey(token));
  }

  async clear(): Promise<void> {
    if (!this.kv) {
      throw new Error("Deno KV not initialized");
    }
    const iter = this.kv.list({ prefix: ["arc-rate-limiter"] });
    for await (const res of iter) {
      await this.kv.delete(res.key);
    }
  }

  async *entries(): AsyncIterable<[string, ArcEntry]> {
    if (!this.kv) {
      throw new Error("Deno KV not initialized");
    }
    const iter = this.kv.list<ArcEntry>({ prefix: ["arc-rate-limiter"] });
    for await (const res of iter) {
      if (res.value) {
        if (!res.key[1] || typeof res.key[1] !== "string") {
          throw new Error("Invalid key format in Deno KV store");
        }
        const token = res.key[1] as string;
        yield [token, res.value];
      }
    }
  }
}
