import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { requireSuperUserId } from "@/lib/auth/require-super";

/**
 * POST /api/admin/users/[userId]/signal-grants  { amount }
 *
 * Adds extra signals to one user's account for the current month.
 *
 * A grant is a `reward_grants` row on the `admin-signal-gift` campaign, the same
 * table every earned reward writes, so the main app needs no new read: its
 * getSignalBonus (lib/rewards/signal-bonus.ts) already adds this month's grants
 * to the user's allowance. That campaign has no fixed amount, so the amount is
 * stored on the grant's payload, where getSignalBonus looks when the campaign
 * names none.
 *
 * The signals last until the end of the month they are granted in, because
 * that is the window getSignalBonus counts. Telling the user is a separate,
 * deliberate press: POST /api/admin/email/send with type "signals-added".
 */

// A ceiling against a typo (500 for 50), not a policy.
const MAX_AMOUNT = 500;
const CAMPAIGN_SLUG = "admin-signal-gift";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const auth = await requireSuperUserId(req);
  if ("response" in auth) return auth.response;

  const { userId } = await params;
  const body = await req.json().catch(() => null);
  const amount = Number(body?.amount);
  if (!Number.isInteger(amount) || amount < 1 || amount > MAX_AMOUNT) {
    return NextResponse.json(
      { error: `Amount must be a whole number from 1 to ${MAX_AMOUNT}.` },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("current_tier")
    .eq("id", userId)
    .maybeSingle();
  if (!profile) return NextResponse.json({ error: "User not found." }, { status: 404 });

  // An unlimited plan cannot be widened: the main app's withSignalBonus keeps
  // unlimited as unlimited, so the grant would be a row nobody can spend.
  // -1 in system_config means unlimited; with no row, Pro is the only
  // unlimited plan in the main app's config/tiers.ts. A trial is not checked:
  // a Pro trial that lapses this month leaves the grant spendable.
  const tier = profile.current_tier ?? "free";
  const { data: limitRow } = await supabase
    .from("system_config")
    .select("value")
    .eq("key", `signals_per_month_${tier}`)
    .maybeSingle();
  const unlimited = limitRow ? Number(limitRow.value) < 0 : tier === "pro";
  if (unlimited) {
    return NextResponse.json(
      { error: `This user's ${tier} plan already has unlimited signals.` },
      { status: 409 },
    );
  }

  const { data: campaign } = await supabase
    .from("reward_campaigns")
    .select("id")
    .eq("slug", CAMPAIGN_SLUG)
    .maybeSingle();
  if (!campaign) {
    return NextResponse.json(
      {
        error:
          "The admin-signal-gift campaign is missing. Apply the main app migration 20261015200000_admin_signal_gift_campaign.sql.",
      },
      { status: 500 },
    );
  }

  const { data: grant, error } = await supabase
    .from("reward_grants")
    .insert({
      user_id: userId,
      campaign_id: campaign.id,
      // Each press is its own grant, so the key only has to be unique.
      idempotency_key: `${userId}:${CAMPAIGN_SLUG}:${crypto.randomUUID()}`,
      expires_at: null,
      payload: {
        reward: { type: "extra_signals", amount },
        granted_by: auth.userId,
      },
    })
    .select("id, granted_at")
    .single();

  if (error) {
    console.error("[admin/signal-grants] insert failed", error.message);
    return NextResponse.json({ error: "Could not add the signals." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, grant: { ...grant, amount } });
}
