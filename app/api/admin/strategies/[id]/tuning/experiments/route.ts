import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

const VALID_SOURCES = ["query", "backtest", "manual_observation"];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: liveStrategyId } = await params;
  const body = await req.json();
  const { hypothesis, source, candidateStrategyId, backtestId, configDiff } =
    body;

  if (!hypothesis || typeof hypothesis !== "string") {
    return NextResponse.json({ error: "Missing 'hypothesis'" }, { status: 400 });
  }
  if (!VALID_SOURCES.includes(source)) {
    return NextResponse.json(
      { error: `'source' must be one of: ${VALID_SOURCES.join(", ")}` },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("strategy_tuning_experiments")
    .insert({
      live_strategy_id: liveStrategyId,
      hypothesis,
      source,
      candidate_strategy_id: candidateStrategyId ?? null,
      backtest_id: backtestId ?? null,
      config_diff: configDiff ?? null,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, id: data.id });
}
