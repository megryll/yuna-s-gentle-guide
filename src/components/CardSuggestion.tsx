import type { CSSProperties, ReactNode } from "react";
import { LifeBuoy, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/Button";
import { ChatBubble } from "@/components/ChatBubble";
import { cardSurface, CardWatermark, MetaDot } from "@/components/Card";
import { KIND_META, type CardKind } from "@/lib/home-cards";

export type EscalationTier = "self-harm" | "crisis" | "non-crisis";

type EscalationTierData = {
  resourceName: string;
  eyebrow: string;
  callLabel: string;
  websiteLabel: string;
  showTherapist: boolean;
  // dark = urgent solid forest-green tile; soft = gentle frosted tile.
  tone: "dark" | "soft";
};

const ESCALATION_TIERS: Record<EscalationTier, EscalationTierData> = {
  "self-harm": {
    resourceName: "988 Suicide & Crisis Lifeline",
    eyebrow: "Free · Confidential · 24/7",
    callLabel: "Call emergency line",
    websiteLabel: "Visit 988lifeline.org",
    showTherapist: false,
    tone: "dark",
  },
  crisis: {
    resourceName: "National Domestic Violence Hotline",
    eyebrow: "Free · Confidential · 24/7",
    callLabel: "Call emergency line",
    websiteLabel: "Visit thehotline.org",
    showTherapist: true,
    tone: "dark",
  },
  "non-crisis": {
    resourceName: "SAMHSA National Helpline",
    eyebrow: "Free · 24/7 · Treatment referral & info",
    callLabel: "Call 1-800-662-4357",
    websiteLabel: "Visit samhsa.gov",
    showTherapist: true,
    tone: "soft",
  },
};

type BaseProps = {
  /** "text" — left-aligned chat bubble; "voice" — centered slide-up sheet. */
  mode?: "text" | "voice";
  /** Photo cluster — threads to the action buttons. Default "dark". */
  surface?: "dark" | "light";
  /** Blurred backdrop photo painted as the sheet's opaque base. In voice mode
   *  it always backs the sheet (on every platform) so the busy voice pad behind
   *  can't bleed through; in text mode it's the Android backdrop-blur fallback
   *  for the ChatBubble shell (iOS uses a live blur there). */
  frostedImage?: string;
  className?: string;
  style?: CSSProperties;
};

type RecoProps = BaseProps & {
  variant?: "reco";
  /** CardKind — drives the eyebrow label + the tile background. Solid kinds
   *  (e.g. questionnaires) render their fixed fill + watermark; photo kinds
   *  fall back to KIND_META[kind].naturePath. */
  kind: CardKind;
  /** Recommended card's title (white Fraunces on the tile). */
  title: string;
  /** Teaser line rendered under the title inside the tile. */
  description?: string;
  /** Length estimate appended to the eyebrow as a "• 5 min" MetaDot. */
  duration?: string;
  /** Tile background photo (photo kinds only — solid kinds ignore it). */
  naturePath?: string;
  /** Primary action label. Default "Start". */
  startLabel?: string;
  onStart?: () => void;
  onDismiss?: () => void;
};

type EscalationProps = BaseProps & {
  variant: "escalation";
  /** Which support resource + tone to surface. */
  tier: EscalationTier;
  onFindTherapist?: () => void;
};

type CardSuggestionProps = RecoProps | EscalationProps;

/**
 * Card Suggestion — something Yuna surfaces mid-session, inside the
 * conversation. Session-only, like ChatBubble; never shown outside a chat.
 *
 * Two forms, picked by `mode`:
 *   - "text"  — a left-aligned, frosted Yuna chat bubble in the message stream.
 *   - "voice" — a centered, frosted slide-up sheet with a drag-notch, floating
 *               above the voice pad.
 *
 * Two variants, picked by `variant`:
 *   - "reco" (default) — recommends a card (meditation, questionnaire, any
 *     CardKind): an eyebrow + a photo-washed tile carrying the title + a
 *     No-thanks / Start pair.
 *   - "escalation" — hands over a vetted support resource when a conversation
 *     surfaces something beyond Yuna's scope. Three tiers; the urgent tiers get
 *     a solid forest-green tile, the non-crisis tier a gentle frosted one.
 *
 * The frosted shell + white ink are authored white-on-dark and invert via
 * `.theme-light`; the green escalation tile stays fixed-dark. `surface` threads
 * to the action buttons so they read on either photo.
 */
export function CardSuggestion(props: CardSuggestionProps) {
  const { mode = "text", surface = "dark", frostedImage, className, style } = props;
  const voice = mode === "voice";

  let body: ReactNode;
  if (props.variant === "escalation") {
    const t = ESCALATION_TIERS[props.tier];
    body = (
      <div>
        <div className={cn("flex items-center gap-1.5", voice && "justify-center")}>
          <LifeBuoy size={16} strokeWidth={1.7} aria-hidden className="text-white" />
          <span className="text-sm font-medium text-white/90">Support</span>
        </div>

        <div
          className={cn(
            "mt-2.5 rounded-2xl overflow-hidden px-5 py-6",
            t.tone === "dark"
              ? "card-fixed-dark bg-primary-green"
              : "bg-white/10 border border-white/15",
          )}
        >
          <h3 className="font-display text-2xl leading-[1.15] tracking-tight text-white">
            {t.resourceName}
          </h3>
          <p className="mt-1.5 text-sm text-white/80">{t.eyebrow}</p>
        </div>

        <div className="mt-3 flex flex-col gap-2">
          <Button surface={surface} variant="primary" fullWidth>
            {t.callLabel}
          </Button>
          <Button surface={surface} variant="secondary" fullWidth>
            {t.websiteLabel}
          </Button>
          {t.showTherapist && (
            <Button surface={surface} variant="link" onClick={props.onFindTherapist}>
              Find a therapist
            </Button>
          )}
        </div>
      </div>
    );
  } else {
    const meta = KIND_META[props.kind];
    body = (
      <div>
        <div className={cn("flex items-center gap-1.5", voice && "justify-center")}>
          <MessageCircle size={16} strokeWidth={1.7} aria-hidden className="text-white" />
          <span className="text-sm font-medium text-white/90">{meta.label}</span>
          {props.duration && <MetaDot>{props.duration}</MetaDot>}
        </div>

        <div
          className="relative mt-2.5 rounded-2xl overflow-hidden card-fixed-dark"
          style={
            meta.solidBg != null
              ? { backgroundColor: meta.solidBg }
              : cardSurface({ naturePath: props.naturePath ?? meta.naturePath }).style
          }
        >
          {meta.watermark && <CardWatermark src={meta.watermark} className="h-[130%] -right-3" />}
          <div className="relative px-5 py-6">
            <h3 className="font-display text-2xl leading-[1.15] tracking-tight text-white">
              {props.title}
            </h3>
            {props.description && (
              <p className="mt-2 text-sm leading-snug text-white/80">{props.description}</p>
            )}
          </div>
        </div>

        <div className="mt-3 flex gap-2 [&>*]:flex-1">
          <Button surface={surface} variant="secondary" onClick={props.onDismiss}>
            No, thanks
          </Button>
          <Button surface={surface} variant="primary" onClick={props.onStart}>
            {props.startLabel ?? "Start"}
          </Button>
        </div>
      </div>
    );
  }

  // Text: reuse the Yuna chat bubble shell (frost, tail, Android fallback).
  if (!voice) {
    return (
      <ChatBubble
        from="yuna"
        frostedImage={frostedImage}
        className={cn("w-full max-w-[88%]", className)}
        style={style}
      >
        {body}
      </ChatBubble>
    );
  }

  // Voice: a frosted slide-up sheet with a drag-notch. White-on-dark + inverts
  // via `.theme-light`, but a rounded sheet rather than a tailed bubble. Unlike
  // the chat bubble, this floats over the busy voice pad (avatar, dots, live
  // waveform), so a translucent live blur reads as visual noise — we paint the
  // blurred backdrop photo as an opaque base instead, so nothing bleeds
  // through. The `bg-white/10 backdrop-blur-md` only applies as a fallback when
  // no `frostedImage` is supplied.
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[340px] rounded-[1.75rem] border border-white/25 bg-white/10 backdrop-blur-md text-white px-5 pt-2.5 pb-5",
        className,
      )}
      style={
        frostedImage
          ? {
              background: `linear-gradient(rgba(255,255,255,0.12), rgba(255,255,255,0.12)), url(${frostedImage}) center/cover fixed no-repeat`,
              ...style,
            }
          : style
      }
    >
      <div aria-hidden className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-white/40" />
      {body}
    </div>
  );
}
