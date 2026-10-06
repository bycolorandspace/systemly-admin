import type { ReactNode } from "react";

/** A titled block in the admin's flat, divided style. */
export function FeedbackSection({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <section className="border-b" style={{ borderColor: "var(--border)" }}>
      <div className="px-6 pt-4 pb-3">
        <p
          className="text-[10px] tracking-widest uppercase"
          style={{ color: "var(--muted-foreground)" }}
        >
          {title}
        </p>
        {note && (
          <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
            {note}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}

export function EmptyLine({ children }: { children: ReactNode }) {
  return (
    <p className="px-6 pb-6 text-sm" style={{ color: "var(--muted-foreground)" }}>
      {children}
    </p>
  );
}

export const TH_CLASS = "text-left px-6 py-2.5 font-medium tracking-wider uppercase text-[10px]";
