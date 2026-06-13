import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the auth cookie on every request so server components see a
 * fresh session. Also enforces admin gate on /admin routes.
 *
 * Defensive: if Supabase env vars are missing or the auth call throws,
 * we pass the request through untouched. The admin server component does
 * its own auth check, so the gate isn't bypassed.
 */
export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  try {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    });

    // Refresh expired session token if needed.
    const { data: { user } } = await supabase.auth.getUser();

    const url = request.nextUrl;

    // /admin gate: redirect unauthenticated visitors to /admin/login.
    if (url.pathname.startsWith("/admin") && url.pathname !== "/admin/login") {
      if (!user) {
        const redirect = url.clone();
        redirect.pathname = "/admin/login";
        redirect.searchParams.set("next", url.pathname);
        return NextResponse.redirect(redirect);
      }
    }
  } catch (e) {
    console.error("[middleware] supabase error:", e);
  }

  return supabaseResponse;
}
