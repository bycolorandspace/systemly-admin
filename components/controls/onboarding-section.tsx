import { ToggleCard } from "@/components/controls/toggle-card";
import { TextConfigCard } from "@/components/controls/text-config-card";
import { OnboardingMediaCard } from "@/components/controls/onboarding-media-card";

/** Defaults match the seed in the main app's 20261015142328_onboarding_config.sql. */
const DEFAULT_VIDEO_URL = "/video/onboarding-steps.mp4";
const DEFAULT_POSTER_URL = "/video/onboarding-steps-poster.jpg";

function pausedOf(configMap: Record<string, unknown>, key: string): boolean {
  // Seeded on, so no row reads as on.
  return (configMap[key] as { paused?: boolean } | undefined)?.paused ?? false;
}

function textOf(configMap: Record<string, unknown>, key: string, fallback: string): string {
  const v = configMap[key];
  return typeof v === "string" && v.length > 0 ? v : fallback;
}

export function OnboardingSection({
  configMap,
  mainAppUrl,
}: {
  configMap: Record<string, unknown>;
  mainAppUrl: string;
}) {
  return (
    <section>
      <p
        className="text-[10px] tracking-widest uppercase mb-4"
        style={{ color: "var(--muted-foreground)" }}
      >
        Onboarding
      </p>
      <div className="space-y-3">
        <ToggleCard
          label="Onboarding video"
          description="Whether the short how-it-works video shows on the onboarding plan page. Off hides it."
          paused={pausedOf(configMap, "onboarding_video_enabled")}
          configKey="onboarding_video_enabled"
        />
        <OnboardingMediaCard
          kind="video"
          label="Onboarding video file"
          configKey="onboarding_video_url"
          initialUrl={textOf(configMap, "onboarding_video_url", DEFAULT_VIDEO_URL)}
          defaultUrl={DEFAULT_VIDEO_URL}
          mainAppUrl={mainAppUrl}
          accept="video/mp4"
          helpText="MP4, at most 15 MB. Should be portrait 720x1280 H.264, no audio, under about 5 MB: ffmpeg -i in.mp4 -vf scale=720:1280 -c:v libx264 -b:v 1.2M -an -movflags +faststart out.mp4"
        />
        <OnboardingMediaCard
          kind="poster"
          label="Onboarding video poster"
          configKey="onboarding_video_poster_url"
          initialUrl={textOf(configMap, "onboarding_video_poster_url", DEFAULT_POSTER_URL)}
          defaultUrl={DEFAULT_POSTER_URL}
          mainAppUrl={mainAppUrl}
          accept="image/jpeg,image/png,image/webp"
          helpText="JPEG, PNG or WebP, at most 1 MB. Same portrait shape as the video."
        />
        <ToggleCard
          label="Free plan exit link"
          description={'Whether the "Not now, stay on the free plan" line shows on the onboarding plan page.'}
          paused={pausedOf(configMap, "onboarding_free_exit_visible")}
          configKey="onboarding_free_exit_visible"
        />
        <TextConfigCard
          label="First market (default)"
          description="The market pre-selected for a new user's first signal. One symbol id, e.g. XAUUSD for gold."
          configKey="onboarding_first_market_default"
          initialValue={textOf(configMap, "onboarding_first_market_default", "XAUUSD")}
          placeholder="XAUUSD"
        />
        <TextConfigCard
          label="First market (excluded)"
          description="Symbol ids that cannot be picked for the first signal. Comma-separated, e.g. SPY,QQQ."
          configKey="onboarding_first_market_excluded"
          initialValue={textOf(configMap, "onboarding_first_market_excluded", "SPY,QQQ")}
          placeholder="SPY,QQQ"
        />
        <ToggleCard
          label="Stop-out follow-up email"
          description="The day-after email to a reader whose first trade hit its stop."
          paused={pausedOf(configMap, "onboarding_stop_out_followup_enabled")}
          configKey="onboarding_stop_out_followup_enabled"
        />
      </div>
    </section>
  );
}
