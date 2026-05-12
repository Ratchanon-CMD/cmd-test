import { describe, expect, it } from "vitest";

import { createNameTagPdf } from "@/lib/pdf";

describe("createNameTagPdf", () => {
  it("creates a PDF document buffer", async () => {
    const buffer = await createNameTagPdf({
      eventName: "CMD Event Registration",
      referenceCode: "REG-2026-ABC123",
      name: "Ada Lovelace",
      organization: "Analytical Engine Co.",
      jobTitle: "Engineer"
    });

    expect(buffer.subarray(0, 4).toString()).toBe("%PDF");
    expect(buffer.length).toBeGreaterThan(1000);
  });
});
