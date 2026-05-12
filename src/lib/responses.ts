import { NextResponse } from "next/server";

export function jsonSuccess<T>(data: T, message = "Success", status = 200): NextResponse {
  return NextResponse.json(
    {
      success: true,
      message,
      data
    },
    { status }
  );
}

export function jsonError(
  message: string,
  status = 400,
  data: Record<string, unknown> = {}
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      message,
      data
    },
    { status }
  );
}
