import { createAdminClient } from "@/lib/supabase";
import { getSignalIntelligence } from "@/lib/queries/overview";
import { getSymbolPerformance, getBestSignalThisWeek } from "@/lib/queries/signals";
import { Header } from "@/components/layout/header";
import { NewsletterSender } from "@/components/newsletter/newsletter-sender";
import { formatPercent } from "@/lib/utils";

export const revalidate = 0;

function buildEmailHtml(data: {
  winRate: number | null;
  topSymbols: { symbol: string; avgPips: number | null; winRate: number | null }[];
  bestSignal: { symbol: string; direction: string; manual_pnl_pips: number } | null;
  signalsLast7d: number;
}): string {
  const winRateStr = data.winRate !== null ? `${data.winRate.toFixed(0)}%` : "—";

  const symbolRows = data.topSymbols
    .map(
      (s) =>
        `<tr>
          <td style="padding:6px 12px;font-weight:600">${s.symbol}</td>
          <td style="padding:6px 12px;color:#888">${s.winRate !== null ? `${s.winRate.toFixed(0)}%` : "—"}</td>
          <td style="padding:6px 12px;color:#888">${s.avgPips !== null ? `${s.avgPips.toFixed(1)} pips` : "—"}</td>
        </tr>`
    )
    .join("");

  const bestSignalBlock = data.bestSignal
    ? `<div style="margin:24px 0;padding:16px;background:#f0fdf4;border-radius:8px;border:1px solid #bbf7d0">
        <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#16a34a">Signal of the week</p>
        <p style="margin:0;font-size:20px;font-weight:700">${data.bestSignal.symbol} ${data.bestSignal.direction} &mdash; +${data.bestSignal.manual_pnl_pips} pips</p>
      </div>`
    : "";

  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#f0f0f0">
  <div style="max-width:580px;margin:0 auto;padding:32px 24px">
    <div style="margin-bottom:32px">
      <p style="margin:0;font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:#666">Systemly</p>
      <h1 style="margin:8px 0 0;font-size:26px;font-weight:700">What you missed this week ⚡</h1>
    </div>

    <div style="display:flex;gap:24px;margin-bottom:28px">
      <div style="flex:1;padding:16px;background:#111;border-radius:8px;border:1px solid #222">
        <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#666">Win Rate</p>
        <p style="margin:0;font-size:28px;font-weight:700;color:${data.winRate !== null && data.winRate >= 60 ? "#22c55e" : "#f0f0f0"}">${winRateStr}</p>
      </div>
      <div style="flex:1;padding:16px;background:#111;border-radius:8px;border:1px solid #222">
        <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#666">Signals</p>
        <p style="margin:0;font-size:28px;font-weight:700">${data.signalsLast7d}</p>
      </div>
    </div>

    ${bestSignalBlock}

    <div style="margin-bottom:28px">
      <p style="margin:0 0 12px;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#666">Top Profitable Pairs (7d)</p>
      <table style="width:100%;border-collapse:collapse;background:#111;border-radius:8px;overflow:hidden;border:1px solid #222">
        <thead>
          <tr style="border-bottom:1px solid #222">
            <th style="padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#666">Pair</th>
            <th style="padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#666">Win Rate</th>
            <th style="padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#666">Avg Pips</th>
          </tr>
        </thead>
        <tbody>${symbolRows || '<tr><td colspan="3" style="padding:12px;color:#666">No resolved signals yet</td></tr>'}</tbody>
      </table>
    </div>

    <div style="padding:20px;background:#111;border-radius:8px;border:1px solid #222;text-align:center">
      <p style="margin:0 0 12px;font-size:15px">See every signal in real time</p>
      <a href="https://systemly.ai/upgrade" style="display:inline-block;padding:10px 24px;background:#7c3aed;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px">
        Upgrade your plan
      </a>
    </div>

    <p style="margin:24px 0 0;font-size:12px;color:#444;text-align:center">
      Systemly &middot; <a href="{{unsubscribeUrl}}" style="color:#444">Unsubscribe</a>
    </p>
  </div>
</body>
</html>`;
}

export default async function NewsletterPage() {
  const supabase = createAdminClient();
  const [intel, symbols, bestSignal, lastSentConfig] = await Promise.all([
    getSignalIntelligence(supabase),
    getSymbolPerformance(supabase),
    getBestSignalThisWeek(supabase),
    supabase.from("system_config").select("value").eq("key", "newsletter_last_sent").maybeSingle(),
  ]);

  const lastSent = lastSentConfig.data?.value as { sent_at: string; channel: string; subject: string } | null;

  const emailHtml = buildEmailHtml({
    winRate: intel.winRate,
    topSymbols: symbols.byProfitability.slice(0, 5).map((s) => ({
      symbol: s.symbol,
      avgPips: s.avgPips,
      winRate: s.winRate,
    })),
    bestSignal: bestSignal
      ? {
          symbol: bestSignal.symbol as string,
          direction: bestSignal.direction as string,
          manual_pnl_pips: Number(bestSignal.manual_pnl_pips),
        }
      : null,
    signalsLast7d: intel.signalsLast7d,
  });

  const defaultSubject = `Systemly | What you missed this week — ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long" })}`;

  return (
    <>
      <Header title="Newsletter" />
      <div className="flex-1 overflow-auto">
        <NewsletterSender
          defaultSubject={defaultSubject}
          emailHtml={emailHtml}
          lastSent={lastSent}
          stats={{
            winRate: intel.winRate,
            signalsLast7d: intel.signalsLast7d,
            topSymbol: intel.topSymbol,
          }}
        />
      </div>
    </>
  );
}
