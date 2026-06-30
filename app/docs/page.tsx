import Link from "next/link";
import { Header } from "@/components/layout/header";
import { BookOpen, FileText } from "lucide-react";

interface DocEntry {
  title: string;
  path: string;
  slug: string;
}

interface Category {
  name: string;
  slug: string;
  order: number;
  docs: DocEntry[];
}

async function fetchDocTree(): Promise<Category[]> {
  const base = process.env.MAIN_APP_URL || "http://localhost:3000";
  const secret = process.env.CRON_SECRET || "";

  try {
    const res = await fetch(`${base}/api/admin/docs`, {
      headers: { Authorization: `Bearer ${secret}` },
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const data = await res.json() as { categories: Category[] };
    return data.categories ?? [];
  } catch {
    return [];
  }
}

export const revalidate = 60;

export default async function DocsPage() {
  const categories = await fetchDocTree();

  return (
    <>
      <Header title="Docs" />
      <div className="flex-1 overflow-auto p-6">
        {categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3"
            style={{ color: "var(--muted-foreground)" }}>
            <BookOpen className="w-8 h-8 opacity-40" />
            <p className="text-sm">No docs found — check MAIN_APP_URL is reachable.</p>
          </div>
        ) : (
          <div className="space-y-8 max-w-4xl">
            {categories.map((cat) => (
              <section key={cat.slug}>
                <h2 className="text-xs font-semibold uppercase tracking-widest mb-3"
                  style={{ color: "var(--muted-foreground)" }}>
                  {cat.name}
                </h2>
                <div className="rounded-lg border overflow-hidden"
                  style={{ borderColor: "var(--border)", background: "var(--card)" }}>
                  {cat.docs.map((doc, i) => (
                    <Link
                      key={doc.path}
                      href={`/docs/view?path=${encodeURIComponent(doc.path)}&title=${encodeURIComponent(doc.title)}`}
                      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent"
                      style={{
                        borderTop: i > 0 ? `1px solid var(--border)` : undefined,
                      }}
                    >
                      <FileText className="w-3.5 h-3.5 flex-shrink-0"
                        style={{ color: "var(--muted-foreground)" }} />
                      <span className="text-sm" style={{ color: "var(--foreground)" }}>
                        {doc.title}
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
