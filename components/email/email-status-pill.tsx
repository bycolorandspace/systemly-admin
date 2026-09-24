import type { EmailStatus } from "@/lib/queries/email";

const STYLES: Record<EmailStatus, { label: string; fg: string; bg: string }> = {
  ok: { label: "Sending", fg: "#0f9d58", bg: "rgba(15,157,88,0.12)" },
  silent: { label: "Silent", fg: "#e2a03f", bg: "rgba(226,160,63,0.14)" },
  never: { label: "Never sent", fg: "#e05252", bg: "rgba(224,82,82,0.14)" },
  quiet: { label: "Nothing yet", fg: "var(--muted-foreground)", bg: "transparent" },
  manual: { label: "By hand", fg: "var(--muted-foreground)", bg: "transparent" },
};

export function EmailStatusPill({ status }: { status: EmailStatus }) {
  const style = STYLES[status];
  return (
    <span
      className="inline-block px-2 py-0.5 rounded text-[11px] font-medium whitespace-nowrap"
      style={{ color: style.fg, background: style.bg }}
    >
      {style.label}
    </span>
  );
}
