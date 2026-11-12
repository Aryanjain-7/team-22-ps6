import { NextResponse } from "next/server";
import { ACCOUNT_COOKIE } from "@/lib/account-session";
import { SESSION_COOKIE } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE);
  response.cookies.delete(ACCOUNT_COOKIE);
  return response;
}
