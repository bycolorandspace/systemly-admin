import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { readBehaviourProfile, setBehaviourProfile } from "@/lib/behaviour-profile";

export async function GET() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("strategies")
    .select(
      "id, name, description, required_tier, is_admin_enabled, available_tiers, ownership, behaviour_profile:config->behaviour_profile",
    )
    .eq("ownership", "system")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ strategies: data ?? [] });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, is_admin_enabled, available_tiers, behaviour_profile_enabled } = body;

  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "Missing strategy id" }, { status: 400 });
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (typeof is_admin_enabled === "boolean") {
    updates.is_admin_enabled = is_admin_enabled;
  }

  // available_tiers: null clears the restriction, array sets it
  if (available_tiers !== undefined) {
    updates.available_tiers =
      Array.isArray(available_tiers) && available_tiers.length > 0
        ? available_tiers
        : null;
  }

  const supabase = createAdminClient();

  // behaviour_profile_enabled: turns the July rails on or off by setting or
  // removing config.behaviour_profile. Read, change that one key, write back,
  // and only if nobody saved the strategy in between (updated_at unchanged),
  // so an edit made in the main app at the same moment is never overwritten.
  let expectedUpdatedAt: string | null = null;
  if (typeof behaviour_profile_enabled === "boolean") {
    const { data: row, error: readError } = await supabase
      .from("strategies")
      .select("config, updated_at")
      .eq("id", id)
      .eq("ownership", "system")
      .maybeSingle();

    if (readError) {
      return NextResponse.json({ error: readError.message }, { status: 500 });
    }
    if (!row) {
      return NextResponse.json({ error: "System strategy not found" }, { status: 404 });
    }
    if (typeof row.config !== "object" || row.config === null || Array.isArray(row.config)) {
      return NextResponse.json(
        { error: "This strategy's config isn't a JSON object, so the switch can't be set" },
        { status: 400 },
      );
    }

    updates.config = setBehaviourProfile(
      row.config as Record<string, unknown>,
      behaviour_profile_enabled,
    );
    expectedUpdatedAt = row.updated_at as string;
  }

  let query = supabase
    .from("strategies")
    .update(updates)
    .eq("id", id)
    .eq("ownership", "system");
  if (expectedUpdatedAt) {
    query = query.eq("updated_at", expectedUpdatedAt);
  }

  const { data: updated, error } = await query.select(
    "id, behaviour_profile:config->behaviour_profile",
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (expectedUpdatedAt && (updated ?? []).length === 0) {
    return NextResponse.json(
      { error: "Someone saved this strategy while you were changing it. Reload and try again." },
      { status: 409 },
    );
  }

  return NextResponse.json({
    success: true,
    behaviour_profile: readBehaviourProfile(updated?.[0]?.behaviour_profile),
  });
}
