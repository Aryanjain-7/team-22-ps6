import { NextResponse } from "next/server";
import { readShortlist } from "@/lib/careermatch";

export async function GET() {
  try {
    return NextResponse.json(await readShortlist());
  } catch {
    return NextResponse.json({ error: "Your shortlist is unavailable. Try again shortly." }, { status: 503 });
  }
}
