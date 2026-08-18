/**
 * POST /api/admin/strategies/[id]/tuning/duplicate
 *
 * Creates a private, non-scanning candidate copy of a strategy for tuning,
 * attributed to the calling admin's own account, and bootstraps a
 * strategy_tuning_experiments row linking it so it shows up immediately
 * in the Tuning dashboard. Mirrors the main app's duplicateStrategy()
 * (lib/strategy/strategy-service.ts) — reimplemented here (separate repo,
 * no shared code) so this can be triggered from the admin app directly
 * instead of requiring a trip to the main app's Strategies page.
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createRouteClient } from "@/lib/supabase";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: liveStrategyId } = await params;

  const sessionClient = createRouteClient(req);
  const {
    data: { user },
  } = await sessionClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  const { data: live, error: liveError } = await supabase
    .from("strategies")
    .select("name, description, config, required_tier")
    .eq("id", liveStrategyId)
    .single();
  if (liveError || !live) {
    return NextResponse.json({ error: "Live strategy not found" }, { status: 404 });
  }

  const { data: created, error: createError } = await supabase
    .from("strategies")
    .insert({
      name: `${live.name} — Tuning Candidate`,
      description: live.description,
      ownership: "user",
      visibility: "private",
      user_id: user.id,
      based_on: liveStrategyId,
      config: live.config,
      is_active: false,
      required_tier: live.required_tier,
      is_admin_enabled: true,
    })
    .select("id, name")
    .single();

  if (createError || !created) {
    return NextResponse.json(
      { error: createError?.message ?? "Failed to create candidate" },
      { status: 500 },
    );
  }

  const { data: experiment, error: expError } = await supabase
    .from("strategy_tuning_experiments")
    .insert({
      live_strategy_id: liveStrategyId,
      candidate_strategy_id: created.id,
      hypothesis: "Candidate copy created for tuning",
      source: "manual_observation",
      status: "open",
    })
    .select("id")
    .single();

  if (expError) {
    // Candidate was created successfully; the bootstrap experiment row is
    // a convenience, not a hard requirement — report the partial success
    // rather than leaving an orphaned candidate strategy with no feedback.
    return NextResponse.json({
      success: true,
      candidateId: created.id,
      candidateName: created.name,
      warning: `Candidate created, but failed to link it to an experiment: ${expError.message}`,
    });
  }

  return NextResponse.json({
    success: true,
    candidateId: created.id,
    candidateName: created.name,
    experimentId: experiment.id,
  });
}
