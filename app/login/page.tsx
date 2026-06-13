"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase";
import { Zap } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const notAuthorized = searchParams.get("error") === "not_authorized";

  useEffect(() => {
    createBrowserClient().auth.signOut();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createBrowserClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError("Invalid credentials. Please try again.");
        return;
      }

      router.push("/overview");
      router.refresh();
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-[360px]">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: "var(--primary)" }}>
            <Zap className="w-5 h-5" style={{ color: "var(--primary-foreground)" }} />
          </div>
          <div>
            <p className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
              Systemly
            </p>
            <p className="text-[10px] tracking-widest uppercase" style={{ color: "var(--muted-foreground)" }}>
              Mission Control
            </p>
          </div>
        </div>

        <h2 className="text-xl font-bold mb-1" style={{ color: "var(--foreground)" }}>
          Sign in
        </h2>
        {notAuthorized ? (
          <p className="text-sm mb-8" style={{ color: "var(--destructive)" }}>
            Your account does not have super admin access.
          </p>
        ) : (
          <p className="text-sm mb-8" style={{ color: "var(--muted-foreground)" }}>
            Super admin access only.
          </p>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs mb-1.5 font-medium"
              style={{ color: "var(--muted-foreground)" }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@systemly.ai"
              className="w-full px-3 py-2.5 rounded-md text-sm outline-none transition-colors"
              style={{
                background: "var(--secondary)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
          </div>

          <div>
            <label className="block text-xs mb-1.5 font-medium"
              style={{ color: "var(--muted-foreground)" }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full px-3 py-2.5 rounded-md text-sm outline-none transition-colors"
              style={{
                background: "var(--secondary)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
          </div>

          {error && (
            <p className="text-xs" style={{ color: "var(--destructive)" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-md text-sm font-semibold transition-opacity disabled:opacity-50 mt-2"
            style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
