import { NextRequest } from "next/server";

import { prisma } from "@/lib/db";
import { createNameTagPdf } from "@/lib/pdf";
import { jsonError } from "@/lib/responses";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/session";

export const runtime = "nodejs";

type RouteParams = {
  params: {
    id: string;
  };
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  const admin = verifySessionToken(
    request.cookies.get(ADMIN_COOKIE)?.value,
    "admin"
  );

  if (!admin) {
    return jsonError("Unauthorized", 401);
  }

  const registration = await prisma.registration.findUnique({
    where: {
      id: params.id
    }
  });

  if (!registration) {
    return jsonError("Registration not found", 404);
  }

  const pdf = await createNameTagPdf({
    eventName: process.env.NEXT_PUBLIC_APP_NAME || "CMD Event Registration",
    referenceCode: registration.referenceCode,
    name: registration.name,
    organization: registration.organization,
    jobTitle: registration.jobTitle
  });

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="name-tag-${registration.referenceCode}.pdf"`
    }
  });
}
