import { NextRequest } from "next/server";

import {
  findRegistrationByReferenceCode,
  serializeStoredRegistration,
  updateRegistrationByReferenceCode,
} from "@/lib/registration-store";
import { jsonError, jsonSuccess } from "@/lib/responses";
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

  const registration = await findRegistrationByReferenceCode(referenceCode);

  if (!registration) {
    return jsonError("Registration not found", 404);
  }

  return jsonSuccess(serializeStoredRegistration(registration));
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
      issues: parsed.error.flatten().fieldErrors,
    });
  }

  const registration = await updateRegistrationByReferenceCode(
    referenceCode,
    parsed.data,
  );

  if (!registration) {
    return jsonError("Registration not found", 404);
  }

  return jsonSuccess(registration, "Registration updated");
}
