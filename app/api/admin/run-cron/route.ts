import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const url = process.env.MAIN_APP_URL || "http://localhost:3000";
  try {
    const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(5000) });
    return NextResponse.json({ url, reachable: true, statusCode: res.status });
  } catch (err) {
    return NextResponse.json({
      url,
      reachable: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * Admin → main app cron trigger proxy.
 *
 * Lets the admin dashboard "Cron Triggers" section invoke any of the main
 * app's cron-backed API routes on demand, bypassing Inngest entirely.
 *
 * The main app guards these routes with `verifyCronRequest` (Bearer
 * CRON_SECRET), so this route just forwards the call with that header.
 *
 * Request:  POST { path: "/api/signals/generate-strategy", body?: object }
 * Response: { ok, status, body }
 */

const ALLOWED_PATHS = new Set([
  "/api/signals/generate-strategy",
  "/api/signals/generate-community",
  "/api/signals/check-outcomes",
  "/api/alert/check-price",
  "/api/mt5/sync-history",
  "/api/cron/affiliates-qualify",
]);

export async function POST(req: NextRequest) {
  const { path, body } = (await req.json().catch(() => ({}))) as {
    path?: string;
    body?: unknown;
  };

  if (!path || !ALLOWED_PATHS.has(path)) {
    return NextResponse.json(
      { error: `Path not allowed. Allowed: ${[...ALLOWED_PATHS].join(", ")}` },
      { status: 400 },
    );
  }

  const baseUrl = process.env.MAIN_APP_URL || "http://localhost:3000";
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured on admin dashboard" },
      { status: 500 },
    );
  }

  const url = `${baseUrl}${path}`;
  const started = Date.now();

  try {
    const upstream = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cronSecret}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const contentType = upstream.headers.get("content-type") || "";
    const text = await upstream.text();
    const elapsedMs = Date.now() - started;

    let parsed: unknown = text;
    if (contentType.includes("application/json")) {
      try {
        parsed = JSON.parse(text);
      } catch {
        // fall through with raw text
      }
    }

    return NextResponse.json(
      {
        ok: upstream.ok,
        status: upstream.status,
        elapsedMs,
        body: parsed,
      },
      { status: upstream.ok ? 200 : 502 },
    );
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        status: 0,
        error: err instanceof Error ? err.message : String(err),
        url,
      },
      { status: 502 },
    );
  }
}
