import type { Prisma } from "@prisma/client";

import type { RegistrationView } from "@/lib/types";

export type RegistrationWithDocuments = Prisma.RegistrationGetPayload<{
  include: {
    documents: {
      orderBy: {
        uploadedAt: "desc";
      };
    };
  };
}>;

export function serializeRegistration(
  registration: RegistrationWithDocuments
): RegistrationView {
  return {
    id: registration.id,
    referenceCode: registration.referenceCode,
    name: registration.name,
    email: registration.email,
    phone: registration.phone,
    organization: registration.organization,
    jobTitle: registration.jobTitle,
    dietaryRequirements: registration.dietaryRequirements,
    notes: registration.notes,
    createdAt: registration.createdAt.toISOString(),
    updatedAt: registration.updatedAt.toISOString(),
    documents: registration.documents.map((document) => ({
      id: document.id,
      fileName: document.fileName,
      mimeType: document.mimeType,
      size: document.size,
      uploadedAt: document.uploadedAt.toISOString()
    }))
  };
}
