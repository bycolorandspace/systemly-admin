import { createAdminClient } from "@/lib/supabase";
import {
  getSignalVolumeTrend,
  getWinRateTrend,
  getStrategyPerformance,
  getSymbolPerformance,
  getShareDetail,
  getCommunitySignals,
} from "@/lib/queries/signals";
import { SignalVolumeChart } from "@/components/signals/signal-volume-chart";
import { WinRateChart } from "@/components/signals/win-rate-chart";
import { Header } from "@/components/layout/header";
import { formatPercent, formatDate } from "@/lib/utils";

export const revalidate = 60;

function PerfTable({
  title,
  columns,
  rows,
  emptyMessage,
}: {
  title: string;
  columns: string[];
  rows: (string | number | null)[][];
  emptyMessage?: string;
}) {
  return (
    <div className="flex-1 min-w-0">
      <p
        className="text-[10px] tracking-widest uppercase px-6 py-4 border-b"
        style={{ color: "var(--muted-foreground)", borderColor: "var(--border)" }}
      >
        {title}
      </p>
      {rows.length === 0 ? (
        <p className="px-6 py-8 text-sm" style={{ color: "var(--muted-foreground)" }}>
          {emptyMessage ?? "No data yet"}
        </p>
      ) : (
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {columns.map((c) => (
                <th
                  key={c}
                  className="text-left px-6 py-2.5 font-medium tracking-wider uppercase text-[10px]"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={i}
                className="hover:bg-accent transition-colors"
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                {row.map((cell, j) => (
                  <td
                    key={j}
                    className="px-6 py-3 metric-number"
                    style={{ color: j === 0 ? "var(--foreground)" : "var(--muted-foreground)" }}
                  >
                    {cell ?? "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default async function SignalsPage() {
  const supabase = createAdminClient();
  const [volumeTrend, winTrend, strategies, symbols, shares, community] = await Promise.all([
    getSignalVolumeTrend(supabase),
    getWinRateTrend(supabase),
    getStrategyPerformance(supabase),
    getSymbolPerformance(supabase),
    getShareDetail(supabase),
    getCommunitySignals(supabase),
  ]);

  const hasWinRateData = winTrend.some((d) => d.winRate !== null);

  return (
    <>
      <Header title="Signals" />
      <div className="flex-1 overflow-auto divide-y" style={{ borderColor: "var(--border)" }}>
        <div
          className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x"
          style={{ borderColor: "var(--border)" }}
        >
          <SignalVolumeChart data={volumeTrend} />
          <div className="relative">
            <WinRateChart data={winTrend} />
            {!hasWinRateData && (
              <p
                className="absolute inset-0 flex items-center justify-center text-xs"
                style={{ color: "var(--muted-foreground)" }}
              >
                No resolved outcomes yet — mark signals as TP/SL to see win rate
              </p>
            )}
          </div>
        </div>

        {/* Strategy + Symbol by volume */}
        <div className="flex divide-x overflow-auto" style={{ borderColor: "var(--border)" }}>
          <PerfTable
            title="Strategy Performance (30d)"
            columns={["Strategy", "Signals", "Win Rate", "Avg Pips"]}
            emptyMessage="No strategy usage logged yet"
            rows={strategies.map((s) => [
              s.name,
              s.signals,
              formatPercent(s.winRate),
              s.avgPips.toFixed(1),
            ])}
          />
          <PerfTable
            title="Symbol Volume (30d)"
            columns={["Symbol", "Signals", "Win Rate", "Avg Pips"]}
            emptyMessage="No signals in the last 30 days"
            rows={symbols.byVolume.map((s) => [
              s.symbol,
              s.signals,
              s.winRate !== null ? formatPercent(s.winRate) : "—",
              s.avgPips !== null ? s.avgPips.toFixed(1) : "—",
            ])}
          />
        </div>

        {/* Most profitable pairs */}
        <div className="flex divide-x overflow-auto" style={{ borderColor: "var(--border)" }}>
          <PerfTable
            title="Most Profitable Pairs (30d, min 3 signals)"
            columns={["Symbol", "Signals", "Win Rate", "Avg Pips"]}
            emptyMessage="Not enough resolved signals to rank profitability yet"
            rows={symbols.byProfitability.map((s) => [
              s.symbol,
              s.signals,
              s.winRate !== null ? formatPercent(s.winRate) : "—",
              s.avgPips !== null ? s.avgPips.toFixed(1) : "—",
            ])}
          />
        </div>

        {/* Community Signals */}
        <div className="border-t" style={{ borderColor: "var(--border)" }}>
          <p
            className="text-[10px] tracking-widest uppercase px-6 py-4 border-b"
            style={{ color: "var(--muted-foreground)", borderColor: "var(--border)" }}
          >
            Community Signals (30d)
          </p>
          {/* Stats strip */}
          <div
            className="grid grid-cols-5 divide-x border-b"
            style={{ borderColor: "var(--border)" }}
          >
            {(
              [
                ["Today", community.stats.today],
                ["7 Days", community.stats.week],
                ["30 Days", community.stats.total30d],
                ["Open", community.stats.open],
                ["Win Rate", community.stats.winRate !== null ? formatPercent(community.stats.winRate) : "—"],
              ] as [string, string | number][]
            ).map(([label, value]) => (
              <div key={label} className="px-6 py-4">
                <p
                  className="text-[10px] tracking-widest uppercase mb-1"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {label}
                </p>
                <p className="text-xl font-bold metric-number" style={{ color: "var(--foreground)" }}>
                  {value}
                </p>
              </div>
            ))}
          </div>
          {/* Symbol breakdown + recent triggers */}
          <div className="flex divide-x overflow-auto" style={{ borderColor: "var(--border)" }}>
            <PerfTable
              title="By Symbol"
              columns={["Symbol", "Signals", "Win Rate", "Avg Pips"]}
              emptyMessage="No community signals yet"
              rows={community.bySymbol.map((s) => [
                s.symbol,
                s.signals,
                s.winRate !== null ? formatPercent(s.winRate) : "—",
                s.avgPips !== null ? s.avgPips.toFixed(1) : "—",
              ])}
            />
            <div className="flex-1 min-w-0">
              <p
                className="text-[10px] tracking-widest uppercase px-6 py-4 border-b"
                style={{ color: "var(--muted-foreground)", borderColor: "var(--border)" }}
              >
                Recent Triggers
              </p>
              {community.recent.length === 0 ? (
                <p className="px-6 py-8 text-sm" style={{ color: "var(--muted-foreground)" }}>
                  No community signals yet
                </p>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      {["Symbol", "Dir", "Confidence", "Outcome", "Pips", "Created"].map((c) => (
                        <th
                          key={c}
                          className="text-left px-6 py-2.5 font-medium tracking-wider uppercase text-[10px]"
                          style={{ color: "var(--muted-foreground)" }}
                        >
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {community.recent.map((r) => (
                      <tr
                        key={r.id}
                        className="hover:bg-accent transition-colors"
                        style={{ borderBottom: "1px solid var(--border)" }}
                      >
                        <td className="px-6 py-3 font-semibold" style={{ color: "var(--foreground)" }}>
                          {r.symbol}
                        </td>
                        <td
                          className="px-6 py-3"
                          style={{ color: r.direction === "BUY" ? "var(--success)" : "var(--destructive)" }}
                        >
                          {r.direction}
                        </td>
                        <td className="px-6 py-3" style={{ color: "var(--muted-foreground)" }}>
                          {r.confidence !== null ? `${Math.round(r.confidence)}%` : "—"}
                        </td>
                        <td
                          className="px-6 py-3 font-medium"
                          style={{
                            color: r.outcome?.startsWith("TP")
                              ? "var(--success)"
                              : r.outcome === "SL_HIT"
                                ? "var(--destructive)"
                                : "var(--muted-foreground)",
                          }}
                        >
                          {r.outcome ?? (r.status === "open" ? "Open" : r.status)}
                        </td>
                        <td className="px-6 py-3 metric-number" style={{ color: "var(--muted-foreground)" }}>
                          {r.pips !== null ? r.pips.toFixed(1) : "—"}
                        </td>
                        <td className="px-6 py-3" style={{ color: "var(--muted-foreground)" }}>
                          {formatDate(r.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Signal shares — sorted by viral reach */}
        <div className="border-t" style={{ borderColor: "var(--border)" }}>
          <p className="text-[10px] tracking-widest uppercase px-6 py-4 border-b"
            style={{ color: "var(--muted-foreground)", borderColor: "var(--border)" }}>
            Signal Shares — by reach
          </p>
          {shares.length === 0 ? (
            <p className="px-6 py-8 text-sm" style={{ color: "var(--muted-foreground)" }}>
              No signal shares yet
            </p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Symbol", "Dir", "Sharer", "Views", "Created", "Expires", "Status"].map((c) => (
                    <th key={c} className="text-left px-6 py-2.5 font-medium tracking-wider uppercase text-[10px]"
                      style={{ color: "var(--muted-foreground)" }}>
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shares.map((s) => (
                  <tr key={s.id} className="hover:bg-accent transition-colors"
                    style={{ borderBottom: "1px solid var(--border)" }}>
                    <td className="px-6 py-3 font-semibold" style={{ color: "var(--foreground)" }}>{s.symbol}</td>
                    <td className="px-6 py-3" style={{ color: s.direction === "BUY" ? "var(--success)" : "var(--destructive)" }}>
                      {s.direction}
                    </td>
                    <td className="px-6 py-3" style={{ color: "var(--muted-foreground)" }}>{s.sharerName}</td>
                    <td className="px-6 py-3 font-bold metric-number" style={{ color: "var(--foreground)" }}>{s.viewCount}</td>
                    <td className="px-6 py-3" style={{ color: "var(--muted-foreground)" }}>{formatDate(s.createdAt)}</td>
                    <td className="px-6 py-3" style={{ color: "var(--muted-foreground)" }}>
                      {s.expiresAt ? formatDate(s.expiresAt) : "Never"}
                    </td>
                    <td className="px-6 py-3">
                      <span className="inline-flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full"
                          style={{ background: s.active ? "var(--success)" : "var(--border)" }} />
                        <span style={{ color: "var(--muted-foreground)" }}>{s.active ? "Live" : "Expired"}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
