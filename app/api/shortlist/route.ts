import { NextResponse, type NextRequest } from "next/server";
import { getIdentity } from "@/lib/account-session";
import { readShortlist } from "@/lib/careermatch";

export async function GET(request: NextRequest) {
  const identity = await getIdentity(request);
  if (!identity) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  try {
    return NextResponse.json(await readShortlist(identity.profileId));
  } catch {
    return NextResponse.json({ error: "Your shortlist is unavailable. Try again shortly." }, { status: 503 });
  }
}
