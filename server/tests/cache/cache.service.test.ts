import { ICacheClient, CacheService } from "../../src/cache";

class InMemoryCacheClient implements ICacheClient {
  private readonly store = new Map<string, unknown>();

  async get<T>(key: string): Promise<T | null> {
    return (this.store.get(key) as T | undefined) ?? null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    this.store.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async deleteMany(keys: string[]): Promise<void> {
    keys.forEach((key) => this.store.delete(key));
  }

  async clear(): Promise<void> {
    this.store.clear();
  }
}

describe("CacheService", () => {
  beforeEach(() => {
    CacheService.reset();
  });

  afterEach(() => {
    CacheService.reset();
  });

  it("returns null by default when no cache client is configured", async () => {
    const result = await CacheService.get("practices:all");

    expect(result).toBeNull();
  });

  it("uses the configured cache client", async () => {
    CacheService.configure(new InMemoryCacheClient());

    await CacheService.set("practices:1", { practiceId: 1 });

    const result = await CacheService.get<{ practiceId: number }>(
      "practices:1"
    );

    expect(result).toEqual({ practiceId: 1 });
  });

  it("loads and caches a missing value", async () => {
    CacheService.configure(new InMemoryCacheClient());
    const loader = jest.fn(async () => ["cached result"]);

    const firstResult = await CacheService.getOrSet("practices:all", loader);
    const secondResult = await CacheService.getOrSet("practices:all", loader);

    expect(firstResult).toEqual(["cached result"]);
    expect(secondResult).toEqual(["cached result"]);
    expect(loader).toHaveBeenCalledTimes(1);
  });
});
