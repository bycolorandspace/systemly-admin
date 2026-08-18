import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

/**
 * Founder outreach segments and per-user send.
 *
 * Two cohorts:
 *   never_scanned  - signed up, never generated a signal. We do not know why.
 *   all_no_trade   - every scan they ran returned NO_TRADE, which was a bug
 *                    fixed on 17 Aug 2026 (repairRefusal, commit 5462ab3).
 *
 * Test and internal accounts are filtered out: emailing info+meta@systemly.ai
 * an apology would be noise, and one of them is a placeholder address that
 * would bounce.
 */
const TEST_EMAIL_PATTERNS = [
  "info+", "+test", "@ted.com", "@plac", "chikechiejine", "chike+",
];

function isTestAccount(email: string | null): boolean {
  if (!email) return true;
  const e = email.toLowerCase();
  return TEST_EMAIL_PATTERNS.some((p) => e.includes(p));
}

export async function GET() {
  const supabase = createAdminClient();

  const [{ data: profiles, error }, { data: signals }] = await Promise.all([
    supabase
      .from("user_profiles")
      .select("id, email, first_name, full_name, current_tier, created_at, outreach_sent_at, outreach_kind, trial_ends_at, trial_tier, is_super")
      .order("created_at", { ascending: false }),
    // `source = 'user'` is what the user personally generated. `community_saved`
    // rows carry their user_id too but are bookmarks of the shared feed, so
    // counting those would mark a passive user as active.
    supabase
      .from("market_signal")
      .select("user_id, direction")
      .eq("source", "user")
      .not("user_id", "is", null),
  ]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const stats = new Map<string, { total: number; tradeable: number }>();
  for (const s of signals ?? []) {
    const cur = stats.get(s.user_id) ?? { total: 0, tradeable: 0 };
    cur.total += 1;
    if (s.direction === "BUY" || s.direction === "SELL") cur.tradeable += 1;
    stats.set(s.user_id, cur);
  }

  const rows = (profiles ?? [])
    .filter((p) => !p.is_super && !isTestAccount(p.email))
    .map((p) => {
      const st = stats.get(p.id);
      const segment = !st
        ? "never_scanned"
        : st.tradeable === 0
          ? "all_no_trade"
          : null;
      return segment
        ? {
            id: p.id,
            email: p.email,
            firstName: p.first_name ?? p.full_name?.split(" ")[0] ?? "there",
            tier: p.current_tier ?? "free",
            createdAt: p.created_at,
            scanCount: st?.total ?? 0,
            isPaying: (p.current_tier ?? "free") !== "free",
            segment,
            outreachSentAt: p.outreach_sent_at,
            outreachKind: p.outreach_kind,
            trialEndsAt: p.trial_ends_at,
            trialTier: p.trial_tier,
          }
        : null;
    })
    .filter(Boolean);

  return NextResponse.json(rows);
}

const KIND_TO_EMAIL_TYPE: Record<string, string> = {
  never_scanned: "founder-invite",
  all_no_trade: "no-trade-apology",
};

/**
 * Send one outreach email, then stamp the profile so it cannot go twice.
 *
 * The stamp is written only after the main app confirms the send, so a
 * failure leaves the row resendable rather than silently marking someone
 * contacted who never heard from us.
 */
export async function POST(req: Request) {
  const body = await req.json();
  const { userId, segment, testTo } = body as {
    userId?: string;
    segment?: string;
    testTo?: string;
  };

  const type = KIND_TO_EMAIL_TYPE[segment ?? ""];
  if (!type) return NextResponse.json({ error: "Unknown segment" }, { status: 400 });

  const mainAppUrl = process.env.MAIN_APP_URL;
  const cronSecret = process.env.CRON_SECRET;
  if (!mainAppUrl || !cronSecret) {
    return NextResponse.json(
      { error: "MAIN_APP_URL or CRON_SECRET is not configured on the admin app." },
      { status: 500 },
    );
  }

  const supabase = createAdminClient();

  let payload: Record<string, unknown> = { type };

  if (testTo) {
    // Test send: addressed to the operator, never stamped.
    payload = { type, to: testTo, params: { firstName: "Chike", scanCount: 3, isPaying: true } };
  } else {
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("id, email, first_name, full_name, current_tier, outreach_sent_at")
      .eq("id", userId)
      .maybeSingle();

    if (!profile?.email) {
      return NextResponse.json({ error: "That user has no email address on file." }, { status: 404 });
    }
    if (profile.outreach_sent_at) {
      return NextResponse.json({ error: "Already contacted." }, { status: 409 });
    }

    const { count } = await supabase
      .from("market_signal")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("source", "user");

    payload = {
      type,
      to: profile.email,
      params: {
        firstName: profile.first_name ?? profile.full_name?.split(" ")[0] ?? "there",
        scanCount: count ?? 1,
        isPaying: (profile.current_tier ?? "free") !== "free",
      },
    };
  }

  const res = await fetch(`${mainAppUrl}/api/admin/email/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cronSecret}`,
    },
    body: JSON.stringify(payload),
  });

  const result = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json(
      { error: result?.error ?? "The main app could not send that email." },
      { status: 502 },
    );
  }

  if (!testTo && userId) {
    await supabase
      .from("user_profiles")
      .update({ outreach_sent_at: new Date().toISOString(), outreach_kind: segment })
      .eq("id", userId);
  }

  return NextResponse.json({ ok: true, test: !!testTo });
}
