import { createAdminClient } from "@/lib/supabase";
import {
  getSystemHealth,
  getGrowthKPIs,
  getRevenueKPIs,
  getSignalIntelligence,
  getAnthropicVolume,
  getCostBreakdown,
} from "@/lib/queries/overview";
import { getEngagementReport } from "@/lib/queries/engagement";
import { EngagementStrip } from "@/components/engagement/engagement-strip";
import { KpiStrip } from "@/components/overview/kpi-strip";
import { RevenueStreams } from "@/components/overview/revenue-streams";
import { CostBreakdown } from "@/components/overview/cost-breakdown";
import { SystemHealthRail } from "@/components/overview/system-health-rail";
import { GrowthStrip } from "@/components/overview/growth-strip";
import { SignalStrip } from "@/components/overview/signal-strip";
import { Header } from "@/components/layout/header";

export const revalidate = 60;

export default async function OverviewPage() {
  const supabase = createAdminClient();

  const [health, growth, revenue, signals, anthropic, costs, engagement] =
    await Promise.all([
      getSystemHealth(supabase),
      getGrowthKPIs(supabase),
      getRevenueKPIs(supabase),
      getSignalIntelligence(supabase),
      getAnthropicVolume(supabase),
      getCostBreakdown(supabase),
      // Fetched over HTTP from the main app rather than queried here: the
      // funnel and return-rate definitions live in one place on purpose.
      getEngagementReport(),
    ]);

  return (
    <>
      <Header title="Overview" />
      <div className="flex-1 overflow-auto">
        <KpiStrip
          mrr={revenue.mrr}
          totalCosts={revenue.totalCosts}
          profit={revenue.profit}
          margin={revenue.margin}
        />

        <div className="flex border-b" style={{ borderColor: "var(--border)" }}>
          <RevenueStreams
            mrrFromStripe={revenue.mrr}
            trialCount={revenue.trialCount}
            newPaidThisMonth={revenue.newPaidThisMonth}
            arpu={revenue.arpu}
            churnedLast30d={revenue.churnedLast30d}
            tierCounts={revenue.tierCounts}
          />
          <CostBreakdown costs={costs} />
        </div>

        <SystemHealthRail data={health} />
        <GrowthStrip data={growth} />
        <EngagementStrip data={engagement} />
        <SignalStrip
          data={{
            ...signals,
            callsThisMonth: anthropic.callsThisMonth,
          }}
        />
      </div>
    </>
  );
}
