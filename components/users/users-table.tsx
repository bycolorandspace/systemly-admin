"use client";

import { useState, useEffect, useCallback } from "react";
import { formatDate } from "@/lib/utils";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { UserDetailDrawer } from "./user-detail-drawer";

const TIER_COLORS: Record<string, string> = {
  free: "#71717a",
  starter: "#3b82f6",
  plus: "#a855f7",
  pro: "#f59e0b",
};

interface User {
  id: string;
  fullName: string;
  email: string;
  tier: string;
  createdAt: string;
  lifetimeSignals: number;
  lastActive: string | null;
  hasMt5: boolean;
}

export function UsersTable({ initialUsers, initialTotal }: {
  initialUsers: User[];
  initialTotal: number;
}) {
  const [users, setUsers] = useState(initialUsers);
  const [total, setTotal] = useState(initialTotal);
  const [search, setSearch] = useState("");
  const [tier, setTier] = useState("all");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ search, tier, page: String(page) });
    const res = await fetch(`/api/admin/users?${params}`);
    const data = await res.json();
    setUsers(data.users);
    setTotal(data.total);
    setLoading(false);
  }, [search, tier, page]);

  useEffect(() => {
    const timer = setTimeout(fetchUsers, 300);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  const pageSize = 50;
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div>
      <div className="flex items-center gap-3 px-6 py-4 border-b"
        style={{ borderColor: "var(--border)" }}>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: "var(--muted-foreground)" }} />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-md outline-none"
            style={{
              background: "var(--secondary)",
              border: "1px solid var(--border)",
              color: "var(--foreground)",
            }}
          />
        </div>
        <select
          value={tier}
          onChange={(e) => { setTier(e.target.value); setPage(0); }}
          className="text-sm rounded-md px-3 py-2 outline-none"
          style={{
            background: "var(--secondary)",
            border: "1px solid var(--border)",
            color: "var(--foreground)",
          }}
        >
          <option value="all">All tiers</option>
          <option value="free">Free</option>
          <option value="starter">Starter</option>
          <option value="plus">Plus</option>
          <option value="pro">Pro</option>
        </select>
        <span className="text-xs ml-auto" style={{ color: "var(--muted-foreground)" }}>
          {total.toLocaleString()} users
        </span>
      </div>

      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["Name", "Email", "Tier", "Joined", "Signals", "Last Active", "MT5"].map((h) => (
                <th
                  key={h}
                  className="text-left px-6 py-3 text-[10px] font-medium tracking-widest uppercase"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={loading ? "opacity-40" : ""}>
            {users.map((user) => (
              <tr
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className="cursor-pointer transition-colors hover:bg-accent"
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                <td className="px-6 py-3.5 font-medium" style={{ color: "var(--foreground)" }}>
                  {user.fullName}
                </td>
                <td className="px-6 py-3.5" style={{ color: "var(--muted-foreground)" }}>
                  {user.email}
                </td>
                <td className="px-6 py-3.5">
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium"
                    style={{
                      background: `${TIER_COLORS[user.tier]}20`,
                      color: TIER_COLORS[user.tier],
                    }}
                  >
                    {user.tier}
                  </span>
                </td>
                <td className="px-6 py-3.5" style={{ color: "var(--muted-foreground)" }}>
                  {formatDate(user.createdAt)}
                </td>
                <td className="px-6 py-3.5 metric-number" style={{ color: "var(--foreground)" }}>
                  {user.lifetimeSignals}
                </td>
                <td className="px-6 py-3.5" style={{ color: "var(--muted-foreground)" }}>
                  {user.lastActive ? formatDate(user.lastActive) : "—"}
                </td>
                <td className="px-6 py-3.5">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: user.hasMt5 ? "var(--success)" : "var(--border)" }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t"
          style={{ borderColor: "var(--border)" }}>
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="flex items-center gap-1 text-sm disabled:opacity-40"
            style={{ color: "var(--muted-foreground)" }}
          >
            <ChevronLeft className="w-4 h-4" />
            Prev
          </button>
          <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="flex items-center gap-1 text-sm disabled:opacity-40"
            style={{ color: "var(--muted-foreground)" }}
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {selectedUser && (
        <UserDetailDrawer
          userId={selectedUser.id}
          userName={selectedUser.fullName}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
}
