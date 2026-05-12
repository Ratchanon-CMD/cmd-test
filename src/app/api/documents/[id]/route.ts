import { NextRequest } from "next/server";

import { prisma } from "@/lib/db";
import { loadStoredDocument } from "@/lib/files";
import { jsonError } from "@/lib/responses";
import {
  ADMIN_COOKIE,
  SUBMISSION_COOKIE,
  verifySessionToken
} from "@/lib/session";

export const runtime = "nodejs";

type RouteParams = {
  params: {
    id: string;
  };
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  const document = await prisma.registrationDocument.findUnique({
    where: { id: params.id },
    include: {
      registration: true
    }
  });

  if (!document) {
    return jsonError("Document not found", 404);
  }

  const adminSubject = verifySessionToken(
    request.cookies.get(ADMIN_COOKIE)?.value,
    "admin"
  )?.subject;
  const submissionSubject = verifySessionToken(
    request.cookies.get(SUBMISSION_COOKIE)?.value,
    "submission"
  )?.subject;
  const canDownload =
    Boolean(adminSubject) || submissionSubject === document.registration.referenceCode;

  if (!canDownload) {
    return jsonError("Unauthorized", 401);
  }

  const loaded = await loadStoredDocument(
    document.storagePath,
    document.fileName,
    document.mimeType
  );

  return new Response(new Uint8Array(loaded.buffer), {
    headers: {
      "Content-Type": loaded.mimeType,
      "Content-Disposition": `attachment; filename="${encodeURIComponent(
        loaded.fileName
      )}"`
    }
  });
}
