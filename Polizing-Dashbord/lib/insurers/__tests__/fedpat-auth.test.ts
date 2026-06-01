import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getAccessToken,
  clearTokenCache,
} from "../providers/federacion-patronal/auth";
import type { FedPatConfig } from "../config";

const config: FedPatConfig = {
  baseUrl: "https://api-sandbox.fedpat.com.ar",
  clientId: "id",
  clientSecret: "secret",
  username: "u",
  password: "p",
};

function mockTokenSequence() {
  let n = 0;
  const fn = vi.fn(async () => {
    n += 1;
    return new Response(
      JSON.stringify({ access_token: `T${n}`, expires_in: 3600 }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

beforeEach(() => clearTokenCache());
afterEach(() => vi.unstubAllGlobals());

describe("getAccessToken (cache)", () => {
  it("cachea el token entre llamadas", async () => {
    const fn = mockTokenSequence();
    const t1 = await getAccessToken(config);
    const t2 = await getAccessToken(config);
    expect(t1).toBe("T1");
    expect(t2).toBe("T1");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("refresca cuando se fuerza", async () => {
    const fn = mockTokenSequence();
    await getAccessToken(config);
    const t2 = await getAccessToken(config, true);
    expect(t2).toBe("T2");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("usa Basic Auth y password grant", async () => {
    const fn = mockTokenSequence();
    await getAccessToken(config);
    const [, init] = fn.mock.calls[0] as unknown as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe(
      `Basic ${Buffer.from("id:secret").toString("base64")}`,
    );
    expect(String(init.body)).toContain("grant_type=password");
  });
});
