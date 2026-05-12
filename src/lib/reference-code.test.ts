import { describe, expect, it } from "vitest";

import { generateReferenceCode } from "@/lib/reference-code";

describe("generateReferenceCode", () => {
  it("generates readable event reference codes with the current year", () => {
    const referenceCode = generateReferenceCode(new Date("2026-05-12T00:00:00Z"));

    expect(referenceCode).toMatch(/^REG-2026-[A-Z2-9]{6}$/);
  });

  it("generates different values across calls", () => {
    const codes = new Set(
      Array.from({ length: 100 }, () =>
        generateReferenceCode(new Date("2026-05-12T00:00:00Z"))
      )
    );

    expect(codes.size).toBeGreaterThan(95);
  });
});
