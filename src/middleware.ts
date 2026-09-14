import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const ROLE_PREFIX: Record<string, string> = {
  people: "/passenger",
  driver: "/driver",
  admin: "/admin",
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected =
    pathname.startsWith("/passenger") ||
    pathname.startsWith("/driver") ||
    pathname.startsWith("/admin");

  if (!isProtected) return NextResponse.next();

  // FAST PATH: Check auth cookies and role cookie first (0ms latency, zero remote calls)
  const hasAuthCookie = request.cookies.getAll().some(
    (c) => c.name.includes("-auth-token") || c.name.startsWith("sb-")
  );
  const role = request.cookies.get("sb-role")?.value;

  if (hasAuthCookie && role) {
    const allowedPrefix = ROLE_PREFIX[role];
    if (allowedPrefix && pathname.startsWith(allowedPrefix)) {
      return NextResponse.next();
    }
  }

  // Fallback to session check if cookies not established or prefix mismatched
  const { response, user, supabase } = await updateSession(request);

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  let userRole: string = role ?? "";
  if (!userRole) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const resolvedRole: string = String(profile?.role ?? "people");
    userRole = resolvedRole;
    response.cookies.set("sb-role", resolvedRole, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
    });
  }

  const allowedPrefix = ROLE_PREFIX[userRole];

  if (allowedPrefix && !pathname.startsWith(allowedPrefix)) {
    const url = request.nextUrl.clone();
    url.pathname = `${allowedPrefix}/dashboard`;
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/passenger/:path*", "/driver/:path*", "/admin/:path*"],
};
