import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { getUserDetail } from "@/lib/queries/users";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const supabase = createAdminClient();
  const data = await getUserDetail(supabase, userId);
  return NextResponse.json(data);
}

const VALID_TIERS = ["free", "starter", "plus", "pro"] as const;

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const body = await req.json();

  const updateFields: Record<string, unknown> = {};

  if ("trialEndsAt" in body) {
    if (!body.trialEndsAt) return NextResponse.json({ error: "trialEndsAt must be a date string" }, { status: 400 });
    updateFields.trial_ends_at = body.trialEndsAt;
  }

  if ("tier" in body) {
    if (!VALID_TIERS.includes(body.tier)) {
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
    }
    updateFields.current_tier = body.tier;
  }

  if (Object.keys(updateFields).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("user_profiles")
    .update(updateFields)
    .eq("id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
