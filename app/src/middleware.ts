import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const protectedRoutes = ["/orders", "/profile", "/driver", "/vendor", "/cart", "/settings", "/wallet"];
const adminRoutes = ["/admin"];

export async function middleware(request: NextRequest) {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL === "your-supabase-url-here"
  ) {
    return NextResponse.next();
  }

  const origin = request.headers.get("origin") || "";
  const capacitorOrigins = ["capacitor://localhost", "ionic://localhost", "http://localhost"];
  if (capacitorOrigins.some((o) => origin.startsWith(o))) {
    const response = NextResponse.next();
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type,Authorization,X-App-Target");
    if (request.method === "OPTIONS") {
      return new NextResponse(null, { status: 204, headers: response.headers });
    }
  }

  const { pathname } = request.nextUrl;

  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));
  const isAdmin = adminRoutes.some((route) => pathname.startsWith(route));
  if (!isProtected && !isAdmin) return NextResponse.next();

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (isAdmin) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|firebase-messaging-sw.js|icons/).*)",
  ],
};
