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
  // Same month boundary the main app's usage counter uses.
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const [data, academy, signalConfig, grants] = await Promise.all([
    getUserDetail(supabase, userId),
    getAcademyUserBrief(userId),
    // The live per-tier signal allowances set on the Controls page. The main
    // app reads the same rows (getSignalLimits in lib/system-config.ts), so the
    // drawer shows what the user is actually held to, not the build default.
    supabase
      .from("system_config")
      .select("key, value")
      .like("key", "signals_per_month_%"),
    // Extra signals earned this month (the Academy completion reward). Mirrors
    // getSignalBonus in the main app's lib/rewards/signal-bonus.ts.
    supabase
      .from("reward_grants")
      .select("payload, expires_at, reward_campaigns!inner(reward)")
      .eq("user_id", userId)
      .gte("granted_at", periodStart.toISOString()),
  ]);
  let signalBonus = 0;
  for (const row of (grants.data ?? []) as Record<string, any>[]) {
    if (row.expires_at && new Date(row.expires_at).getTime() <= now.getTime()) continue;
    const campaign = Array.isArray(row.reward_campaigns) ? row.reward_campaigns[0] : row.reward_campaigns;
    const reward = campaign?.reward ?? row.payload?.reward;
    if (reward?.type === "extra_signals" && typeof reward.amount === "number" && reward.amount > 0) {
      signalBonus += reward.amount;
    }
  }
  const signalLimits: Record<string, number> = {};
  for (const row of signalConfig.data ?? []) {
    const n = Number(row.value);
    if (Number.isFinite(n)) {
      signalLimits[row.key.replace("signals_per_month_", "")] = n;
    }
  }
  return NextResponse.json({ ...data, academy, signalLimits, signalBonus });
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
