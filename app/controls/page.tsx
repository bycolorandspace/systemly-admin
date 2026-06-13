import { createAdminClient } from "@/lib/supabase";
import { getSystemHealth } from "@/lib/queries/overview";
import { ToggleCard } from "@/components/controls/toggle-card";
import { NumberConfigCard } from "@/components/controls/number-config-card";
import { TextConfigCard } from "@/components/controls/text-config-card";
import { CronTriggerList } from "@/components/controls/cron-trigger-card";
import { Header } from "@/components/layout/header";

export const revalidate = 30;

export default async function ControlsPage() {
  const supabase = createAdminClient();
  const health = await getSystemHealth(supabase);

  const { data: allConfigs } = await supabase
    .from("system_config")
    .select("key, value, updated_at")
    .order("key");

  const configMap = Object.fromEntries(
    (allConfigs ?? []).map((c) => [c.key, c.value]),
  );
  const defaultTrialDays = Number(
    (configMap["default_trial_days"] as number | undefined) ?? 7,
  );
  const shareExpiryHours = Number(
    (configMap["share_expiry_hours"] as number | undefined) ?? 168,
  );
  const emailSenderName = String(
    (configMap["email_sender_name"] as string | undefined) ?? "Joshua",
  );
  const emailSenderRole = String(
    (configMap["email_sender_role"] as string | undefined) ?? "Community Manager",
  );

  return (
    <>
      <Header title="Controls" />
      <div className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto px-6 py-8 space-y-10">
          {/* System toggles */}
          <section>
            <p
              className="text-[10px] tracking-widest uppercase mb-4"
              style={{ color: "var(--muted-foreground)" }}
            >
              System Controls
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ToggleCard
                label="Signal Sharing"
                description="Pausing blocks all shared signal link access (returns 503 to viewers)"
                paused={health.signalSharingPaused}
                configKey="signal_sharing"
              />
              <ToggleCard
                label="Test Trading"
                description="Pausing stops automated test signal generation and execution"
                paused={health.testTradingPaused}
                configKey="test_trading"
              />
              <ToggleCard
                label="Community Signals"
                description="Runs AI analysis on 15 symbols 5× daily (weekdays). ~$3.75/day in Anthropic credits when active."
                paused={health.communitySignalsPaused}
                configKey="community_signals"
              />
              <ToggleCard
                label="Community Feed"
                description="Shows the /feed page and Share-to-Feed buttons. No AI credits — display only."
                paused={health.communityFeedPaused}
                configKey="community_feed"
              />
            </div>
          </section>

          {/* Growth controls */}
          <section>
            <p
              className="text-[10px] tracking-widest uppercase mb-4"
              style={{ color: "var(--muted-foreground)" }}
            >
              Growth Controls
            </p>
            <div className="space-y-3">
              <NumberConfigCard
                label="Default Trial Length"
                description="Days granted to new signups — main app reads this at registration"
                configKey="default_trial_days"
                initialValue={defaultTrialDays}
                min={0}
                max={365}
                unit="days"
              />
              <NumberConfigCard
                label="Share Link Expiry"
                description="How long shared signal links stay active before expiring"
                configKey="share_expiry_hours"
                initialValue={shareExpiryHours}
                min={1}
                unit="hours"
              />
            </div>
          </section>

          {/* Email sender */}
          <section>
            <p
              className="text-[10px] tracking-widest uppercase mb-4"
              style={{ color: "var(--muted-foreground)" }}
            >
              Email
            </p>
            <div className="space-y-3">
              <TextConfigCard
                label="Sender Name"
                description="Name shown in welcome and transactional emails"
                configKey="email_sender_name"
                initialValue={emailSenderName}
                placeholder="e.g. Joshua"
              />
              <TextConfigCard
                label="Sender Role"
                description="Role shown under the sender name in the email sign-off"
                configKey="email_sender_role"
                initialValue={emailSenderRole}
                placeholder="e.g. Community Manager"
              />
            </div>
          </section>

          {/* Cron triggers — invoke main app jobs on demand */}
          <section>
            <p
              className="text-[10px] tracking-widest uppercase mb-1"
              style={{ color: "var(--muted-foreground)" }}
            >
              Cron Triggers
            </p>
            <p
              className="text-xs mb-4"
              style={{ color: "var(--muted-foreground)" }}
            >
              Manually invoke a main-app cron job. Forwards with the shared CRON_SECRET.
            </p>
            <CronTriggerList mainAppUrl={process.env.MAIN_APP_URL ?? "not set"} />
          </section>

          {/* System config viewer */}
          <section>
            <p
              className="text-[10px] tracking-widest uppercase mb-4"
              style={{ color: "var(--muted-foreground)" }}
            >
              System Config (raw)
            </p>
            <div
              className="rounded-lg overflow-hidden"
              style={{ border: "1px solid var(--border)" }}
            >
              {(allConfigs ?? []).map((config, i) => (
                <div
                  key={config.key}
                  className="px-4 py-3"
                  style={{
                    borderBottom:
                      i < (allConfigs?.length ?? 0) - 1
                        ? "1px solid var(--border)"
                        : "none",
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className="text-xs font-mono font-semibold"
                      style={{ color: "var(--primary)" }}
                    >
                      {config.key}
                    </span>
                    <span
                      className="text-[10px]"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      {config.updated_at
                        ? new Date(config.updated_at as string).toLocaleString(
                            "en-GB",
                            {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )
                        : "—"}
                    </span>
                  </div>
                  <pre
                    className="text-xs font-mono overflow-auto"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {JSON.stringify(config.value, null, 2)}
                  </pre>
                </div>
              ))}
              {(allConfigs?.length ?? 0) === 0 && (
                <p
                  className="px-4 py-3 text-sm"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  No system config entries
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
