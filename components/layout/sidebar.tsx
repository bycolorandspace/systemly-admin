"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  TrendingUp,
  Settings2,
  LogOut,
  Zap,
  Mail,
  Receipt,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createBrowserClient } from "@/lib/supabase";

const NAV_ITEMS = [
  { href: "/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/users", label: "Users", icon: Users },
  { href: "/revenue", label: "Revenue", icon: CreditCard },
  { href: "/signals", label: "Signals", icon: TrendingUp },
  { href: "/newsletter", label: "Newsletter", icon: Mail },
  { href: "/costs", label: "Costs", icon: Receipt },
  { href: "/controls", label: "Controls", icon: Settings2 },
  { href: "/docs", label: "Docs", icon: BookOpen },
];

export function Sidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <aside className="w-[220px] min-h-screen flex-shrink-0 border-r flex flex-col"
      style={{ background: "var(--card)", borderColor: "var(--border)" }}>
      <div className="px-5 py-6 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md flex items-center justify-center"
            style={{ background: "var(--primary)" }}>
            <Zap className="w-4 h-4" style={{ color: "var(--primary-foreground)" }} />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight" style={{ color: "var(--foreground)" }}>
              Systemly
            </p>
            <p className="text-[10px] tracking-widest uppercase" style={{ color: "var(--muted-foreground)" }}>
              Admin
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors",
                active
                  ? "font-medium"
                  : "hover:bg-accent"
              )}
              style={{
                background: active ? "var(--accent)" : undefined,
                color: active ? "var(--foreground)" : "var(--muted-foreground)",
              }}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t" style={{ borderColor: "var(--border)" }}>
        <div className="px-3 py-2 mb-1">
          <p className="text-xs truncate" style={{ color: "var(--muted-foreground)" }}>
            {userEmail}
          </p>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm transition-colors hover:bg-accent"
          style={{ color: "var(--muted-foreground)" }}
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
