import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, isValidSession } from "./auth";
import { requireEnv } from "./env";
import { getSupabase } from "./supabase";

export const ACCOUNT_COOKIE = "careermatch_account";
const demoProfileId = "S001";

export function accountEmail(username: string) {
  return `${username}@accounts.careermatch.invalid`;
}

// A fresh client keeps a password login from changing the shared server client's session.
export function createAccountClient() {
  return createClient(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_SECRET_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export async function getIdentity(request: NextRequest) {
  const token = request.cookies.get(ACCOUNT_COOKIE)?.value;
  if (token) {
    try {
      const { data, error } = await getSupabase().auth.getUser(token);
      if (!error && data.user?.app_metadata.careermatch === true) {
        return { profileId: data.user.id, canEdit: true };
      }
    } catch {
      // Treat an unverifiable session as signed out.
    }
    return null;
  }
  return await isValidSession(request.cookies.get(SESSION_COOKIE)?.value)
    ? { profileId: demoProfileId, canEdit: false } : null;
}

export function setAccountSession(response: NextResponse, token: string, expiresIn: number) {
  response.cookies.delete(SESSION_COOKIE);
  response.cookies.set(ACCOUNT_COOKIE, token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "lax", path: "/", maxAge: expiresIn,
  });
}
