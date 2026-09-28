import { NextResponse, type NextRequest } from "next/server";
import { requireSuperUser } from "@/lib/auth/require-super";
import { mainAppFetch, MainAppConfigError } from "@/lib/main-app";

/**
 * GET /api/admin/email/preview/<type>?<params>  ->  <main>/api/email-preview/<type>
 *
 * The main app only renders previews in production for a request carrying the
 * CRON_SECRET bearer token, so a plain link to it from the editor returned 404.
 * This forwards the request with the token added on the server and returns the
 * rendered HTML. It renders the saved copy, not unsaved edits in the form.
 */
type Ctx = { params: Promise<{ type: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const denied = await requireSuperUser(req);
  if (denied) return denied;

  const { type } = await ctx.params;
  if (!/^[a-z0-9-]+$/.test(type)) {
    return NextResponse.json({ error: "Unknown email type." }, { status: 404 });
  }

  try {
    const upstream = await mainAppFetch(
      `/api/email-preview/${type}${req.nextUrl.search}`,
    );
    const body = await upstream.text();
    return new NextResponse(body, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("content-type") ?? "text/html; charset=utf-8",
      },
    });
  } catch (err) {
    if (err instanceof MainAppConfigError) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    console.error("[admin/email preview] main app unreachable", err);
    return NextResponse.json({ error: "Could not reach the main app." }, { status: 502 });
  }
}
