import { NextResponse, type NextRequest } from "next/server";
import { getIdentity } from "@/lib/account-session";

/**
 * Passcode gate. Every page and API needs a valid session cookie,
 * except the login page, the login API and the health check.
 */
export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  // These handlers verify the session before reading or writing student data.
  if (["/api/agent", "/api/profile", "/api/shortlist", "/api/logout"].includes(path)) {
    return NextResponse.next();
  }

  const identity = await getIdentity(request);
  if (identity && (!path.startsWith("/api/") || !identity.canEdit)) return NextResponse.next();

  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!login|api/login|api/health|_next/static|_next/image|favicon.ico).*)"],
};
