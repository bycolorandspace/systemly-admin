"use client";

import { useState, useEffect } from "react";

export type EmailFieldDef = {
  key: string;
  label: string;
  multiline?: boolean;
  json?: boolean; // changelog_entries: render as structured list
};

export type EmailTypeDef = {
  type: string;
  label: string;
  desc: string;
  fields: EmailFieldDef[];
  previewParams?: Record<string, string>;
};

interface Props {
  def: EmailTypeDef;
  mainAppUrl: string;
  cronSecret: string;
}

export function EmailTemplatePanel({ def, mainAppUrl, cronSecret }: Props) {
  const [fields, setFields] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testTo, setTestTo] = useState("");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${cronSecret}` };

  useEffect(() => {
    fetch(`${mainAppUrl}/api/admin/email/copy?type=${def.type}`, { headers: { Authorization: `Bearer ${cronSecret}` } })
      .then((r) => r.json())
      .then((data) => {
        const map: Record<string, string> = {};
        for (const f of data.fields ?? []) map[f.field_key] = f.value;
        setFields(map);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [def.type, mainAppUrl, cronSecret]);

  async function handleSave() {
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch(`${mainAppUrl}/api/admin/email/copy`, {
        method: "POST",
        headers,
        body: JSON.stringify({ emailType: def.type, fields }),
      });
      const json = await res.json();
      setStatus(res.ok ? `✓ Saved ${json.upserted} fields` : `✗ ${json.error}`);
    } catch (err) {
      setStatus(`✗ ${String(err)}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleSend() {
    if (!testTo) { setStatus("Enter a test email first"); return; }
    setSending(true);
    setStatus(null);
    try {
      const res = await fetch(`${mainAppUrl}/api/admin/email/send`, {
        method: "POST",
        headers,
        body: JSON.stringify({ type: def.type, to: testTo }),
      });
      const json = await res.json();
      setStatus(res.ok ? `✓ Sent to ${testTo}` : `✗ ${json.error}`);
    } catch (err) {
      setStatus(`✗ ${String(err)}`);
    } finally {
      setSending(false);
    }
  }

  const previewUrl = `${mainAppUrl}/api/email-preview/${def.type}${def.previewParams ? "?" + new URLSearchParams(def.previewParams).toString() : ""}`;

  if (loading) {
    return <div className="text-sm text-muted-foreground p-4">Loading…</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-sm">{def.label}</p>
          <p className="text-xs text-muted-foreground">{def.desc}</p>
        </div>
        <a href={previewUrl} target="_blank" rel="noreferrer" className="text-xs px-3 py-1.5 border rounded-md hover:bg-accent">
          Preview
        </a>
      </div>

      {def.fields.map((f) =>
        f.json ? (
          <ChangelogEditor key={f.key} value={fields[f.key] ?? "[]"} onChange={(v) => setFields((prev) => ({ ...prev, [f.key]: v }))} />
        ) : (
          <div key={f.key}>
            <label className="block text-xs font-medium mb-1 text-muted-foreground">{f.label}</label>
            {f.multiline ? (
              <textarea
                rows={4}
                className="w-full text-sm border rounded-md p-2 resize-y font-mono bg-background"
                value={fields[f.key] ?? ""}
                onChange={(e) => setFields((prev) => ({ ...prev, [f.key]: e.target.value }))}
              />
            ) : (
              <input
                type="text"
                className="w-full text-sm border rounded-md p-2 bg-background"
                value={fields[f.key] ?? ""}
                onChange={(e) => setFields((prev) => ({ ...prev, [f.key]: e.target.value }))}
              />
            )}
          </div>
        )
      )}

      <div className="flex items-center gap-2 pt-2">
        <input
          type="email"
          placeholder="test@example.com"
          value={testTo}
          onChange={(e) => setTestTo(e.target.value)}
          className="flex-1 text-sm border rounded-md p-2 bg-background"
        />
        <button onClick={handleSend} disabled={sending} className="text-sm px-3 py-1.5 border rounded-md hover:bg-accent disabled:opacity-50">
          {sending ? "Sending…" : "Send test"}
        </button>
        <button onClick={handleSave} disabled={saving} className="text-sm px-3 py-1.5 bg-foreground text-background rounded-md hover:opacity-80 disabled:opacity-50">
          {saving ? "Saving…" : "Save copy"}
        </button>
      </div>

      {status && (
        <p className={`text-xs ${status.startsWith("✓") ? "text-green-600" : "text-red-500"}`}>{status}</p>
      )}
    </div>
  );
}

// ── Structured changelog entry editor ────────────────────────────────────────

type Entry = { title: string; description: string };

function ChangelogEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  let entries: Entry[] = [];
  try { entries = JSON.parse(value); } catch { /* start empty */ }

  function update(next: Entry[]) {
    onChange(JSON.stringify(next));
  }

  function addEntry() {
    update([...entries, { title: "", description: "" }]);
  }

  function removeEntry(i: number) {
    update(entries.filter((_, idx) => idx !== i));
  }

  function editEntry(i: number, field: keyof Entry, val: string) {
    update(entries.map((e, idx) => (idx === i ? { ...e, [field]: val } : e)));
  }

  return (
    <div>
      <label className="block text-xs font-medium mb-2 text-muted-foreground">Changelog entries (shown in winback email)</label>
      <div className="space-y-3">
        {entries.map((entry, i) => (
          <div key={i} className="border rounded-md p-3 space-y-2 relative">
            <button onClick={() => removeEntry(i)} className="absolute top-2 right-2 text-xs text-muted-foreground hover:text-red-500">✕</button>
            <input
              type="text"
              placeholder="Title"
              className="w-full text-sm border rounded p-1.5 bg-background"
              value={entry.title}
              onChange={(e) => editEntry(i, "title", e.target.value)}
            />
            <textarea
              rows={2}
              placeholder="Description"
              className="w-full text-sm border rounded p-1.5 resize-none bg-background"
              value={entry.description}
              onChange={(e) => editEntry(i, "description", e.target.value)}
            />
          </div>
        ))}
      </div>
      <button onClick={addEntry} className="mt-2 text-xs px-3 py-1.5 border rounded-md hover:bg-accent">
        + Add entry
      </button>
    </div>
  );
}
