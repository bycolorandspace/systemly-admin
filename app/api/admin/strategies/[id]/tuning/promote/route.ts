/**
 * POST /api/admin/strategies/[id]/tuning/promote
 *
 * Applies a validated candidate strategy's config to the live strategy.
 * Snapshots the live strategy's *current* config onto the experiment row
 * (previous_live_config) before overwriting it, so a regression can be
 * rolled back by re-applying that snapshot. Only ever touches the live
 * strategy row on this one explicit action — never as a side effect of
 * any trial/screening step.
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: liveStrategyId } = await params;
  const body = await req.json();
  const { experimentId } = body;

  if (!experimentId || typeof experimentId !== "string") {
    return NextResponse.json({ error: "Missing 'experimentId'" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: experiment, error: expError } = await supabase
    .from("strategy_tuning_experiments")
    .select("id, candidate_strategy_id, live_strategy_id, status")
    .eq("id", experimentId)
    .single();

  if (expError || !experiment) {
    return NextResponse.json({ error: "Experiment not found" }, { status: 404 });
  }
  if (experiment.live_strategy_id !== liveStrategyId) {
    return NextResponse.json(
      { error: "Experiment does not belong to this strategy" },
      { status: 400 },
    );
  }
  if (!experiment.candidate_strategy_id) {
    return NextResponse.json(
      { error: "Experiment has no candidate_strategy_id to promote from" },
      { status: 400 },
    );
  }
  if (experiment.status === "promoted") {
    return NextResponse.json(
      { error: "Experiment has already been promoted" },
      { status: 400 },
    );
  }

  const { data: candidate, error: candidateError } = await supabase
    .from("strategies")
    .select("config")
    .eq("id", experiment.candidate_strategy_id)
    .single();
  if (candidateError || !candidate) {
    return NextResponse.json({ error: "Candidate strategy not found" }, { status: 404 });
  }

  const { data: live, error: liveError } = await supabase
    .from("strategies")
    .select("config")
    .eq("id", liveStrategyId)
    .single();
  if (liveError || !live) {
    return NextResponse.json({ error: "Live strategy not found" }, { status: 404 });
  }

  // Apply the candidate's config to the live strategy first — only mark
  // the experiment "promoted" once this actually succeeds.
  const { error: updateError } = await supabase
    .from("strategies")
    .update({ config: candidate.config, updated_at: new Date().toISOString() })
    .eq("id", liveStrategyId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const now = new Date().toISOString();
  const { error: experimentUpdateError } = await supabase
    .from("strategy_tuning_experiments")
    .update({
      status: "promoted",
      promoted_at: now,
      decided_at: now,
      previous_live_config: live.config,
    })
    .eq("id", experimentId);

  if (experimentUpdateError) {
    // The live strategy was already updated successfully — report this so
    // the rollback snapshot can be recovered manually if needed, but don't
    // claim overall failure since the promotion itself did apply.
    return NextResponse.json(
      {
        success: true,
        warning: `Live config updated, but failed to record the rollback snapshot: ${experimentUpdateError.message}`,
      },
      { status: 200 },
    );
  }

  return NextResponse.json({ success: true });
}
