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
  const result = await requireSuperUserId(req);
  return "response" in result ? result.response : null;
}

/**
 * The same check, returning the signed-in super user's id on success.
 *
 * Added 2 October 2026 for the config writers (`app/api/admin/toggle-config`,
 * `app/api/admin/set-config`), which used to record every change as the string
 * "admin-dashboard". Now each change names the admin who made it, in the row and
 * in `security_events`, which matters most for `trade_execution`: the switch
 * that lets the main app place real orders.
 */
export async function requireSuperUserId(
  req: NextRequest,
): Promise<{ userId: string } | { response: NextResponse }> {
  const {
    data: { user },
  } = await createRouteClient(req).auth.getUser();

  if (!user) {
    return {
      response: NextResponse.json({ error: "Sign in to the admin dashboard first." }, { status: 401 }),
    };
  }

  const { data: profile, error } = await createAdminClient()
    .from("user_profiles")
    .select("is_super")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[require-super] profile lookup failed", error.message);
    return {
      response: NextResponse.json({ error: "Could not confirm admin access." }, { status: 500 }),
    };
  }

  if (!profile?.is_super) {
    return {
      response: NextResponse.json({ error: "This account does not have admin access." }, { status: 403 }),
    };
  }

  return { userId: user.id };
}
