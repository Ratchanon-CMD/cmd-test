import { NextRequest } from "next/server";

import {
  listRegistrations,
  serializeStoredRegistration,
} from "@/lib/registration-store";
import { jsonError, jsonSuccess } from "@/lib/responses";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/session";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const admin = verifySessionToken(
    request.cookies.get(ADMIN_COOKIE)?.value,
    "admin",
  );

  if (!admin) {
    return jsonError("Unauthorized", 401);
  }

  const query = request.nextUrl.searchParams.get("q")?.trim();
  const registrations = await listRegistrations(query);

  return jsonSuccess({
    registrations: registrations.map(serializeStoredRegistration),
  });
}
