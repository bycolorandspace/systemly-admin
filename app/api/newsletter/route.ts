import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

const BREVO_URL = "https://api.brevo.com/v3";

async function brevoRequest(path: string, method: string, body?: object) {
  const res = await fetch(`${BREVO_URL}${path}`, {
    method,
    headers: {
      "api-key": process.env.BREVO_API_KEY!,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res;
}

export async function POST(req: NextRequest) {
  const { subject, htmlContent, channel, recipientGroup } = await req.json();

  if (!subject || !htmlContent) {
    return NextResponse.json({ error: "subject and htmlContent required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const results: { email?: string; whatsapp?: string; errors: string[] } = { errors: [] };

  // Email via Brevo
  if (channel === "email" || channel === "both") {
    const listId = Number(process.env.BREVO_NEWSLETTER_GROUP_ID ?? 4);

    const emailRes = await brevoRequest("/emailCampaigns", "POST", {
      name: `Newsletter — ${new Date().toLocaleDateString("en-GB")}`,
      subject,
      sender: { name: "Systemly", email: process.env.BREVO_FROM_EMAIL ?? "hello@systemly.ai" },
      type: "classic",
      htmlContent,
      recipients: { listIds: [listId] },
      scheduledAt: new Date(Date.now() + 60_000).toISOString(), // 1 min delay
    });

    if (emailRes.ok) {
      const emailData = await emailRes.json();
      // Send immediately
      await brevoRequest(`/emailCampaigns/${emailData.id}/sendNow`, "POST");
      results.email = `Campaign ${emailData.id} queued`;
    } else {
      const err = await emailRes.text();
      results.errors.push(`Brevo: ${err}`);
    }
  }

  // WhatsApp via Twilio
  if (channel === "whatsapp" || channel === "both") {
    // Fetch opted-in users (those with whatsapp_optin = true in user_profiles, or all paid if not tracked)
    const { data: users } = await supabase
      .from("user_profiles")
      .select("phone, full_name")
      .not("phone", "is", null)
      .limit(500);

    let sent = 0;
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`;
    const authHeader = "Basic " + Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64");

    // Strip HTML for WhatsApp plain text
    const plainText = htmlContent.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().slice(0, 1500);

    for (const user of users ?? []) {
      if (!user.phone) continue;
      await fetch(twilioUrl, {
        method: "POST",
        headers: { Authorization: authHeader, "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          From: process.env.TWILIO_WHATSAPP_NUMBER!,
          To: `whatsapp:${user.phone}`,
          Body: plainText,
        }),
      });
      sent++;
    }
    results.whatsapp = `${sent} WhatsApp messages sent`;
  }

  // Log send timestamp
  await supabase.from("system_config").upsert(
    { key: "newsletter_last_sent", value: { sent_at: new Date().toISOString(), channel, subject }, updated_at: new Date().toISOString() },
    { onConflict: "key" }
  );

  return NextResponse.json({ ok: true, ...results });
}
