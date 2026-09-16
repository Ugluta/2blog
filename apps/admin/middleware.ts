import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_TOKEN_COOKIE, ACCESS_TOKEN_MAX_AGE, REFRESH_TOKEN_COOKIE, REFRESH_TOKEN_MAX_AGE } from "./lib/session-constants";

const PUBLIC_PATHS = ["/login"];

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

/**
 * Runs before every admin page. The access-token cookie's own maxAge
 * matches the API's JWT TTL, so once the browser drops it, its absence
 * here means "needs a refresh," not "definitely expired" — no JWT
 * decoding needed. A silent refresh keeps the admin logged in across the
 * 15-minute access-token window without the user noticing.
 */
export async function middleware(request: NextRequest) {
  if (PUBLIC_PATHS.some((path) => request.nextUrl.pathname.startsWith(path)) || request.nextUrl.pathname.startsWith("/_next")) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  if (accessToken) return NextResponse.next();

  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  if (!refreshToken) {
    return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(request.nextUrl.pathname)}`, request.url));
  }

  try {
    const apiUrl = process.env.API_INTERNAL_URL ?? "http://localhost:4000";
    const res = await fetch(`${apiUrl}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete(ACCESS_TOKEN_COOKIE);
      response.cookies.delete(REFRESH_TOKEN_COOKIE);
      return response;
    }

    const body = (await res.json()) as { data: { accessToken: string; refreshToken: string } };
    const response = NextResponse.next();
    response.cookies.set(ACCESS_TOKEN_COOKIE, body.data.accessToken, { ...cookieOptions, maxAge: ACCESS_TOKEN_MAX_AGE });
    response.cookies.set(REFRESH_TOKEN_COOKIE, body.data.refreshToken, { ...cookieOptions, maxAge: REFRESH_TOKEN_MAX_AGE });
    return response;
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
