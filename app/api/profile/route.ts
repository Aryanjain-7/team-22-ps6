import { NextResponse } from "next/server";
import { readProfile } from "@/lib/careermatch";

export async function GET() {
  try {
    return NextResponse.json(await readProfile());
  } catch {
    return NextResponse.json({ error: "Your student profile is unavailable. Try again shortly." }, { status: 503 });
  }
}
