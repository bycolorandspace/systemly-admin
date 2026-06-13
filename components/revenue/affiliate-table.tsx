"use client";

import { useState, useEffect } from "react";
import { ExternalLink, Plus, Trash2, X } from "lucide-react";
import { formatDate, formatGBP } from "@/lib/utils";

interface AffiliateCode {
  id: string;
  code?: string;
  active?: boolean;
  commission_value?: number;
  referee_bonus_pct?: number;
  referrer_reward_gbp?: number;
  max_uses?: number;
  uses?: number;
  created_at?: string;
  [key: string]: unknown;
}

interface DrawerState {
  code: AffiliateCode;
  refereePct: string;
  referrerGbp: string;
  saving: boolean;
}

export function AffiliateTable() {
  const [codes, setCodes] = useState<AffiliateCode[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [grants, setGrants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawer, setDrawer] = useState<DrawerState | null>(null);
  const [promoOpen, setPromoOpen] = useState(false);
  const [promo, setPromo] = useState({ code: "", discount_pct: "", expires_at: "", max_uses: "" });
  const [promoSaving, setPromoSaving] = useState(false);
  const [promoMsg, setPromoMsg] = useState("");

  useEffect(() => {
    fetch("/api/admin/affiliate")
      .then((r) => r.json())
      .then((d) => {
        setCodes(d.codes ?? []);
        setReferrals(d.referrals ?? []);
        setGrants(d.grants ?? []);
        setLoading(false);
      });
  }, []);

  function referralCount(codeId: string) {
    return referrals.filter(
      (r) => r.affiliate_code_id === codeId || r.code_id === codeId
    ).length;
  }

  function rewardTotal(codeId: string) {
    return grants
      .filter((g) => g.affiliate_code_id === codeId || g.code_id === codeId)
      .reduce((sum, g) => sum + (Number(g.amount) || 0), 0);
  }

  async function toggleActive(code: AffiliateCode) {
    const next = !code.active;
    setCodes((prev) => prev.map((c) => c.id === code.id ? { ...c, active: next } : c));
    await fetch(`/api/admin/affiliate/${code.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: next }),
    });
  }

  async function saveDeal() {
    if (!drawer) return;
    setDrawer((d) => d ? { ...d, saving: true } : null);
    await fetch(`/api/admin/affiliate/${drawer.code.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        referee_bonus_pct: drawer.refereePct ? Number(drawer.refereePct) : undefined,
        referrer_reward_gbp: drawer.referrerGbp ? Number(drawer.referrerGbp) : undefined,
      }),
    });
    setCodes((prev) => prev.map((c) =>
      c.id === drawer.code.id
        ? { ...c, referee_bonus_pct: Number(drawer.refereePct), referrer_reward_gbp: Number(drawer.referrerGbp) }
        : c
    ));
    setDrawer(null);
  }

  async function savePromo() {
    setPromoSaving(true);
    setPromoMsg("");
    const res = await fetch("/api/admin/affiliate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: promo.code,
        discount_pct: Number(promo.discount_pct),
        expires_at: promo.expires_at || null,
        max_uses: promo.max_uses ? Number(promo.max_uses) : null,
      }),
    });
    setPromoSaving(false);
    setPromoMsg(res.ok ? "Promo saved to system_config" : "Failed to save");
  }

  async function deletePromo() {
    await fetch("/api/admin/affiliate", { method: "DELETE" });
    setPromoMsg("Promo deleted");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "var(--primary)" }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Affiliate code table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] tracking-widest uppercase" style={{ color: "var(--muted-foreground)" }}>
            Affiliate Codes ({codes.length})
          </p>
        </div>

        {codes.length === 0 ? (
          <p className="text-sm py-4" style={{ color: "var(--muted-foreground)" }}>
            No affiliate codes found
          </p>
        ) : (
          <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Code", "Referrals", "Reward Paid", "Referee Bonus", "Referrer Reward", "Uses", "Active"].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-[10px] font-medium tracking-wider uppercase"
                      style={{ color: "var(--muted-foreground)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {codes.map((code) => (
                  <tr
                    key={code.id}
                    className="cursor-pointer hover:bg-accent transition-colors"
                    style={{ borderBottom: "1px solid var(--border)" }}
                    onClick={() => setDrawer({
                      code,
                      refereePct: String(code.referee_bonus_pct ?? ""),
                      referrerGbp: String(code.referrer_reward_gbp ?? ""),
                      saving: false,
                    })}
                  >
                    <td className="px-4 py-3 font-mono text-xs font-semibold" style={{ color: "var(--primary)" }}>
                      {String(code.code ?? code.id)}
                    </td>
                    <td className="px-4 py-3 metric-number" style={{ color: "var(--foreground)" }}>
                      {referralCount(code.id)}
                    </td>
                    <td className="px-4 py-3 metric-number" style={{ color: "var(--foreground)" }}>
                      {formatGBP(rewardTotal(code.id))}
                    </td>
                    <td className="px-4 py-3" style={{ color: "var(--muted-foreground)" }}>
                      {code.referee_bonus_pct != null ? `${code.referee_bonus_pct}%` : "—"}
                    </td>
                    <td className="px-4 py-3" style={{ color: "var(--muted-foreground)" }}>
                      {code.referrer_reward_gbp != null ? formatGBP(code.referrer_reward_gbp) : "—"}
                    </td>
                    <td className="px-4 py-3 metric-number" style={{ color: "var(--muted-foreground)" }}>
                      {code.uses ?? 0}{code.max_uses ? ` / ${code.max_uses}` : ""}
                    </td>
                    <td className="px-4 py-3" onClick={(e) => { e.stopPropagation(); toggleActive(code); }}>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full"
                          style={{ background: code.active ? "var(--success)" : "var(--border)" }} />
                        <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                          {code.active ? "Live" : "Off"}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Promo code */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] tracking-widest uppercase" style={{ color: "var(--muted-foreground)" }}>
            Active Promo Code
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPromoOpen((v) => !v)}
              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded"
              style={{ background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--foreground)" }}
            >
              <Plus className="w-3 h-3" />
              {promoOpen ? "Cancel" : "New promo"}
            </button>
            <button onClick={deletePromo}
              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded"
              style={{ background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--destructive)" }}>
              <Trash2 className="w-3 h-3" />
              Clear
            </button>
          </div>
        </div>

        {promoOpen && (
          <div className="p-4 rounded-lg space-y-3" style={{ border: "1px solid var(--border)" }}>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Code", key: "code", placeholder: "LAUNCH20", type: "text" },
                { label: "Discount %", key: "discount_pct", placeholder: "20", type: "number" },
                { label: "Expires (optional)", key: "expires_at", placeholder: "", type: "date" },
                { label: "Max uses (optional)", key: "max_uses", placeholder: "100", type: "number" },
              ].map(({ label, key, placeholder, type }) => (
                <div key={key}>
                  <label className="block text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>{label}</label>
                  <input
                    type={type}
                    value={promo[key as keyof typeof promo]}
                    onChange={(e) => setPromo((p) => ({ ...p, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full px-3 py-2 rounded text-sm outline-none"
                    style={{ background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                  />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={savePromo}
                disabled={promoSaving || !promo.code || !promo.discount_pct}
                className="px-4 py-2 rounded text-sm font-semibold disabled:opacity-50"
                style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
              >
                {promoSaving ? "Saving…" : "Save promo"}
              </button>
              {promoMsg && <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{promoMsg}</p>}
            </div>
          </div>
        )}
      </div>

      {/* Deal drawer */}
      {drawer && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={() => setDrawer(null)} />
          <div className="w-80 h-full flex flex-col"
            style={{ background: "var(--card)", borderLeft: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
              <p className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
                {String(drawer.code.code ?? drawer.code.id)}
              </p>
              <button onClick={() => setDrawer(null)} className="p-1 rounded hover:bg-accent">
                <X className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
              </button>
            </div>
            <div className="flex-1 overflow-auto px-5 py-4 space-y-4">
              <div>
                <p className="text-[10px] tracking-widest uppercase mb-3" style={{ color: "var(--muted-foreground)" }}>
                  Deal Configuration
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>
                      Referee bonus (% off first month)
                    </label>
                    <input
                      type="number"
                      value={drawer.refereePct}
                      onChange={(e) => setDrawer((d) => d ? { ...d, refereePct: e.target.value } : null)}
                      placeholder="e.g. 30"
                      className="w-full px-3 py-2 rounded text-sm outline-none"
                      style={{ background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>
                      Referrer reward (£ per conversion)
                    </label>
                    <input
                      type="number"
                      value={drawer.referrerGbp}
                      onChange={(e) => setDrawer((d) => d ? { ...d, referrerGbp: e.target.value } : null)}
                      placeholder="e.g. 20"
                      className="w-full px-3 py-2 rounded text-sm outline-none"
                      style={{ background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                    />
                  </div>
                </div>
              </div>
              <div>
                <p className="text-[10px] tracking-widest uppercase mb-2" style={{ color: "var(--muted-foreground)" }}>
                  Stats
                </p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span style={{ color: "var(--muted-foreground)" }}>Total referrals</span>
                    <span style={{ color: "var(--foreground)" }}>{referralCount(drawer.code.id)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: "var(--muted-foreground)" }}>Reward paid</span>
                    <span style={{ color: "var(--foreground)" }}>{formatGBP(rewardTotal(drawer.code.id))}</span>
                  </div>
                  {drawer.code.created_at && (
                    <div className="flex justify-between">
                      <span style={{ color: "var(--muted-foreground)" }}>Created</span>
                      <span style={{ color: "var(--foreground)" }}>{formatDate(drawer.code.created_at)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="px-5 py-4 border-t" style={{ borderColor: "var(--border)" }}>
              <button
                onClick={saveDeal}
                disabled={drawer.saving}
                className="w-full py-2.5 rounded text-sm font-semibold disabled:opacity-50"
                style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
              >
                {drawer.saving ? "Saving…" : "Save deal"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
