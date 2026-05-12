import { NextRequest } from "next/server";

import { isUploadedFile, removeStoredDocument, saveUploadedDocuments } from "@/lib/files";
import { prisma } from "@/lib/db";
import { jsonError, jsonSuccess } from "@/lib/responses";
import { serializeRegistration } from "@/lib/serializers";
import { SUBMISSION_COOKIE, verifySessionToken } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SUBMISSION_COOKIE)?.value;
  const referenceCode = verifySessionToken(token, "submission")?.subject;

  if (!referenceCode) {
    return jsonError("Unauthorized", 401);
  }

  const formData = await request.formData();
  const files = formData.getAll("documents").filter(isUploadedFile);
  const replaceExisting = formData.get("replaceExisting") === "true";

  if (files.length === 0) {
    return jsonError("No documents uploaded", 422);
  }

  const existingRegistration = await prisma.registration.findUnique({
    where: { referenceCode },
    include: { documents: true }
  });

  if (!existingRegistration) {
    return jsonError("Registration not found", 404);
  }

  const savedDocuments = await saveUploadedDocuments(files, referenceCode);

  if (replaceExisting) {
    await Promise.all(
      existingRegistration.documents.map((document) =>
        removeStoredDocument(document.storagePath)
      )
    );
    await prisma.registrationDocument.deleteMany({
      where: {
        registrationId: existingRegistration.id
      }
    });
  }

  const registration = await prisma.registration.update({
    where: { referenceCode },
    data: {
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

  return jsonSuccess(serializeRegistration(registration), "Documents updated");
}
