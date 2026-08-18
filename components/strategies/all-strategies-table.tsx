import Link from "next/link";
import { formatDate } from "@/lib/utils";

interface StrategyRow {
  id: string;
  name: string;
  ownership: string;
  visibility: string;
  ownerLabel: string;
  createdAt: string;
}

interface AllStrategiesTableProps {
  strategies: StrategyRow[];
  mainAppUrl: string;
}

export function AllStrategiesTable({
  strategies,
  mainAppUrl,
}: AllStrategiesTableProps) {
  if (strategies.length === 0) {
    return (
      <p className="px-6 py-8 text-sm" style={{ color: "var(--muted-foreground)" }}>
        No strategies found.
      </p>
    );
  }

  return (
    <div className="overflow-auto border rounded-lg" style={{ borderColor: "var(--border)" }}>
      <table className="w-full text-xs">
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)" }}>
            {["Name", "Owner", "Ownership", "Visibility", "Created", ""].map((c) => (
              <th
                key={c}
                className="text-left px-4 py-2.5 font-medium tracking-wider uppercase text-[10px]"
                style={{ color: "var(--muted-foreground)" }}
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {strategies.map((s) => (
            <tr
              key={s.id}
              className="hover:bg-accent transition-colors"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <td className="px-4 py-3 font-medium" style={{ color: "var(--foreground)" }}>
                {s.name}
              </td>
              <td className="px-4 py-3" style={{ color: "var(--muted-foreground)" }}>
                {s.ownership === "system" ? "System" : s.ownerLabel}
              </td>
              <td className="px-4 py-3" style={{ color: "var(--muted-foreground)" }}>
                {s.ownership}
              </td>
              <td className="px-4 py-3" style={{ color: "var(--muted-foreground)" }}>
                {s.visibility}
              </td>
              <td className="px-4 py-3" style={{ color: "var(--muted-foreground)" }}>
                {formatDate(s.createdAt)}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <Link
                    href={`/strategies/${s.id}/tuning`}
                    className="hover:underline"
                    style={{ color: "var(--primary)" }}
                  >
                    Tuning
                  </Link>
                  <a
                    href={`${mainAppUrl}/strategies/${s.id}/edit`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                    style={{ color: "var(--primary)" }}
                  >
                    Edit ↗
                  </a>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
