import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { getMonthStart } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const monthParam = searchParams.get("month");

  const supabase = createAdminClient();
  const monthStart = monthParam ?? getMonthStart().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("cost_entries")
    .select("*")
    .eq("period_month", monthStart)
    .order("amount_gbp", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const { service_name, amount_gbp, month } = await req.json();

  if (!service_name || amount_gbp === undefined) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const monthStart = month ?? getMonthStart().toISOString().split("T")[0];

  const { error } = await supabase.from("cost_entries").upsert(
    {
      service_name,
      amount_gbp,
      period_month: monthStart,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "service_name,period_month" }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function POST(req: NextRequest) {
  const { service_name, amount_gbp, month } = await req.json();

  if (!service_name) {
    return NextResponse.json({ error: "service_name required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const monthStart = month ?? getMonthStart().toISOString().split("T")[0];

  const { error } = await supabase.from("cost_entries").insert({
    service_name,
    amount_gbp: amount_gbp ?? 0,
    period_month: monthStart,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
