import { NextRequest } from "next/server";

import { prisma } from "@/lib/db";
import { jsonError, jsonSuccess } from "@/lib/responses";
import { serializeRegistration } from "@/lib/serializers";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/session";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const admin = verifySessionToken(
    request.cookies.get(ADMIN_COOKIE)?.value,
    "admin"
  );

  if (!admin) {
    return jsonError("Unauthorized", 401);
  }

  const query = request.nextUrl.searchParams.get("q")?.trim();
  const registrations = await prisma.registration.findMany({
    where: query
      ? {
          OR: [
            { referenceCode: { contains: query } },
            { name: { contains: query } },
            { email: { contains: query } }
          ]
        }
      : undefined,
    include: {
      documents: {
        orderBy: {
          uploadedAt: "desc"
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  return jsonSuccess({
    registrations: registrations.map(serializeRegistration)
  });
}
