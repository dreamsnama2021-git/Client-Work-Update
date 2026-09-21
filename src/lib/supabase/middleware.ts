import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database, UserRole } from "@/types/database.types";

const AUTH_ROUTES = ["/login", "/signup"];
const ROLE_PREFIXES: Record<string, UserRole> = {
  "/admin": "admin",
  "/client": "client",
};

// Avoids a profiles round-trip on every single navigation — role changes
// are rare, and RLS (not this check) is the real access-control boundary;
// this cache only affects how fast the redirect-guard UX reacts to a role
// change.
const ROLE_CACHE_TTL_MS = 30_000;
const roleCache = new Map<string, { role: UserRole; expiresAt: number }>();

async function getCachedRole(
  supabase: ReturnType<typeof createServerClient<Database>>,
  userId: string,
): Promise<UserRole> {
  const cached = roleCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.role;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  const role = profile?.role ?? "client";
  roleCache.set(userId, { role, expiresAt: Date.now() + ROLE_CACHE_TTL_MS });
  return role;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));
  const matchedRolePrefix = Object.keys(ROLE_PREFIXES).find((prefix) =>
    pathname.startsWith(prefix),
  );

  if (!user && matchedRolePrefix) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  if (user && (isAuthRoute || matchedRolePrefix)) {
    const role = await getCachedRole(supabase, user.id);

    if (isAuthRoute) {
      const url = request.nextUrl.clone();
      url.pathname = role === "admin" ? "/admin" : "/client";
      return NextResponse.redirect(url);
    }

    if (
      matchedRolePrefix &&
      role !== "admin" &&
      role !== ROLE_PREFIXES[matchedRolePrefix]
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/client";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
