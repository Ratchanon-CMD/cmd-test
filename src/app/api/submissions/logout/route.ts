import { jsonSuccess } from "@/lib/responses";
import { SUBMISSION_COOKIE } from "@/lib/session";

export async function POST() {
  const response = jsonSuccess({}, "Logged out");
  response.cookies.set(SUBMISSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
  return response;
}
