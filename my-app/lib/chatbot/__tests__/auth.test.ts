import { describe, it, expect, beforeEach } from "vitest";
import { requireApiKey } from "../auth";

const reqWith = (headers: Record<string, string> = {}) =>
  new Request("http://localhost/x", { headers });

describe("requireApiKey", () => {
  beforeEach(() => {
    process.env.CHATBOT_API_KEY = "test-key";
  });

  it("rechaza sin header → 401", async () => {
    const res = requireApiKey(reqWith({}));
    expect(res?.status).toBe(401);
  });

  it("rechaza con header equivocado → 401", async () => {
    const res = requireApiKey(reqWith({ "x-api-key": "otra" }));
    expect(res?.status).toBe(401);
  });

  it("rechaza con header de distinto largo → 401", async () => {
    const res = requireApiKey(reqWith({ "x-api-key": "test-key-extra" }));
    expect(res?.status).toBe(401);
  });

  it("acepta con header correcto → null", () => {
    const res = requireApiKey(reqWith({ "x-api-key": "test-key" }));
    expect(res).toBeNull();
  });

  it("503 si la env no está definida", () => {
    delete process.env.CHATBOT_API_KEY;
    const res = requireApiKey(reqWith({ "x-api-key": "test-key" }));
    expect(res?.status).toBe(503);
  });
});
