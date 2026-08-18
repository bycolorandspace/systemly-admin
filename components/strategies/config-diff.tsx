const SECTIONS = ["entry", "risk", "exit", "sessions", "symbols"] as const;

interface ConfigDiffProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  liveConfig: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  candidateConfig: Record<string, any> | null;
}

interface FieldDiff {
  section: string;
  key: string;
  before: string;
  after: string;
}

function stringifyValue(v: unknown): string {
  if (v === undefined) return "—";
  if (v === null) return "null";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

function diffSections(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  live: Record<string, any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  candidate: Record<string, any>,
): FieldDiff[] {
  const diffs: FieldDiff[] = [];
  for (const section of SECTIONS) {
    const liveSection = live?.[section] ?? {};
    const candidateSection = candidate?.[section] ?? {};
    const keys = new Set([
      ...Object.keys(liveSection),
      ...Object.keys(candidateSection),
    ]);
    for (const key of keys) {
      const before = liveSection[key];
      const after = candidateSection[key];
      if (JSON.stringify(before) !== JSON.stringify(after)) {
        diffs.push({
          section,
          key,
          before: stringifyValue(before),
          after: stringifyValue(after),
        });
      }
    }
  }
  return diffs;
}

export function ConfigDiff({ liveConfig, candidateConfig }: ConfigDiffProps) {
  if (!candidateConfig) {
    return (
      <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
        No candidate copy linked yet — create one via duplicateStrategy() and
        link it to an experiment to see a config diff here.
      </p>
    );
  }

  const diffs = diffSections(liveConfig, candidateConfig);

  if (diffs.length === 0) {
    return (
      <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
        Candidate config is identical to the live strategy — no pending changes.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {diffs.map((d) => (
        <div
          key={`${d.section}.${d.key}`}
          className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-xs py-1.5"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <span
            className="font-mono text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded"
            style={{ color: "var(--muted-foreground)", background: "var(--muted)" }}
          >
            {d.section}
          </span>
          <span className="font-medium" style={{ color: "var(--foreground)" }}>
            {d.key}
          </span>
          <span style={{ color: "var(--destructive)" }}>{d.before}</span>
          <span style={{ color: "var(--muted-foreground)" }}>→</span>
          <span style={{ color: "var(--success)" }}>{d.after}</span>
        </div>
      ))}
    </div>
  );
}
