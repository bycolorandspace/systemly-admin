import { createBrowserClient as createSSRBrowserClient, createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

/**
 * Session-aware client for Route Handlers — reads the caller's identity
 * from cookies. `proxy.ts` middleware already verified is_super before
 * any route handler runs, so this is only used to attribute an action
 * (e.g. "who duplicated this strategy") to the actual admin user, not to
 * re-check authorization.
 */
export function createRouteClient(req: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll() {
          // No-op — middleware already refreshes the session cookie on
          // every request; a route handler only needs read access here.
        },
      },
    },
  );
}

let browserClient: ReturnType<typeof createSSRBrowserClient> | undefined;

export function createBrowserClient() {
  if (!browserClient) {
    browserClient = createSSRBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return browserClient;
}
