import { NextResponse, type NextRequest } from "next/server";
import { profileDetails } from "@/lib/account-schema";
import { getIdentity } from "@/lib/account-session";
import { findProfile, saveProfile } from "@/lib/careermatch";

export async function GET(request: NextRequest) {
  const identity = await getIdentity(request);
  if (!identity) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  try {
    const profile = await findProfile(identity.profileId);
    if (profile) return NextResponse.json({ ...profile, canEdit: identity.canEdit });
    if (identity.canEdit) return NextResponse.json({ canEdit: true });
  } catch {
    // Match the unavailable state used by the demo profile.
  }
  return NextResponse.json({ error: "Your student profile is unavailable. Try again shortly." }, { status: 503 });
}

export async function PUT(request: NextRequest) {
  const identity = await getIdentity(request);
  if (!identity) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  if (!identity.canEdit) return NextResponse.json({ error: "Sign in to an individual account to edit details." }, { status: 403 });
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return NextResponse.json({ error: "Send profile details as JSON." }, { status: 415 });
  }
  const details = profileDetails.safeParse(await request.json().catch(() => null));
  if (!details.success) return NextResponse.json({ error: "Check the required fields and the limits for skills and cities." }, { status: 400 });
  try {
    await saveProfile(identity.profileId, details.data);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not save your profile. Try again." }, { status: 503 });
  }
}
