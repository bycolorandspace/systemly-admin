import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ codeId: string }> }
) {
  const { codeId } = await params;
  const body = await req.json();

  const allowed = ["active", "commission_value", "referee_bonus_pct", "referrer_reward_gbp", "max_uses"];
  const updateFields: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updateFields[key] = body[key];
  }

  if (Object.keys(updateFields).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("affiliate_codes")
    .update(updateFields)
    .eq("id", codeId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
