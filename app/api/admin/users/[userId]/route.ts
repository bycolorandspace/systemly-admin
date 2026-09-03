import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { getUserDetail } from "@/lib/queries/users";
import { getAcademyUserBrief } from "@/lib/queries/engagement";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const supabase = createAdminClient();
  // Academy progress lives in a different Supabase project, reachable only
  // through the main app, so it is fetched alongside rather than joined.
  // `null` when that call fails: the drawer renders without the block rather
  // than showing a learner as having done nothing.
  const [data, academy] = await Promise.all([
    getUserDetail(supabase, userId),
    getAcademyUserBrief(userId),
  ]);
  return NextResponse.json({ ...data, academy });
}

const VALID_TIERS = ["free", "starter", "plus", "pro"] as const;
// A trial can only grant a paid tier: "free" would be a downgrade dressed up
// as a reward, and the main app's getEffectiveTier takes the higher of
// trial_tier and current_tier anyway, so it would be a no-op.
const VALID_TRIAL_TIERS = ["starter", "plus", "pro"] as const;

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

  if ("trialTier" in body) {
    if (body.trialTier === null) {
      // Explicit clear: revoke the trial outright.
      updateFields.trial_tier = null;
      updateFields.trial_ends_at = null;
      updateFields.trial_source = null;
    } else if (!VALID_TRIAL_TIERS.includes(body.trialTier)) {
      return NextResponse.json({ error: "Invalid trialTier" }, { status: 400 });
    } else {
      updateFields.trial_tier = body.trialTier;
      updateFields.trial_source = body.trialSource ?? "admin";
      updateFields.trial_granted_at = new Date().toISOString();
    }
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
