import { NextRequest } from "next/server";

import { isUploadedFile } from "@/lib/files";
import { createRegistration } from "@/lib/registration-store";
import { jsonError, jsonSuccess } from "@/lib/responses";
import { formValue, registrationSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const parsed = registrationSchema.safeParse({
    name: formValue(formData, "name"),
    email: formValue(formData, "email"),
    phone: formValue(formData, "phone"),
    organization: formValue(formData, "organization"),
    jobTitle: formValue(formData, "jobTitle"),
    dietaryRequirements: formValue(formData, "dietaryRequirements"),
    notes: formValue(formData, "notes"),
    password: formValue(formData, "password"),
    confirmPassword: formValue(formData, "confirmPassword"),
  });

  if (!parsed.success) {
    return jsonError("Invalid registration data", 422, {
      issues: parsed.error.flatten().fieldErrors,
    });
  }

  const uploadedFiles = formData.getAll("documents").filter(isUploadedFile);

  try {
    const registration = await createRegistration(parsed.data, uploadedFiles);

    return jsonSuccess(registration, "Registration submitted", 201);
  } catch (error) {
    console.error("Could not create registration", error);
    return jsonError("Could not create registration", 500);
  }
}
