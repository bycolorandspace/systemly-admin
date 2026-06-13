import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export async function GET() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("strategies")
    .select("id, name, description, required_tier, is_admin_enabled, available_tiers, ownership")
    .eq("ownership", "system")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ strategies: data ?? [] });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, is_admin_enabled, available_tiers } = body;

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
  const { error } = await supabase
    .from("strategies")
    .update(updates)
    .eq("id", id)
    .eq("ownership", "system");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
