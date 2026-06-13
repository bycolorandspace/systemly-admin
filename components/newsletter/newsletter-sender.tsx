"use client";

import { useState } from "react";
import { Send, Mail, MessageCircle } from "lucide-react";
import { formatDate, formatPercent } from "@/lib/utils";

interface Props {
  defaultSubject: string;
  emailHtml: string;
  lastSent: { sent_at: string; channel: string; subject: string } | null;
  stats: { winRate: number | null; signalsLast7d: number; topSymbol: string };
}

type Channel = "email" | "whatsapp" | "both";

export function NewsletterSender({ defaultSubject, emailHtml, lastSent, stats }: Props) {
  const [subject, setSubject] = useState(defaultSubject);
  const [channel, setChannel] = useState<Channel>("email");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [tab, setTab] = useState<"preview" | "html">("preview");

  async function send() {
    setSending(true);
    setResult(null);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, htmlContent: emailHtml, channel }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(`Sent — ${data.email ?? ""} ${data.whatsapp ?? ""}`.trim());
      } else {
        setResult(`Error: ${data.error ?? JSON.stringify(data)}`);
      }
    } catch (e) {
      setResult("Network error");
    }
    setSending(false);
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Win Rate (7d)", value: stats.winRate !== null ? formatPercent(stats.winRate, 0) : "—" },
          { label: "Signals (7d)", value: String(stats.signalsLast7d) },
          { label: "Top Symbol", value: stats.topSymbol },
        ].map(({ label, value }) => (
          <div key={label} className="px-5 py-4 rounded-lg" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <p className="text-[10px] tracking-widest uppercase mb-1" style={{ color: "var(--muted-foreground)" }}>{label}</p>
            <p className="text-xl font-bold metric-number" style={{ color: "var(--foreground)" }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="space-y-4 p-5 rounded-lg" style={{ border: "1px solid var(--border)", background: "var(--card)" }}>
        <div>
          <label className="block text-xs mb-1.5" style={{ color: "var(--muted-foreground)" }}>Subject line</label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-3 py-2.5 rounded text-sm outline-none"
            style={{ background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--foreground)" }}
          />
        </div>

        <div>
          <label className="block text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>Channel</label>
          <div className="flex gap-2">
            {(["email", "whatsapp", "both"] as Channel[]).map((c) => (
              <button
                key={c}
                onClick={() => setChannel(c)}
                className="flex items-center gap-1.5 px-3 py-2 rounded text-xs font-medium transition-colors"
                style={{
                  background: channel === c ? "var(--primary)" : "var(--secondary)",
                  color: channel === c ? "var(--primary-foreground)" : "var(--foreground)",
                  border: "1px solid var(--border)",
                }}
              >
                {c === "email" && <Mail className="w-3 h-3" />}
                {c === "whatsapp" && <MessageCircle className="w-3 h-3" />}
                {c === "both" && <Send className="w-3 h-3" />}
                {c === "email" ? "Email" : c === "whatsapp" ? "WhatsApp" : "Both"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 pt-1">
          <button
            onClick={send}
            disabled={sending || !subject}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded font-semibold text-sm disabled:opacity-50"
            style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
          >
            <Send className="w-4 h-4" />
            {sending ? "Sending…" : "Send now"}
          </button>
          {lastSent && (
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              Last sent {formatDate(lastSent.sent_at)} via {lastSent.channel}
            </p>
          )}
          {result && (
            <p className="text-xs" style={{ color: result.startsWith("Error") ? "var(--destructive)" : "var(--success)" }}>
              {result}
            </p>
          )}
        </div>
      </div>

      {/* Preview */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          {(["preview", "html"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-3 py-1.5 rounded text-xs font-medium"
              style={{
                background: tab === t ? "var(--secondary)" : "transparent",
                border: "1px solid var(--border)",
                color: tab === t ? "var(--foreground)" : "var(--muted-foreground)",
              }}
            >
              {t === "preview" ? "Preview" : "HTML source"}
            </button>
          ))}
        </div>

        {tab === "preview" ? (
          <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>
            <iframe
              srcDoc={emailHtml}
              className="w-full"
              style={{ height: "600px", background: "#0a0a0a" }}
              title="Email preview"
            />
          </div>
        ) : (
          <pre
            className="text-xs font-mono overflow-auto p-4 rounded-lg"
            style={{ background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--muted-foreground)", maxHeight: "600px" }}
          >
            {emailHtml}
          </pre>
        )}
      </div>
    </div>
  );
}
