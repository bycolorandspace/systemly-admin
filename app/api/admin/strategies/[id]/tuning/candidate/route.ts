/**
 * PATCH /api/admin/strategies/[id]/tuning/candidate
 *
 * Updates a tuning candidate's StrategyConfig directly from the admin
 * Tuning dashboard. Scoped to ownership='user' as a safety rail — this
 * route must never be able to touch a system/live strategy row, only a
 * private candidate copy created via the /duplicate route.
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // liveStrategyId isn't used directly (the candidate id is authoritative
  // for the update target) but is part of the route for consistency with
  // the other tuning endpoints, which are all scoped under a strategy id.
  await params;

  const body = await req.json();
  const { candidateStrategyId, config } = body;

  if (!candidateStrategyId || typeof candidateStrategyId !== "string") {
    return NextResponse.json(
      { error: "Missing 'candidateStrategyId'" },
      { status: 400 },
    );
  }
  if (typeof config !== "object" || config === null || Array.isArray(config)) {
    return NextResponse.json(
      { error: "'config' must be a JSON object" },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("strategies")
    .update({ config, updated_at: new Date().toISOString() })
    .eq("id", candidateStrategyId)
    .eq("ownership", "user");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
