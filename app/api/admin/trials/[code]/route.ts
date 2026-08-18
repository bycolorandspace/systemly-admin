import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

/**
 * PATCH toggles or edits an invite. There is deliberately no DELETE: invites
 * are referenced by trial_redemption rows, and deleting one would erase the
 * record of who was granted what. Deactivate instead.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const body = await req.json();

  const updates: Record<string, unknown> = {};
  if ("active" in body) updates.active = !!body.active;
  if ("label" in body) updates.label = body.label || null;
  if ("max_redemptions" in body) {
    updates.max_redemptions = body.max_redemptions ? Number(body.max_redemptions) : null;
  }
  if ("expires_at" in body) updates.expires_at = body.expires_at || null;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("trial_invite").update(updates).eq("code", code);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
