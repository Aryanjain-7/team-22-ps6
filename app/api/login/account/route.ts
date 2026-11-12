import { NextResponse } from "next/server";
import { accountCredentials, newAccount } from "@/lib/account-schema";
import { accountEmail, createAccountClient, setAccountSession } from "@/lib/account-session";
import { getSupabase } from "@/lib/supabase";

export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return NextResponse.json({ error: "Send account details as JSON." }, { status: 415 });
  }
  const body = await request.json().catch(() => null);
  const registering = body?.mode === "register";
  const parsed = (registering ? newAccount : accountCredentials).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid username and a password of at least 8 characters." }, { status: 400 });
  }

  const { username, password } = parsed.data;
  const email = accountEmail(username);
  try {
    if (registering) {
      const expected = process.env.APP_PASSCODE?.trim();
      if (!expected || !("passcode" in parsed.data) || parsed.data.passcode !== expected) {
        return NextResponse.json({ error: "The team passcode is required to create an account." }, { status: 403 });
      }
      const { error } = await getSupabase().auth.admin.createUser({
        email, password, email_confirm: true, app_metadata: { careermatch: true },
      });
      if (error) {
        const conflict = error.code === "email_exists" || error.code === "user_already_exists";
        return NextResponse.json({ error: conflict ? "That username is taken." : "Could not create the account. Try another username or password." },
          { status: conflict ? 409 : 422 });
      }
    }

    const { data, error } = await createAccountClient().auth.signInWithPassword({ email, password });
    if (error || !data.session || data.user?.app_metadata.careermatch !== true) {
      return NextResponse.json({
        error: error?.status === 429 ? "Too many sign-in attempts. Try again shortly."
          : registering ? "Account created. Sign in with your new username and password."
          : "The username or password is incorrect.",
      }, { status: error?.status === 429 ? 429 : 401 });
    }

    const response = NextResponse.json({ ok: true });
    setAccountSession(response, data.session.access_token, data.session.expires_in);
    return response;
  } catch {
    return NextResponse.json({ error: "Account sign-in is unavailable. Try again shortly." }, { status: 503 });
  }
}
