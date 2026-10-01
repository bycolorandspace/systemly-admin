import {
  tierHistoryLine,
  tierSourceLabel,
  type Grantors,
  type TierHistoryEvent,
  type TierSourceFields,
} from "@/lib/tier-source";
import { formatDate } from "@/lib/utils";

interface TierSourcePanelProps {
  profile: TierSourceFields | null | undefined;
  history: TierHistoryEvent[];
  grantors: Grantors;
}

/**
 * Where this user's plan came from: Stripe, an admin (and which one), or
 * nobody recorded it. Staff-only.
 *
 * Built on 29 September 2026 because 12 accounts were on a paid plan with no
 * Stripe customer and no way to tell an admin grant from a user who had
 * written their own tier. The history is what survives the next change: the
 * current source alone would forget an admin grant as soon as Stripe moved
 * the account.
 */
export function TierSourcePanel({ profile, history, grantors }: TierSourcePanelProps) {
  if (!profile) return null;

  return (
    <div>
      <p className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>
        Plan source
      </p>
      <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
        {tierSourceLabel(profile, grantors)}
      </p>
      {profile.tier_source_note && (
        <p className="text-[11px] mt-1" style={{ color: "var(--muted-foreground)" }}>
          {profile.tier_source_note}
        </p>
      )}
      {history.length > 0 && (
        <ul className="mt-2 space-y-1">
          {history.map((e, i) => (
            <li
              key={`${e.created_at}-${i}`}
              className="text-[11px]"
              style={{ color: "var(--muted-foreground)" }}
            >
              {formatDate(e.created_at)} · {tierHistoryLine(e, grantors)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
