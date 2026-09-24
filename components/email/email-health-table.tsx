import { formatDistanceToNowStrict } from "date-fns";
import type { EmailRow } from "@/lib/queries/email";
import { EmailStatusPill } from "./email-status-pill";

function lastSentLabel(row: EmailRow): string {
  if (!row.lastSent) return "never";
  return `${formatDistanceToNowStrict(new Date(row.lastSent))} ago`;
}

export function EmailHealthTable({ rows }: { rows: EmailRow[] }) {
  return (
    <div
      className="rounded-md overflow-hidden"
      style={{ border: "1px solid var(--border)" }}
    >
      <table className="w-full text-sm">
        <thead>
          <tr
            className="text-left text-[10px] tracking-widest uppercase"
            style={{
              background: "var(--card)",
              color: "var(--muted-foreground)",
            }}
          >
            <th className="px-4 py-2.5 font-medium">Email</th>
            <th className="px-4 py-2.5 font-medium">Goes out when</th>
            <th className="px-4 py-2.5 font-medium text-right">Last sent</th>
            <th className="px-4 py-2.5 font-medium text-right">24h</th>
            <th className="px-4 py-2.5 font-medium text-right">7d</th>
            <th className="px-4 py-2.5 font-medium text-right">30d</th>
            <th className="px-4 py-2.5 font-medium text-right">Failed</th>
            <th className="px-4 py-2.5 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.family}
              style={{ borderTop: "1px solid var(--border)" }}
            >
              <td
                className="px-4 py-2.5 font-medium"
                style={{ color: "var(--foreground)" }}
              >
                {row.label}
              </td>
              <td
                className="px-4 py-2.5"
                style={{ color: "var(--muted-foreground)" }}
              >
                {row.trigger}
              </td>
              <td
                className="px-4 py-2.5 text-right metric-number"
                style={{ color: "var(--muted-foreground)" }}
              >
                {lastSentLabel(row)}
              </td>
              <td
                className="px-4 py-2.5 text-right metric-number"
                style={{ color: "var(--foreground)" }}
              >
                {row.sent24h}
              </td>
              <td
                className="px-4 py-2.5 text-right metric-number"
                style={{ color: "var(--foreground)" }}
              >
                {row.sent7d}
              </td>
              <td
                className="px-4 py-2.5 text-right metric-number"
                style={{ color: "var(--foreground)" }}
              >
                {row.sent30d}
              </td>
              <td
                className="px-4 py-2.5 text-right metric-number"
                style={{
                  color: row.failures30d > 0 ? "#e05252" : "var(--muted-foreground)",
                }}
              >
                {row.failures30d}
              </td>
              <td className="px-4 py-2.5">
                <EmailStatusPill status={row.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
