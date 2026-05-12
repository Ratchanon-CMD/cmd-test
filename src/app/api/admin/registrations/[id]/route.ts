import { NextRequest } from "next/server";

import { prisma } from "@/lib/db";
import { jsonError, jsonSuccess } from "@/lib/responses";
import { serializeRegistration } from "@/lib/serializers";
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
    },
    include: {
      documents: {
        orderBy: {
          uploadedAt: "desc"
        }
      }
    }
  });

  if (!registration) {
    return jsonError("Registration not found", 404);
  }

  return jsonSuccess(serializeRegistration(registration));
}
