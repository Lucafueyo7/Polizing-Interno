import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => {
  const unstable_cache = vi.fn((getter: any, _keyParts: string[], _options: any) => {
    const store = new Map<string, unknown>();
    return async (...args: unknown[]) => {
      const key = JSON.stringify(args);
      if (!store.has(key)) {
        store.set(key, await getter(...args));
      }
      return store.get(key);
    };
  });

  return {
    unstable_cache,
    revalidateTag: vi.fn(),
  };
});

import { revalidateTag, unstable_cache } from "next/cache";
import {
  CACHE_TAGS,
  DEFAULT_CACHE_TTL_SECONDS,
  DOMAIN_CACHE_TTL_SECONDS,
  createCachedGetter,
} from "../cache";

describe("createCachedGetter", () => {
  beforeEach(() => vi.clearAllMocks());

  it("caches async getters with the same input", async () => {
    let counter = 0;
    const getter = vi.fn(async (id: number) => {
      counter += 1;
      return { id, counter };
    });

    const cached = createCachedGetter(getter, ["polizas", "by-id", 1], CACHE_TAGS.polizas);

    await expect(cached(1)).resolves.toEqual({ id: 1, counter: 1 });
    await expect(cached(1)).resolves.toEqual({ id: 1, counter: 1 });
    expect(counter).toBe(1);
    expect(getter).toHaveBeenCalledTimes(1);
    expect(unstable_cache).toHaveBeenCalledWith(
      getter,
      ["polizas", "by-id", "1"],
      { tags: [CACHE_TAGS.polizas], revalidate: DEFAULT_CACHE_TTL_SECONDS },
    );
  });

  it("uses domain TTL defaults and explicit overrides", async () => {
    const getter = vi.fn(async () => "ok");

    createCachedGetter(getter, ["kpis", "summary"], CACHE_TAGS.kpis);
    createCachedGetter(getter, ["clientes", "summary"], CACHE_TAGS.clientes, 45);

    expect(unstable_cache).toHaveBeenNthCalledWith(
      1,
      getter,
      ["kpis", "summary"],
      { tags: [CACHE_TAGS.kpis], revalidate: DOMAIN_CACHE_TTL_SECONDS.kpis },
    );
    expect(unstable_cache).toHaveBeenNthCalledWith(
      2,
      getter,
      ["clientes", "summary"],
      { tags: [CACHE_TAGS.clientes], revalidate: 45 },
    );
  });

  it("re-exports revalidateTag", () => {
    revalidateTag(CACHE_TAGS.polizas, "max");
    expect(revalidateTag).toHaveBeenCalledWith(CACHE_TAGS.polizas, "max");
  });
});
