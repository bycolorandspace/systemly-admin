import { NextRequest, NextResponse } from "next/server";
import { requireSuperUserId } from "@/lib/auth/require-super";
import { isWritableValueKey } from "@/lib/config/writable-config-keys";
import { writeConfigAsAdmin } from "@/lib/config/write-config";

/**
 * POST /api/admin/set-config: set one number or text value.
 *
 * Since 2 October 2026: only keys in `VALUE_CONFIG_KEYS` or the Costs page's manual usage keys
 * (unknown key is a 400; a toggle key such as `trade_execution` is refused here, so a switch can
 * only be written in its own shape by `toggle-config`), the value must be a number or a string,
 * the admin's user id is recorded in `updated_by`, and every change writes a `security_events`
 * row (`config_changed`).
 */
export async function POST(req: NextRequest) {
  const auth = await requireSuperUserId(req);
  if ("response" in auth) return auth.response;

  let body: { key?: unknown; value?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "key and value required" }, { status: 400 });
  }
  const { key, value } = body;

  if (key === undefined || value === undefined) {
    return NextResponse.json({ error: "key and value required" }, { status: 400 });
  }
  if (!isWritableValueKey(key)) {
    return NextResponse.json({ error: "Unknown config key" }, { status: 400 });
  }
  const isNumber = typeof value === "number" && Number.isFinite(value);
  const isText = typeof value === "string" && value.length <= 2000;
  if (!isNumber && !isText) {
    return NextResponse.json({ error: "Value must be a number or text" }, { status: 400 });
  }

  const result = await writeConfigAsAdmin({ key, value, adminId: auth.userId, req });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
