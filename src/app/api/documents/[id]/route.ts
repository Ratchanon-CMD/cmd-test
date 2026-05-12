import { NextRequest } from "next/server";

import {
  findRegistrationDocument,
  loadRegistrationDocument,
} from "@/lib/registration-store";
import { jsonError } from "@/lib/responses";
import {
  ADMIN_COOKIE,
  SUBMISSION_COOKIE,
  verifySessionToken,
} from "@/lib/session";

export const runtime = "nodejs";

type RouteParams = {
  params: {
    id: string;
  };
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  const lookup = await findRegistrationDocument(params.id);

  if (!lookup) {
    return jsonError("Document not found", 404);
  }

  const adminSubject = verifySessionToken(
    request.cookies.get(ADMIN_COOKIE)?.value,
    "admin",
  )?.subject;
  const submissionSubject = verifySessionToken(
    request.cookies.get(SUBMISSION_COOKIE)?.value,
    "submission",
  )?.subject;
  const canDownload =
    Boolean(adminSubject) ||
    submissionSubject === lookup.registration.referenceCode;

  if (!canDownload) {
    return jsonError("Unauthorized", 401);
  }

  const loaded = await loadRegistrationDocument(params.id);

  if (!loaded) {
    return jsonError("Document not found", 404);
  }

  return new Response(new Uint8Array(loaded.buffer), {
    headers: {
      "Content-Type": loaded.document.mimeType,
      "Content-Disposition": `attachment; filename="${encodeURIComponent(
        loaded.document.fileName,
      )}"`,
    },
  });
}
