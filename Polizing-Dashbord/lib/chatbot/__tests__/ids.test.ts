import { describe, it, expect } from "vitest";

import { buildPayReference } from "../ids";

describe("buildPayReference", () => {
  it("padea 5 dígitos", () => {
    expect(buildPayReference(1)).toBe("PAY-00001");
    expect(buildPayReference(123)).toBe("PAY-00123");
    expect(buildPayReference(99999)).toBe("PAY-99999");
  });

  it("admite ids más grandes que 5 dígitos sin truncar", () => {
    expect(buildPayReference(123456)).toBe("PAY-123456");
  });
});
