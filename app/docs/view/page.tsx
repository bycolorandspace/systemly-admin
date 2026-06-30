import Link from "next/link";
import { Header } from "@/components/layout/header";
import { DocViewer } from "@/components/docs/doc-viewer";
import { ArrowLeft } from "lucide-react";

interface PageProps {
  searchParams: Promise<{ path?: string; title?: string }>;
}

async function fetchDocContent(
  docPath: string,
): Promise<{ title: string; content: string } | null> {
  const base = process.env.MAIN_APP_URL || "http://localhost:3000";
  const secret = process.env.CRON_SECRET || "";

  try {
    const res = await fetch(
      `${base}/api/admin/docs?path=${encodeURIComponent(docPath)}`,
      {
        headers: { Authorization: `Bearer ${secret}` },
        next: { revalidate: 60 },
      },
    );
    if (!res.ok) return null;
    return res.json() as Promise<{ title: string; content: string }>;
  } catch {
    return null;
  }
}

export default async function DocViewPage({ searchParams }: PageProps) {
  const { path: docPath, title: titleParam } = await searchParams;

  if (!docPath) {
    return (
      <>
        <Header title="Docs" />
        <div className="p-6">
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            No document path provided.
          </p>
        </div>
      </>
    );
  }

  const doc = await fetchDocContent(docPath);

  return (
    <>
      <Header
        title={doc?.title ?? titleParam ?? "Doc"}
        action={
          <Link
            href="/docs"
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-colors hover:bg-accent"
            style={{ color: "var(--muted-foreground)" }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            All docs
          </Link>
        }
      />
      <div className="flex-1 overflow-auto p-8">
        {doc ? (
          <div className="max-w-3xl">
            <DocViewer content={doc.content} />
          </div>
        ) : (
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            Could not load document. Check that MAIN_APP_URL is reachable.
          </p>
        )}
      </div>
    </>
  );
}
