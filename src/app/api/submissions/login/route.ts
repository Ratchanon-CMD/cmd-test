import { NextRequest } from "next/server";

import { verifyPassword } from "@/lib/password";
import {
  findRegistrationByReferenceCode,
  serializeStoredRegistration,
} from "@/lib/registration-store";
import { jsonError, jsonSuccess } from "@/lib/responses";
import { createSessionToken, SUBMISSION_COOKIE } from "@/lib/session";
import { submissionLoginSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = submissionLoginSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError("Invalid login data", 422, {
      issues: parsed.error.flatten().fieldErrors,
    });
  }

  const registration = await findRegistrationByReferenceCode(
    parsed.data.referenceCode,
  );

  if (!registration) {
    return jsonError("Invalid reference code or password", 401);
  }

  const passwordMatches = await verifyPassword(
    parsed.data.password,
    registration.passwordHash,
  );

  if (!passwordMatches) {
    return jsonError("Invalid reference code or password", 401);
  }

  const response = jsonSuccess(
    serializeStoredRegistration(registration),
    "Submission unlocked",
  );

  response.cookies.set(
    SUBMISSION_COOKIE,
    createSessionToken("submission", registration.referenceCode, 60 * 60 * 4),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 4,
    },
  );

  return response;
}
