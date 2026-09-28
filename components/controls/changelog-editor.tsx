"use client";

/** A JSON list of {title, description} entries, edited as rows. */
type Entry = { title: string; description: string };

export function ChangelogEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
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
