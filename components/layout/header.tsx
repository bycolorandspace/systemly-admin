import { ReactNode } from "react";

interface HeaderProps {
  title: string;
  action?: ReactNode;
}

export function Header({ title, action }: HeaderProps) {
  return (
    <div
      className="h-14 border-b flex items-center justify-between px-6 flex-shrink-0"
      style={{ borderColor: "var(--border)", background: "var(--card)" }}
    >
      <h1
        className="text-sm font-semibold tracking-tight"
        style={{ color: "var(--foreground)" }}
      >
        {title}
      </h1>
      {action && <div>{action}</div>}
    </div>
  );
}
