import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

const VALID_TIERS = ["starter", "plus", "pro"];
const CODE_REGEX = /^[a-z0-9_-]{1,64}$/;

/** List every invite with its live redemption count. */
export async function GET() {
  const supabase = createAdminClient();

  const [{ data: invites, error }, { data: redemptions }] = await Promise.all([
    supabase.from("trial_invite").select("*").order("created_at", { ascending: false }),
    supabase.from("trial_redemption").select("code"),
  ]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Counted here rather than stored on the row: a denormalised counter drifts
  // the first time a grant is undone by hand.
  const counts = new Map<string, number>();
  for (const r of redemptions ?? []) {
    counts.set(r.code, (counts.get(r.code) ?? 0) + 1);
  }

  return NextResponse.json(
    (invites ?? []).map((i) => ({ ...i, redemptions: counts.get(i.code) ?? 0 })),
  );
}

export async function POST(req: Request) {
  const body = await req.json();
  const code = String(body.code ?? "").trim().toLowerCase();
  const tier = String(body.tier ?? "");
  const days = Number(body.days);

  if (!CODE_REGEX.test(code)) {
    return NextResponse.json(
      { error: "Code must be 1-64 characters: lowercase letters, numbers, dashes or underscores." },
      { status: 400 },
    );
  }
  if (!VALID_TIERS.includes(tier)) {
    return NextResponse.json({ error: "Tier must be starter, plus or pro." }, { status: 400 });
  }
  if (!Number.isInteger(days) || days < 1 || days > 365) {
    return NextResponse.json({ error: "Days must be a whole number between 1 and 365." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("trial_invite").insert({
    code,
    tier,
    days,
    label: body.label || null,
    max_redemptions: body.max_redemptions ? Number(body.max_redemptions) : null,
    expires_at: body.expires_at || null,
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: `The code "${code}" already exists.` }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
