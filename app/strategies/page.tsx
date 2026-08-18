import { createAdminClient } from "@/lib/supabase";
import { Header } from "@/components/layout/header";
import { StrategyAdminRow } from "@/components/strategies/strategy-admin-row";
import { AllStrategiesTable } from "@/components/strategies/all-strategies-table";

export const revalidate = 0;

export default async function StrategiesPage() {
  const supabase = createAdminClient();

  // All strategies — system, user-owned, and community — not just system
  // presets. Previously this page (and this query) only ever surfaced
  // ownership='system' rows, even though the service-role client is
  // capable of seeing everything; that made any user-owned strategy
  // (including tuning candidate copies from duplicateStrategy()) invisible
  // and unlinkable from the admin app.
  const { data: allStrategies } = await supabase
    .from("strategies")
    .select(
      "id, name, description, required_tier, is_admin_enabled, available_tiers, ownership, visibility, user_id, created_at",
    )
    .order("created_at", { ascending: true });

  const systemStrategies = (allStrategies ?? []).filter(
    (s) => s.ownership === "system",
  );

  const ownerIds = [
    ...new Set(
      (allStrategies ?? [])
        .map((s) => s.user_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const { data: owners } =
    ownerIds.length > 0
      ? await supabase
          .from("user_profiles")
          .select("id, full_name, email")
          .in("id", ownerIds)
      : { data: [] as { id: string; full_name: string | null; email: string | null }[] };
  const ownerMap = Object.fromEntries(
    (owners ?? []).map((o) => [o.id, o.full_name || o.email || o.id]),
  );

  const mainAppUrl = process.env.MAIN_APP_URL || "http://localhost:3000";

  return (
    <>
      <Header title="Strategies" />
      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-6 py-8 space-y-10">
          <section>
            <p
              className="text-[10px] tracking-widest uppercase mb-1"
              style={{ color: "var(--muted-foreground)" }}
            >
              System Strategies
            </p>
            <p className="text-xs mb-4" style={{ color: "var(--muted-foreground)" }}>
              Toggle strategies on or off to control what users can access. Set tier
              availability to restrict a strategy to specific subscription tiers — leaving
              all tiers unselected means the strategy is visible to every tier above its
              required minimum.
            </p>
            <div className="space-y-3">
              {systemStrategies.map((s) => (
                <StrategyAdminRow
                  key={s.id}
                  id={s.id}
                  name={s.name}
                  description={s.description}
                  required_tier={s.required_tier}
                  is_admin_enabled={s.is_admin_enabled ?? true}
                  available_tiers={s.available_tiers ?? null}
                />
              ))}
              {systemStrategies.length === 0 && (
                <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                  No system strategies found. Run the seed endpoint to create them.
                </p>
              )}
            </div>
          </section>

          <section>
            <p
              className="text-[10px] tracking-widest uppercase mb-1"
              style={{ color: "var(--muted-foreground)" }}
            >
              All Strategies ({(allStrategies ?? []).length})
            </p>
            <p className="text-xs mb-4" style={{ color: "var(--muted-foreground)" }}>
              Every strategy platform-wide — system presets, user-owned strategies
              (including private tuning candidate copies), and community strategies.
              Open Tuning to evaluate/promote a strategy, or Edit to change its
              config directly in the main app.
            </p>
            <AllStrategiesTable
              strategies={(allStrategies ?? []).map((s) => ({
                id: s.id,
                name: s.name,
                ownership: s.ownership,
                visibility: s.visibility,
                ownerLabel: s.user_id ? (ownerMap[s.user_id] ?? s.user_id) : "—",
                createdAt: s.created_at,
              }))}
              mainAppUrl={mainAppUrl}
            />
          </section>
        </div>
      </div>
    </>
  );
}
