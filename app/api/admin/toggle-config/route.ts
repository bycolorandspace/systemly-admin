import { NextRequest, NextResponse } from "next/server";
import { requireSuperUserId } from "@/lib/auth/require-super";
import { isWritableToggleKey } from "@/lib/config/writable-config-keys";
import { writeConfigAsAdmin } from "@/lib/config/write-config";

/**
 * POST /api/admin/toggle-config: pause or resume one `{ paused }` switch.
 *
 * Since 2 October 2026: only keys in `TOGGLE_CONFIG_KEYS` (unknown key is a 400), the admin's
 * user id is recorded in the value's `paused_by` and the row's `updated_by` instead of the string
 * "admin-dashboard", and every change writes a `security_events` row (`config_changed`). The
 * super-user check here is the route's own; `proxy.ts` runs one too.
 */
export async function POST(req: NextRequest) {
  const auth = await requireSuperUserId(req);
  if ("response" in auth) return auth.response;

  let body: { key?: unknown; paused?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const { key, paused } = body;

  if (typeof paused !== "boolean") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  if (!isWritableToggleKey(key)) {
    return NextResponse.json({ error: "Unknown config key" }, { status: 400 });
  }

  const result = await writeConfigAsAdmin({
    key,
    value: {
      paused,
      paused_at: paused ? new Date().toISOString() : null,
      paused_by: auth.userId,
    },
    adminId: auth.userId,
    req,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
