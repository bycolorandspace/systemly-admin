import { NextResponse, type NextRequest } from "next/server";
import { requireSuperUser } from "@/lib/auth/require-super";
import { mainAppFetch, MainAppConfigError } from "@/lib/main-app";

/**
 * Admin -> main app proxy for the email copy editor.
 *
 *   GET  /api/admin/email/copy?type=<type>  ->  GET  <main>/api/admin/email/copy?type=<type>
 *   POST /api/admin/email/copy              ->  POST <main>/api/admin/email/copy
 *   POST /api/admin/email/send              ->  POST <main>/api/admin/email/send
 *
 * The query string and JSON body are forwarded unchanged, so this route knows
 * nothing about which email types or fields exist; the main app validates
 * those. What it adds is the CRON_SECRET bearer token, which it reads on the
 * server. The browser never sees the token and never talks to the main app
 * directly, which also means the main app's CORS allow-list no longer matters
 * for this page.
 *
 * Only the actions and methods below are forwarded. This is not a general
 * pass-through to the main app: /api/admin/email/broadcast (bulk send) is
 * deliberately absent, and adding it is a decision, not a one-line change.
 *
 * Access: `proxy.ts` requires a signed-in super user for every path, and
 * `requireSuperUser` checks again here so the route holds on its own.
 */

const ALLOWED: Record<string, ReadonlySet<string>> = {
  copy: new Set(["GET", "POST"]),
  send: new Set(["POST"]),
};

type Ctx = { params: Promise<{ action: string }> };

async function forward(req: NextRequest, ctx: Ctx): Promise<NextResponse> {
  const { action } = await ctx.params;
  const methods = ALLOWED[action];
  if (!methods) {
    return NextResponse.json({ error: "Unknown email action." }, { status: 404 });
  }
  if (!methods.has(req.method)) {
    return NextResponse.json({ error: "Method not allowed." }, { status: 405 });
  }

  const denied = await requireSuperUser(req);
  if (denied) return denied;

  const path = `/api/admin/email/${action}${req.nextUrl.search}`;
  const init: RequestInit = { method: req.method };
  if (req.method === "POST") {
    init.body = await req.text();
    init.headers = { "Content-Type": "application/json" };
  }

  let upstream: Response;
  try {
    upstream = await mainAppFetch(path, init);
  } catch (err) {
    if (err instanceof MainAppConfigError) {
      console.error("[admin/email proxy]", err.message);
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    console.error("[admin/email proxy] main app unreachable", err);
    return NextResponse.json({ error: "Could not reach the main app." }, { status: 502 });
  }

  const text = await upstream.text();
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    // An HTML page here usually means deployment protection or a 404 page on
    // the main app. Log the start of it, return a sentence.
    console.error(
      `[admin/email proxy] non-JSON from main app (${upstream.status}) for ${path}:`,
      text.slice(0, 300),
    );
    return NextResponse.json(
      { error: `The main app returned an unexpected response (${upstream.status}).` },
      { status: 502 },
    );
  }

  return NextResponse.json(body, { status: upstream.status });
}

export async function GET(req: NextRequest, ctx: Ctx) {
  return forward(req, ctx);
}

export async function POST(req: NextRequest, ctx: Ctx) {
  return forward(req, ctx);
}
