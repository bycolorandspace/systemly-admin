import { createAdminClient } from "@/lib/supabase";
import { getCostBreakdown } from "@/lib/queries/overview";
import { CostTracker } from "@/components/controls/cost-tracker";
import { ServiceMonitor } from "@/components/controls/service-monitor";
import { Header } from "@/components/layout/header";
import { getMonthStart } from "@/lib/utils";

export const revalidate = 60;

export default async function CostsPage() {
  const supabase = createAdminClient();
  const costs = await getCostBreakdown(supabase);

  const currentMonth = getMonthStart().toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  const costsWithId = costs.map((c, i) => ({
    id: String(i),
    service_name: c.service_name,
    amount_gbp: c.amount_gbp,
    period_month: getMonthStart().toISOString().split("T")[0],
  }));

  return (
    <>
      <Header title="Costs" />
      <div className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto px-6 py-8 space-y-10">
          <section>
            <CostTracker initialCosts={costsWithId} currentMonth={currentMonth} />
          </section>
          <section>
            <ServiceMonitor />
          </section>
        </div>
      </div>
    </>
  );
}
