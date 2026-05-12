import { z } from "zod";

const requiredText = z.string().trim().min(1, "Required");

export const registrationSchema = z
  .object({
    name: requiredText.min(2, "Name is too short"),
    email: requiredText.email("Invalid email"),
    phone: requiredText.min(6, "Phone is too short"),
    organization: z.string().trim().optional().default(""),
    jobTitle: z.string().trim().optional().default(""),
    dietaryRequirements: z.string().trim().optional().default(""),
    notes: z.string().trim().optional().default(""),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm password is required")
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Password confirmation does not match",
    path: ["confirmPassword"]
  });

export const registrationUpdateSchema = z.object({
  name: requiredText.min(2, "Name is too short"),
  email: requiredText.email("Invalid email"),
  phone: requiredText.min(6, "Phone is too short"),
  organization: z.string().trim().optional().default(""),
  jobTitle: z.string().trim().optional().default(""),
  dietaryRequirements: z.string().trim().optional().default(""),
  notes: z.string().trim().optional().default("")
});

export const submissionLoginSchema = z.object({
  referenceCode: requiredText,
  password: requiredText
});

export const adminLoginSchema = z.object({
  username: requiredText,
  password: requiredText
});

export type RegistrationInput = z.infer<typeof registrationSchema>;
export type RegistrationUpdateInput = z.infer<typeof registrationUpdateSchema>;

export function formValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
