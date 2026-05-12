import { describe, expect, it } from "vitest";

import { registrationSchema, registrationUpdateSchema } from "@/lib/validation";

describe("registration validation", () => {
  it("accepts a complete registration payload", () => {
    const parsed = registrationSchema.safeParse({
      name: "Ada Lovelace",
      email: "ada@example.com",
      phone: "0812345678",
      organization: "Analytical Engine Co.",
      jobTitle: "Engineer",
      dietaryRequirements: "",
      notes: "",
      password: "password123",
      confirmPassword: "password123"
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects mismatched password confirmation", () => {
    const parsed = registrationSchema.safeParse({
      name: "Ada Lovelace",
      email: "ada@example.com",
      phone: "0812345678",
      organization: "",
      jobTitle: "",
      dietaryRequirements: "",
      notes: "",
      password: "password123",
      confirmPassword: "password456"
    });

    expect(parsed.success).toBe(false);
  });

  it("accepts editable fields without requiring a password", () => {
    const parsed = registrationUpdateSchema.safeParse({
      name: "Ada Lovelace",
      email: "ada@example.com",
      phone: "0812345678",
      organization: "",
      jobTitle: "",
      dietaryRequirements: "Vegetarian",
      notes: "Needs invoice"
    });

    expect(parsed.success).toBe(true);
  });
});
