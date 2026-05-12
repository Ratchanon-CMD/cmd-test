import { NextRequest } from "next/server";

import { isUploadedFile } from "@/lib/files";
import { updateRegistrationDocuments } from "@/lib/registration-store";
import { jsonError, jsonSuccess } from "@/lib/responses";
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

  const registration = await updateRegistrationDocuments(
    referenceCode,
    files,
    replaceExisting,
  );

  if (!registration) {
    return jsonError("Registration not found", 404);
  }

  return jsonSuccess(registration, "Documents updated");
}
