import type { Metadata } from "next";
import "./globals.css";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Sidebar } from "@/components/layout/sidebar";

export const metadata: Metadata = {
  title: "Systemly Admin",
  description: "Internal product dashboard",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="en">
      <body>
        {user ? (
          <div className="flex min-h-screen">
            <Sidebar userEmail={user.email ?? ""} />
            <div className="flex-1 flex flex-col min-h-screen overflow-auto"
              style={{ background: "var(--background)" }}>
              {children}
            </div>
          </div>
        ) : (
          <div className="min-h-screen" style={{ background: "var(--background)" }}>
            {children}
          </div>
        )}
      </body>
    </html>
  );
}
