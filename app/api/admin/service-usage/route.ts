import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

interface ServiceUsage {
  service: string;
  used: number | null;
  limit: number | null;
  unit: string;
  billingUrl: string;
  autoFetched: boolean;
  error?: string;
}

async function fetchBrevo(): Promise<ServiceUsage> {
  try {
    const res = await fetch("https://api.brevo.com/v3/account", {
      headers: { "api-key": process.env.BREVO_API_KEY! },
    });
    const data = await res.json();
    const emails = data?.plan?.[0];
    return {
      service: "Brevo",
      used: emails?.credits ?? null,
      limit: emails?.creditsLimit ?? 9000,
      unit: "emails/mo",
      billingUrl: "https://app.brevo.com/account/billing",
      autoFetched: true,
    };
  } catch (e) {
    return { service: "Brevo", used: null, limit: 9000, unit: "emails/mo", billingUrl: "https://app.brevo.com/account/billing", autoFetched: true, error: String(e) };
  }
}

async function fetchTwelveData(): Promise<ServiceUsage> {
  try {
    const res = await fetch(`https://api.twelvedata.com/api_usage?apikey=${process.env.TWELVE_DATA_API_KEY}`);
    const data = await res.json();
    return {
      service: "Twelve Data",
      used: data?.current_usage ?? null,
      limit: data?.daily_limit ?? 800,
      unit: "credits/day",
      billingUrl: "https://twelvedata.com/account",
      autoFetched: true,
    };
  } catch (e) {
    return { service: "Twelve Data", used: null, limit: 800, unit: "credits/day", billingUrl: "https://twelvedata.com/account", autoFetched: true, error: String(e) };
  }
}

async function fetchTwilio(): Promise<ServiceUsage> {
  try {
    const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64");
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Balance.json`,
      { headers: { Authorization: `Basic ${auth}` } }
    );
    const data = await res.json();
    const balance = parseFloat(data?.balance ?? "0");
    return {
      service: "Twilio",
      used: null,
      limit: null,
      unit: `$${balance.toFixed(2)} balance`,
      billingUrl: "https://console.twilio.com/",
      autoFetched: true,
    };
  } catch (e) {
    return { service: "Twilio", used: null, limit: null, unit: "balance", billingUrl: "https://console.twilio.com/", autoFetched: true, error: String(e) };
  }
}

async function fetchMetaAPI(): Promise<ServiceUsage> {
  try {
    const res = await fetch("https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai/users/current/quota", {
      headers: { "auth-token": process.env.METAAPI_TOKEN! },
    });
    const data = await res.json();
    return {
      service: "MetaAPI",
      used: data?.deploymentsUsed ?? null,
      limit: data?.maxDeployedG1Accounts ?? null,
      unit: "MT accounts",
      billingUrl: "https://app.metaapi.cloud/billing",
      autoFetched: true,
    };
  } catch (e) {
    return { service: "MetaAPI", used: null, limit: null, unit: "MT accounts", billingUrl: "https://app.metaapi.cloud/billing", autoFetched: true, error: String(e) };
  }
}

const MANUAL_SERVICES: Omit<ServiceUsage, "used">[] = [
  { service: "Supabase", limit: 500, unit: "MB DB", billingUrl: "https://supabase.com/dashboard/project/kylyumugjzfadkvfxbzh/settings/billing", autoFetched: false },
  { service: "Anthropic", limit: null, unit: "$ credit", billingUrl: "https://console.anthropic.com/settings/billing", autoFetched: false },
  { service: "OpenAI", limit: null, unit: "$ credit", billingUrl: "https://platform.openai.com/account/billing", autoFetched: false },
  { service: "Stripe", limit: null, unit: "sandbox → live", billingUrl: "https://dashboard.stripe.com/settings/billing", autoFetched: false },
  { service: "Inngest", limit: 50000, unit: "runs/mo", billingUrl: "https://app.inngest.com/settings/billing", autoFetched: false },
  { service: "Google AI", limit: 50, unit: "req/day", billingUrl: "https://console.cloud.google.com/billing", autoFetched: false },
  { service: "Sanity CMS", limit: 100000, unit: "API req/mo", billingUrl: "https://www.sanity.io/manage", autoFetched: false },
  { service: "ActiveCampaign", limit: null, unit: "⚠ check billing", billingUrl: "https://bycolorandspace15951.activehosted.com", autoFetched: false },
];

export async function GET(req: NextRequest) {
  const bust = req.nextUrl.searchParams.get("bust") === "1";
  const supabase = createAdminClient();

  if (!bust) {
    const { data: cached } = await supabase
      .from("system_config")
      .select("value, updated_at")
      .eq("key", "service_usage_cache")
      .maybeSingle();

    if (cached?.updated_at) {
      const age = Date.now() - new Date(cached.updated_at as string).getTime();
      if (age < 3600_000) {
        return NextResponse.json(cached.value);
      }
    }
  }

  // Fetch auto-fetchable services in parallel
  const [brevo, twelveData, twilio, metaApi] = await Promise.all([
    fetchBrevo(),
    fetchTwelveData(),
    fetchTwilio(),
    fetchMetaAPI(),
  ]);

  const autoServices = [brevo, twelveData, twilio, metaApi];
  const manualServices = MANUAL_SERVICES.map((s) => ({ ...s, used: null }));

  const result = { autoServices, manualServices, fetchedAt: new Date().toISOString() };

  // Cache result
  await supabase.from("system_config").upsert(
    { key: "service_usage_cache", value: result, updated_at: new Date().toISOString() },
    { onConflict: "key" }
  );

  return NextResponse.json(result);
}
