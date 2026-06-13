import { createAdminClient } from "@/lib/supabase";
import { Header } from "@/components/layout/header";
import { StrategyAdminRow } from "@/components/strategies/strategy-admin-row";

export const revalidate = 0;

export default async function StrategiesPage() {
  const supabase = createAdminClient();

  const { data: strategies } = await supabase
    .from("strategies")
    .select("id, name, description, required_tier, is_admin_enabled, available_tiers")
    .eq("ownership", "system")
    .order("created_at", { ascending: true });

  return (
    <>
      <Header title="Strategies" />
      <div className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
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
              {(strategies ?? []).map((s) => (
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
              {(strategies ?? []).length === 0 && (
                <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                  No system strategies found. Run the seed endpoint to create them.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
