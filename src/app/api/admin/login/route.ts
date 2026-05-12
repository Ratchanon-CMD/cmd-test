import { NextRequest } from "next/server";

import { verifyAdminCredentials } from "@/lib/admin";
import { jsonError, jsonSuccess } from "@/lib/responses";
import { adminLoginSchema } from "@/lib/validation";
import { ADMIN_COOKIE, createSessionToken } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = adminLoginSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError("Invalid login data", 422, {
      issues: parsed.error.flatten().fieldErrors
    });
  }

  if (!verifyAdminCredentials(parsed.data.username, parsed.data.password)) {
    return jsonError("Invalid username or password", 401);
  }

  const response = jsonSuccess({}, "Admin login success");
  response.cookies.set(
    ADMIN_COOKIE,
    createSessionToken("admin", parsed.data.username, 60 * 60 * 8),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8
    }
  );

  return response;
}
