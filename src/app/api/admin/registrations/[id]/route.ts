import { NextRequest } from "next/server";

import {
  findRegistrationById,
  serializeStoredRegistration,
} from "@/lib/registration-store";
import { jsonError, jsonSuccess } from "@/lib/responses";
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
    "admin",
  );

  if (!admin) {
    return jsonError("Unauthorized", 401);
  }

  const registration = await findRegistrationById(params.id);

  if (!registration) {
    return jsonError("Registration not found", 404);
  }

  return jsonSuccess(serializeStoredRegistration(registration));
}
