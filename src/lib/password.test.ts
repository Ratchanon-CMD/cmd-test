import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "@/lib/password";

describe("password helpers", () => {
  it("hashes passwords and verifies only the matching password", async () => {
    const hash = await hashPassword("secure-password");

    expect(hash).not.toBe("secure-password");
    await expect(verifyPassword("secure-password", hash)).resolves.toBe(true);
    await expect(verifyPassword("wrong-password", hash)).resolves.toBe(false);
  });
});
