import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

const VALID_STATUSES = ["open", "confirmed", "rejected", "promoted", "reverted"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ experimentId: string }> },
) {
  const { experimentId } = await params;
  const body = await req.json();
  const { status, liveValidationSummary } = body;

  const updates: Record<string, unknown> = {};

  if (status !== undefined) {
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `'status' must be one of: ${VALID_STATUSES.join(", ")}` },
        { status: 400 },
      );
    }
    updates.status = status;
    // "promoted" is set exclusively by the /promote route (it also stamps
    // promoted_at + previous_live_config atomically with the live update).
    if (status !== "promoted") {
      updates.decided_at = new Date().toISOString();
    }
  }

  if (liveValidationSummary !== undefined) {
    updates.live_validation_summary = liveValidationSummary;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("strategy_tuning_experiments")
    .update(updates)
    .eq("id", experimentId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
