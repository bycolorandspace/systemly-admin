import "server-only";

import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient, createRouteClient } from "@/lib/supabase";

/**
 * Super-user check for route handlers that act on the main app's behalf.
 *
 * `proxy.ts` already runs the same check on every request, so on the happy
 * path this is a second look. It exists because the two layers fail
 * differently, and a route that holds CRON_SECRET should not depend on only
 * one of them:
 *
 *  - The proxy answers an unauthenticated API call with a redirect to /login,
 *    which `fetch` follows and reports as a 200 HTML page. Here the answer is
 *    a 401 or 403 JSON body the caller can act on.
 *  - The proxy's matcher and early returns are edited for unrelated reasons
 *    (a new public path, an asset prefix). If one of those edits ever lets an
 *    /api/admin path through, this check still holds.
 *
 * Keep it in step with the is_super check in `proxy.ts`. Added 28 September
 * 2026, when the email copy editor stopped sending CRON_SECRET to the browser
 * and started calling the main app through `app/api/admin/email/[action]`.
 *
 * Returns null when the caller is a signed-in super user, otherwise the
 * response to send back.
 */
export async function requireSuperUser(req: NextRequest): Promise<NextResponse | null> {
  const {
    data: { user },
  } = await createRouteClient(req).auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in to the admin dashboard first." }, { status: 401 });
  }

  const { data: profile, error } = await createAdminClient()
    .from("user_profiles")
    .select("is_super")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[require-super] profile lookup failed", error.message);
    return NextResponse.json({ error: "Could not confirm admin access." }, { status: 500 });
  }

  if (!profile?.is_super) {
    return NextResponse.json({ error: "This account does not have admin access." }, { status: 403 });
  }

  return null;
}
