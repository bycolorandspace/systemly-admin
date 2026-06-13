import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { getAffiliateDetails } from "@/lib/queries/revenue";

export async function GET() {
  const supabase = createAdminClient();
  const data = await getAffiliateDetails(supabase);
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { code, discount_pct, expires_at, max_uses } = body;

  if (!code || discount_pct === undefined) {
    return NextResponse.json({ error: "code and discount_pct required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const promoValue = { code, discount_pct, expires_at: expires_at ?? null, max_uses: max_uses ?? null, uses: 0 };

  const { error } = await supabase
    .from("system_config")
    .upsert(
      { key: "active_promo", value: promoValue, updated_at: new Date().toISOString() },
      { onConflict: "key" }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("system_config")
    .delete()
    .eq("key", "active_promo");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
