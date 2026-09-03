import type { EngagementReport } from "@/lib/queries/engagement";
import { FunnelRow } from "./funnel-row";

/**
 * Activation, return rate, and where returning users land.
 *
 * The funnel is free-tier only and starts at the date client events began
 * reaching the database. Anything earlier would count users as having skipped
 * a step that nothing was recording, which is the exact mistake this
 * instrumentation was added to stop making.
 */
export function EngagementStrip({ data }: { data: EngagementReport | null }) {
  if (!data) {
    return (
      <div className="px-6 py-5 border-b" style={{ borderColor: "var(--border)" }}>
        <p
          className="text-[10px] tracking-widest uppercase mb-2"
          style={{ color: "var(--muted-foreground)" }}
        >
          Engagement
        </p>
        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
          Report unavailable. The main app did not respond.
        </p>
      </div>
    );
  }

  const f = data.funnel;
  const r = data.retention;

  return (
    <div className="px-6 py-5 border-b" style={{ borderColor: "var(--border)" }}>
      <div className="flex items-baseline justify-between mb-4 gap-3 flex-wrap">
        <p
          className="text-[10px] tracking-widest uppercase"
          style={{ color: "var(--muted-foreground)" }}
        >
          Engagement
        </p>
        <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
          Client events tracked since {data.instrumentation_start}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activation funnel */}
        <div className="space-y-3">
          <p
            className="text-[10px] uppercase tracking-wider"
            style={{ color: "var(--muted-foreground)" }}
          >
            Free activation funnel
          </p>
          <FunnelRow
            label="Signed up"
            value={f.signed_up}
            previous={f.signed_up}
            total={f.signed_up}
          />
          <FunnelRow
            label="Reached scan form"
            value={f.reached_scan_form}
            previous={f.signed_up}
            total={f.signed_up}
          />
          <FunnelRow
            label="Started a scan"
            value={f.started_scan}
            previous={f.reached_scan_form}
            total={f.signed_up}
          />
          <FunnelRow
            label="Got a signal"
            value={f.completed_scan}
            previous={f.started_scan}
            total={f.signed_up}
          />
        </div>

        {/* Return rate */}
        <div className="space-y-3">
          <p
            className="text-[10px] uppercase tracking-wider"
            style={{ color: "var(--muted-foreground)" }}
          >
            Return rate
          </p>
          <div className="flex items-baseline gap-3">
            <p
              className="text-3xl font-bold metric-number"
              style={{ color: "var(--foreground)" }}
            >
              {r.return_rate}%
            </p>
            <p className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
              {r.returning_users} of {r.users_seen} came back
              <br />a day or more after signing up
            </p>
          </div>
          <p
            className="text-[10px] uppercase tracking-wider pt-2"
            style={{ color: "var(--muted-foreground)" }}
          >
            Hit a paywall
          </p>
          <p
            className="text-lg font-bold metric-number"
            style={{ color: "var(--foreground)" }}
          >
            {f.hit_a_gate}
          </p>
        </div>

        {/* What they returned to */}
        <div className="space-y-2">
          <p
            className="text-[10px] uppercase tracking-wider"
            style={{ color: "var(--muted-foreground)" }}
          >
            What they returned to
          </p>
          {r.returned_to.length === 0 ? (
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              No return visits recorded yet.
            </p>
          ) : (
            <div className="space-y-1.5">
              {r.returned_to.map((row) => (
                <div
                  key={row.label}
                  className="flex items-baseline justify-between gap-3"
                >
                  <span
                    className="text-xs font-mono truncate"
                    style={{ color: "var(--foreground)" }}
                  >
                    {row.label}
                  </span>
                  <span
                    className="text-xs font-bold metric-number shrink-0"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {row.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Gates and failures, side by side: both are reasons a session ended badly. */}
      {(data.gates.length > 0 || data.failures.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-5 pt-5 border-t"
          style={{ borderColor: "var(--border)" }}>
          <div className="space-y-1.5">
            <p
              className="text-[10px] uppercase tracking-wider mb-2"
              style={{ color: "var(--muted-foreground)" }}
            >
              Upgrade prompts shown
            </p>
            {data.gates.length === 0 ? (
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                None recorded.
              </p>
            ) : (
              data.gates.map((g) => (
                <div key={g.label} className="flex justify-between gap-3">
                  <span className="text-xs" style={{ color: "var(--foreground)" }}>
                    {g.label}
                  </span>
                  <span
                    className="text-xs font-bold metric-number"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {g.count}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="space-y-1.5">
            <p
              className="text-[10px] uppercase tracking-wider mb-2"
              style={{ color: "var(--muted-foreground)" }}
            >
              Scan failures by code
            </p>
            {data.failures.length === 0 ? (
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                None recorded.
              </p>
            ) : (
              data.failures.map((row) => (
                <div key={row.label} className="flex justify-between gap-3">
                  <span
                    className="text-xs font-mono"
                    style={{ color: "var(--foreground)" }}
                  >
                    {row.label}
                  </span>
                  <span
                    className="text-xs font-bold metric-number"
                    style={{ color: "var(--destructive, #ef4444)" }}
                  >
                    {row.count}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
