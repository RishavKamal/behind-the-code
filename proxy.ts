import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const { data: claimsData, error } =
    await supabase.auth.getClaims();

  const claims = error ? null : claimsData?.claims;

  const pathname = request.nextUrl.pathname;

  /*
   * Pages that require authentication.
   */
  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname === "/profile" ||
    pathname === "/settings";

  /*
   * Logged-out users are always sent to login.
   */
  if (isProtectedRoute && !claims) {
    const loginUrl = request.nextUrl.clone();

    loginUrl.pathname = "/login";

    /*
     * Remember the page the user originally wanted.
     *
     * Example:
     * /settings
     *
     * becomes:
     * /login?redirectTo=%2Fsettings
     */
    loginUrl.searchParams.set(
      "redirectTo",
      pathname + request.nextUrl.search,
    );

    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};