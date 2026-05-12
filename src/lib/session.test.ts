import { describe, expect, it } from "vitest";

import { createSessionToken, verifySessionToken } from "@/lib/session";

describe("session tokens", () => {
  it("verifies signed tokens for the expected session kind", () => {
    process.env.SESSION_SECRET = "test-session-secret";
    const token = createSessionToken("submission", "REG-2026-ABC123", 60);

    expect(verifySessionToken(token, "submission")?.subject).toBe(
      "REG-2026-ABC123"
    );
    expect(verifySessionToken(token, "admin")).toBeNull();
  });

  it("rejects tampered tokens", () => {
    process.env.SESSION_SECRET = "test-session-secret";
    const token = createSessionToken("admin", "admin", 60);
    const [payload, signature] = token.split(".");
    const tampered = `${payload.slice(0, -1)}x.${signature}`;

    expect(verifySessionToken(tampered, "admin")).toBeNull();
  });
});
