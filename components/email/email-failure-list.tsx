import { formatDistanceToNowStrict } from "date-fns";
import type { EmailFailure } from "@/lib/queries/email";

export function EmailFailureList({ failures }: { failures: EmailFailure[] }) {
  if (failures.length === 0) {
    return (
      <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
        Nothing has failed to send in the last 30 days.
      </p>
    );
  }

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
            <th className="px-4 py-2.5 font-medium">When</th>
            <th className="px-4 py-2.5 font-medium">What</th>
            <th className="px-4 py-2.5 font-medium">Who</th>
            <th className="px-4 py-2.5 font-medium">Why it failed</th>
          </tr>
        </thead>
        <tbody>
          {failures.map((failure, i) => (
            <tr
              key={`${failure.createdAt}-${i}`}
              style={{ borderTop: "1px solid var(--border)" }}
            >
              <td
                className="px-4 py-2.5 whitespace-nowrap"
                style={{ color: "var(--muted-foreground)" }}
              >
                {formatDistanceToNowStrict(new Date(failure.createdAt))} ago
              </td>
              <td
                className="px-4 py-2.5 font-medium whitespace-nowrap"
                style={{ color: "var(--foreground)" }}
              >
                {failure.kind}
              </td>
              <td
                className="px-4 py-2.5"
                style={{ color: "var(--muted-foreground)" }}
              >
                {failure.recipient ?? failure.userId ?? "not recorded"}
              </td>
              <td className="px-4 py-2.5" style={{ color: "#e05252" }}>
                {failure.error}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
