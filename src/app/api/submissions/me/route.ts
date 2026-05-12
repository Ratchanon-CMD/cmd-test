import { NextRequest } from "next/server";

import { prisma } from "@/lib/db";
import { jsonError, jsonSuccess } from "@/lib/responses";
import { serializeRegistration } from "@/lib/serializers";
import { SUBMISSION_COOKIE, verifySessionToken } from "@/lib/session";
import { registrationUpdateSchema } from "@/lib/validation";

export const runtime = "nodejs";

function getReferenceCode(request: NextRequest): string | null {
  const token = request.cookies.get(SUBMISSION_COOKIE)?.value;
  return verifySessionToken(token, "submission")?.subject ?? null;
}

export async function GET(request: NextRequest) {
  const referenceCode = getReferenceCode(request);

  if (!referenceCode) {
    return jsonError("Unauthorized", 401);
  }

  const registration = await prisma.registration.findUnique({
    where: { referenceCode },
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

export async function PATCH(request: NextRequest) {
  const referenceCode = getReferenceCode(request);

  if (!referenceCode) {
    return jsonError("Unauthorized", 401);
  }

  const body = await request.json();
  const parsed = registrationUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError("Invalid registration data", 422, {
      issues: parsed.error.flatten().fieldErrors
    });
  }

  const registration = await prisma.registration.update({
    where: { referenceCode },
    data: parsed.data,
    include: {
      documents: {
        orderBy: {
          uploadedAt: "desc"
        }
      }
    }
  });

  return jsonSuccess(serializeRegistration(registration), "Registration updated");
}
