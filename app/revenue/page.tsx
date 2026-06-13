import { createAdminClient } from "@/lib/supabase";
import { getMRRTrend, getSubscriptionEvents } from "@/lib/queries/revenue";
import { getRevenueKPIs } from "@/lib/queries/overview";
import { MrrChart } from "@/components/revenue/mrr-chart";
import { AffiliateTable } from "@/components/revenue/affiliate-table";
import { Header } from "@/components/layout/header";
import { formatGBP, formatPercent, formatDate } from "@/lib/utils";
import { ExternalLink } from "lucide-react";

export const revalidate = 60;

const isSandbox = process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_") ?? true;
const stripeBase = `https://dashboard.stripe.com${isSandbox ? "/test" : ""}`;

export default async function RevenuePage() {
  const supabase = createAdminClient();
  const [trend, events, kpis] = await Promise.all([
    getMRRTrend(supabase),
    getSubscriptionEvents(supabase),
    getRevenueKPIs(supabase),
  ]);

  const STATUS_COLOR: Record<string, string> = {
    active: "var(--success)",
    trialing: "var(--primary)",
    canceled: "var(--destructive)",
    past_due: "var(--destructive)",
  };

  return (
    <>
      <Header title="Revenue" />
      <div className="flex-1 overflow-auto divide-y" style={{ borderColor: "var(--border)" }}>
        {/* KPI row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x" style={{ borderColor: "var(--border)" }}>
          {[
            { label: "MRR", value: formatGBP(kpis.mrr), color: "var(--success)" },
            { label: "ARR", value: formatGBP(kpis.arr), color: "var(--success)" },
            { label: "Paid Subs", value: String(kpis.totalPaidSubs), color: "var(--foreground)" },
            { label: "Conversion", value: formatPercent(kpis.conversionRate), color: "var(--primary)" },
          ].map(({ label, value, color }) => (
            <div key={label} className="px-6 py-5">
              <p
                className="text-[10px] tracking-widest uppercase mb-2"
                style={{ color: "var(--muted-foreground)" }}
              >
                {label}
              </p>
              <p className="text-3xl font-bold metric-number" style={{ color }}>{value}</p>
            </div>
          ))}
        </div>

        {/* MRR chart */}
        <div className="border-b" style={{ borderColor: "var(--border)" }}>
          <MrrChart data={trend} />
        </div>

        {/* Two columns: subscription events + referrals */}
        <div className="flex flex-col divide-y" style={{ borderColor: "var(--border)" }}>
          <div className="flex-1 px-6 py-5">
            <div className="flex items-center gap-3 mb-4">
              <p
                className="text-[10px] tracking-widest uppercase"
                style={{ color: "var(--muted-foreground)" }}
              >
                Recent Subscription Events
              </p>
              {isSandbox && (
                <span
                  className="text-[10px] font-semibold tracking-widest uppercase px-2 py-0.5 rounded"
                  style={{ background: "var(--primary)20", color: "var(--primary)" }}
                >
                  Sandbox
                </span>
              )}
              <a
                href={`${stripeBase}/subscriptions`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto inline-flex items-center gap-1 text-xs"
                style={{ color: "var(--muted-foreground)" }}
              >
                Stripe dashboard
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="space-y-3">
              {events.map((e: any, i: number) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className="capitalize font-medium w-16" style={{ color: "var(--foreground)" }}>
                    {e.tier}
                  </span>
                  <span
                    className="text-xs px-1.5 py-0.5 rounded"
                    style={{
                      background: `${STATUS_COLOR[e.status] ?? "var(--muted)"}20`,
                      color: STATUS_COLOR[e.status] ?? "var(--muted-foreground)",
                    }}
                  >
                    {e.status}
                  </span>
                  {e.cancel_at_period_end && (
                    <span className="text-xs" style={{ color: "var(--destructive)" }}>
                      canceling
                    </span>
                  )}
                  <span className="text-xs ml-auto" style={{ color: "var(--muted-foreground)" }}>
                    {e.current_period_start ? formatDate(e.current_period_start) : "—"}
                    {e.current_period_end ? ` → ${formatDate(e.current_period_end)}` : ""}
                  </span>
                  {e.stripe_subscription_id && (
                    <a
                      href={`${stripeBase}/subscriptions/${e.stripe_subscription_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))}
              {events.length === 0 && (
                <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                  No subscription events yet
                </p>
              )}
            </div>
          </div>

          <div className="flex-1 px-6 py-5 border-t" style={{ borderColor: "var(--border)" }}>
            <AffiliateTable />
          </div>
        </div>
      </div>
    </>
  );
}
