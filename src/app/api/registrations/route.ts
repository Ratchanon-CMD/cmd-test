import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";

import { saveUploadedDocuments, isUploadedFile } from "@/lib/files";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/db";
import { generateReferenceCode } from "@/lib/reference-code";
import { jsonError, jsonSuccess } from "@/lib/responses";
import { serializeRegistration } from "@/lib/serializers";
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
    confirmPassword: formValue(formData, "confirmPassword")
  });

  if (!parsed.success) {
    return jsonError("Invalid registration data", 422, {
      issues: parsed.error.flatten().fieldErrors
    });
  }

  const uploadedFiles = formData.getAll("documents").filter(isUploadedFile);
  const passwordHash = await hashPassword(parsed.data.password);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const referenceCode = generateReferenceCode();
    const savedDocuments = await saveUploadedDocuments(uploadedFiles, referenceCode);

    try {
      const registration = await prisma.registration.create({
        data: {
          referenceCode,
          name: parsed.data.name,
          email: parsed.data.email,
          phone: parsed.data.phone,
          organization: parsed.data.organization,
          jobTitle: parsed.data.jobTitle,
          dietaryRequirements: parsed.data.dietaryRequirements,
          notes: parsed.data.notes,
          passwordHash,
          documents: {
            create: savedDocuments
          }
        },
        include: {
          documents: {
            orderBy: {
              uploadedAt: "desc"
            }
          }
        }
      });

      return jsonSuccess(
        serializeRegistration(registration),
        "Registration submitted",
        201
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        continue;
      }

      return jsonError("Could not create registration", 500);
    }
  }

  return jsonError("Could not generate a unique reference code", 500);
}
